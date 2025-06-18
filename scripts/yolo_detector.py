#!/usr/bin/env python3
"""
YOLOv8 Object Detection Script for Lost Object Detection
This script processes video files and detects stationary objects that could be lost items.
"""

import cv2
import json
import sys
import argparse
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("YOLOv8 not available. Install with: pip install ultralytics")

class LostObjectDetector:
    def __init__(self, model_path="yolov8n.pt", confidence_threshold=0.7):
        """
        Initialize the lost object detector
        
        Args:
            model_path: Path to YOLOv8 model file
            confidence_threshold: Minimum confidence for object detection
        """
        self.confidence_threshold = confidence_threshold
        self.model = None
        
        if YOLO_AVAILABLE:
            try:
                self.model = YOLO(model_path)
                logger.info(f"Loaded YOLOv8 model: {model_path}")
            except Exception as e:
                logger.error(f"Failed to load YOLO model: {e}")
                self.model = None
        
        # Object classes we're interested in for lost items
        self.monitored_classes = [
            'backpack', 'handbag', 'suitcase', 'laptop', 'cell phone', 
            'book', 'umbrella', 'bottle', 'keys', 'wallet'
        ]
        
        # Track objects across frames
        self.object_tracks = {}
        self.next_track_id = 0
        
    def detect_objects_in_frame(self, frame, frame_number, timestamp):
        """
        Detect objects in a single frame
        
        Args:
            frame: OpenCV frame
            frame_number: Frame number in video
            timestamp: Timestamp in seconds
            
        Returns:
            List of detected objects
        """
        if not self.model:
            return []
            
        try:
            # Run YOLOv8 detection
            results = self.model(frame, conf=self.confidence_threshold)
            
            detected_objects = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # Get class name
                        class_name = self.model.names[class_id]
                        
                        # Only track monitored classes
                        if class_name in self.monitored_classes:
                            obj = {
                                'class': class_name,
                                'confidence': float(confidence),
                                'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                                'center': [int((x1+x2)/2), int((y1+y2)/2)],
                                'frame_number': frame_number,
                                'timestamp': timestamp
                            }
                            detected_objects.append(obj)
            
            return detected_objects
            
        except Exception as e:
            logger.error(f"Error detecting objects in frame {frame_number}: {e}")
            return []
    
    def track_objects(self, detected_objects, proximity_threshold=50):
        """
        Track objects across frames to identify stationary items
        
        Args:
            detected_objects: List of objects detected in current frame
            proximity_threshold: Maximum distance to consider same object
            
        Returns:
            Updated object tracks
        """
        current_tracks = {}
        
        # Match detected objects to existing tracks
        for obj in detected_objects:
            best_match = None
            best_distance = float('inf')
            
            # Find closest existing track
            for track_id, track in self.object_tracks.items():
                if track['class'] != obj['class']:
                    continue
                    
                # Calculate distance from last known position
                last_pos = track['positions'][-1]['center']
                current_pos = obj['center']
                distance = np.sqrt((current_pos[0] - last_pos[0])**2 + 
                                 (current_pos[1] - last_pos[1])**2)
                
                if distance < proximity_threshold and distance < best_distance:
                    best_match = track_id
                    best_distance = distance
            
            if best_match:
                # Update existing track
                track = self.object_tracks[best_match]
                track['positions'].append({
                    'center': obj['center'],
                    'bbox': obj['bbox'],
                    'confidence': obj['confidence'],
                    'frame_number': obj['frame_number'],
                    'timestamp': obj['timestamp']
                })
                track['last_seen'] = obj['timestamp']
                current_tracks[best_match] = track
            else:
                # Create new track
                track_id = self.next_track_id
                self.next_track_id += 1
                
                new_track = {
                    'id': track_id,
                    'class': obj['class'],
                    'first_seen': obj['timestamp'],
                    'last_seen': obj['timestamp'],
                    'positions': [{
                        'center': obj['center'],
                        'bbox': obj['bbox'],
                        'confidence': obj['confidence'],
                        'frame_number': obj['frame_number'],
                        'timestamp': obj['timestamp']
                    }],
                    'is_stationary': False,
                    'stationary_duration': 0
                }
                current_tracks[track_id] = new_track
        
        # Update object tracks
        self.object_tracks = current_tracks
        
        return self.object_tracks
    
    def analyze_stationary_objects(self, stationary_threshold=300):
        """
        Analyze tracks to identify stationary objects (potential lost items)
        
        Args:
            stationary_threshold: Minimum time (seconds) to consider object stationary
            
        Returns:
            List of lost objects
        """
        lost_objects = []
        
        for track_id, track in self.object_tracks.items():
            if len(track['positions']) < 3:  # Need multiple detections
                continue
                
            # Calculate movement
            positions = track['positions']
            total_movement = 0
            
            for i in range(1, len(positions)):
                prev_pos = positions[i-1]['center']
                curr_pos = positions[i]['center']
                movement = np.sqrt((curr_pos[0] - prev_pos[0])**2 + 
                                 (curr_pos[1] - prev_pos[1])**2)
                total_movement += movement
            
            # Average movement per detection
            avg_movement = total_movement / (len(positions) - 1) if len(positions) > 1 else 0
            
            # Duration object has been tracked
            duration = track['last_seen'] - track['first_seen']
            
            # Consider stationary if low movement and sufficient duration
            if avg_movement < 30 and duration >= stationary_threshold:
                # Get best frame for capture
                best_detection = max(positions, key=lambda x: x['confidence'])
                
                lost_object = {
                    'id': f"lost_{track_id}_{int(track['first_seen'])}",
                    'class': track['class'],
                    'confidence': np.mean([pos['confidence'] for pos in positions]),
                    'bbox': best_detection['bbox'],
                    'center': best_detection['center'],
                    'first_seen': track['first_seen'],
                    'last_seen': track['last_seen'],
                    'duration': duration,
                    'stationary_duration_minutes': duration / 60,
                    'total_detections': len(positions),
                    'average_movement': avg_movement,
                    'best_frame': best_detection['frame_number'],
                    'capture_timestamp': best_detection['timestamp']
                }
                
                lost_objects.append(lost_object)
        
        return lost_objects
    
    def process_video(self, video_path, settings):
        """
        Process entire video file and detect lost objects
        
        Args:
            video_path: Path to video file
            settings: Detection settings
            
        Returns:
            Dictionary with detection results
        """
        if not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        logger.info(f"Processing video: {video_path}")
        logger.info(f"Duration: {duration:.1f}s, FPS: {fps}, Frames: {total_frames}")
        
        # Processing settings
        frame_skip = settings.get('frame_skip', 30)  # Process every Nth frame
        stationary_threshold = settings.get('stationary_threshold', 5) * 60  # Convert to seconds
        confidence_threshold = settings.get('confidence_threshold', 0.7)
        proximity_threshold = settings.get('proximity_threshold', 50)
        
        self.confidence_threshold = confidence_threshold
        
        results = {
            'video_info': {
                'path': video_path,
                'duration': duration,
                'fps': fps,
                'total_frames': total_frames
            },
            'settings': settings,
            'detected_objects': [],
            'lost_objects': [],
            'processing_stats': {
                'frames_processed': 0,
                'objects_detected': 0,
                'tracks_created': 0
            }
        }
        
        frame_number = 0
        processed_frames = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Skip frames for performance
                if frame_number % frame_skip != 0:
                    frame_number += 1
                    continue
                
                timestamp = frame_number / fps
                
                # Detect objects in frame
                detected_objects = self.detect_objects_in_frame(frame, frame_number, timestamp)
                
                if detected_objects:
                    results['detected_objects'].extend(detected_objects)
                    results['processing_stats']['objects_detected'] += len(detected_objects)
                
                # Track objects
                self.track_objects(detected_objects, proximity_threshold)
                
                processed_frames += 1
                frame_number += 1
                
                # Progress update
                if processed_frames % 100 == 0:
                    progress = (frame_number / total_frames) * 100
                    logger.info(f"Progress: {progress:.1f}% ({processed_frames} frames processed)")
        
        finally:
            cap.release()
        
        # Analyze for lost objects
        lost_objects = self.analyze_stationary_objects(stationary_threshold)
        results['lost_objects'] = lost_objects
        
        # Update stats
        results['processing_stats']['frames_processed'] = processed_frames
        results['processing_stats']['tracks_created'] = len(self.object_tracks)
        results['processing_stats']['lost_objects_found'] = len(lost_objects)
        
        logger.info(f"Processing complete. Found {len(lost_objects)} potential lost objects")
        
        return results

