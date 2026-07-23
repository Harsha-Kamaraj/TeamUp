# 🎓 Squadly — Project Summary

**Squadly** is a full-stack student collaboration platform where students find their "squad" — teammates for hackathons, research, startups, competitions, open-source, college fests, and any other event. Students post an opportunity, others express interest in one tap, and the two sides chat in real time and form a team.

> **Status:** ✅ Feature-complete & deployment-ready (all 15 phases done).
> Built phase-by-phase as a production-grade MERN application.

---

## 📑 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [System Architecture](#-system-architecture)
3. [Core Workflows](#-core-workflows)
4. [Data Model](#-data-model)
5. [API Surface](#-api-surface)
6. [Repository Structure](#-repository-structure)
7. [Phase-by-Phase Summary](#-phase-by-phase-summary)
8. [Technical & Practical Fallbacks](#-technical--practical-fallbacks)
9. [Security Measures](#-security-measures)
10. [Testing Approach](#-testing-approach)
11. [Local Development](#-local-development)
12. [Deployment](#-deployment)
13. [Environment Variables](#-environment-variables)
14. [Future Roadmap](#-future-roadmap)

---

## 🧰 Tech Stack

### Frontend
| Tech | Version | Role |
|------|---------|------|
| **React** | 19.2 | UI library |
| **Vite** | 8 (rolldown bundler) | Dev server + build tool |
| **Tailwind CSS** | v4 (`@theme`/`@utility` CSS-based config) | Styling / design system |
| **React Router** | 7.18 | Client-side routing (with lazy-loaded routes) |
| **TanStack Query** | 5.10 | Server-state: caching, invalidation, infinite scroll |
| **Axios** | 1.18 | HTTP client (interceptors for auth + refresh) |
| **React Hook Form** | 7.82 | Forms & validation |
| **Socket.IO client** | 4.8 | Real-time chat / presence / notifications |
| **lucide-react** | 1.25 | Icon set |
| **clsx + tailwind-merge** | — | `cn()` class-composition helper |
| **oxlint** | 1.71 | Fast linter |

### Backend
| Tech | Version | Role |
|------|---------|------|
| **Node.js** | 20+ | Runtime (ESM modules) |
| **Express** | 5.2 | HTTP framework |
| **Mongoose** | 9.8 | MongoDB ODM (schemas, validation, hooks) |
| **Socket.IO** | 4.8 | WebSocket server |
| **JWT (jsonwebtoken)** | 9 | Access tokens |
| **bcryptjs** | 3 | Password hashing |
| **Zod** | 4.4 | Request-body validation schemas |
| **Nodemailer** | 9 | Email transport |
| **Cloudinary SDK** | 2.10 | Image hosting |
| **Multer** | 2.2 | Multipart/file upload parsing (memory storage) |
| **helmet, cors, compression, cookie-parser, morgan, express-rate-limit** | — | Security & core middleware |

### Infrastructure & Services
| Concern | Service | Free tier |
|---------|---------|-----------|
| Frontend hosting | **Vercel** | Hobby |
| Backend hosting | **Render** (Web Service) | 750 hrs/mo |
| Database | **MongoDB Atlas** | M0 (512 MB) |
| Image storage | **Cloudinary** | 25 GB |
| Email delivery | **Brevo** SMTP | 300/day |
| Keep-alive | **cron-job.org** | free pinger |

### Testing / Tooling
`mongodb-memory-server` (in-memory integration tests) · `puppeteer-core` (browser smoke tests driving system Chrome) · `nodemon` (dev reload) · `oxlint`.

---

## 🏗 System Architecture

```
                         ┌──────────────────────────────────────┐
                         │            Browser (SPA)             │
                         │   React + Vite + Tailwind + Query    │
                         └───────────────┬──────────────────────┘
                       REST (Axios)      │      WebSocket (Socket.IO)
                                         ▼
                         ┌──────────────────────────────────────┐
                         │        Express API + Socket.IO       │
                         │  routes → validate → controller →    │
                         │  service → Mongoose model            │
                         └───┬───────────────┬──────────────┬───┘
                             ▼               ▼              ▼
                     ┌──────────────┐ ┌────────────┐ ┌────────────┐
                     │ MongoDB Atlas│ │ Cloudinary │ │   Brevo    │
                     │  (database)  │ │  (images)  │ │  (email)   │
                     └──────────────┘ └────────────┘ └────────────┘
```

**Layered backend:** `route` (defines path + middleware) → `validate` (Zod) → `controller` (thin request handler) → `service` (business logic: chat, notifications, tokens, email, uploads) → `model` (Mongoose schema). Cross-cutting concerns live in `middleware/` (auth, error handling, rate limiting, uploads) and `utils/` (`ApiError`, `ApiResponse`, `asyncHandler`, logger).

**Monorepo:** two independently deployable apps — `backend/` (→ Render) and `frontend/` (→ Vercel).

---

## 🔄 Core Workflows

### 1. Authentication (JWT + rotating refresh token)
1. **Register/Login** → backend verifies credentials (bcrypt), returns a short-lived **access token** (15 min, kept in memory on the client) and sets an **httpOnly refresh-token cookie** (7 days, opaque random string stored hashed in DB).
2. Every API call attaches `Authorization: Bearer <access>`.
3. On a **401**, an Axios response interceptor transparently calls `/auth/refresh` (using the cookie), gets a new access token, and retries the original request. Concurrent 401s share one refresh call ("single-flight").
4. Refresh tokens **rotate** on use and are revoked on logout.

### 2. Post an opportunity → express interest → team up
1. A student **creates a post** (type, title, description, required skills, members needed, mode, deadline, tags). Type can be a preset or **"Other"** with a free-text label (e.g. *DJ Nite*).
2. Others browse the **feed** (search + category/mode filters, infinite scroll) and open a post.
3. A viewer taps **"I'm interested"** (optional note) → an `Interest` is created, the author gets a **notification + email**.
4. The author reviews interested students, **accepts/rejects**; accepted members join the **team roster**. When `membersNeeded` is met, the post **auto-closes**.

### 3. Real-time chat
- Socket.IO handshake is **JWT-authenticated**. Each socket joins a personal room `user:<id>`.
- Messages, typing indicators, and read receipts are emitted to the relevant users' rooms, so delivery works regardless of which conversation is open. Presence is **connection-counted** (supports multiple tabs).

### 4. Notifications
- A real-time bell aggregates **interest**, **message**, and **system** alerts. Message notifications are **deduped per conversation** and cleared when the conversation is read.

### 5. Image upload
- Avatar is uploaded as multipart → **Cloudinary** (normalized to a 512×512 face-cropped image) when configured, otherwise saved to **local disk** and served from `/uploads` (dev fallback).

---

## 🗃 Data Model

| Collection | Purpose | Key fields / relations |
|------------|---------|------------------------|
| **User** | Account + profile | name, email, password(hash), skills, college, projects, links, avatar, availability, workMode |
| **RefreshToken** | Session persistence | user →User, tokenHash, expiresAt, userAgent/IP |
| **Post** | An opportunity | author →User, type (+`customType`), title, description, requiredSkills, membersNeeded, mode, deadline, tags, status |
| **Interest** | "I'm interested" | post →Post, fromUser →User, toUser →User, message, status (pending/accepted/rejected) |
| **Conversation** | A 1:1 chat | participants[] →User, `pairKey` (dedupe), post →Post, lastMessage |
| **Message** | A chat message | conversation →Conversation, sender →User, text, readBy[] |
| **Notification** | Bell alert | user →User, type, text, link, read |
| **Bookmark** | Saved post | user →User, post →Post |

All models expose a clean JSON shape (`id` instead of `_id`, no `__v`, secrets stripped) via `toJSON` transforms.

---

## 🌐 API Surface

Base prefix: **`/api/v1`**

| Group | Endpoints (representative) |
|-------|----------------------------|
| **auth** | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, verify-email, forgot/reset-password |
| **users** | `GET /users/:id`, `PATCH /users/me`, `POST /users/me/avatar`, `DELETE /users/me/avatar` |
| **posts** | `GET /posts` (feed+filters), `POST /posts`, `GET /posts/:id`, `PATCH/DELETE /posts/:id`, `GET /posts/me` |
| **interests** | express, withdraw, list-for-post, respond (accept/reject), mine |
| **conversations** | list, get/create with a user, messages |
| **dashboard** | aggregated stats + recent activity |
| **notifications** | list, mark read |
| **bookmarks** | list, add, remove |
| **health** | `GET /health` (used by Render + the keep-alive pinger) |

Real-time (Socket.IO) events: `message:send`/`message:new`, `typing`, `conversation:read`, `presence:online/offline/init`, `notifications:updated`.

---

## 📁 Repository Structure

```
Squadly/
├── backend/                    # Express + Mongoose API → Render
│   └── src/
│       ├── config/             # env loading, DB connection
│       ├── controllers/        # thin request handlers
│       ├── routes/             # route definitions (mounted under /api/v1)
│       ├── middleware/         # auth, validate, upload, rate-limit, errors
│       ├── models/             # Mongoose schemas
│       ├── services/           # chat, email, notification, token, cloudinary
│       ├── sockets/            # Socket.IO server, auth, registry
│       ├── validators/         # Zod schemas
│       ├── utils/              # ApiError, ApiResponse, asyncHandler, logger
│       ├── app.js              # Express app assembly
│       └── server.js           # entry (HTTP + Socket.IO)
├── frontend/                   # React + Vite SPA → Vercel
│   └── src/
│       ├── api/                # axios client + per-resource modules
│       ├── components/         # ui/, layout/, posts/, chat/, dashboard/, auth/
│       ├── contexts/           # AuthContext, SocketContext
│       ├── hooks/              # useDebounce, etc.
│       ├── lib/                # config, socket, postOptions, profileOptions
│       ├── pages/              # route-level pages
│       └── routes/             # AppRoutes + guards (Protected/Guest)
├── render.yaml                 # Render blueprint (backend)
├── frontend/vercel.json        # Vercel config (SPA rewrites)
├── DEPLOYMENT.md               # step-by-step deploy guide
└── PROJECT_SUMMARY.md          # this file
```

---

## 🧩 Phase-by-Phase Summary

| # | Phase | What was built |
|---|-------|----------------|
| **1** | Planning, Architecture, Setup | Monorepo scaffold, Express app skeleton, env config, `/health`, logging, error handling, CORS/helmet/rate-limit. |
| **2** | Backend & Authentication | User model, bcrypt hashing, JWT access + rotating refresh tokens, register/login/refresh/logout, auth middleware. |
| **3** | Frontend Setup | Vite + Tailwind v4 + Router + Query + Axios, design-system UI primitives (`Button`, `Card`, `Input`, …), app shell (Navbar/Footer). |
| **4** | Authentication UI | Login/Register/Forgot/Reset pages, `AuthContext`, protected & guest route guards, token refresh interceptor, password eye-toggle. |
| **5** | Student Profile | Profile model fields, view/edit profile, skills/projects/links, **avatar upload** (Cloudinary + local fallback). |
| **6** | Post Creation | Post model + validators, create/edit forms, post types (incl. **"Other"** custom event type). |
| **7** | Post Feed | Public feed with cards, author info, pagination/infinite scroll. |
| **8** | Search & Filters | Debounced text search + category/work-mode filters (server-side, indexed queries). |
| **9** | Interested Workflow & Email | Express/withdraw interest, author accept/reject, **email notifications** (Brevo + console fallback). |
| **10** | Real-time Chat | Socket.IO (JWT handshake), 1:1 conversations, messages, typing, read receipts, presence. |
| **11** | Dashboard | Aggregated stats, recent activity, quick actions. |
| **12** | Notifications | Real-time bell, interest/message/system alerts, per-conversation dedup. |
| **13** | Bookmarks | Save/unsave posts, "Saved" page. |
| **14** | Team Management | Team roster, member limits, skill-gap hints, **auto-close** when full. |
| **15** | Deployment & Optimization | **Route code-splitting** + vendor chunking, `render.yaml`, `vercel.json`, prod CORS/cookies, env templates, deploy guide. Rebranded **TeamUp → Squadly**. |

---

## 🛟 Technical & Practical Fallbacks

The design favors **graceful degradation** — the app stays usable even when an optional service isn't configured, and it recovers from common runtime failures.

### Service-level fallbacks
- **Image upload:** Cloudinary when configured → **local-disk fallback** (`/uploads`) in development, so avatars work with zero setup. *(Note: Render's disk is ephemeral, so Cloudinary is required in production or images vanish on restart.)*
- **Email:** Real SMTP (Brevo) when configured → otherwise emails (incl. verification/reset links) are **printed to the server console**, so auth flows are testable without any mail account.
- **Database:** The server can **boot and answer `/health` without a DB connection** (warns instead of crashing); auth features simply require it connected.
- **Custom post types:** An **"Other"** option with a free-text label handles any event we didn't enumerate (DJ Nite, fests, study groups) without schema changes per event.

### Auth & session resilience
- **Access token in memory + refresh cookie** → survives page reloads via silent refresh, while keeping the access token out of `localStorage` (XSS-safer).
- **Refresh-on-401 with single-flight** → transparent re-auth; concurrent failures don't stampede `/auth/refresh`.
- **Rotating, hashed refresh tokens** → stolen-cookie blast radius is limited; revoked on logout.
- **Cross-site cookies** auto-switch to `SameSite=None; Secure` in production (Vercel ↔ Render), `Lax` locally over plain HTTP.

### Realtime robustness
- **Presence is connection-counted** per user (a Map), so multiple tabs don't produce false "offline" events.
- **Personal rooms (`user:<id>`)** mean messages/receipts reach a user regardless of which conversation they're viewing.
- **Notification dedup** per conversation prevents bell spam.

### Build & deploy fallbacks
- **Route-level code-splitting** (`React.lazy` + `Suspense`) + **manual vendor chunking** keep the initial bundle small (largest chunk 72 KB gzip vs. the old 519 KB monolith). *(Vite 8's rolldown bundler required the function form of `manualChunks`.)*
- **SPA rewrites** (`vercel.json`) so deep links like `/browse` don't 404 on refresh.
- **Render free-tier sleep** mitigated by a free **keep-alive pinger** hitting `/health` every ~10 min.
- **Health check endpoint** doubles as Render's liveness probe and the pinger target.

### Environment-specific quirks handled
- **Port 5001, not 5000** — macOS Control Center/AirPlay occupies 5000.
- **Mongoose 9** async hooks (no `next` callback), **Zod v4** error API, **Express 5** read-only `req.query`, and **FormData/multipart** handling (dropping the JSON content-type so the browser sets the multipart boundary).
- **Reduced-motion** respected — animations collapse for users who prefer less motion.

---

## 🔐 Security Measures
- Passwords hashed with **bcrypt** (cost 12); never returned in API responses.
- **JWT** access tokens (short-lived) + **opaque, hashed, rotating** refresh tokens.
- **httpOnly / Secure / SameSite** cookies for refresh tokens.
- **helmet** security headers; **CORS allowlist** driven by `CLIENT_URL`; per-route **rate limiting**.
- **Zod validation** on every write; **regex-injection escaping** on search input.
- Secrets kept in gitignored `.env` (never committed); Render generates the JWT secret.
- Cross-origin images served with an explicit `Cross-Origin-Resource-Policy` header.

## 🧪 Testing Approach
- **Backend integration tests** run against an in-memory MongoDB (`mongodb-memory-server`) — no external DB needed.
- **Browser smoke tests** (`puppeteer-core` driving system Chrome) exercise real user journeys end-to-end: register → feed → post detail → bookmark → express interest → chat → edit/view profile → create post — asserting on rendered UI and **zero console errors**.

## 💻 Local Development
```bash
# From repo root
npm run install:all            # install root + both apps
cp backend/.env.example backend/.env   # then fill in values
npm run dev                    # runs backend (5001) + frontend (5173)
```
- Backend: `http://localhost:5001` (health at `/api/v1/health`)
- Frontend: `http://localhost:5173`

## 🚀 Deployment
Full walkthrough in **[DEPLOYMENT.md](DEPLOYMENT.md)**. In short: push to GitHub → **Render** Blueprint (backend, reads `render.yaml`) → **Vercel** import with root `frontend/` and `VITE_API_URL` → set `CLIENT_URL`/`SERVER_URL` back on Render → add a `/health` keep-alive pinger.

## ⚙️ Environment Variables

**Backend** (`backend/.env`, or Render dashboard): `NODE_ENV`, `PORT`, `API_PREFIX`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`, `EMAIL_TOKEN_EXPIRES_MINUTES`, `CLIENT_URL`, `SERVER_URL`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

**Frontend** (`frontend/.env`, or Vercel): `VITE_API_URL` (the Socket.IO URL is derived from it).

---

## 🔮 Future Roadmap

Squadly is feature-complete for v1. These are natural next steps, grouped by theme. Many build directly on the existing data model and infrastructure (noted where relevant).

### 🔍 Discovery & Matching
- **Skill-based matchmaking** — score teammate/post suggestions from a user's `skills` vs. a post's `requiredSkills` ("92% match"). *Extends the missing-skills logic already in `TeamPanel`.*
- **"Posts for you"** — a personalized feed ranked by skills/interests instead of newest-first.
- **Saved searches + alerts** — notify students when a new post matches their skills.
- **Richer filters/sort** — by college, deadline proximity, team size, and trending.

### 💬 Social & Community
- **Group team chat** — extend `Conversation` (already has `participants[]`) from 1:1 to group once a team forms.
- **Follow students** with a "following" activity feed.
- **Post comments / discussion threads** and reactions.
- **Skill endorsements & post-collaboration reviews** — peer trust signals on profiles.
- **Shareable post & profile links.**

### 👥 Teams & Collaboration
- **Team workspace** — shared to-do list, roles, milestones, and links (GitHub/Figma).
- **Proactive invites** — invite a specific student to a post, not just wait for interest.
- **GitHub integration** — link a repo and surface contributions on profiles.
- **Availability & meeting scheduling** across time zones.

### 🎪 Events & Organizations
- **Official event pages** — group posts under an event (e.g. "HackMIT 2026") with dates/deadlines.
- **Club / college accounts** posting official opportunities.
- **`.edu` verification badges** — build on the existing `isEmailVerified` flag.

### 🔔 Engagement & Notifications
- **PWA + web push** — installable app with push notifications.
- **Weekly email digest** of matching opportunities (Brevo is already wired).
- **Profile-completeness meter** + onboarding nudges.
- **Gamification** — badges, streaks, and an active-collaborator leaderboard.

### 🤖 AI-Powered
- **AI post/message assist** — help write a compelling post or interest note.
- **Semantic search & matching** via embeddings ("find posts/teammates like this").
- **Resume parsing** to auto-fill skills.

### 🛡 Trust, Safety & Platform
- **Report/block + admin moderation dashboard.**
- **OAuth login** (Google/GitHub) and **2FA**; an **active-sessions** page to revoke devices (refresh tokens are already stored per device).
- **Dark mode** — the Tailwind design system is already theme-ready.
- **CI pipeline** (GitHub Actions), **Sentry** monitoring, and a **Redis Socket.IO adapter** for horizontal scaling.

### 🏆 Suggested "Phase 16" priorities
1. **Group team chat** — natural follow-up to Team Management; reuses the chat stack.
2. **Skill-based matchmaking + "Posts for you"** — the core value-add; data model already supports it.
3. **PWA + push notifications** — turns it into an app students keep open.
4. **Endorsements / reviews** — social proof that makes profiles meaningful.
5. **`.edu` / college verification badges** — trust and community identity.

---

*Built by students, for students. 💜*
