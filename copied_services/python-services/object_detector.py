#!/usr/bin/env python3
"""
RECOVR Lost Object Detector
Detects objects that have been left unattended for too long
"""

import cv2
import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import json
import requests
from collections import defaultdict
import time
import os
from PIL import Image
import io
import uuid
import argparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecovRObjectDetector:
    def __init__(self, model_path, num_classes=29, device=None, api_base_url="http://localhost:8080/api"):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.api_base_url = api_base_url
        print(f"Using device: {self.device}")
        
        # Initialize model architecture
        self.model = fasterrcnn_resnet50_fpn(pretrained=False)
        
        # Modify the classifier for your number of classes
        in_features = self.model.roi_heads.box_predictor.cls_score.in_features
        self.model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
        
        # Load state dict
        try:
            state_dict = torch.load(model_path, map_location=self.device)
            if isinstance(state_dict, dict) and 'model' in state_dict:
                state_dict = state_dict['model']
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()
            print(f"Model loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
        
        # Initialize video capture
        self.cap = None
        
        # Map model classes to ItemCategory enum values
        self.class_to_category = {
            0: 'MISCELLANEOUS',  # background -> miscellaneous
            1: 'ELECTRONICS', 2: 'ELECTRONICS', 3: 'ELECTRONICS',
            4: 'BAGS', 5: 'BAGS', 6: 'BAGS',
            7: 'CLOTHING', 8: 'CLOTHING', 9: 'CLOTHING',
            10: 'ACCESSORIES', 11: 'ACCESSORIES', 12: 'ACCESSORIES',
            13: 'DOCUMENTS', 14: 'DOCUMENTS',
            15: 'KEYS', 16: 'KEYS',
            17: 'JEWELRY', 18: 'JEWELRY',
            19: 'TOYS', 20: 'TOYS', 21: 'TOYS',
            22: 'BOOKS', 23: 'BOOKS',
            # Default to MISCELLANEOUS for any other classes
        }
        
        # Initialize detection session
        self.session_id = None
        self.camera_id = "default_camera"
        self.camera_location = "Default Location"
        
        # Object tracking
        self.tracked_objects = {}
        self.next_tracking_id = 1
        
    def start_detection_session(self, camera_id="default_camera", camera_location="Default Location"):
        """Start a detection session with the backend"""
        try:
            url = f"{self.api_base_url}/detection/sessions/start"
            params = {
                'cameraId': camera_id,
                'cameraLocation': camera_location,
                'modelVersion': 'pytorch_fasterrcnn_v1'
            }
            
            response = requests.post(url, params=params)
            
            if response.status_code == 200:
                session_data = response.json()
                self.session_id = session_data.get('sessionId')
                self.camera_id = camera_id
                self.camera_location = camera_location
                print(f"Detection session started: {self.session_id}")
                return True
            else:
                print(f"Failed to start detection session: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error starting detection session: {e}")
            return False
    
    def end_detection_session(self):
        """End the current detection session"""
        if not self.session_id:
            return
            
        try:
            url = f"{self.api_base_url}/detection/sessions/{self.session_id}/end"
            response = requests.post(url)
            
            if response.status_code == 200:
                print(f"Detection session ended: {self.session_id}")
            else:
                print(f"Failed to end detection session: {response.status_code}")
                
        except Exception as e:
            print(f"Error ending detection session: {e}")
        
        finally:
            self.session_id = None
    
    def start_video(self, video_path):
        """Start video capture from file or camera"""
        if self.cap is not None:
            self.cap.release()
            
        if isinstance(video_path, int):  # Camera index
            self.cap = cv2.VideoCapture(video_path)
        else:  # Video file
            self.cap = cv2.VideoCapture(video_path)
            
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video source: {video_path}")
            
        return self.cap.get(cv2.CAP_PROP_FRAME_WIDTH), self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    
    def process_frame(self, frame):
        """Process a single frame and return detections"""
        if frame is None:
            return []
            
        # Convert frame to RGB and normalize
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_tensor = torch.from_numpy(frame_rgb).permute(2, 0, 1).float() / 255.0
        frame_tensor = frame_tensor.unsqueeze(0).to(self.device)
        
        # Run inference
        with torch.no_grad():
            predictions = self.model(frame_tensor)
            
        # Process predictions
        detections = []
        if isinstance(predictions, list):
            predictions = predictions[0]  # Take first image's predictions
            
        boxes = predictions['boxes'].cpu().numpy()
        scores = predictions['scores'].cpu().numpy()
        labels = predictions['labels'].cpu().numpy()
        
        # Filter by confidence
        confidence_threshold = 0.5
        mask = scores > confidence_threshold
        
        for box, score, label in zip(boxes[mask], scores[mask], labels[mask]):
            x1, y1, x2, y2 = map(int, box)
            
            # Assign tracking ID (simple approach - in production you'd use a proper tracker)
            tracking_id = self._get_tracking_id(box)
            
            # Map class to category
            category = self.class_to_category.get(label, 'MISCELLANEOUS')
            
            detection = {
                'tracking_id': tracking_id,
                'bbox': [x1, y1, x2, y2],
                'score': float(score),
                'label': int(label),
                'category': category,
                'timestamp': datetime.now().isoformat()
            }
            
            detections.append(detection)
            
        return detections
    
    def _get_tracking_id(self, box):
        """Simple tracking ID assignment based on box position"""
        # This is a simplified approach - in production, use a proper multi-object tracker
        x1, y1, x2, y2 = box
        center_x, center_y = (x1 + x2) / 2, (y1 + y2) / 2
        
        # Find closest existing tracked object
        min_distance = float('inf')
        closest_id = None
        
        for track_id, (prev_x, prev_y) in self.tracked_objects.items():
            distance = np.sqrt((center_x - prev_x)**2 + (center_y - prev_y)**2)
            if distance < min_distance and distance < 50:  # Threshold for same object
                min_distance = distance
                closest_id = track_id
        
        if closest_id is not None:
            # Update position
            self.tracked_objects[closest_id] = (center_x, center_y)
            return closest_id
        else:
            # New object
            new_id = f"track_{self.next_tracking_id}"
            self.tracked_objects[new_id] = (center_x, center_y)
            self.next_tracking_id += 1
            return new_id
    
    def save_detection_to_backend(self, detection, frame):
        """Save detection to backend using the detection API"""
        if not self.session_id:
            print("No active detection session")
            return False
            
        try:
            # First, upload the cropped image
            x1, y1, x2, y2 = detection['bbox']
            crop = frame[y1:y2, x1:x2]
            
            # Save crop temporarily
            temp_filename = f"temp_crop_{detection['tracking_id']}.jpg"
            cv2.imwrite(temp_filename, crop)
            
            # Upload file
            snapshot_url = self._upload_file(temp_filename)
            
            # Clean up temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            
            if not snapshot_url:
                print("Failed to upload detection image")
                return False
            
            # Send detection data to backend
            url = f"{self.api_base_url}/detection/process"
            
            detection_data = {
                'sessionId': self.session_id,
                'trackingId': detection['tracking_id'],
                'category': detection['category'],
                'confidence': detection['score'],
                'x': detection['bbox'][0],
                'y': detection['bbox'][1],
                'width': detection['bbox'][2] - detection['bbox'][0],
                'height': detection['bbox'][3] - detection['bbox'][1],
                'snapshotUrl': snapshot_url
            }
            
            response = requests.post(url, json=detection_data, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                print(f"Detection saved: {detection['tracking_id']}")
                return True
            else:
                print(f"Failed to save detection: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error saving detection: {e}")
            return False
    
    def _upload_file(self, file_path):
        """Upload file to backend and return URL"""
        try:
            url = f"{self.api_base_url}/files/upload"
            
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'image/jpeg')}
                response = requests.post(url, files=files)
            
            if response.status_code == 200:
                # The response should be the file URL
                return response.text.strip('"')  # Remove quotes if present
            else:
                print(f"File upload failed: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error uploading file: {e}")
            return None
    
    def process_video(self, video_path, output_path=None, save_to_backend=True):
        """Process entire video and optionally save results"""
        # Start detection session
        if save_to_backend and not self.start_detection_session():
            print("Failed to start detection session, continuing without backend integration")
            save_to_backend = False
        
        try:
            width, height = map(int, self.start_video(video_path))
            print(f"Processing video: {video_path}")
            print(f"Resolution: {width}x{height}")
            
            frame_count = 0
            all_detections = []
            out = None
            
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break
                    
                frame_count += 1
                if frame_count % 30 == 0:
                    print(f"Processing frame {frame_count}")
                
                # Process frame
                detections = self.process_frame(frame)
                if detections:
                    all_detections.extend(detections)
                    print(f"Found {len(detections)} objects in frame {frame_count}")
                    
                    # Save to backend if enabled
                    if save_to_backend:
                        for detection in detections:
                            self.save_detection_to_backend(detection, frame)
                
                # Display frame with detections (optional)
                if output_path:
                    frame_with_boxes = self._draw_detections(frame.copy(), detections)
                    if frame_count == 1:
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                        out = cv2.VideoWriter(output_path, fourcc, 30.0, (int(width), int(height)))
                    if out is not None:
                        out.write(frame_with_boxes)
            
            if output_path and out is not None:
                out.release()
                
            self.cap.release()
            print(f"Processed {frame_count} frames. Found {len(all_detections)} objects.")
            return all_detections
            
        except Exception as e:
            print(f"Error processing video: {e}")
            if self.cap is not None:
                self.cap.release()
            if 'out' in locals() and out is not None:
                out.release()
            raise
        finally:
            # End detection session
            if save_to_backend:
                self.end_detection_session()
    
    def _draw_detections(self, frame, detections):
        """Draw bounding boxes on frame"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            score = det['score']
            category = det['category']
            tracking_id = det['tracking_id']
            
            # Draw box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label_text = f"{category}: {score:.2f} [{tracking_id}]"
            cv2.putText(frame, label_text, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return frame

# Backwards compatibility
ObjectDetector = RecovRObjectDetector

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='RECOVR Object Detection')
    parser.add_argument('--model', type=str, required=True, help='Path to the model file')
    parser.add_argument('--video', type=str, default='0', help='Video source (file path or camera index)')
    parser.add_argument('--output', type=str, help='Output video file path (optional)')
    parser.add_argument('--no-backend', action='store_true', help='Disable backend integration')
    parser.add_argument('--camera-id', type=str, default='default_camera', help='Camera ID for backend')
    parser.add_argument('--camera-location', type=str, default='Default Location', help='Camera location for backend')
    
    args = parser.parse_args()
    
    # Convert video argument to int if it's a camera index
    try:
        video_path = int(args.video)
    except ValueError:
        video_path = args.video
    
    detector = RecovRObjectDetector(args.model, num_classes=29)
    detector.process_video(
        video_path, 
        output_path=args.output,
        save_to_backend=not args.no_backend
    )