import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten
from tensorflow.keras.utils import to_categorical
import os
import shutil
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

# --- Custom Dataset Loading and Preprocessing ---
# Define image parameters (should match what was used in custom dataset creation)
img_height = 32
img_width = 32
batch_size = 32 # Keep batch_size consistent

# Load the custom image dataset using image_dataset_from_directory
# Note: Ensure you have a directory named 'my_dataset' containing subfolders 'potholes' and 'no_potholes'
try:
    train_ds = tf.keras.utils.image_dataset_from_directory(
        'my_dataset',
        validation_split=0.2,
        subset='training',
        seed=123,
        image_size=(img_height, img_width),
        batch_size=batch_size
    )

    test_ds = tf.keras.utils.image_dataset_from_directory(
        'my_dataset',
        validation_split=0.2,
        subset='validation',
        seed=123,
        image_size=(img_height, img_width),
        batch_size=batch_size
    )
except Exception as e:
    print(f"Error loading dataset: {e}")
    print("Please make sure you have a directory named 'my_dataset' containing folders 'potholes' and 'no_potholes'.")
    exit(1)

custom_class_names = ['potholes', 'no_potholes'] # Updated class names as requested
num_custom_classes = len(custom_class_names)
print(f"Custom Class names: {custom_class_names}")
print(f"Number of Custom Classes: {num_custom_classes}")

# Normalization layer
normalization_layer = tf.keras.layers.Rescaling(1./255)

# Preprocessing function for normalization and one-hot encoding
def preprocess(image, label):
    image = normalization_layer(image)
    label = tf.one_hot(label, depth=num_custom_classes)
    return image, label

# Apply preprocessing to the datasets
train_ds = train_ds.map(preprocess)
test_ds = test_ds.map(preprocess)

# --- Display a sample of the loaded custom images ---
plt.figure(figsize=(10,10))
for i, (images, labels) in enumerate(train_ds.take(1)):
    for j in range(min(49, len(images))):
        plt.subplot(7,7,j+1)
        plt.xticks([])
        plt.yticks([])
        plt.grid(False)
        plt.imshow(images[j].numpy())
        # Convert one-hot label back to class index for display
        label_idx = tf.argmax(labels[j]).numpy()
        plt.xlabel(custom_class_names[label_idx])
    break # Only take one batch for visualization
plt.show()


# --- Model Definition and Training with Custom Data ---
model = Sequential()
# Adjusted input_shape to match custom image dimensions (32, 32, 3)
model.add(Conv2D(8, (3, 3), strides=(1, 1), activation='relu', input_shape=(img_height, img_width, 3)))
model.add(MaxPooling2D(pool_size=(2, 2), strides=(2, 2)))

model.add(Flatten())
model.add(Dense(100, activation='relu'))
# Output layer should have 'num_custom_classes' units and 'softmax' for multi-class
model.add(Dense(num_custom_classes, activation='softmax'))
model.summary()

# Compile model
model.compile(optimizer='adam', loss=tf.keras.losses.CategoricalCrossentropy(), metrics=['accuracy'])

# Fit the model using the custom datasets
model_CNN = model.fit(train_ds, epochs=10, validation_data=test_ds)

# --- Visualize the training/testing accuracy ---
fig = plt.figure(figsize=(8, 10), dpi=80)
plt.subplot(2,1,1)
plt.plot(model_CNN.history['accuracy'],"b-o")
plt.plot(model_CNN.history['val_accuracy'],"r-d")
plt.title('model accuracy')
plt.ylabel('accuracy')
plt.legend(['train', 'test'])

plt.subplot(2,1,2)
plt.plot(model_CNN.history['loss'],"b-o")
plt.plot(model_CNN.history['val_loss'],"r-d")
plt.title('model loss')
plt.ylabel('loss')
plt.xlabel('epoch')
plt.legend(['train', 'test'])
plt.tight_layout()
plt.show()

# --- Save and Export Model to TensorFlow.js ---
print("\n--- Saving and Converting Model ---")
model.save('pothole_model.h5')
print("Model saved to 'pothole_model.h5'.")

try:
    import tensorflowjs as tfjs
    # Save the model directly in TensorFlow.js format
    tfjs.converters.save_keras_model(model, 'pothole_model_tfjs')
    print("Model successfully converted and saved to 'pothole_model_tfjs/' folder.")
except ImportError:
    print("Warning: 'tensorflowjs' package is not installed. To convert automatically, run:")
    print("  pip install tensorflowjs")
    print("And then run:")
    print("  tensorflowjs_converter --input_format keras pothole_model.h5 ./pothole_model_tfjs")
