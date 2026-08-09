# Squadly — Deployment Log

What was done to take Squadly from a local project to a live app on **9 August 2026**,
why each decision was made, and what to check first when something breaks.

For the step-by-step guide to deploying from scratch, see [DEPLOYMENT.md](DEPLOYMENT.md).
This file is the record of what actually happened.

---

## Live URLs

| Piece | URL |
|---|---|
| Frontend | https://squadly-app.vercel.app |
| Backend API | https://squadly-api.onrender.com |
| Health check | https://squadly-api.onrender.com/api/v1/health |
| Repo | https://github.com/Harsha-Kamaraj/TeamUp |

`squadly.vercel.app` was already claimed by another Vercel account, so the project is
named `squadly` but serves from `squadly-app.vercel.app`.

---

## Hosting

| Service | Purpose | Tier | Account |
|---|---|---|---|
| Vercel | Frontend (Vite/React) | Hobby | Harsha's projects team |
| Render | Backend API + Socket.IO | Free | — |
| MongoDB Atlas | Database | M0 free, AWS Mumbai | Gagan's own org |
| Cloudinary | Image + resume storage | Free 25 GB | Gagan's own |
| Gmail SMTP | Verification / reset email | — | Gagan's own |

Cloudinary is **not optional in production**: Render's disk is ephemeral, so anything
saved locally is wiped on every restart and redeploy.

Brevo (which `render.yaml` originally assumed) was skipped entirely — Gmail SMTP was
already working locally, so it was reused.

---

## Pre-flight audit

Before deploying, an audit of the codebase found the application code in good shape:

- Frontend built clean, well code-split, routes lazy-loaded
- Backend booted in production mode, graceful shutdown, correct 404 and error handling
- Security solid — helmet CSP/HSTS, CORS allowlist, rate limiting, `trust proxy`,
  JWT invalidation on password change, stack traces suppressed in production
- Git history clean — no `.env` or `node_modules` ever committed

Four **deployment config** blockers were found and fixed (see below). None were bugs in
the app itself.

---

## Commits

| Commit | What |
|---|---|
| `fab23b4` | Finish the Squadly rename; fix the four deploy blockers |
| `2b9030b` | Make `SMTP_HOST` per-provider instead of hardcoding Brevo |
| `66a7a70` | Point the Vercel `/api` proxy at the live Render service |
| `1790502` | Stop a cold-starting backend from looking like a logged-out session |

### `fab23b4` — rename and deploy blockers

- Root `package.json` / `package-lock.json` still said `teamup`; everything else was
  already Squadly. (`PROJECT_SUMMARY.md` still records the rename as history — that's
  intentional.)
- `render.yaml` was missing `GOOGLE_CLIENT_ID`, which silently disabled Google Sign-In
  in production — the button just never renders.
- `DEPLOYMENT.md` said to set `VITE_API_URL` to the absolute Render URL, contradicting
  `config.js`. Corrected — see the load-bearing values below.
- `VITE_SOCKET_URL` was undocumented, so chat would fall back to `localhost` and never
  connect in production.
- Nothing told you to replace the `REPLACE_WITH_RENDER_URL` placeholder in
  `vercel.json`, which fails every API call. Now its own numbered step.

### `1790502` — the cold-start fix

See "The cold start problem" below.

---

## Two load-bearing config values

These look wrong and are not. Getting either backwards breaks the app in a way that's
hard to trace.

**`VITE_API_URL` must be the relative `/api/v1`** — not the Render URL.
`vercel.json` rewrites `/api/*` to Render, so the browser treats the API as same-origin
and the refresh-token cookie stays first-party. Point it straight at Render and
Safari/Brave block that cookie as third-party — users get logged out on every refresh.

**`VITE_SOCKET_URL` must be the absolute Render URL** — WebSockets cannot travel
through Vercel's rewrite, so chat connects directly. Leave it unset and the socket
silently tries `localhost` forever.

---

## Environment variables

Values live in the Render and Vercel dashboards, never in the repo.

