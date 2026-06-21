# FixMyCity

Citizen-powered civic complaint platform. Residents report road / pothole / drainage / streetlight / miscellaneous issues with photo proof and live status tracking; admins triage, forward to municipal departments, and resolve.

Built for **SIH PS 25031** (Smart India Hackathon — Civic Issue Reporting).

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 (Create React App), framer-motion, lucide-react |
| Backend | Node.js 20 LTS, Express 4, Mongoose, bcryptjs |
| Database | MongoDB (Atlas cluster or local) |
| AI advisory | `@tensorflow/tfjs` + `@tensorflow-models/mobilenet` (ImageNet, advisory mode) |
| Training (optional) | Python 3.11, TensorFlow / Keras, scikit-learn |

The classifier runs in **advisory mode** — it tags every uploaded image with an AI commentary but never blocks a submission. See [AI advisory](#ai-advisory) below.

---

## Prerequisites

- **Node.js 20 LTS** — verify with `node -v`. Install via [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows) or [nvm](https://github.com/nvm-sh/nvm) (mac/Linux).
- **MongoDB** — either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended) or a local `mongod` instance.
- **Git**
- **(Optional) Python 3.11** + venv — only needed if you want to retrain the custom classifier on your own dataset.

> Node 24 will fail. TensorFlow.js native prebuilts don't ship for NAPI v10, so stay on Node 20.

---

## Quick start (clone-and-run)

### 1. Clone

```bash
git clone <repo-url> FixMyCity
cd FixMyCity
```

### 2. MongoDB

**Option A — MongoDB Atlas (recommended for first-timers):**

1. Create a free cluster at https://cloud.mongodb.com/
2. Database Access → add user `your_user` with password.
3. Network Access → add IP `0.0.0.0/0` (or your IP).
4. Cluster → Connect → Drivers → copy the connection string. Example:
   ```
   mongodb+srv://your_user:your_pass@cluster.xxxxx.mongodb.net/FixMyCity?retryWrites=true&w=majority
   ```

**Option B — local MongoDB:**

Install MongoDB Community Server and run it. Default URI: `mongodb://127.0.0.1:27017/FixMyCity`.

### 3. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://your_user:your_pass@cluster.xxxxx.mongodb.net/FixMyCity?retryWrites=true&w=majority
PORT=5000
```

Start backend:

```bash
npm run dev
```

Expected boot output:

```
Express server running on port 5000
Loading MobileNet (ImageNet)...
Connected to MongoDB.
MobileNet loaded. Civic categories: [ 'drainage', 'others', 'potholes', 'streetlight' ]
```

> First boot downloads MobileNet (~14 MB) from Google's TFHub CDN. Needs internet on first run.

### 4. Frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`.

### 5. Log in

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin@fixmycity` | `admin123` |
| Citizen | `9876543210` | `citizen123` |
| Citizen | `9123456780` | `citizen123` |

These are seeded automatically on first connect (only if the DB is empty).

---

## Health check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "ok": true,
  "model_loaded": true,
  "classes": ["drainage", "others", "potholes", "streetlight"],
  "classifier": "mobilenet-imagenet+keywords (advisory mode — never blocks)"
}
```

---

## Project structure

```
FixMyCity/
├── backend/
│   ├── server.js                  # Express + MongoDB + MobileNet classifier
│   ├── models/                    # User.js, Admin.js, Complaint.js
│   ├── .env                       # MONGO_URI (you create this)
│   ├── civic_model.keras          # custom Keras model (training output)
│   ├── civic_labels.json          # class order
│   ├── civic_model_tfjs/          # TFJS-converted custom model (not used at runtime)
│   ├── my_dataset/                # training images per class
│   │   ├── potholes/
│   │   ├── drainage/
│   │   ├── streetlight/
│   │   └── others/
│   ├── train_civic_model.py       # MobileNetV2 transfer-learning script
│   ├── audit_dataset.py           # checks training labels with trained model
│   ├── download_datasets.py       # Bing/Kaggle scraper for dataset
│   └── clean_datasets.py          # dedupe + filter
├── frontend/
│   ├── src/
│   │   ├── App.js                 # SINGLE SOURCE OF TRUTH — all state + handlers
│   │   ├── components/
│   │   │   ├── CitizenDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ComplaintForm.jsx
│   │   │   ├── Hero.jsx
│   │   │   └── ...
│   │   └── ...
│   └── public/
├── CLAUDE.md                      # internal contributor guide
└── README.md                      # this file
```

---

## AI advisory

The backend runs each uploaded image through **MobileNet (ImageNet)** and reports a best-guess match against the declared category — but **never blocks** the submission. Why:

- A previous custom 4-class CNN overfit (predicted `potholes` for almost everything) due to small dataset (~350 images/class).
- ImageNet's 1000 classes are mostly animals/food/household; only partial coverage of civic damage.
- Honest mode: classifier output is advisory metadata for admins, not a gatekeeper.

Pipeline in `backend/server.js`:

1. `loadCivicModel()` loads MobileNet v2 alpha=1.0 from CDN at boot.
2. On `POST /api/complaints`, the image is decoded, classified, and the top-5 ImageNet labels are inspected.
3. `CATEGORY_KEYWORDS` maps each civic category to ImageNet substrings (potholes → `crater, pothole, asphalt, road, ...`).
4. If a top-5 label contains any keyword for the declared category, it's an `advisory_match`; otherwise `advisory_no_match`.
5. The result is saved on the complaint as `imageCheck.note` (admins see it in detail view).

Backend log per submit:

```
[civic-advisory] declared=Potholes top=[crater (12%), asphalt (8%), pavement (5%)] match=advisory_match
```

---

## Using your own custom data / retraining

You can rebuild the ML dataset and retrain a custom classifier from scratch. The dataset itself is **not tracked in Git** (`.gitignore`) to avoid bloat. Instead, use the provided fetching and cleaning scripts to reproduce it, or supply your own city's images.

### Step 1 — Python environment

From `backend/`:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # PowerShell on Windows
# or: source .venv/bin/activate  (macOS / Linux)
pip install -r requirements.txt
```

### Step 2 — Fetch default dataset

Since the dataset is too large to commit, download the starter images using the provided scripts:

```bash
python download_datasets.py --target 400
python clean_datasets.py
```

This script (`download_datasets.py`) scrapes Kaggle and Bing to fetch base images into `backend/my_dataset/`, and then (`clean_datasets.py`) drops irrelevant/noisy images by querying a baseline ImageNet model.

### Step 3 — Add your own custom data (Optional)

You can import your own custom data by placing images into their respective folders under `backend/my_dataset/`:

```
backend/my_dataset/
├── potholes/         # Images of road potholes / craters
├── drainage/         # Images of blocked drains, sewer overflow, manholes
├── streetlight/      # Images of lamp posts, broken lights
└── others/           # Miscellaneous civic issues (garbage, leaks, etc.)
```

Recommended: ≥ 500 images per class for a model that generalizes well. Mix lighting, angles, urban/rural shots, and day/night for variety. JPG/PNG, any resolution — the training script resizes to 224×224.

### Step 4 — Train

```bash
python train_civic_model.py
```

This script:
- Uses MobileNetV2 (ImageNet weights) as backbone.
- Trains a head on top (frozen backbone, ~12 epochs).
- Fine-tunes top 30 layers (~8 epochs).
- Exports `civic_model.keras` (Keras format) and `civic_model_tfjs/` (TFJS LayersModel).
- Writes class order to `civic_labels.json`.

Typical training time: ~10–20 minutes on CPU; <5 minutes on GPU.

Output console shows per-epoch val_acc. Aim for ≥85% on validation.

### Step 5 — Audit your dataset (optional but recommended)

After training, check whether your folder labels match what the model learned:

```bash
python audit_dataset.py
```

Prints per-folder summary:

```
folder        total  correct  mismatch  low_conf    acc
potholes        500     485         8         7    97.0%
drainage        500     441        38        21    88.2%
streetlight     500     463        19        18    92.6%
others          500     488         5         7    97.6%
```

Writes `audit_report.csv` listing every flagged mismatch (filename + expected vs predicted). Open mismatched files and decide: delete junk / move to correct folder. Retrain after cleanup.

### Step 5 — Wire up your custom model

Two ways to use the retrained classifier:

**A. Keep MobileNet ImageNet (current default).** No code change. Your retrained model just sits in `civic_model_tfjs/`. The runtime ignores it.

**B. Switch to your custom model.** Edit `backend/server.js`:

1. Replace the `loadCivicModel()` body with the previous custom-model loader (load via `http://localhost:${PORT}/model/model.json`).
2. Replace `classifyCivicImage()` to return `{topClass, topProb, probs}` against your 4 classes.
3. Replace `decideBlock()` logic — either keep advisory or block when wrong class wins (`block: true` when `prediction.topClass !== declaredClass`).
4. Re-enable `app.use('/model', express.static(path.join(__dirname, 'civic_model_tfjs')))`.

Git history has the old loader if you want to revert.

### Step 6 — Restart and test

```bash
npm run dev
```

Submit a test complaint per category. Backend log shows classifier verdict per upload.

---

## Custom municipal departments

To change the list of forwarding targets:

1. Edit `frontend/src/App.js`. Find `authorityOptions` (array of strings) and replace with your city's department list.
2. Save. CRA hot-reloads. Admin's Forward dropdown now shows the new departments.

---

## Common issues

### `npm install` fails on `@tensorflow/tfjs-node`
You probably installed `tfjs-node` somewhere. This project uses **pure-JS tfjs** (`@tensorflow/tfjs` + `@tensorflow-models/mobilenet`) — no native bindings. Run:
```bash
npm uninstall @tensorflow/tfjs-node
npm install
```

### `MongoServerError: bad auth`
Wrong `MONGO_URI` user/password. Atlas treats the password as URL-encoded — special characters like `@`, `:`, `/` must be percent-encoded.

### `MongooseError: Could not connect`
Atlas Network Access doesn't include your IP. Add `0.0.0.0/0` for development.

### Frontend shows `Could not connect to server`
Backend isn't running, or wrong port. Check `http://localhost:5000/api/health` returns JSON.

### MobileNet failed to load on backend boot
First boot needs internet (downloads model from Google CDN). Subsequent boots cache it.

### `node` not found after `nvm use 20`
Close and reopen PowerShell — Windows PATH cache lag.

---

## Default routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health + classifier status |
| POST | `/api/users/register` | Register citizen |
| POST | `/api/users/login` | Login citizen |
| POST | `/api/admins/login` | Login admin |
| GET | `/api/complaints` | List all complaints |
| POST | `/api/complaints` | Create complaint (runs classifier) |
| PATCH | `/api/complaints/:id/status` | Update status (Approve / Forward / Solve) |
| DELETE | `/api/complaints/:id` | Delete complaint |

**Security note:** API routes are currently unauthenticated. Anyone who reaches them can mutate data. Do not expose to public internet without adding auth.

---

## Production build

```bash
cd frontend
npm run build
# output in frontend/build/ — serve with any static host
```

Backend runs as a normal Node process. For production, use `pm2` or `systemd` to keep `npm start` alive in `backend/`.

---

## License

Internal SIH project. No license declared.

## Credits

Built for Smart India Hackathon PS 25031.
