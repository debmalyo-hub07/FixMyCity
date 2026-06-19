# FixMyCity — Review Log

Civic complaint platform. **SIH 2025 PS 25031** — Crowdsourced Civic Issue Reporting and Resolution System.

This log records the architecture **as forked** and every change made during this work session, with rationale and verification.

---

## 1. Architecture — Before (as forked)

Single Create React App repo with the backend nested inside, no folder separation.

```
FixMyCity/                  (repo root = frontend)
├── package.json            React 19 CRA, framer-motion, lucide-react
├── public/ , src/          React app (App.js holds ALL state, presentational children)
└── server/                 Express + Mongoose backend
    ├── server.js           API, auth, ML image validation, seeding
    ├── models/             User.js, Complaint.js
    ├── my_dataset/         empty potholes/ + no_potholes/ (.gitkeep)
    └── train_pothole_model.py
```

Key traits of the original build:
- **No frontend/backend folder split.** Frontend at root, backend under `server/`.
- **`server/node_modules` committed to git** (~9184 files) and **`server/.env` tracked** — `.gitignore` only anchored `/node_modules` at root.
- **Auth:** login form maps to schema `phone` for everyone. Admin login ID stored in the `phone` field (confusing in DB). No JWT/token — session is client-trusted, stored in `localStorage`.
- **Complaints:** keyed by human string `id` (`CMP-2401`...). Status workflow `Submitted → In Review → Forwarded → Resolved`, timeline in `updates[]`. Timestamps are preformatted Asia/Kolkata strings.
- **ML image validation (server-side, on create):**
  - Potholes → custom CNN from `server/pothole_model_tfjs/` (not committed; absent → bypassed).
  - Road/Drainage → generic MobileNet keyword match.
  - **Hard-rejected** uploads with a 400 when no keyword matched.

### Original behaviour problems found
| # | Problem | Impact |
|---|---------|--------|
| 1 | No folder separation; node_modules + .env tracked | messy repo, credential-leak risk |
| 2 | MobileNet keyword gate hard-rejected valid Road/Drainage photos | citizens blocked from filing real complaints |
| 3 | `selectedComplaint` fell back to global `complaints[0]` | a citizen saw another citizen's complaint (data leak) |
| 4 | ML verdict only `console.log`ged | admin had no visibility into flagged images |
| 5 | Login form exposed demo credentials in placeholder + a "Demo:" hint | credentials shown in UI |
| 6 | Admin card action buttons clipped by `overflow:hidden` + fixed image-row height | actions invisible/unusable |
| 7 | Admin login ID stored in `phone` field | confusing schema, hard to reason about in Compass |
| 8 | Status route wiped `forwardedTo` when an empty string was sent (Approve/Solve/Reopen) | assigned authority lost → cards showed "Unassigned" after solving |

---

## 2. Architecture — After (this session)

```
FixMyCity/
├── package.json            root: `npm run dev` (concurrently boots both)
├── .gitignore              fixed: node_modules, .env, build, model artifacts
├── CLAUDE.md               repo guide
├── REVIEW_LOG.md           this file
├── frontend/               React 19 CRA  (src, public, .env REACT_APP_API_URL)
└── backend/                Express + Mongoose + tfjs  (server.js, models, my_dataset, .env)
```

---

## 3. Changes — detail

### 3.1 Repository restructure (migration)
- `git mv` all source into `frontend/` and `backend/` (history preserved).
- Untracked `server/node_modules` (9184 files) and `server/.env`; deleted stale `server/`.
- Rewrote `.gitignore`: `node_modules/`, `.env*`, `build/`, `backend/pothole_model_tfjs/`, `backend/pothole_model.h5`.
- Added root `package.json` with `concurrently` → `npm run dev`, `install:all`, etc.
- Created `backend/.env` (`PORT`, `MONGO_URI`) and `frontend/.env` (`REACT_APP_API_URL`). **Both gitignored.**

### 3.2 Image upload — advisory validation (no model changes)
- `backend/server.js` create route: ML now **advisory** — runs inference, logs, **never blocks**. Both the custom-CNN and MobileNet hard `400` rejections replaced with `console.warn`.
- ML model code (loading, `imageToTensor`, `verifyImageCategory`, thresholds, keywords) **untouched** — only request-handling reaction changed.
- All categories (Potholes / Road / Drainage / Others) now save.

### 3.3 imageCheck — capture + flag + surface
- `backend/models/Complaint.js`: new `imageCheck { model, matched, score, note, at }` sub-schema (`matched` default `null`).
- `backend/server.js`: builds a verdict object in every validation branch and persists it on the complaint (returned to client). Still advisory.
- `frontend/src/components/AdminDashboard.jsx`: amber warning chip (list) + banner (detail) shown only when `imageCheck.matched === false`. Old/seeded complaints render normally.
- Rationale: civic reporting must **maximise capture** (a false-reject loses a real report; a false-accept is a 5-second admin delete). The ML verdict now assists admin triage instead of dying in console logs.