**Render (backend)** — `NODE_ENV`, `API_PREFIX`, `PORT` (auto), `JWT_ACCESS_SECRET`
(auto-generated), `JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`,
`EMAIL_TOKEN_EXPIRES_MINUTES`, `MONGODB_URI`, `CLIENT_URL`, `SERVER_URL`, `EMAIL_FROM`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `GOOGLE_CLIENT_ID`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Vercel (frontend)** — `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_GOOGLE_CLIENT_ID`

`CLIENT_URL` is more load-bearing than it looks. It drives three things:
Socket.IO CORS (`sockets/index.js`), the base URL in verification and reset emails
(`email.service.js`), and REST CORS (`app.js`). Set wrong, chat is blocked and email
links point at `localhost`.

---

## The cold start problem

**The single most likely cause of any weird production behaviour.**

Render's free instance sleeps after 15 minutes idle and takes ~50s to wake. That cold
start outlives Vercel's proxy timeout, so the browser gets a **502**.

This showed up as two apparently unrelated bugs:

1. "Send interest" hung, then failed with 502.
2. The navbar showed Log in / Sign up even while logged in.

Both were the same event. `AuthContext` caught *any* error from `/auth/me` and concluded
the user was logged out — so a sleeping backend was indistinguishable from an expired
session. The session was never actually broken.

Fixed in `1790502`:

- Session restore rides out gateway errors for ~60s before declaring a logout, and
  exposes `isServerWaking` so the UI can explain the wait.
- A failed token refresh only ends the session if the server actually *rejected* it. A
  refresh that never arrived says nothing about the cookie's validity.
- GET/HEAD retry three times on 502/503/504. **Mutations deliberately do not** — the
  proxy can time out after the write already landed, so replaying a POST could duplicate
  it.
- `getErrorMessage` explains gateway errors in words instead of surfacing a bare 502.

**The actual cure** is preventing the sleep: a [cron-job.org](https://cron-job.org) job
hitting `/api/v1/health` every 10 minutes. Well inside the free 750 hrs/month.
If cold starts return, check that this job is still running.

---

## Also fixed

A disallowed CORS origin returned **500** instead of **403** — the origin callback threw
a plain `Error`, which the handler treated as a server fault. Security was never
affected (no `ACAO` header, so browsers still blocked it), but it filled the logs with
fake internal errors.

---

## How to deploy a change

Both hosts auto-deploy from `main`:

```bash
git add -A
git commit -m "your message"
git push origin main
```

Vercel rebuilds the frontend, Render rebuilds the backend. Roughly 2 minutes.
Changing `render.yaml` triggers a blueprint sync.

Verify with:

```bash
curl https://squadly-api.onrender.com/api/v1/health   # want "database":"connected"
curl https://squadly-app.vercel.app/api/v1/health     # same JSON = proxy works
```

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Random 502s, "takes forever then fails" | Cold start — check the cron pinger is alive |
| Logged out on refresh | `VITE_API_URL` must be relative `/api/v1`, not the Render URL |
| Chat never connects | `VITE_SOCKET_URL` unset or wrong on Vercel |
| Every API call 404s | `vercel.json` placeholder not replaced |
| CORS error | `CLIENT_URL` must match the Vercel URL exactly, no trailing slash |
| `"database":"disconnected"` | Atlas Network Access missing `0.0.0.0/0`, or password not URL-encoded |
| Google button missing | `VITE_GOOGLE_CLIENT_ID` unset on Vercel |
| Google button errors on click | Vercel URL not in Authorized JavaScript origins |
| Photos vanish after redeploy | Cloudinary vars not set — Render's disk is ephemeral |
| Emails not arriving | Gmail needs a 16-char **App Password**, not the account password |

---

## Outstanding

- **Rotate credentials** — the Mongo password, Cloudinary API secret and Gmail App
  Password were pasted into a chat transcript during setup. Rotate them in each
  dashboard once things settle.
- The Atlas cluster is named `Sqaudly` (letters transposed). Cosmetic — it only appears
  inside the connection hostname, and Atlas can't rename clusters after creation.
- The Vercel project lives under **Harsha's projects**, so that account owns the
  deployment.
- No custom domain yet. Attaching one later makes the `squadly-app.vercel.app`
  subdomain irrelevant — but remember to update `CLIENT_URL` on Render and the
  Google authorized origin at the same time.
