"""Download datasets for civic complaint image classifier."""
import argparse
import hashlib
import io
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
CATEGORIES = ["potholes", "drainage", "streetlight", "others"]

KAGGLE_SLUGS = {
    "potholes": [
        "atulyakumar98/pothole-detection-dataset",
        "chitholian/annotated-potholes-dataset",
    ],
    "drainage": [
        "saurabhshahane/road-classification-images",
        "jonathannield/cctv-human-pose-estimation-dataset",
        "alincijov/flood-area-segmentation",
    ],
    "streetlight": [
        "akshat0007/streetlightdetection",
        "andrewmvd/road-sign-detection",
    ],
    "others": [
        "mostafaabla/garbage-classification",
        "asdasdasasdas/garbage-classification",
    ],
}

BING_QUERIES = {
    "potholes": ["pothole road damage", "asphalt pothole closeup"],
    "drainage": [
        "clogged storm drain street india",
        "overflowing manhole street",
        "blocked road drainage water",
        "street flood drain blocked",
        "open sewer drain road",
    ],
    "streetlight": [
        "broken street light pole damaged",
        "bent street lamp post",
        "street light fallen pole",
        "rusty street light post",
        "vandalized street lamp",
    ],
    "others": [
        "broken water pipe leaking road",
        "fallen tree blocking street",
        "garbage pile road india",
        "damaged sidewalk crack",
    ],
}


def ensure_dirs():
    for c in CATEGORIES:
        (DATA_DIR / c).mkdir(parents=True, exist_ok=True)


def import_image(src_path, dest_dir, prefix):
    try:
        img = Image.open(src_path).convert("RGB")
        if min(img.size) < 96:
            return False
        h = hashlib.md5(Path(src_path).read_bytes()).hexdigest()[:12]
        out = dest_dir / f"{prefix}_{h}.jpg"
        if out.exists():
            return False
        img.save(out, "JPEG", quality=88)
        return True
    except Exception:
        return False


def fetch_via_kagglehub(category, target):
    slugs = KAGGLE_SLUGS.get(category, [])
    if not slugs:
        return 0
    try:
        import kagglehub
    except Exception as e:
        print(f"  kagglehub unavailable: {e}", file=sys.stderr)
        return 0
    dest = DATA_DIR / category
    total = len(list(dest.glob("*.jpg")))
    for slug in slugs:
        if total >= target:
            break
        try:
            print(f"[{category}] kagglehub pull: {slug}")
            path = kagglehub.dataset_download(slug)
            src = Path(path)
            copied = 0
            for p in src.rglob("*"):
                if total >= target:
                    break
                if p.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                    if import_image(p, dest, prefix="kag"):
                        copied += 1
                        total += 1
            print(f"  copied {copied} from {slug} (total {total})")
        except Exception as e:
            print(f"  kagglehub fail {slug}: {e}", file=sys.stderr)
    return total


def fetch_via_bing(category, target):
    dest = DATA_DIR / category
    have = len(list(dest.glob("*.jpg")))
    if have >= target:
        print(f"[{category}] already {have} >= {target}; skip Bing")
        return
    try:
        from icrawler.builtin import BingImageCrawler
    except Exception as e:
        print(f"  icrawler unavailable: {e}", file=sys.stderr)
        return
    queries = BING_QUERIES[category]
    per_q = max(80, (target - have) // max(1, len(queries)) + 50)
    for q in queries:
        if len(list(dest.glob("*.jpg"))) >= target:
            break
        tmp = DATA_DIR / f"_tmp_{category}_{abs(hash(q)) % 10000}"
        tmp.mkdir(exist_ok=True)
        print(f"[{category}] Bing: '{q}' (target {per_q})")
        try:
            crawler = BingImageCrawler(storage={"root_dir": str(tmp)}, log_level=40)
            crawler.crawl(keyword=q, max_num=per_q, file_idx_offset=0)
            imported = 0
            for p in tmp.iterdir():
                if import_image(p, dest, prefix=f"bing_{abs(hash(q)) % 10000}"):
                    imported += 1
            print(f"  imported {imported}")
        except Exception as e:
            print(f"  Bing fail '{q}': {e}", file=sys.stderr)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", choices=CATEGORIES + ["all"], default="all")
    ap.add_argument("--target", type=int, default=400)
    ap.add_argument("--skip-kaggle", action="store_true")
    ap.add_argument("--skip-bing", action="store_true")
    args = ap.parse_args()

    ensure_dirs()
    cats = CATEGORIES if args.category == "all" else [args.category]
    for c in cats:
        if not args.skip_kaggle:
            fetch_via_kagglehub(c, args.target)
        if not args.skip_bing:
            fetch_via_bing(c, args.target)

    print("\n=== Final counts ===")
    for c in CATEGORIES:
        n = len(list((DATA_DIR / c).glob("*.jpg")))
        print(f"  {c}: {n}")


if __name__ == "__main__":
    main()
