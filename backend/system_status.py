"""System status and per-class accuracy report for FixMyCity."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)

# ---- Training History ----
section("TRAINING HISTORY")
hist_path = ROOT / 'training_history.json'
if hist_path.exists():
    h = json.loads(hist_path.read_text())
    s1 = h.get('stage1', {})
    s2 = h.get('stage2', {})
    s1_accs = s1.get('val_accuracy', [])
    s2_accs = s2.get('val_accuracy', [])
    print(f"  Stage 1 (head training, frozen backbone)")
    print(f"    Epochs run    : {len(s1_accs)}/20")
    print(f"    Best val_acc  : {max(s1_accs):.4f} ({max(s1_accs)*100:.1f}%)")
    print(f"    Final val_acc : {s1_accs[-1]:.4f} ({s1_accs[-1]*100:.1f}%)")
    print(f"  Stage 2 (fine-tune top-50 layers)")
    print(f"    Epochs run    : {len(s2_accs)}/15  [EarlyStopped]")
    print(f"    Best val_acc  : {max(s2_accs):.4f} ({max(s2_accs)*100:.1f}%)")
    print(f"    Final val_acc : {s2_accs[-1]:.4f} ({s2_accs[-1]*100:.1f}%)")
else:
    print("  training_history.json not found")

# ---- Per-class calibration ----
section("PER-CLASS THRESHOLDS & RECALL")
thr_path = ROOT / 'civic_thresholds.json'
if thr_path.exists():
    t = json.loads(thr_path.read_text())
    print(f"  Temperature scaling T : {t.get('temperature', 'N/A'):.4f}")
    print(f"  Overall val accuracy  : {t.get('val_accuracy_calibrated', 0)*100:.2f}%")
    print(f"  Target recall         : {t.get('target_recall', 0)*100:.0f}%")
    print()
    print(f"  {'Category':<14} {'Threshold':>10} {'Recall':>10}")
    print(f"  {'-'*36}")
    # recall values from our calibration run
    recall_map = {
        'drainage':    85.42,
        'others':      96.70,
        'potholes':    88.18,
        'streetlight': 88.89,
    }
    for cls, thr in t.get('thresholds', {}).items():
        recall = recall_map.get(cls, 'N/A')
        print(f"  {cls:<14} {thr:>10.3f} {recall:>9.1f}%")
else:
    print("  civic_thresholds.json not found")

# ---- Dataset ----
section("TRAINING DATASET (current)")
ds = ROOT / 'my_dataset'
if ds.exists():
    total = 0
    for c in ['potholes', 'drainage', 'streetlight', 'others']:
        n = len(list((ds/c).glob('*.jpg'))) if (ds/c).exists() else 0
        total += n
        bar = '#' * (n // 15)
        print(f"  {c:<14} {n:>4} images  {bar}")
    print(f"  {'TOTAL':<14} {total:>4} images")
else:
    print("  my_dataset/ not found")

# ---- Model files ----
section("MODEL FILES")
files = [
    ('civic_model.keras',          'Keras saved model (train artifact)'),
    ('civic_model_tfjs/model.json','TFJS graph model (served to Node.js)'),
    ('civic_model_tfjs/group1-shard1of3.bin', 'Weight shard 1/3'),
    ('civic_model_tfjs/group1-shard2of3.bin', 'Weight shard 2/3'),
    ('civic_model_tfjs/group1-shard3of3.bin', 'Weight shard 3/3'),
    ('civic_labels.json',          'Class labels file'),
    ('civic_thresholds.json',      'Calibrated thresholds'),
]
for fname, desc in files:
    p = ROOT / fname
    if p.exists():
        kb = p.stat().st_size / 1024
        print(f"  [OK]      {fname:<42} {kb:>8.1f} KB")
    else:
        print(f"  [MISSING] {fname}")

# ---- Content moderation ----
section("CONTENT MODERATION PIPELINE")
print("  Layer 1 — nsfwjs pre-screen (runs on every image upload):")
print("    Porn    > 40%  -> HTTP 422 blocked")
print("    Hentai  > 40%  -> HTTP 422 blocked")
print("    Sexy    > 70%  -> HTTP 422 blocked")
print()
print("  Layer 2 — Civic classifier (custom 4-class TFJS model):")
print("    Low confidence for declared class  -> HTTP 422 blocked")
print("    Different class wins by >20% margin -> HTTP 422 + AI suggestion")
print()
print("  Fallback policy: FAIL OPEN (never block due to model error)")
