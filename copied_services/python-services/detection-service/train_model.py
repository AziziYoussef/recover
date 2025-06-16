#!/usr/bin/env python3
"""
Train a YOLOv8 model for lost item detection
This will create a model that can detect common lost items like bags, phones, etc.
"""

from ultralytics import YOLO
import yaml
import os
from pathlib import Path

# Define the classes we want to detect
CLASSES = [
    'backpack', 'handbag', 'suitcase',  # Bags
    'cell phone', 'laptop', 'keyboard', 'mouse',  # Electronics
    'umbrella', 'book', 'bottle',  # Common items
    'person'  # To help with context
]

def create_dataset_yaml():
    """Create dataset.yaml for YOLO training"""
    data = {
        'path': str(Path.cwd() / 'dataset'),
        'train': 'images/train',
        'val': 'images/val',
        'names': {i: name for i, name in enumerate(CLASSES)}
    }
    
    with open('dataset.yaml', 'w') as f:
        yaml.dump(data, f)
    
    return 'dataset.yaml'

def download_pretrained():
    """Download a pretrained YOLOv8 model"""
    model = YOLO('yolov8n.pt')  # Load smallest YOLOv8 model
    return model

def main():
    print("🚀 Setting up lost item detection model...")
    
    # 1. Create dataset structure
    os.makedirs('dataset/images/train', exist_ok=True)
    os.makedirs('dataset/images/val', exist_ok=True)
    os.makedirs('dataset/labels/train', exist_ok=True)
    os.makedirs('dataset/labels/val', exist_ok=True)
    
    # 2. Create dataset.yaml
    yaml_path = create_dataset_yaml()
    print("✅ Created dataset configuration")
    
    # 3. Download pretrained model
    model = download_pretrained()
    print("✅ Downloaded pretrained YOLOv8 model")
    
    # 4. Fine-tune the model
    print("\n🎯 Starting model training...")
    print("This will take a while. The model will be saved as 'stable_model_epoch_30.pt'")
    
    results = model.train(
        data=yaml_path,
        epochs=30,
        imgsz=640,
        batch=16,
        name='lost_items_model',
        patience=10,
        save=True
    )
    
    # 5. Save the final model
    model.export(format='torchscript')
    os.rename('lost_items_model/weights/best.torchscript', 'stable_model_epoch_30.pth')
    print("\n✅ Training complete! Model saved as 'stable_model_epoch_30.pth'")
    print("\nYou can now use this model with start_detection.py")

if __name__ == '__main__':
    main() 