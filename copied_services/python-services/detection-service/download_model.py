#!/usr/bin/env python3
"""
Download a pre-trained YOLOv8 model for object detection
"""

from ultralytics import YOLO
import torch
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_model():
    """Download and save a pre-trained YOLOv8 model"""
    try:
        logger.info("🚀 Downloading YOLOv8 model...")
        
        # Download the smallest YOLOv8 model
        model = YOLO('yolov8n.pt')
        
        # Save as torchscript format
        logger.info("💾 Converting and saving model...")
        model.export(format='torchscript')
        
        # Rename to our expected filename
        Path('yolov8n.torchscript').rename('stable_model_epoch_30.pth')
        
        logger.info("✅ Model downloaded and saved as 'stable_model_epoch_30.pth'")
        logger.info("\n📝 Model Info:")
        logger.info("- Type: YOLOv8n (nano)")
        logger.info("- Classes: 80 common objects")
        logger.info("- Size: ~6MB")
        logger.info("\n🎯 You can now run test_video.py!")
        
    except Exception as e:
        logger.error(f"❌ Error downloading model: {e}")
        raise

if __name__ == '__main__':
    download_model() 