"""Train 4-class civic image classifier via MobileNetV2 transfer + fine-tune.

Improvements over previous version:
  - Class-weighted loss to handle imbalanced data
  - Stronger augmentation to simulate real citizen phone photos
  - Unfreeze top 50 base layers (was 30) for better domain adaptation
  - Longer training: Stage 1 = 20 epochs, Stage 2 = 15 epochs
  - ReduceLROnPlateau + EarlyStopping with restore_best_weights
  - Saves training history to training_history.json
  - Validation split 0.25 (was 0.2)

Stage 1: freeze backbone, train head 20 epochs.
Stage 2: unfreeze top 50 base layers, fine-tune 15 epochs at LR 1e-5.
Export: TFJS LayersModel to civic_model_tfjs/.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
OUT_KERAS = ROOT / "civic_model.keras"
OUT_TFJS = ROOT / "civic_model_tfjs"
LABELS_JSON = ROOT / "civic_labels.json"
HISTORY_JSON = ROOT / "training_history.json"

IMG = 224
# Alphabetical order matches tf.keras.utils.image_dataset_from_directory default
CLASSES = ["drainage", "others", "potholes", "streetlight"]


def get_class_counts():
    """Count images per class for class-weight computation."""
    counts = {}
    for c in CLASSES:
        d = DATA_DIR / c
        counts[c] = len(list(d.glob("*.jpg"))) if d.exists() else 0
    return counts


def compute_class_weights(counts):
    """Inverse-frequency class weights to handle imbalanced data."""
    total = sum(counts.values())
    n_classes = len(counts)
    weights = {}
    for i, c in enumerate(CLASSES):
        count = counts[c]
        if count == 0:
            weights[i] = 1.0
        else:
            # sklearn-style balanced weighting
            weights[i] = total / (n_classes * count)
    return weights


def build_datasets(batch, val_split=0.25):
    """Build augmented training and validation datasets."""
    common_kwargs = dict(
        labels="inferred",
        label_mode="int",
        class_names=CLASSES,
        validation_split=val_split,
        seed=42,
        image_size=(IMG, IMG),
        batch_size=batch,
    )
    train = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, subset="training", **common_kwargs
    )
    val = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, subset="validation", **common_kwargs
    )

    # Strong augmentation to simulate real citizen phone-captured photos:
    # - Random flips (phone orientation varies)
    # - Rotation (hand-held photos are tilted)
    # - Zoom (citizen zooms in/out on issue)
    # - Brightness (daytime, night, cloud cover)
    # - Contrast (varied lighting conditions)
    aug = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomBrightness(0.2),
        layers.RandomContrast(0.2),
    ], name="augmentation")

    AUTOTUNE = tf.data.AUTOTUNE
    train = (
        train
        .map(lambda x, y: (preprocess_input(aug(x, training=True)), y),
             num_parallel_calls=AUTOTUNE)
        .prefetch(AUTOTUNE)
    )
    val = (
        val
        .map(lambda x, y: (preprocess_input(x), y),
             num_parallel_calls=AUTOTUNE)
        .prefetch(AUTOTUNE)
    )
    return train, val


def build_model():
    """Build MobileNetV2-based transfer learning model."""
    base = MobileNetV2(include_top=False, weights="imagenet", input_shape=(IMG, IMG, 3))
    base.trainable = False

    inputs = layers.Input(shape=(IMG, IMG, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    out = layers.Dense(len(CLASSES), activation="softmax")(x)
    return models.Model(inputs, out), base


def stage1_train(model, train, val, epochs, class_weights):
    """Stage 1: Train classification head only, backbone frozen."""
    model.compile(
        optimizer=optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    cb = [
        callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5,
            restore_best_weights=True, verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3,
            min_lr=1e-6, verbose=1
        ),
    ]
    hist = model.fit(
        train, validation_data=val, epochs=epochs,
        callbacks=cb, class_weight=class_weights,
    )
    return hist.history


def stage2_finetune(model, base, train, val, epochs, class_weights):
    """Stage 2: Unfreeze top 50 layers, fine-tune at low LR."""
    base.trainable = True
    # Freeze all layers EXCEPT the top 50
    for layer in base.layers[:-50]:
        layer.trainable = False

    # Use cosine decay for fine-tuning LR schedule
    steps_per_epoch = tf.data.experimental.cardinality(train).numpy()
    total_steps = max(1, steps_per_epoch) * epochs
    lr_schedule = optimizers.schedules.CosineDecay(
        initial_learning_rate=1e-5,
        decay_steps=total_steps,
        alpha=1e-7,
    )

    model.compile(
        optimizer=optimizers.Adam(lr_schedule),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    cb = [
        callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5,
            restore_best_weights=True, verbose=1
        ),
    ]
    hist = model.fit(
        train, validation_data=val, epochs=epochs,
        callbacks=cb, class_weight=class_weights,
    )
    return hist.history


def export_tfjs():
    """Export trained Keras model to TensorFlow.js LayersModel format."""
    OUT_TFJS.mkdir(exist_ok=True)
    try:
        import tensorflowjs
        from tensorflowjs.converters import converter
        converter.convert([
            "--input_format=keras",
            "--output_format=tfjs_layers_model",
            "--quantize_float16",          # reduce model size by ~50%
            str(OUT_KERAS),
            str(OUT_TFJS),
        ])
        print(f"[OK] Exported TFJS to {OUT_TFJS}")
    except Exception as e:
        print(f"Python API export failed ({e}); trying CLI", file=sys.stderr)
        try:
            subprocess.run([
                sys.executable, "-m", "tensorflowjs.converters.converter",
                "--input_format=keras",
                "--output_format=tfjs_layers_model",
                str(OUT_KERAS), str(OUT_TFJS),
            ], check=True)
        except Exception as e2:
            print(f"CLI export also failed: {e2}", file=sys.stderr)
            print("  Model saved as Keras (.keras) -- TFJS export needs tensorflowjs package.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=20,
                    help="Stage 1 epochs (default: 20)")
    ap.add_argument("--finetune-epochs", type=int, default=15,
                    help="Stage 2 fine-tune epochs (default: 15)")
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--no-class-weight", action="store_true",
                    help="Disable class weighting (not recommended if data is imbalanced)")
    args = ap.parse_args()

    print(f"Classes: {CLASSES}")
    print(f"Data dir: {DATA_DIR}")

    # Check class counts
    counts = get_class_counts()
    print("\n=== Class counts ===")
    for c, n in counts.items():
        print(f"  {c}: {n} images")

    if min(counts.values()) == 0:
        print("\n[ERR] ERROR: One or more classes have 0 images. Run download_datasets.py first.")
        sys.exit(1)

    if min(counts.values()) < 50:
        print(f"\n[WARN] WARNING: Some classes have very few images (<50). Consider downloading more data.")

    # Compute class weights
    class_weights = None
    if not args.no_class_weight:
        class_weights = compute_class_weights(counts)
        print("\n=== Class weights (inverse-frequency) ===")
        for i, c in enumerate(CLASSES):
            print(f"  {c}: {class_weights[i]:.3f}")

    train, val = build_datasets(args.batch)
    model, base = build_model()
    model.summary()

    all_history = {}

    print("\n=== Stage 1: head training (backbone frozen) ===")
    h1 = stage1_train(model, train, val, args.epochs, class_weights)
    all_history["stage1"] = h1
    val_acc_s1 = max(h1.get("val_accuracy", [0]))
    print(f"  Best val_accuracy Stage 1: {val_acc_s1:.4f}")

    print("\n=== Stage 2: fine-tune top 50 MobileNetV2 layers ===")
    h2 = stage2_finetune(model, base, train, val, args.finetune_epochs, class_weights)
    all_history["stage2"] = h2
    val_acc_s2 = max(h2.get("val_accuracy", [0]))
    print(f"  Best val_accuracy Stage 2: {val_acc_s2:.4f}")

    # Save model
    model.save(OUT_KERAS)
    LABELS_JSON.write_text(json.dumps(CLASSES))
    # Convert numpy float32 values to native Python float for JSON serialization
    def to_serializable(obj):
        if isinstance(obj, dict):
            return {k: to_serializable(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [to_serializable(v) for v in obj]
        try:
            return float(obj)
        except (TypeError, ValueError):
            return obj
    HISTORY_JSON.write_text(json.dumps(to_serializable(all_history), indent=2))
    print(f"\n[OK] Saved Keras model: {OUT_KERAS}")
    print(f"[OK] Saved labels:      {LABELS_JSON}")
    print(f"[OK] Saved history:     {HISTORY_JSON}")

    print("\n=== Export TFJS ===")
    export_tfjs()

    print("\n=== Training Complete ===")
    print(f"  Stage 1 best val_acc: {val_acc_s1:.4f}")
    print(f"  Stage 2 best val_acc: {val_acc_s2:.4f}")
    print("\nNext step: run python temperature_scaling.py to calibrate confidence thresholds.")


if __name__ == "__main__":
    main()

