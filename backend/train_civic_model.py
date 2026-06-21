"""Train 4-class civic image classifier via MobileNetV2 transfer + fine-tune.

Stage 1: freeze backbone, train head 12 epochs.
Stage 2: unfreeze top 30 base layers, fine-tune 8 epochs at LR 1e-5.
Export: TFJS LayersModel to civic_model_tfjs/.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "my_dataset"
OUT_KERAS = ROOT / "civic_model.keras"
OUT_TFJS = ROOT / "civic_model_tfjs"
LABELS_JSON = ROOT / "civic_labels.json"

IMG = 224
CLASSES = ["drainage", "others", "potholes", "streetlight"]


def build_datasets(batch):
    train = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        labels="inferred",
        label_mode="int",
        class_names=CLASSES,
        validation_split=0.2,
        subset="training",
        seed=42,
        image_size=(IMG, IMG),
        batch_size=batch,
    )
    val = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        labels="inferred",
        label_mode="int",
        class_names=CLASSES,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=(IMG, IMG),
        batch_size=batch,
    )
    aug = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
        layers.RandomContrast(0.1),
    ])
    AUTOTUNE = tf.data.AUTOTUNE
    train = train.map(lambda x, y: (preprocess_input(aug(x)), y), num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    val = val.map(lambda x, y: (preprocess_input(x), y), num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    return train, val


def build_model():
    base = MobileNetV2(include_top=False, weights="imagenet", input_shape=(IMG, IMG, 3))
    base.trainable = False
    inputs = layers.Input(shape=(IMG, IMG, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    out = layers.Dense(len(CLASSES), activation="softmax")(x)
    return models.Model(inputs, out), base


def stage1_train(model, train, val, epochs):
    model.compile(optimizer=optimizers.Adam(1e-3),
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
    es = callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True)
    model.fit(train, validation_data=val, epochs=epochs, callbacks=[es])


def stage2_finetune(model, base, train, val, epochs):
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(optimizer=optimizers.Adam(1e-5),
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
    es = callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True)
    model.fit(train, validation_data=val, epochs=epochs, callbacks=[es])


def export_tfjs():
    OUT_TFJS.mkdir(exist_ok=True)
    try:
        from tensorflowjs.converters import converter
        converter.convert([
            "--input_format=keras",
            "--output_format=tfjs_layers_model",
            str(OUT_KERAS),
            str(OUT_TFJS),
        ])
        print(f"Exported TFJS to {OUT_TFJS}")
    except Exception as e:
        print(f"Python API export failed ({e}); trying CLI", file=sys.stderr)
        subprocess.run([
            sys.executable, "-m", "tensorflowjs.converters.converter",
            "--input_format=keras", "--output_format=tfjs_layers_model",
            str(OUT_KERAS), str(OUT_TFJS),
        ], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=12)
    ap.add_argument("--finetune-epochs", type=int, default=8)
    ap.add_argument("--batch", type=int, default=32)
    args = ap.parse_args()

    print(f"Classes: {CLASSES}")
    print(f"Data dir: {DATA_DIR}")

    train, val = build_datasets(args.batch)
    model, base = build_model()
    model.summary()

    print("\n=== Stage 1: head training ===")
    stage1_train(model, train, val, args.epochs)

    print("\n=== Stage 2: fine-tune top 30 layers ===")
    stage2_finetune(model, base, train, val, args.finetune_epochs)

    model.save(OUT_KERAS)
    LABELS_JSON.write_text(json.dumps(CLASSES))
    print(f"Saved Keras: {OUT_KERAS}")
    print(f"Saved labels: {LABELS_JSON}")

    print("\n=== Export TFJS ===")
    export_tfjs()


if __name__ == "__main__":
    main()
