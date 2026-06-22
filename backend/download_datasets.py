import os
import shutil
from pathlib import Path
from kaggle.api.kaggle_api_extended import KaggleApi

# Configuration
DATASETS = {
    "potholes": "chitholian/annotated-potholes-dataset",
    "drainage": "saurabhshahane/roadway-flooding-image-dataset", 
    "streetlight": "samuelayman/light-poles", 
    "others": "asdasdasasdas/garbage-classification"
}

MAX_IMAGES_PER_CATEGORY = 1000
DATA_DIR = Path("my_dataset")

def setup_directories():
    if DATA_DIR.exists():
        print(f"Backing up existing dataset to {DATA_DIR.name}_backup...")
        backup_dir = Path(f"{DATA_DIR.name}_backup")
        if backup_dir.exists():
            shutil.rmtree(backup_dir)
        shutil.move(str(DATA_DIR), str(backup_dir))
    
    for category in DATASETS.keys():
        (DATA_DIR / category).mkdir(parents=True, exist_ok=True)

def download_and_extract():
    api = KaggleApi()
    api.authenticate()
    
    for category, dataset_id in DATASETS.items():
        print(f"\n--- Processing {category} ({dataset_id}) ---")
        temp_dir = Path("temp_kaggle") / category
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Downloading {dataset_id}...")
        try:
            api.dataset_download_files(dataset_id, path=str(temp_dir), unzip=True)
        except Exception as e:
            print(f"Failed to download {dataset_id}: {e}")
            print("Will attempt search for alternatives...")
            # Search alternative
            search_results = api.dataset_list(search=category)
            for res in search_results:
                if res.size and res.size > 1000000: # at least 1MB
                    print(f"Found alternative: {res.ref}")
                    api.dataset_download_files(res.ref, path=str(temp_dir), unzip=True)
                    break
        
        # Move images to final directory
        print(f"Extracting and copying up to {MAX_IMAGES_PER_CATEGORY} images...")
        count = 0
        for ext in ["*.jpg", "*.jpeg", "*.png"]:
            for img_path in temp_dir.rglob(ext):
                if count >= MAX_IMAGES_PER_CATEGORY:
                    break
                
                # Check file size to avoid corrupt/tiny images
                if img_path.stat().st_size < 5000:
                    continue
                    
                dest_path = DATA_DIR / category / f"kg_{category}_{count:04d}{img_path.suffix.lower()}"
                shutil.copy2(img_path, dest_path)
                count += 1
                
        print(f"Copied {count} images for {category}.")
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    setup_directories()
    download_and_extract()
    print("\nDataset migration complete!")
