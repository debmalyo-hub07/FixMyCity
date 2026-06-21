"""Auto-clean: only reject HARD junk (animals, anime, products). Keep ambiguous."""
import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import (
    MobileNetV2, preprocess_input, decode_predictions
)

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
QUARANTINE = ROOT / "my_dataset_rejected"

HARD_REJECT_SUBSTR = [
    "tabby", "tiger_cat", "persian_cat", "siamese_cat", "egyptian_cat",
    "golden_retriever", "labrador", "beagle", "poodle", "bulldog", "chihuahua",
    "shepherd", "terrier", "spaniel", "husky", "rottweiler",
    "goldfish", "shark", "stingray", "eel",
    "cock", "hen", "ostrich", "peacock", "parrot", "macaw", "toucan",
    "lion", "tiger", "leopard", "cheetah", "jaguar",
    "elephant", "zebra", "giraffe", "hippopotamus", "rhinoceros",
    "monkey", "baboon", "gorilla", "chimpanzee", "orangutan",
    "butterfly", "ladybug", "dragonfly",
    "daisy", "tulip", "sunflower", "rose",
    "pizza", "burger", "hotdog", "sandwich", "cake", "ice_cream",
    "banana", "pineapple", "strawberry",
    "comic_book", "envelope", "menu", "book_jacket",
    "violin", "cello", "trumpet", "saxophone", "trombone",
    "wig", "lipstick", "perfume", "hair_spray",
    "sports_car", "convertible", "limousine", "racer",
    "stage", "ballplayer", "groom", "bride",
    "spider_web", "starfish", "jellyfish",
]

CATEGORIES = ["potholes", "drainage", "streetlight", "others"]
K = 5
REJECT_PROB_THRESHOLD = 0.20


def load_model():
    print("Loading MobileNetV2 ImageNet head...")
    return MobileNetV2(weights="imagenet")


def classify_batch(model, imgs):
    arr = np.stack([np.array(im.resize((224, 224))) for im in imgs])
    arr = preprocess_input(arr.astype("float32"))
    preds = model.predict(arr, verbose=0)
    return decode_predictions(preds, top=K)


def is_hard_reject(top_labels):
    for _, name, prob in top_labels:
        if prob < REJECT_PROB_THRESHOLD:
            continue
        lname = name.lower()
        for sub in HARD_REJECT_SUBSTR:
            if sub in lname:
                return True, name, prob
    return False, None, None


def clean_category(category, model, batch=32, dry_run=False):
    src_dir = DATA_DIR / category
    rej_dir = QUARANTINE / category
    rej_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(src_dir.glob("*.jpg"))
    print(f"\n[{category}] scoring {len(files)} files...")
    kept, removed = 0, 0
    buf, paths = [], []

    def flush():
        nonlocal kept, removed
        if not buf:
            return
        results = classify_batch(model, buf)
        for p, top in zip(paths, results):
            reject, label, prob = is_hard_reject(top)
            if reject:
                removed += 1
                if not dry_run:
                    shutil.move(str(p), str(rej_dir / p.name))
            else:
                kept += 1
        buf.clear()
        paths.clear()

    for f in files:
        try:
            im = Image.open(f).convert("RGB")
            buf.append(im)
            paths.append(f)
            if len(buf) >= batch:
                flush()
        except Exception:
            removed += 1
            if not dry_run:
                f.unlink(missing_ok=True)
    flush()
    print(f"[{category}] kept {kept}, removed {removed}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", choices=CATEGORIES + ["all"], default="all")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    model = load_model()
    cats = CATEGORIES if args.category == "all" else [args.category]
    for c in cats:
        clean_category(c, model, dry_run=args.dry_run)

    print("\n=== Post-clean counts ===")
    for c in CATEGORIES:
        n = len(list((DATA_DIR / c).glob("*.jpg")))
        print(f"  {c}: {n}")


if __name__ == "__main__":
    main()
