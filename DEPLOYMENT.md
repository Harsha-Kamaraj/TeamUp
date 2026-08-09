# 🚀 Deploying Squadly

This guide takes you from a local project to a live, free-hosted app.

## Architecture

```
Browser ──▶ Vercel (frontend)  ──REST + WebSocket──▶  Render (backend API + Socket.IO)
                                                              │
                        ┌─────────────────────────────────────┼───────────────────────┐
                        ▼                                     ▼                        ▼
                 MongoDB Atlas                          Cloudinary                  Brevo
                  (database)                             (images)                (email SMTP)
```

| Piece | Service | Free tier |
|-------|---------|-----------|
| Frontend | **Vercel** | Hobby (free) |
| Backend (API + chat) | **Render** | Web Service (free, 750 hrs/mo) |
| Database | **MongoDB Atlas** | M0 (512 MB) |
| Images | **Cloudinary** | 25 GB |
| Email | **Brevo** | 300 emails/day |

---

## 0. Prerequisites

- Push this repo to **GitHub** (Render and Vercel both deploy from GitHub).
- Create free accounts: [Render](https://render.com), [Vercel](https://vercel.com), [MongoDB Atlas](https://cloud.mongodb.com), [Cloudinary](https://cloudinary.com), [Brevo](https://brevo.com).

> **Deploy order matters** because the two hosts reference each other's URLs:
> deploy the **backend first** → get its URL → deploy the **frontend** with that URL →
> then come back and give the backend the frontend's URL. Steps below do exactly that.

---

## 1. MongoDB Atlas (database)

> Use **your own** Atlas account — the cluster owner controls the data, billing, and
> access. Nothing in this repo is tied to any particular account; the connection
> string is supplied entirely through the `MONGODB_URI` environment variable.

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) (Google sign-in is fine).
2. **Create a cluster** → choose the **M0 / Free** tier → pick the region closest to
   you → **Create Deployment**.
3. Atlas prompts you to create a database user. Set a username and password and
   **write both down** — the password is only shown once. → **Create Database User**.
4. **Network Access** (left sidebar) → **Add IP Address** → **ALLOW ACCESS FROM
   ANYWHERE** (`0.0.0.0/0`) → **Confirm**. Render's outbound IPs are dynamic, so
   restricting by IP will block the backend.
5. **Clusters** → **Connect** → **Drivers** → copy the connection string:
   `mongodb+srv://USER:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
6. Edit it in two places:
   - Replace `<password>` with the real password. URL-encode special characters
     (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`).
   - Insert the database name `squadly` before the `?`.

   Final form:
   `mongodb+srv://USER:pass123@cluster0.xxxx.mongodb.net/squadly?retryWrites=true&w=majority`
7. Keep this for `MONGODB_URI`.

## 2. Cloudinary (images — required in production)

> Render's disk is **ephemeral**: locally-saved uploads are wiped on every restart.
> Cloudinary keeps profile photos permanent.

1. Sign in → **Dashboard** shows **Cloud name**, **API Key**, **API Secret**.
2. Keep these for `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## 3. Brevo (email — for real verification/reset emails)

1. Create an account → **Senders, Domains & Dedicated IPs** → add & **verify a sender**
   email (this becomes your `EMAIL_FROM`, e.g. `Squadly <you@gmail.com>`).
2. **SMTP & API ▸ SMTP** → note the server `smtp-relay.brevo.com`, port `587`,
   your **login** (`SMTP_USER`) and generate an **SMTP key** (`SMTP_PASS`).

> You can skip Brevo at first — without SMTP set, the backend just logs email links to
> the Render logs instead of sending them. Auth still works.

---

## 4. Deploy the backend → Render

1. Render dashboard → **New ▸ Blueprint** → connect this GitHub repo.
   Render reads [`render.yaml`](render.yaml) and creates the **squadly-api** web service
   (root `backend/`, build `npm install`, start `npm start`, health check `/api/v1/health`).
2. Open the service → **Environment** and fill the secrets marked `sync: false`:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas string from step 1 |
   | `CLIENT_URL` | *leave blank for now — set in step 6* |
   | `SERVER_URL` | *leave blank for now — set in step 6* |
   | `EMAIL_FROM` | your verified Brevo sender |
   | `SMTP_USER` / `SMTP_PASS` | from Brevo (step 3) |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from step 2 |

   (`JWT_ACCESS_SECRET` is auto-generated; `NODE_ENV`, `SMTP_HOST`, `SMTP_PORT` are preset.)
3. Deploy. When it's live you get a URL like `https://squadly-api.onrender.com`.
   Test it: visiting `https://squadly-api.onrender.com/api/v1/health` should return
   `"Squadly API is healthy"`. **Copy this URL.**

