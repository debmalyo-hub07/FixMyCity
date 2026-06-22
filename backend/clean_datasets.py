"""Auto-clean: reject junk AND civic cross-category contamination.

Two-pass strategy:
  Pass 1 -- Hard rejects: obvious non-civic images (animals, food, anime, etc.)
  Pass 2 -- Civic cross-contamination: images from one civic folder that
            ImageNet-classifies as a different civic concept with high confidence.
"""
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

# ---- Pass 1: Hard reject substrings (non-civic, clearly off-topic) ----
HARD_REJECT_SUBSTR = [
    # Animals
    "tabby", "tiger_cat", "persian_cat", "siamese_cat", "egyptian_cat",
    "golden_retriever", "labrador", "beagle", "poodle", "bulldog", "chihuahua",
    "shepherd", "terrier", "spaniel", "husky", "rottweiler",
    "goldfish", "shark", "stingray", "eel",
    "cock", "hen", "ostrich", "peacock", "parrot", "macaw", "toucan",
    "lion", "tiger", "leopard", "cheetah", "jaguar",
    "elephant", "zebra", "giraffe", "hippopotamus", "rhinoceros",
    "monkey", "baboon", "gorilla", "chimpanzee", "orangutan",
    "butterfly", "ladybug", "dragonfly", "spider_web", "starfish", "jellyfish",
    # Food (not civic)
    "pizza", "burger", "hotdog", "sandwich", "cake", "ice_cream",
    "banana", "pineapple", "strawberry", "daisy", "tulip", "sunflower", "rose",
    # Products/indoor
    "comic_book", "envelope", "menu", "book_jacket",
    "violin", "cello", "trumpet", "saxophone", "trombone",
    "wig", "lipstick", "perfume", "hair_spray",
    "sports_car", "convertible", "limousine", "racer",
    "stage", "ballplayer", "groom", "bride",
    # Indoor/people scenes
    "restaurant", "barbershop", "classroom", "gymnasium", "bedroom", "bathroom",
    "suit", "jersey", "uniform", "lab_coat",
    "laptop", "monitor", "keyboard", "mouse", "remote_control",
    "face_powder", "sunscreen", "lotion",
]

# ---- Pass 2: Civic cross-contamination rules ----
# If an image in folder X has a top prediction that belongs to a DIFFERENT civic
# category with probability above CROSS_REJECT_THRESHOLD, it is contaminated.
CROSS_CONTAMINATION_RULES = {
    # key = folder name, value = list of ImageNet concept substrings that
    # indicate the image actually belongs to a DIFFERENT civic class
    "drainage": [
        # These indicate it's a streetlight image, not drainage
        "street_sign", "traffic_light", "spotlight", "lamppost",
        "candle", "torch", "lantern", "pole", "beacon",
        # These indicate it's a pothole image
        "asphalt", "gravel", "cobblestone", "pavement",
    ],
    "streetlight": [
        # These indicate drainage content
        "manhole", "sewer", "water", "flood", "mud", "swamp",
        "geyser", "fountain", "dam", "irrigation",
        # These indicate pothole content
        "gravel", "asphalt", "cobblestone",
    ],
    "potholes": [
        # These indicate streetlight content
        "street_sign", "traffic_light", "spotlight", "lamppost", "pole",
        "candle", "torch", "lantern",
        # These indicate drainage content
        "manhole", "sewer", "gutter", "mud", "swamp",
    ],
    "others": [
        # "others" should only be rejected if it's clearly one of the 3 main categories
        # (not a general reject -- others is a catch-all for real civic issues)
        # Only reject if top-1 is a very specific main-category concept
    ],
}

CATEGORIES = ["potholes", "drainage", "streetlight", "others"]
K = 5
HARD_REJECT_PROB_THRESHOLD = 0.15   # lower = more aggressive rejection
CROSS_REJECT_PROB_THRESHOLD = 0.55  # if cross-category concept > 55%, likely mislabelled


