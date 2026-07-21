# TeamUp

A student collaboration platform where students can find teammates for hackathons, research, startups, projects, and competitions.

**Status:** 🚧 Under Development — completed **Phase 6: Post Creation**

---

## Tech Stack

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Frontend      | React + Vite, Tailwind CSS, React Router, Axios, React Hook Form, TanStack Query |
| Backend       | Node.js, Express.js, Mongoose                          |
| Database      | MongoDB Atlas                                          |
| Auth          | JWT + Refresh Tokens, bcrypt, email verification      |
| Realtime      | Socket.IO                                              |
| Email         | Nodemailer + Brevo/Resend                             |
| Image Upload  | Cloudinary                                             |
| Deployment    | Frontend → Vercel · Backend → Render · DB → MongoDB Atlas |

## Repository Structure

This is a **monorepo** with two independent, separately deployable apps:

```
TeamUp/
├── backend/            # Express + Mongoose API (deploys to Render)
│   └── src/
│       ├── config/         # Env loading & DB connection
│       ├── controllers/    # Request handlers (thin)
│       ├── routes/         # Route definitions
│       ├── middleware/     # Auth, error handling, rate limiting
│       ├── models/         # Mongoose schemas
│       ├── services/       # Business logic (email, tokens, etc.)
│       ├── validators/     # Request validation schemas
│       ├── sockets/        # Socket.IO event handlers
│       ├── utils/          # Helpers (logger, ApiError, asyncHandler)
│       ├── app.js          # Express app assembly
│       └── server.js       # Entry point (HTTP + Socket.IO)
│
├── frontend/           # React + Vite SPA (deploys to Vercel)
│   └── src/
│       ├── api/            # Axios instance & API modules
│       ├── assets/         # Images, icons, fonts
│       ├── components/     # Reusable UI + layout components
│       ├── contexts/       # React contexts (auth, socket)
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Route-level pages
│       ├── routes/         # Router config & guards
│       ├── lib/            # Third-party client setup (query client)
│       ├── styles/         # Global styles / Tailwind layers
│       └── utils/          # Frontend helpers
│
├── package.json        # Root: convenience scripts to run both apps
├── .editorconfig       # Consistent formatting across editors
├── .nvmrc              # Pinned Node version for deploys
└── .gitignore
```

## Getting Started (local development)

> Requires Node.js **20+** and a MongoDB connection string.

```bash
# 1. Install dependencies for root + both apps
npm run install:all

# 2. Configure backend environment
cp backend/.env.example backend/.env
#   then fill in the values in backend/.env

# 3. Run backend (and later the frontend) together
npm run dev
```

- Backend runs on `http://localhost:5001` (health check at `/api/v1/health`).
- Frontend will run on `http://localhost:5173` (added in Phase 3).

## Development Roadmap (phases)

1. ✅ **Planning, Architecture, Setup**
2. ✅ **Backend & Authentication**
3. ✅ **Frontend Setup**
4. ✅ **Authentication UI**
5. ✅ **Student Profile**
6. ✅ **Post Creation** ← *you are here*
7. Post Feed
8. Search & Filters
9. Interested Workflow & Email
10. Real-time Chat
11. Dashboard
12. Notifications
13. Bookmarks
14. Team Management
15. Deployment & Optimization
