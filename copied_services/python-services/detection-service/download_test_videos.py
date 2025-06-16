#!/usr/bin/env python3
"""
Download test videos for lost object detection
"""

import os
import requests
from pathlib import Path
import gdown
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create test_videos directory
TEST_VIDEOS_DIR = Path('test_videos')
TEST_VIDEOS_DIR.mkdir(exist_ok=True)

# Sample videos from public datasets
VIDEOS = {
    'abandoned_bag': {
        'url': 'https://drive.google.com/uc?id=1-2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M',
        'description': 'Person leaves a bag and walks away'
    },
    'stationary_laptop': {
        'url': 'https://drive.google.com/uc?id=1-2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M',
        'description': 'Laptop left on table with people walking by'
    },
    'busy_entrance': {
        'url': 'https://drive.google.com/uc?id=1-2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M',
        'description': 'High traffic area with various objects'
    }
}

def download_video(url, filename):
    """Download a video from Google Drive"""
    try:
        output = TEST_VIDEOS_DIR / filename
        gdown.download(url, str(output), quiet=False)
        if output.exists():
            logger.info(f"✅ Downloaded: {filename}")
            return True
        else:
            logger.error(f"❌ Failed to download: {filename}")
            return False
    except Exception as e:
        logger.error(f"❌ Error downloading {filename}: {e}")
        return False

def main():
    logger.info("🎥 Downloading test videos...")
    
    # Create a README with video descriptions
    readme_path = TEST_VIDEOS_DIR / 'README.md'
    with open(readme_path, 'w') as f:
        f.write("# Test Videos for Lost Object Detection\n\n")
        f.write("These videos can be used to test the lost object detection system.\n\n")
        f.write("## Available Videos\n\n")
        
        for name, info in VIDEOS.items():
            f.write(f"### {name}\n")
            f.write(f"- Description: {info['description']}\n")
            f.write(f"- File: {name}.mp4\n\n")
    
    # Download each video
    for name, info in VIDEOS.items():
        filename = f"{name}.mp4"
        if not (TEST_VIDEOS_DIR / filename).exists():
            download_video(info['url'], filename)
    
    logger.info("\n📝 How to use these videos:")
    logger.info("1. Place your own test videos in the test_videos directory")
    logger.info("2. Run the detection test:")
    logger.info("   python test_video.py test_videos/your_video.mp4")
    logger.info("\n💡 Tips for creating your own test videos:")
    logger.info("- Record in good lighting")
    logger.info("- Include different scenarios (busy areas, quiet areas)")
    logger.info("- Test with different types of objects")
    logger.info("- Include people walking by to test person proximity detection")

if __name__ == '__main__':
    main() 