### 3.4 Cross-citizen data leak fix
- `frontend/src/App.js`: `selectedComplaint` fallback now scoped — citizens fall back to their own complaints, admins to all. Stops one citizen seeing another's complaint.

### 3.5 Login credential exposure removed
- `frontend/src/components/Hero.jsx`: admin ID placeholder → `Enter Admin ID`; removed both `Demo:` credential blocks (admin + citizen).

### 3.6 Admin card layout fix
- `frontend/src/App.css`: removed `overflow:hidden` from `.admin-complaint-card-modern` so the card grows to fit content (actions were being clipped). Restored left-corner radius on the image container. Status buttons on their own full-width row; View History + Delete on a separate spaced row.

### 3.7 Admin identity refactor (username out of `phone`)
- `backend/models/User.js`: added `username` (sparse-unique); `phone` made sparse (no longer required at schema level).
- `backend/server.js`: login looks up `{$or:[{username},{phone}]}`, accepts `identifier` (phone fallback for back-compat), returns both `phone` + `username`. Seed admin uses `username`.
- `frontend/src/App.js`: login sends `identifier`.
- **Data migration (Atlas):** existing admins moved `phone`→`username`, `phone` unset. Citizens untouched. Required dropping a **stale non-sparse `phone_1` index** (it rejected a second null) and re-syncing sparse indexes.

### 3.8 forwardedTo preservation fix
- `backend/server.js` status route: only overwrite `forwardedTo` when a **non-empty** value is sent (`forwardedTo !== undefined && forwardedTo !== ''`). Previously Approve/Solve/Reopen sent `''` and wiped the assigned authority. Now the department survives through resolution; Forward/Re-assign still set it.

---

## 4. Files changed (committed set)
- `.gitignore` (rewritten)
- `package.json` (new root)
- `CLAUDE.md` (new), `REVIEW_LOG.md` (new)
- `backend/server.js`, `backend/models/User.js`, `backend/models/Complaint.js`
- `frontend/src/App.js`, `frontend/src/App.css`
- `frontend/src/components/AdminDashboard.jsx`, `Hero.jsx`, `ComplaintDetail.jsx`
- plus folder-migration renames of all source files into `frontend/` and `backend/`.

**Not committed (gitignored):** `backend/.env`, `frontend/.env`, all `node_modules`, build output, ML model artifacts.

---

## 5. Test results

All test streams passed → **verdict: GO**. Run on the live system (frontend `:3000`, backend `:5000`, Atlas).

### Backend integration (live API) — 7/7 PASS
| Test | Result |
|------|--------|
| `GET /api/complaints` → 200, array of 3, each has `id/title/type/status/forwardedTo/imageCheck` | PASS |
| Admin login by username (`admin@fixmycity`/`admin123`) → role admin, `username` set, `phone` empty | PASS |
| New admin (`Debmalyo@admin123`/`Admin@123`) → admin | PASS |
| Citizen login by phone (`9876543210`/`citizen123`) → role citizen, `phone` set | PASS |
| Wrong password → 400 | PASS |
| **forwardedTo preservation**: Forward `CMP-2403`→"Ward Office", then Solve (empty payload) → authority **still "Ward Office"** (not wiped) | PASS |
| Create `Others` complaint → 201 with `imageCheck{model:'none'}`, then DELETE → 200 | PASS |

### Frontend unit (CRA, CI mode) — 1/1 PASS
`src/App.test.js` "renders FixMyCity hero content" — passes (already FixMyCity-specific, no stale boilerplate).

### Frontend build (strict, `CI=true`) — PASS
`Compiled successfully`, zero ESLint warnings. gzip: main.js ~118 kB, css ~6.8 kB.

### Playwright E2E (headless, 1366×900) — 9/9 PASS
Admin flow: dashboard loads (3 cards) · cards show real `Assigned:` authorities · **no blank "Assigned:"** (renders "Unassigned") · action buttons visible (`View History` etc.) · **actions not clipped** (actions bottom 740.7 ≤ card bottom 763.3). Citizen flow: login → "Welcome back" + Track tab present.

_After tests, demo state reset: CMP-2401/2402 Resolved with their departments; CMP-2403 → Submitted/unassigned (clean)._

---

## 6. Known / deferred (not in scope this session)
- Custom pothole CNN + wet/dry waste model: dataset empty, Python 3.14 has no TF wheels (use the bundled Python 3.11 via uv). Training deferred.
- SIH gaps for later: live map + geotag, voice notes, stage notifications, automated routing engine, analytics/response-time metrics, object storage for images (base64-in-Mongo won't scale), server-side authorization (currently client-trusted).
- `to_categorical` import in `train_pothole_model.py` is unused (harmless).

---

## 7. Security note
The MongoDB Atlas credential lives only in the gitignored `backend/.env`. It was shared in a chat session during setup — **rotate the Atlas password** after the demo. No live URI or real password exists in any tracked file (the `server.js` fallback is a localhost URI; `admin123`/`citizen123` are demo seed passwords).
