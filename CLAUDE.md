# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FixMyCity is a civic complaint platform. Citizens register, file complaints about road/pothole/drainage issues (with photo proof), and track status; admins review complaints, forward them to municipal departments, and resolve them. It has two independently-run halves:

- **Frontend** (repo root): Create React App (React 19) served on port 3000.
- **Backend** (`server/`): Express + MongoDB (Mongoose) API on port 5000, with TensorFlow.js image validation.

These are separate npm packages with separate `package.json` and `node_modules`. The CRA dev server proxies API calls to `http://localhost:5000` via the `"proxy"` field in the root `package.json`.

## Commands

Frontend (run from repo root):
```bash
npm install
npm start                 # dev server on :3000
npm run build             # production build to /build
npm test                  # interactive Jest watch mode
npm test -- --watchAll=false src/App.test.js   # run a single test file once (CI-style)
```

Backend (run from `server/`):
```bash
cd server
npm install
npm run dev               # nodemon, auto-reload
npm start                 # plain node server.js
```

Requires a running MongoDB. Connection comes from `server/.env` (`MONGO_URI`, `PORT`); defaults to `mongodb://127.0.0.1:27017/FixMyCity` and port 5000 if unset.

ML model retraining (Python, run from `server/`):
```bash
python train_pothole_model.py     # trains CNN on my_dataset/, exports pothole_model_tfjs/
```

## Architecture

### State lives in App.js
`src/App.js` is the single source of truth for the entire frontend. It holds **all** state (session, complaints list, all form state, selection) and **all** handlers (auth, complaint CRUD, image compression). Every component is presentational — they receive state and callbacks as props and render nothing on their own. There is no router, no global store, and no component-level data fetching. View switching is driven by `session.role`:

- no session → `Hero` (landing + login/register forms)
- `citizen` → `CitizenDashboard` (file + track complaints)
- `admin` → `AdminDashboard` (review, forward, resolve, delete)

When adding a feature, expect to add state + a handler in `App.js` and thread them down as props. Match this pattern rather than introducing local fetching or state in child components.

### Session is client-trusted (no tokens)
There is **no JWT or session token**. Login returns the user object, which is stored in `localStorage` under `fixmycity-session` and kept in React state. Role checks (`requiredRole === 'admin'`) happen client-side in `handleLogin`. The backend API endpoints are unauthenticated — any caller can hit `/api/complaints` and the status/delete routes directly. Keep this in mind: server-side authorization does not exist yet.

### Complaints use a human-facing string ID
Complaints are keyed throughout by a custom `id` field (`CMP-2401`, `CMP-2402`, …), **not** Mongo's `_id`. New IDs are generated in the create route as `CMP-${2401 + count}` with a uniqueness loop. All API routes (`/api/complaints/:id/status`, `DELETE /api/complaints/:id`) and all frontend lookups match on this `id`. Timestamps (`createdAt`, `updatedAt`, `updates[].at`) are stored as preformatted **strings** in `Asia/Kolkata` time (see `getFormattedDate`), not Date objects — sorting and display rely on the `YYYY-MM-DD HH:mm` lexical format.

### Status workflow + timeline
A complaint moves `Submitted → In Review → Forwarded → Resolved` (enum in `models/Complaint.js`). The status PATCH route auto-appends an entry to the `updates[]` array with a canned note per status; the frontend `Timeline` component renders this array. `forwardedTo` names a municipal department (`authorityOptions` in `App.js`).

### Two-stage ML image validation (server-side, on create)
`POST /api/complaints` validates the uploaded photo before saving, but only for base64 data-URI images (seeded/URL images skip it):
- **`Potholes`** → custom CNN loaded from `server/pothole_model_tfjs/model.json`. Image is resized to 32×32, normalized to [0,1], and rejected if pothole probability (output index 0) < 0.5.
- **`Road problem` / `Drainage problem`** → general MobileNet; passes if any predicted label matches a keyword list in `verifyImageCategory`.

Both validators **fail open**: if the model is not loaded or inference throws, validation is bypassed and the complaint is saved. Note `pothole_model_tfjs/` is not committed — it is produced by `train_pothole_model.py`; without it, pothole validation is skipped. Images are sent inline as base64 in the JSON body (hence the `50mb` body limit); the frontend compresses them client-side in `compressImage` before upload.

### Database seeding
On connect, `seedDatabase()` inserts default users and complaints **only if the collections are empty**. Seeded credentials: admin `admin@fixmycity` / `admin123` (the admin's `phone` field holds the login ID); citizens `9876543210` and `9123456780`, both password `citizen123`. Passwords are bcrypt-hashed; `aadhar` is `sparse`-unique so the admin can omit it.

## Notes

- All API requests from the frontend send an `ngrok-skip-browser-warning: true` header — the app is intended to be tunneled via ngrok for demos. `API_BASE_URL` can be overridden with `REACT_APP_API_URL`.
- The MongoDB instance is expected to be local/standalone; there is no migration tooling — schema changes take effect on next write.
