"""filter_dataset.py -- Smart dataset filtering before training.

Runs three passes on my_dataset/:
  Pass 1: Near-duplicate removal via perceptual hashing (imagehash)
  Pass 2: Minimum resolution enforcement (128x128 minimum)
  Pass 3: Civic relevance check -- rejects clearly non-outdoor/non-civic images
           using MobileNetV2 ImageNet predictions

Usage:
  python filter_dataset.py                   # dry-run (show what would be removed)
  python filter_dataset.py --apply           # actually move rejected files
  python filter_dataset.py --category potholes --apply
"""
import argparse
import shutil
import sys
from pathlib import Path
from collections import defaultdict

import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import (
    MobileNetV2, preprocess_input, decode_predictions
)

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
EXCESS_DIR = ROOT / "my_dataset_excess"

CATEGORIES = ["potholes", "drainage", "streetlight", "others"]

# ImageNet concept substrings that strongly indicate an OUTDOOR CIVIC ENVIRONMENT
# At least one of these should appear in top-5 predictions for the image to be relevant
CIVIC_POSITIVE_CONCEPTS = {
    "potholes": [
        "road", "street", "highway", "pavement", "asphalt", "gravel",
        "cobblestone", "tarmac", "concrete", "pothole", "crater", "hole",
        "pit", "ditch", "trench", "curb", "gutter", "sidewalk", "alley",
        "intersection", "lane", "bridge", "overpass", "tunnel",
    ],
    "drainage": [
        "manhole", "sewer", "drain", "gutter", "pipe", "plumbing",
        "water", "flood", "puddle", "pool", "brook", "stream", "mud",
        "sludge", "overflow", "bog", "swamp", "marsh", "irrigation",
        "road", "street", "pavement", "curb", "grate",
    ],
    "streetlight": [
        "street", "road", "pole", "lamp", "light", "lantern", "torch",
        "beacon", "spotlight", "lamppost", "highway", "pavement",
        "urban", "city", "night", "dusk", "bulb",
    ],
    "others": [
        # "others" is broad -- just needs to be outdoor/civic-ish
        "road", "street", "building", "wall", "fence", "sidewalk",
        "tree", "bush", "park", "garden", "outdoor", "field",
        "garbage", "trash", "waste", "bin", "debris", "rubble",
        "construction", "scaffold", "crane", "excavator",
        "water", "pipe", "manhole", "graffiti",
    ],
}

# If top-1 prediction has one of these concepts AND probability > threshold,
# the image is clearly irrelevant (indoor, person, product, etc.)
CIVIC_NEGATIVE_STRONG = [
    "suit", "jersey", "dress", "shirt", "coat", "tie",
    "laptop", "computer", "keyboard", "monitor", "phone", "remote_control",
    "desk", "chair", "sofa", "table", "shelf", "cabinet",
    "restaurant", "kitchen", "bedroom", "bathroom", "classroom",
    "face", "portrait", "selfie",
    "bottle", "cup", "bowl", "plate", "fork", "spoon",
    "book", "magazine", "newspaper",
    "screen", "television", "projector",
]

HASH_THRESHOLD = 8          # Hamming distance for near-duplicate detection
MIN_SIZE = 128              # Minimum width/height in pixels
CIVIC_NEG_THRESHOLD = 0.60  # If top-1 negative concept > 60%, reject
CIVIC_POS_MIN_PROB = 0.05   # At least one positive concept must have >= 5% prob


def load_imagenet_model():
    print("Loading MobileNetV2 for civic relevance check...")
    return MobileNetV2(weights="imagenet")


def phash(img):
    """Compute perceptual hash of an image."""
    try:
        import imagehash
        return imagehash.phash(img)
    except ImportError:
        # Fallback: use a simple average hash without imagehash library
        small = img.resize((16, 16)).convert("L")
        arr = np.array(small)
        return arr > arr.mean()


def hashes_are_duplicate(h1, h2):
    """Check if two hashes represent near-duplicate images."""
    try:
        import imagehash
        return (h1 - h2) < HASH_THRESHOLD
    except (ImportError, TypeError):
        # Fallback: bitwise XOR comparison
        if isinstance(h1, np.ndarray) and isinstance(h2, np.ndarray):
            return np.sum(h1 != h2) < 20
        return False


def pass1_dedup(category, apply=False):
    """Remove near-duplicate images within a category."""
    src_dir = DATA_DIR / category
    files = sorted(src_dir.glob("*.jpg"))
    print(f"\n[{category}] Pass 1 -- Dedup: checking {len(files)} files...")

    hashes = {}
    dups = []

    for f in files:
        try:
            img = Image.open(f).convert("RGB")
            h = phash(img)
            is_dup = False
            for existing_file, existing_hash in hashes.items():
                if hashes_are_duplicate(h, existing_hash):
                    dups.append(f)
                    is_dup = True
                    break
            if not is_dup:
                hashes[f] = h
        except Exception as e:
            dups.append(f)

    excess_dir = EXCESS_DIR / category
    excess_dir.mkdir(parents=True, exist_ok=True)

    for f in dups:
        if apply:
            shutil.move(str(f), str(excess_dir / ("dup_" + f.name)))
        else:
            print(f"  [DRY] would remove dup: {f.name}")

    print(f"  >> {len(dups)} duplicates {'moved' if apply else 'found (dry-run)'}")
    return len(dups)