## 5. Point the proxy at your backend (do this BEFORE deploying)

Open [`vercel.json`](frontend/vercel.json) and replace the placeholder host with the
Render URL you copied in step 4:

```diff
- "destination": "https://REPLACE_WITH_RENDER_URL.onrender.com/api/:path*"
+ "destination": "https://squadly-api.onrender.com/api/:path*"
```

Commit and push. This rewrite is what makes the browser see the API as
same-origin — without it every API call fails.

## 6. Deploy the frontend → Vercel

1. Vercel → **Add New ▸ Project** → import this GitHub repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Vite
   (build `npm run build`, output `dist`). [`vercel.json`](frontend/vercel.json) handles
   SPA routing so refreshing `/browse` doesn't 404.
3. **Environment Variables** → add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `/api/v1` — a **relative path**, not your Render URL |
   | `VITE_SOCKET_URL` | `https://squadly-api.onrender.com` — your Render URL, no path |
   | `VITE_GOOGLE_CLIENT_ID` | your Google client ID (skip if not using Google Sign-In) |

   > **Why `VITE_API_URL` is relative:** step 5's rewrite proxies `/api/*` to Render, so
   > the browser treats the API as same-origin and the login cookie is first-party. Point
   > this straight at Render instead and Safari/Brave block that cookie as third-party —
   > users get logged out on every refresh.
   >
   > **Why `VITE_SOCKET_URL` is absolute:** WebSockets can't travel through Vercel's
   > rewrite, so chat connects directly to Render. Leave this unset and chat silently
   > tries `localhost` and never connects.

4. Deploy. You get a URL like `https://squadly.vercel.app`. **Copy it.**

## 7. Connect the two (finish the loop)

1. Back in **Render ▸ squadly-api ▸ Environment**, set:
   - `CLIENT_URL` = `https://squadly.vercel.app`  (your Vercel URL — enables CORS + secure cookies)
   - `SERVER_URL` = `https://squadly-api.onrender.com`  (your Render URL)
2. Save → Render redeploys automatically. Done. 🎉

## 8. Keep it awake (beat Render's cold start)

Render's free service sleeps after 15 min idle (~40s cold start on next visit).
Free fix: create a cron at [cron-job.org](https://cron-job.org) that GETs
`https://squadly-api.onrender.com/api/v1/health` every **10 minutes**. Stays within the
free 750 hours and keeps the app snappy.

---

## 9. Verify it works

On your live Vercel URL: sign up → check the verification email (or Render logs) →
create a post → upload a profile photo (should persist to Cloudinary) → open a second
account in a private window and send a chat message (tests Socket.IO cross-origin).

## Environment variable reference

**Backend (Render):** `NODE_ENV`, `API_PREFIX`, `MONGODB_URI`, `JWT_ACCESS_SECRET`,
`JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`, `EMAIL_TOKEN_EXPIRES_MINUTES`,
`CLIENT_URL`, `SERVER_URL`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`. (See [`backend/.env.example`](backend/.env.example).)

**Frontend (Vercel):** `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_GOOGLE_CLIENT_ID`.
(See [`frontend/.env.example`](frontend/.env.example).)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **CORS error** in browser console | `CLIENT_URL` on Render must exactly match your Vercel URL (no trailing slash). |
| **Every API call 404s / "Not Found"** | `vercel.json` still has the `REPLACE_WITH_RENDER_URL` placeholder — see step 5. |
| **Login doesn't persist / logged out on refresh** | `VITE_API_URL` must be the relative `/api/v1`, not your Render URL (step 6). Also confirm both sides are HTTPS and `NODE_ENV=production` on Render. |
| **Chat never connects / no realtime updates** | `VITE_SOCKET_URL` is unset on Vercel, so it falls back to `localhost`. Set it to your Render URL and redeploy. |
| **Google button missing** | `VITE_GOOGLE_CLIENT_ID` (Vercel) and `GOOGLE_CLIENT_ID` (Render) must both be set to the same client ID. |
| **Can't connect to database** | Add `0.0.0.0/0` in Atlas Network Access; check the password is URL-encoded. |
| **Uploaded photos disappear** | Cloudinary env vars aren't set — Render's disk is ephemeral. |
| **First request very slow** | Render free-tier cold start; set up the pinger (step 8). |
| **Emails not arriving** | Verify your Brevo sender; without SMTP the links are printed in Render logs. |