def load_model():
    print("Loading MobileNetV2 ImageNet head for cleaning...")
    return MobileNetV2(weights="imagenet")


def classify_batch(model, imgs):
    arr = np.stack([np.array(im.resize((224, 224))) for im in imgs])
    arr = preprocess_input(arr.astype("float32"))
    preds = model.predict(arr, verbose=0)
    return decode_predictions(preds, top=K)


def is_hard_reject(top_labels):
    """Pass 1: obvious non-civic images."""
    for _, name, prob in top_labels:
        if prob < HARD_REJECT_PROB_THRESHOLD:
            continue
        lname = name.lower()
        for sub in HARD_REJECT_SUBSTR:
            if sub in lname:
                return True, name, prob
    return False, None, None


def is_cross_contaminated(top_labels, category):
    """Pass 2: image belongs to a different civic category."""
    bad_concepts = CROSS_CONTAMINATION_RULES.get(category, [])
    if not bad_concepts:
        return False, None, None
    for _, name, prob in top_labels:
        if prob < CROSS_REJECT_PROB_THRESHOLD:
            continue
        lname = name.lower()
        for concept in bad_concepts:
            if concept in lname:
                return True, name, prob
    return False, None, None


def clean_category(category, model, batch=32, dry_run=False):
    src_dir = DATA_DIR / category
    rej_dir = QUARANTINE / category
    rej_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(src_dir.glob("*.jpg"))
    print(f"\n[{category}] scoring {len(files)} files (Pass 1: hard reject + Pass 2: cross-contamination)...")

    kept, removed_hard, removed_cross = 0, 0, 0
    buf, paths = [], []

    def flush():
        nonlocal kept, removed_hard, removed_cross
        if not buf:
            return
        results = classify_batch(model, buf)
        for p, top in zip(paths, results):
            # Pass 1 -- hard reject
            reject, label, prob = is_hard_reject(top)
            if reject:
                removed_hard += 1
                if not dry_run:
                    shutil.move(str(p), str(rej_dir / p.name))
                continue
            # Pass 2 -- civic cross-contamination
            cross, label, prob = is_cross_contaminated(top, category)
            if cross:
                removed_cross += 1
                if not dry_run:
                    shutil.move(str(p), str(rej_dir / ("cross_" + p.name)))
                if dry_run:
                    print(f"  [DRY-RUN cross] {p.name} -> would reject (matched '{label}' p={prob:.2f})")
                continue
            kept += 1
        buf.clear()
        paths.clear()

    for f in files:
        try:
            im = Image.open(f).convert("RGB")
            # Also reject extremely small images slipping through
            if min(im.size) < 100:
                removed_hard += 1
                if not dry_run:
                    f.unlink(missing_ok=True)
                continue
            buf.append(im)
            paths.append(f)
            if len(buf) >= batch:
                flush()
        except Exception:
            removed_hard += 1
            if not dry_run:
                f.unlink(missing_ok=True)
    flush()

    print(f"[{category}] kept={kept} | removed hard={removed_hard} | removed cross-category={removed_cross}")
    return kept, removed_hard, removed_cross


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", choices=CATEGORIES + ["all"], default="all")
    ap.add_argument("--dry-run", action="store_true",
                    help="Preview what would be removed without moving files")
    args = ap.parse_args()

    model = load_model()
    cats = CATEGORIES if args.category == "all" else [args.category]

    total_kept = total_removed = 0
    for c in cats:
        k, rh, rc = clean_category(c, model, dry_run=args.dry_run)
        total_kept += k
        total_removed += rh + rc

    print(f"\n=== Post-clean counts ===")
    for c in CATEGORIES:
        n = len(list((DATA_DIR / c).glob("*.jpg")))
        print(f"  {c}: {n}")

    print(f"\nTotal kept: {total_kept} | Total removed: {total_removed}")
    if args.dry_run:
        print("\n[DRY RUN -- no files were moved. Re-run without --dry-run to apply.]")


if __name__ == "__main__":
    main()

