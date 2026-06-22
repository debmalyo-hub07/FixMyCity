"""
Model accuracy test for FixMyCity civic classifier.
Tests:
  1. Per-class accuracy on training dataset images (20 random per class)
  2. Cross-category confusion matrix (what does model predict when given wrong category?)
  3. Threshold enforcement simulation (what fraction would be blocked by server?)

Usage:
  .venv\Scripts\python test_model_accuracy.py
"""
import json
import random
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "civic_model.keras"
DATASET_PATH = ROOT / "my_dataset"
THRESHOLDS_PATH = ROOT / "civic_thresholds.json"

CLASSES = ["drainage", "others", "potholes", "streetlight"]
IMG_SIZE = 224
N_TEST_PER_CLASS = 20  # images sampled per class for quick test
random.seed(42)

# ---- Helpers ----

def load_thresholds():
    if THRESHOLDS_PATH.exists():
        raw = json.loads(THRESHOLDS_PATH.read_text())
        return raw.get("thresholds", raw)
    return {c: 0.30 for c in CLASSES}


def preprocess_image(path):
    img = tf.keras.utils.load_img(path, target_size=(IMG_SIZE, IMG_SIZE))
    arr = tf.keras.utils.img_to_array(img)
    arr = preprocess_input(arr)
    return np.expand_dims(arr, axis=0)


def predict(model, img_path):
    x = preprocess_image(img_path)
    probs = model.predict(x, verbose=0)[0]
    return {cls: float(probs[i]) for i, cls in enumerate(CLASSES)}


def bar(val, width=20):
    filled = int(val * width)
    return "[" + "#" * filled + "." * (width - filled) + f"] {val*100:5.1f}%"


# ---- Main ----

def main():
    if not MODEL_PATH.exists():
        print(f"ERROR: {MODEL_PATH} not found. Run train_civic_model.py first.")
        sys.exit(1)

    print("Loading model...")
    model = tf.keras.models.load_model(str(MODEL_PATH))
    thresholds = load_thresholds()
    print(f"Thresholds: {thresholds}\n")

    # Confusion matrix: rows = true class, cols = predicted class
    conf_matrix = {true: {pred: 0 for pred in CLASSES} for true in CLASSES}
    per_class_results = {}
    all_wrong_category_blocks = {c: {"blocked": 0, "total": 0} for c in CLASSES}

    for true_class in CLASSES:
        class_dir = DATASET_PATH / true_class
        if not class_dir.exists():
            print(f"[SKIP] {true_class} folder not found")
            continue

        images = list(class_dir.glob("*.jpg"))
        sampled = random.sample(images, min(N_TEST_PER_CLASS, len(images)))

        correct = 0
        blocked_if_wrong = {c: 0 for c in CLASSES if c != true_class}
        probs_list = []

        for img_path in sampled:
            probs = predict(model, img_path)
            predicted = max(probs, key=probs.get)
            conf_matrix[true_class][predicted] += 1
            probs_list.append(probs)

            if predicted == true_class:
                correct += 1

            # Simulate: what if user submits under WRONG category?
            for wrong_class in CLASSES:
                if wrong_class == true_class:
                    continue
                declared_conf = probs[wrong_class]
                thr = thresholds.get(wrong_class, 0.30)
                top_class = max(probs, key=probs.get)
                top_conf = probs[top_class]
                # Server blocks if: declared conf < threshold OR different class wins by >20%
                low_conf = declared_conf < thr
                mismatch = (top_class != wrong_class) and (top_conf - declared_conf > 0.20)
                if low_conf or mismatch:
                    blocked_if_wrong[wrong_class] += 1
                all_wrong_category_blocks[wrong_class]["total"] += 1
                if low_conf or mismatch:
                    all_wrong_category_blocks[wrong_class]["blocked"] += 1

        per_class_results[true_class] = {
            "correct": correct,
            "total": len(sampled),
            "accuracy": correct / len(sampled),
            "blocked_if_submitted_as_wrong": blocked_if_wrong,
            "avg_probs": {c: float(np.mean([p[c] for p in probs_list])) for c in CLASSES},
        }

    # ---- Print Report ----
    print("\n" + "="*62)
    print("  PER-CLASS ACCURACY (on 20 random training images each)")
    print("="*62)
    for cls in CLASSES:
        r = per_class_results.get(cls)
        if not r:
            continue
        acc = r["accuracy"]
        status = "PASS" if acc >= 0.70 else "WARN" if acc >= 0.50 else "FAIL"
        print(f"\n  [{status}] {cls.upper():<14} {bar(acc)}")
        print(f"         Correct: {r['correct']}/{r['total']}")
        print(f"         Avg confidence scores:")
        for c, p in sorted(r["avg_probs"].items(), key=lambda x: -x[1]):
            marker = " <-- declared" if c == cls else ""
            print(f"           {c:<14} {bar(p, 15)}{marker}")

    print("\n" + "="*62)
    print("  CONFUSION MATRIX (rows=true, cols=predicted)")
    print("="*62)
    label = "True\\Pred"
    header = f"  {label:<14}" + "".join(f"{c[:8]:>10}" for c in CLASSES)
    print(header)
    print("  " + "-"*58)
    for true_cls in CLASSES:
        row = conf_matrix[true_cls]
        total = sum(row.values())
        line = f"  {true_cls:<14}"
        for pred_cls in CLASSES:
            count = row[pred_cls]
            pct = count / total * 100 if total else 0
            marker = " *" if pred_cls == true_cls else "  "
            line += f"{count:>6}({pct:3.0f}%)"
        print(line)

    print("\n" + "="*62)
    print("  CROSS-CATEGORY BLOCKING SIMULATION")
    print("  (% of true-class images that would be BLOCKED if submitted")
    print("   under the WRONG category)")
    print("="*62)
    for true_cls in CLASSES:
        r = per_class_results.get(true_cls)
        if not r:
            continue
        print(f"\n  {true_cls.upper()} images submitted as:")
        for wrong_cls, blocked in r["blocked_if_submitted_as_wrong"].items():
            total = r["total"]
            pct = blocked / total * 100
            status = "GOOD" if pct >= 70 else "WARN"
            print(f"    [{status}] '{wrong_cls}' -> {blocked}/{total} blocked ({pct:.0f}%)")

    print("\n" + "="*62)
    print("  SUMMARY")
    print("="*62)
    avg_acc = np.mean([r["accuracy"] for r in per_class_results.values()])
    print(f"  Average accuracy across all classes: {avg_acc*100:.1f}%")
    print(f"  Model file: {MODEL_PATH.name} ({MODEL_PATH.stat().st_size/1024/1024:.1f} MB)")
    print(f"  TFJS model: civic_model_tfjs/ (served to Node.js backend)")
    print(f"  Thresholds: {thresholds}")
    print()

if __name__ == "__main__":
    main()