def main():
    parser = argparse.ArgumentParser(description='YOLOv8 Lost Object Detection')
    parser.add_argument('video_path', help='Path to video file')
    parser.add_argument('--settings', help='JSON settings file', default=None)
    parser.add_argument('--output', help='Output JSON file', default=None)
    parser.add_argument('--model', help='YOLOv8 model path', default='yolov8n.pt')
    parser.add_argument('--confidence', type=float, help='Confidence threshold', default=0.7)
    parser.add_argument('--stationary-time', type=int, help='Stationary threshold (minutes)', default=5)
    
    args = parser.parse_args()
    
    # Load settings
    settings = {
        'confidence_threshold': args.confidence,
        'stationary_threshold': args.stationary_time,
        'proximity_threshold': 50,
        'frame_skip': 30
    }
    
    if args.settings and Path(args.settings).exists():
        with open(args.settings, 'r') as f:
            file_settings = json.load(f)
            settings.update(file_settings)
    
    # Initialize detector
    detector = LostObjectDetector(args.model, settings['confidence_threshold'])
    
    try:
        # Process video
        results = detector.process_video(args.video_path, settings)
        
        # Output results
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            logger.info(f"Results saved to: {args.output}")
        else:
            print(json.dumps(results, indent=2, default=str))
            
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()