def pass2_min_resolution(category, apply=False):
    """Remove images below minimum resolution."""
    src_dir = DATA_DIR / category
    files = sorted(src_dir.glob("*.jpg"))
    print(f"\n[{category}] Pass 2 -- Min resolution ({MIN_SIZE}px): checking {len(files)} files...")

    small = []
    for f in files:
        try:
            img = Image.open(f)
            w, h = img.size
            if min(w, h) < MIN_SIZE:
                small.append(f)
        except Exception:
            small.append(f)

    excess_dir = EXCESS_DIR / category
    excess_dir.mkdir(parents=True, exist_ok=True)

    for f in small:
        if apply:
            shutil.move(str(f), str(excess_dir / ("small_" + f.name)))
        else:
            print(f"  [DRY] would remove small ({f.name})")

    print(f"  >> {len(small)} small images {'moved' if apply else 'found (dry-run)'}")
    return len(small)


def pass3_civic_relevance(category, model, batch=32, apply=False):
    """Remove images that don't represent outdoor/civic scenes."""
    src_dir = DATA_DIR / category
    files = sorted(src_dir.glob("*.jpg"))
    print(f"\n[{category}] Pass 3 -- Civic relevance: checking {len(files)} files...")

    positive_concepts = CIVIC_POSITIVE_CONCEPTS.get(category, [])
    rejected = []
    buf, paths = [], []

    def flush():
        if not buf:
            return
        arr = np.stack([np.array(im.resize((224, 224))) for im in buf])
        arr = preprocess_input(arr.astype("float32"))
        preds = model.predict(arr, verbose=0)
        top5_all = decode_predictions(preds, top=5)
        for p, top5 in zip(paths, top5_all):
            # Check negative: top-1 is clearly non-civic
            top1_name = top5[0][1].lower()
            top1_prob = float(top5[0][2])
            is_negative = any(neg in top1_name for neg in CIVIC_NEGATIVE_STRONG)
            if is_negative and top1_prob >= CIVIC_NEG_THRESHOLD:
                rejected.append((p, f"negative:{top1_name}({top1_prob:.2f})"))
                continue

            # Check positive: at least one civic concept in top-5
            has_positive = False
            for _, name, prob in top5:
                name_lower = name.lower()
                if float(prob) >= CIVIC_POS_MIN_PROB:
                    for concept in positive_concepts:
                        if concept in name_lower:
                            has_positive = True
                            break
                if has_positive:
                    break

            if not has_positive:
                top_str = ", ".join(f"{n}({p:.2f})" for _, n, p in top5[:3])
                rejected.append((p, f"no_civic_concept:[{top_str}]"))

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
            rejected.append((f, "corrupt"))
    flush()

    excess_dir = EXCESS_DIR / category
    excess_dir.mkdir(parents=True, exist_ok=True)

    for f, reason in rejected:
        if apply:
            shutil.move(str(f), str(excess_dir / ("irrelevant_" + f.name)))
        else:
            print(f"  [DRY] would remove: {f.name} reason={reason}")

    print(f"  >> {len(rejected)} irrelevant images {'moved' if apply else 'found (dry-run)'}")
    return len(rejected)


def main():
    ap = argparse.ArgumentParser(
        description="Smart dataset filter: dedup + resolution + civic relevance"
    )
    ap.add_argument("--category", choices=CATEGORIES + ["all"], default="all")
    ap.add_argument("--apply", action="store_true",
                    help="Actually move rejected files (default: dry-run only)")
    ap.add_argument("--skip-dedup", action="store_true", help="Skip Pass 1 dedup")
    ap.add_argument("--skip-rescheck", action="store_true", help="Skip Pass 2 resolution")
    ap.add_argument("--skip-relevance", action="store_true", help="Skip Pass 3 civic relevance")
    args = ap.parse_args()

    if args.apply:
        print("=== APPLY MODE -- files will be moved to my_dataset_excess/ ===\n")
    else:
        print("=== DRY RUN MODE -- no files will be moved (use --apply to apply) ===\n")

    cats = CATEGORIES if args.category == "all" else [args.category]

    model = None
    if not args.skip_relevance:
        model = load_imagenet_model()

    summary = {}
    for c in cats:
        print(f"\n{'='*55}")
        print(f"  Filtering: {c}")
        print(f"{'='*55}")
        before = len(list((DATA_DIR / c).glob("*.jpg")))
        d = r = s = 0
        if not args.skip_dedup:
            d = pass1_dedup(c, apply=args.apply)
        if not args.skip_rescheck:
            r = pass2_min_resolution(c, apply=args.apply)
        if not args.skip_relevance and model is not None:
            s = pass3_civic_relevance(c, model, apply=args.apply)
        after = len(list((DATA_DIR / c).glob("*.jpg")))
        summary[c] = {"before": before, "after": after, "removed": d + r + s}

    print(f"\n{'='*55}")
    print(f"  SUMMARY")
    print(f"{'='*55}")
    print(f"{'Category':<14} {'Before':>7} {'Removed':>8} {'After':>7}")
    for c, s in summary.items():
        print(f"  {c:<14} {s['before']:>5}  -> -{s['removed']:<6} {s['after']:>5}")

    if not args.apply:
        print("\n[DRY RUN -- run with --apply to actually filter]")
    else:
        print("\nFiltering complete.")


if __name__ == "__main__":
    main()

