"""temperature_scaling.py -- Post-training confidence calibration.

After training, the model's raw softmax probabilities may be overconfident or
underconfident. Temperature scaling fits a single scalar T on the validation set
so that confidence scores better reflect true accuracy.

Also computes per-class blocking thresholds from the calibrated probabilities,
saved to civic_thresholds.json for use by server.js.

Usage:
  python temperature_scaling.py
  python temperature_scaling.py --val-split 0.25   # must match training split

Output:
  civic_thresholds.json -- per-class accept thresholds for server.js
"""
import json
import sys
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
MODEL_PATH = ROOT / "civic_model.keras"
LABELS_PATH = ROOT / "civic_labels.json"
THRESHOLDS_PATH = ROOT / "civic_thresholds.json"
IMG_SIZE = (224, 224)

# Default safe thresholds if calibration cannot run
# (used by server.js as fallback when civic_thresholds.json is missing)
DEFAULT_THRESHOLDS = {
    "drainage":    0.40,
    "others":      0.30,   # lower threshold -- catch-all for varied civic issues
    "potholes":    0.45,
    "streetlight": 0.40,
}


def load_val_data(labels, val_split=0.25, batch=32):
    """Load validation set matching training configuration."""
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        labels="inferred",
        label_mode="int",
        class_names=labels,
        validation_split=val_split,
        subset="validation",
        seed=42,
        image_size=IMG_SIZE,
        batch_size=batch,
    )
    AUTOTUNE = tf.data.AUTOTUNE
    val_ds = val_ds.map(
        lambda x, y: (preprocess_input(x), y),
        num_parallel_calls=AUTOTUNE
    ).prefetch(AUTOTUNE)
    return val_ds


def get_logits_and_labels(model, val_ds):
    """Collect all softmax outputs and true labels from validation set."""
    import tensorflow as tf
    all_probs = []
    all_labels = []
    for x, y in val_ds:
        probs = model(x, training=False).numpy()
        all_probs.append(probs)
        all_labels.append(y.numpy())
    probs = np.concatenate(all_probs, axis=0)
    labels = np.concatenate(all_labels, axis=0)
    return probs, labels


def find_temperature(probs, labels, n_classes):
    """Find optimal temperature T via scipy minimization of NLL."""
    try:
        from scipy.optimize import minimize_scalar
    except ImportError:
        print("  scipy not available -- skipping temperature scaling, using T=1.0")
        return 1.0

    # Convert to log-probs (logits approximation from softmax output)
    # Clip to avoid log(0)
    probs_clipped = np.clip(probs, 1e-7, 1.0)
    log_probs = np.log(probs_clipped)

    def nll_loss(T):
        """Negative log-likelihood after temperature scaling."""
        scaled = log_probs / T
        # Log-softmax
        scaled -= np.log(np.sum(np.exp(scaled), axis=1, keepdims=True))
        # NLL
        nll = -scaled[np.arange(len(labels)), labels].mean()
        return nll

    result = minimize_scalar(nll_loss, bounds=(0.1, 10.0), method="bounded")
    T = float(result.x)
    print(f"  Optimal temperature T = {T:.4f}  (NLL before={nll_loss(1.0):.4f}, after={nll_loss(T):.4f})")
    return T


def apply_temperature(probs, T):
    """Apply temperature scaling to raw softmax probabilities."""
    log_probs = np.log(np.clip(probs, 1e-7, 1.0)) / T
    # Re-normalize to valid softmax distribution
    exp_log = np.exp(log_probs - np.max(log_probs, axis=1, keepdims=True))
    return exp_log / exp_log.sum(axis=1, keepdims=True)


