#!/usr/bin/env python3
"""
Record test videos for lost object detection
"""

import cv2
import time
from pathlib import Path
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def record_video(duration=30, output_dir='test_videos'):
    """Record a test video using webcam"""
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("❌ Could not open camera")
        return
        
    # Get camera properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    # Create video writer
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_path / f"test_video_{timestamp}.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_file), fourcc, fps, (width, height))
    
    logger.info("🎥 Recording started...")
    logger.info(f"Recording for {duration} seconds")
    logger.info("Press 'q' to stop recording early")
    
    start_time = time.time()
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Add timestamp and recording info
        elapsed = time.time() - start_time
        cv2.putText(frame, f"Recording: {elapsed:.1f}s", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Show frame
        cv2.imshow('Recording Test Video', frame)
        
        # Write frame
        out.write(frame)
        frame_count += 1
        
        # Check for quit or duration
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        if elapsed >= duration:
            break
            
    # Cleanup
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    
    # Print summary
    actual_duration = time.time() - start_time
    logger.info(f"\n✅ Recording complete!")
    logger.info(f"📊 Stats:")
    logger.info(f"- Duration: {actual_duration:.1f} seconds")
    logger.info(f"- Frames: {frame_count}")
    logger.info(f"- FPS: {frame_count/actual_duration:.1f}")
    logger.info(f"- Saved to: {output_file}")
    
    return str(output_file)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Record test videos for lost object detection')
    parser.add_argument('--duration', type=int, default=30,
                      help='Recording duration in seconds')
    parser.add_argument('--output', type=str, default='test_videos',
                      help='Output directory for videos')
    args = parser.parse_args()
    
    print("\n📝 Test Video Recording Guide:")
    print("1. Position your camera to capture the scene")
    print("2. Place objects in the frame (bags, laptops, etc.)")
    print("3. Have people walk by to test person detection")
    print("4. Leave objects stationary to test lost detection")
    print("\n💡 Tips:")
    print("- Ensure good lighting")
    print("- Keep camera stable")
    print("- Include both busy and quiet moments")
    print("- Test different types of objects")
    print("\nPress Enter to start recording...")
    input()
    
    video_file = record_video(args.duration, args.output)
    
    if video_file:
        print(f"\n🎯 To test this video with the detection system:")
        print(f"python test_video.py {video_file}")

if __name__ == '__main__':
    main() 