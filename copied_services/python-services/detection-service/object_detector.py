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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ObjectDetector:
    def __init__(self, model_path, num_classes=29, device=None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        # Load TorchScript model
        try:
            self.model = torch.jit.load(model_path, map_location=self.device)
            self.model.eval()
            print(f"TorchScript model loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading TorchScript model: {e}")
            raise
        
        # Initialize video capture
        self.cap = None
        
        # Class names (modify these based on your training)
        self.class_names = ['background'] + [f'class_{i}' for i in range(1, num_classes)]
        
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
        """Process a single frame and return detections (YOLOv8 TorchScript format)"""
        if frame is None:
            return []

        # Convert frame to RGB and resize to 640x640 (YOLOv8 default)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(frame_rgb, (640, 640))
        img_tensor = torch.from_numpy(img_resized).permute(2, 0, 1).float() / 255.0
        img_tensor = img_tensor.unsqueeze(0).to(self.device)

        # Run inference
        with torch.no_grad():
            preds = self.model(img_tensor)[0]  # (num_detections, 85)
            preds = preds.cpu().numpy()

        detections = []
        confidence_threshold = 0.5
        # COCO class names for YOLOv8
        coco_classes = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
            'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
            'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
            'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
            'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
            'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
            'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
            'hair drier', 'toothbrush'
        ]
        for det in preds:
            # YOLOv8 output format: [x1, y1, x2, y2, conf, class_scores...]
            x1, y1, x2, y2, conf, *class_scores = det
            if conf < confidence_threshold:
                continue
            # Get class with highest score
            cls = np.argmax(class_scores)
            x1, y1, x2, y2, cls = map(int, [x1, y1, x2, y2, cls])
            class_name = coco_classes[cls] if 0 <= cls < len(coco_classes) else f'class_{cls}'
            detections.append({
                'bbox': [x1, y1, x2, y2],
                'score': float(conf),
                'label': int(cls),
                'class_name': class_name,
                'timestamp': datetime.now().isoformat()
            })
        return detections
    
    def process_video(self, video_path, output_path=None, save_to_db=True):
        """Process entire video and optionally save results"""
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
                    
                    # Save to database if enabled
                    if save_to_db:
                        self._save_to_database(detections, frame)
                
                # Display frame with detections (optional)
                if output_path:
                    frame_with_boxes = self._draw_detections(frame.copy(), detections)
                    if frame_count == 1:
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                        out = cv2.VideoWriter(output_path, fourcc, 30.0, (width, height))
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
    
    def _draw_detections(self, frame, detections):
        """Draw bounding boxes on frame"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            score = det['score']
            class_name = det['class_name']
            
            # Draw box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label_text = f"{class_name}: {score:.2f}"
            cv2.putText(frame, label_text, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return frame
    
    def _save_to_database(self, detections, frame):
        """Save detections to database via API"""
        api_url = "http://localhost:8080/api/items"

        for det in detections:
            # Prepare data for API (match ItemDto fields)
            data = {
                'name': f"Detected {det['class_name']}",
                'description': f"Automatically detected {det['class_name']} (confidence: {det['score']:.2f})",
                'type': 'LOST',  # or 'FOUND' if you want
                'category': 'MISCELLANEOUS',  # or map to a real category if possible
                'status': 'LOST',
                'location': "Camera Feed",
                'imageUrl': None,  # TODO: Implement image upload and set URL here
                'timestamp': det['timestamp']
            }

            headers = {'Content-Type': 'application/json'}

            try:
                response = requests.post(api_url, json=data, headers=headers)
                if response.status_code in (200, 201):
                    print(f"Saved detection to database: {data['name']}")
                else:
                    print(f"Failed to save detection: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Error saving to database: {e}")

if __name__ == "__main__":
    # Example usage
    model_path = "stable_model_epoch_30.pth"
    video_path = "test_videos/stock-footage-shanghai-china-february-passengers-boarding-high-speed-train-at-shanghai-station-on-a.webm"
    
    detector = ObjectDetector(model_path, num_classes=29)  # Using 29 classes to match the model
    detector.process_video(video_path, output_path="output.mp4") 