def compute_thresholds(calibrated_probs, labels, class_names, target_recall=0.92):
    """
    Compute per-class acceptance thresholds.

    For each class, find the minimum confidence threshold such that
    at least `target_recall` fraction of true positives are accepted.

    This ensures we don't block too many legitimate submissions.
    """
    thresholds = {}
    n_classes = len(class_names)

    for i, cls in enumerate(class_names):
        # Get probabilities for images that truly belong to this class
        mask = labels == i
        true_probs = calibrated_probs[mask, i]

        if len(true_probs) == 0:
            thresholds[cls] = DEFAULT_THRESHOLDS.get(cls, 0.40)
            print(f"  {cls}: no validation samples -> using default {thresholds[cls]:.2f}")
            continue

        # Find threshold that preserves target_recall of true positives
        sorted_probs = np.sort(true_probs)
        recall_idx = int((1.0 - target_recall) * len(sorted_probs))
        recall_threshold = float(sorted_probs[max(0, recall_idx)])

        # Cap thresholds: don't go too low (security) or too high (usability)
        min_thresh = DEFAULT_THRESHOLDS.get(cls, 0.30) * 0.7   # 30% below default min
        max_thresh = 0.60                                         # never demand >60%
        threshold = float(np.clip(recall_threshold, min_thresh, max_thresh))

        # Accuracy at this threshold
        accepted_true = np.sum(true_probs >= threshold)
        actual_recall = accepted_true / len(true_probs)
        thresholds[cls] = round(threshold, 3)

        print(f"  {cls}: threshold={threshold:.3f} | "
              f"recall@threshold={actual_recall:.2%} | "
              f"n_true={len(true_probs)}")

    return thresholds


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--val-split", type=float, default=0.25,
                    help="Validation split (must match training, default: 0.25)")
    ap.add_argument("--target-recall", type=float, default=0.92,
                    help="Min fraction of correct images to accept (default: 0.92)")
    args = ap.parse_args()

    if not MODEL_PATH.exists():
        print(f"[ERR] Model not found: {MODEL_PATH}")
        print("   Run train_civic_model.py first.")
        # Write default thresholds so server.js has something to load
        THRESHOLDS_PATH.write_text(json.dumps(DEFAULT_THRESHOLDS, indent=2))
        print(f"   Written default thresholds to {THRESHOLDS_PATH}")
        sys.exit(0)

    if not LABELS_PATH.exists():
        print(f"[ERR] Labels not found: {LABELS_PATH}")
        sys.exit(1)

    import tensorflow as tf
    labels = json.loads(LABELS_PATH.read_text())
    print(f"Classes: {labels}")

    print("\nLoading model...")
    model = tf.keras.models.load_model(MODEL_PATH)

    print("Loading validation data...")
    val_ds = load_val_data(labels, val_split=args.val_split)

    print("Running inference on validation set...")
    probs, true_labels = get_logits_and_labels(model, val_ds)
    print(f"  Collected {len(probs)} validation samples")

    # Baseline accuracy
    pred_classes = np.argmax(probs, axis=1)
    baseline_acc = np.mean(pred_classes == true_labels)
    print(f"\nBaseline val accuracy (T=1.0): {baseline_acc:.4f}")

    # Temperature scaling
    print("\nFitting temperature scalar...")
    T = find_temperature(probs, true_labels, len(labels))

    # Apply calibration
    calibrated = apply_temperature(probs, T)
    cal_pred = np.argmax(calibrated, axis=1)
    cal_acc = np.mean(cal_pred == true_labels)
    print(f"Calibrated val accuracy (T={T:.4f}): {cal_acc:.4f}")

    # Compute per-class thresholds
    print(f"\nComputing per-class thresholds (target recall={args.target_recall:.0%})...")
    thresholds = compute_thresholds(calibrated, true_labels, labels, args.target_recall)

    # Save thresholds
    output = {
        "temperature": round(T, 4),
        "thresholds": thresholds,
        "class_order": labels,
        "target_recall": args.target_recall,
        "val_accuracy_uncalibrated": round(float(baseline_acc), 4),
        "val_accuracy_calibrated": round(float(cal_acc), 4),
    }
    THRESHOLDS_PATH.write_text(json.dumps(output, indent=2))
    print(f"\n[OK] Saved thresholds to {THRESHOLDS_PATH}")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()

