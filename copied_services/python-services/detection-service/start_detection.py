#!/usr/bin/env python3
"""
RECOVR Detection Service Starter
Starts the object detection service with proper configuration
"""

import os
import sys
import logging
from pathlib import Path
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'detection_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

def find_latest_model():
    """Find the latest model file in the current directory"""
    model_files = list(Path('.').glob('stable_model_epoch_*.pth'))
    if not model_files:
        logger.error("No model files found! Please place your model file in the detection-service directory.")
        return None
    return max(model_files, key=lambda p: p.stat().st_mtime)

def test_dependencies():
    """Test if all required dependencies are installed"""
    try:
        import cv2
        import torch
        import numpy
        import requests
        logger.info("✅ All dependencies are installed")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        logger.info("Please run: pip install -r requirements.txt")
        return False

def test_camera():
    """Test if camera is accessible"""
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logger.error("❌ Camera not accessible")
            return False
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            h, w = frame.shape[:2]
            logger.info(f"✅ Camera working! Resolution: {w}x{h}")
            return True
        else:
            logger.error("❌ Camera opened but can't read frames")
            return False
    except Exception as e:
        logger.error(f"❌ Camera test failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Start RECOVR detection service')
    parser.add_argument('--camera', type=int, default=0, help='Camera device index')
    parser.add_argument('--location', type=str, default='Main Entrance', help='Camera location')
    parser.add_argument('--model', type=str, help='Path to model file (optional)')
    parser.add_argument('--threshold', type=float, default=0.6, help='Detection confidence threshold')
    parser.add_argument('--abandon-time', type=int, default=300, help='Seconds before marking object as abandoned')
    args = parser.parse_args()

    # Find model file
    model_path = args.model or find_latest_model()
    if not model_path:
        return

    # Test setup
    if not test_dependencies() or not test_camera():
        return

    # Import and run detection service
    try:
        from object_detector import DetectionService
        
        config = {
            'model_path': str(model_path),
            'confidence_threshold': args.threshold,
            'abandon_threshold': args.abandon_time,
            'camera_location': args.location,
            'api_base_url': 'http://localhost:8080',
            'snapshots_dir': 'snapshots'
        }
        
        logger.info("\n🚀 Starting detection service...")
        logger.info("📸 Camera will open - Press 'q' to quit")
        logger.info(f"🔍 Objects stationary >{args.abandon_time} seconds will be marked as abandoned")
        logger.info("📡 Results will be sent to your Spring Boot backend")
        
        service = DetectionService(config)
        service.run_detection(camera_index=args.camera)
        
    except Exception as e:
        logger.error(f"❌ Error starting service: {e}")
        logger.info("Make sure your camera is available and backend is running")

if __name__ == '__main__':
    main() 