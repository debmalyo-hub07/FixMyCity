"""
Audit my_dataset/ folders by running each image through the trained civic model.
Flags images whose folder name disagrees with model's top prediction.
Outputs per-folder summary + writes mismatches to audit_report.csv.
"""

import os
import csv
import json
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

DATASET_DIR = "my_dataset"
MODEL_PATH = "civic_model.keras"
LABELS_PATH = "civic_labels.json"
REPORT_PATH = "audit_report.csv"
IMG_SIZE = (224, 224)
CONF_THRESHOLD = 0.70  # only flag mismatches above this confidence

if not os.path.exists(MODEL_PATH):
    print(f"ERROR: {MODEL_PATH} not found. Train model first.")
    sys.exit(1)
if not os.path.exists(LABELS_PATH):
    print(f"ERROR: {LABELS_PATH} not found.")
    sys.exit(1)

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
labels = json.load(open(LABELS_PATH))
print(f"Classes: {labels}")

# Folder name -> expected label
folder_to_label = {
    "potholes": "potholes",
    "drainage": "drainage",
    "streetlight": "streetlight",
    "others": "others",
}

results = []  # (folder, filename, expected, predicted, top_prob)
per_folder_stats = {f: {"total": 0, "correct": 0, "mismatch": 0, "low_conf": 0} for f in folder_to_label}

for folder, expected_label in folder_to_label.items():
    folder_path = os.path.join(DATASET_DIR, folder)
    if not os.path.isdir(folder_path):
        print(f"WARN: skipping {folder_path} (not a directory)")
        continue
    files = [f for f in os.listdir(folder_path)
             if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    print(f"\nProcessing {folder}/ ({len(files)} images)...")

    BATCH = 32
    batch_imgs = []
    batch_names = []

    def flush():
        if not batch_imgs:
            return
        arr = np.stack(batch_imgs, axis=0)
        arr = preprocess_input(arr)
        preds = model.predict(arr, verbose=0)
        for name, p in zip(batch_names, preds):
            top_idx = int(np.argmax(p))
            top_label = labels[top_idx]
            top_prob = float(p[top_idx])
            per_folder_stats[folder]["total"] += 1
            if top_label == expected_label:
                per_folder_stats[folder]["correct"] += 1
            elif top_prob >= CONF_THRESHOLD:
                per_folder_stats[folder]["mismatch"] += 1
                results.append((folder, name, expected_label, top_label, round(top_prob, 3)))
            else:
                per_folder_stats[folder]["low_conf"] += 1
        batch_imgs.clear()
        batch_names.clear()

    for fname in files:
        path = os.path.join(folder_path, fname)
        try:
            img = tf.keras.utils.load_img(path, target_size=IMG_SIZE)
            arr = tf.keras.utils.img_to_array(img)
            batch_imgs.append(arr)
            batch_names.append(fname)
            if len(batch_imgs) >= BATCH:
                flush()
        except Exception as e:
            print(f"  skip {fname}: {e}")
    flush()

print("\n" + "=" * 60)
print("PER-FOLDER SUMMARY")
print("=" * 60)
print(f"{'folder':<14}{'total':>8}{'correct':>10}{'mismatch':>11}{'low_conf':>11}{'acc':>8}")
for folder, s in per_folder_stats.items():
    acc = (s["correct"] / s["total"] * 100) if s["total"] else 0
    print(f"{folder:<14}{s['total']:>8}{s['correct']:>10}{s['mismatch']:>11}{s['low_conf']:>11}{acc:>7.1f}%")

with open(REPORT_PATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["folder", "filename", "expected", "predicted", "top_prob"])
    for r in results:
        w.writerow(r)

print(f"\nFlagged {len(results)} high-confidence mismatches.")
print(f"Report written to {REPORT_PATH}")
print("\nNext: open audit_report.csv, review flagged images, delete or move misplaced ones.")
