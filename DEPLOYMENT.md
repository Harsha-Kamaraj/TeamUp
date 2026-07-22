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

1. You already have a cluster. In Atlas, open **Network Access** → **Add IP Address** →
   **Allow access from anywhere** (`0.0.0.0/0`). Render's IPs are dynamic, so this is
   required for the backend to connect.
2. **Database Access** → confirm your DB user + password.
3. **Connect ▸ Drivers** → copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/squadly?retryWrites=true&w=majority`
   (URL-encode special characters in the password, e.g. `@` → `%40`.)
   Keep this for `MONGODB_URI`.

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

## 5. Deploy the frontend → Vercel

1. Vercel → **Add New ▸ Project** → import this GitHub repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Vite
   (build `npm run build`, output `dist`). [`vercel.json`](frontend/vercel.json) handles
   SPA routing so refreshing `/browse` doesn't 404.
3. **Environment Variables** → add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://squadly-api.onrender.com/api/v1` (your Render URL + `/api/v1`) |

4. Deploy. You get a URL like `https://squadly.vercel.app`. **Copy it.**

## 6. Connect the two (finish the loop)

1. Back in **Render ▸ squadly-api ▸ Environment**, set:
   - `CLIENT_URL` = `https://squadly.vercel.app`  (your Vercel URL — enables CORS + secure cookies)
   - `SERVER_URL` = `https://squadly-api.onrender.com`  (your Render URL)
2. Save → Render redeploys automatically. Done. 🎉

## 7. Keep it awake (beat Render's cold start)

Render's free service sleeps after 15 min idle (~40s cold start on next visit).
Free fix: create a cron at [cron-job.org](https://cron-job.org) that GETs
`https://squadly-api.onrender.com/api/v1/health` every **10 minutes**. Stays within the
free 750 hours and keeps the app snappy.

---

## 8. Verify it works

On your live Vercel URL: sign up → check the verification email (or Render logs) →
create a post → upload a profile photo (should persist to Cloudinary) → open a second
account in a private window and send a chat message (tests Socket.IO cross-origin).

## Environment variable reference

**Backend (Render):** `NODE_ENV`, `API_PREFIX`, `MONGODB_URI`, `JWT_ACCESS_SECRET`,
`JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`, `EMAIL_TOKEN_EXPIRES_MINUTES`,
`CLIENT_URL`, `SERVER_URL`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
(See [`backend/.env.example`](backend/.env.example).)

**Frontend (Vercel):** `VITE_API_URL`. (See [`frontend/.env.example`](frontend/.env.example).)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **CORS error** in browser console | `CLIENT_URL` on Render must exactly match your Vercel URL (no trailing slash). |
| **Login doesn't persist / logged out on refresh** | Frontend and backend must both be HTTPS; confirm `NODE_ENV=production` on Render (sets `SameSite=None; Secure` cookies). |
| **Can't connect to database** | Add `0.0.0.0/0` in Atlas Network Access; check the password is URL-encoded. |
| **Uploaded photos disappear** | Cloudinary env vars aren't set — Render's disk is ephemeral. |
| **First request very slow** | Render free-tier cold start; set up the pinger (step 7). |
| **Emails not arriving** | Verify your Brevo sender; without SMTP the links are printed in Render logs. |
