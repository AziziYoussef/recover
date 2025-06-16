#!/usr/bin/env python3
import argparse
import os
from object_detector import ObjectDetector

def main():
    parser = argparse.ArgumentParser(description='Run object detection on video')
    parser.add_argument('--model', required=True, help='Path to model file (.pth or .pt)')
    parser.add_argument('--video', required=True, help='Path to video file or camera index')
    parser.add_argument('--output', help='Path to save output video (optional)')
    parser.add_argument('--no-db', action='store_true', help='Disable saving to database')
    args = parser.parse_args()

    # Validate inputs
    if not os.path.exists(args.model):
        print(f"Error: Model file not found: {args.model}")
        return

    if not args.video.isdigit() and not os.path.exists(args.video):
        print(f"Error: Video file not found: {args.video}")
        return

    try:
        # Initialize detector
        print(f"Loading model from: {args.model}")
        detector = ObjectDetector(args.model)
        
        # Process video
        video_path = int(args.video) if args.video.isdigit() else args.video
        print(f"Processing video: {video_path}")
        
        detector.process_video(
            video_path=video_path,
            output_path=args.output,
            save_to_db=not args.no_db
        )
        
        print("Processing complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        return

if __name__ == "__main__":
    main() 