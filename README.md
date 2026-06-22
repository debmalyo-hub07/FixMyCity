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

## AI Moderation & Validation

The backend uses a **custom 4-class Civic AI Model** (MobileNetV2 base, fine-tuned on custom datasets) to strictly enforce category correctness and block invalid submissions. It no longer relies on the generic ImageNet classifier.

### Features
1. **Cross-Category Enforcement**: If a user submits a pothole image but selects "Broken street light problem", the API will reject the request with HTTP 422 and prompt them to use the correct category.
2. **"Others" Keyword Routing**: When the "Others" category is selected, the API scans the problem title. If it contains words like `pothole`, `drain`, or `light`, it dynamically overrides the validation target to the specific class, preventing users from bypassing filters by just clicking "Others".
3. **Threshold Calibration**: Confidence thresholds are individually configured per class in `civic_thresholds.json`.

Pipeline in `backend/server.js`:

1. `loadCivicModel()` loads the TFJS layers model from `backend/civic_model_tfjs` at boot.
2. On `POST /api/complaints`, the image is base64-decoded and classified.
3. The model returns probabilities for `drainage`, `others`, `potholes`, and `streetlight`.
4. `decideBlock()` compares the top probability against the required threshold and blocks if the mismatch is severe or confidence is too low.

Backend log per submit:
```
[civic] Civic graph model loaded. Classes: [ 'drainage', 'others', 'potholes', 'streetlight' ]
  Pothole→Drainage BLOCKED: potholes(100%) vs declared(0%)
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

The application is already hardwired to use the local `civic_model_tfjs` directory. 

To update the thresholds or tweak the blocking logic:
1. Open `backend/civic_thresholds.json` to change the minimum confidence required for each category.
2. If tests fail due to over-eager blocking, run `python temperature_scaling.py` to calibrate the model confidence scores.
3. Restart the backend (`npm run dev`) so the new thresholds and model take effect.

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
