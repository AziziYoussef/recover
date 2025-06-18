# AI Video Detection Service

This service provides automated lost object detection using YOLOv8 computer vision technology. It analyzes video footage to identify objects that remain stationary for extended periods and automatically reports them as potential lost items.

## Features

- **Real-time Object Detection**: Uses YOLOv8 for accurate object detection
- **Stationary Object Tracking**: Identifies objects that haven't moved for configurable time periods
- **Automatic Lost Item Reporting**: Automatically adds detected lost items to the database
- **Configurable Detection Parameters**: Customize confidence thresholds, stationary time limits, and monitored object classes
- **Video Processing Queue**: Process multiple videos with progress monitoring
- **Frame Extraction**: Captures frames of detected lost objects for evidence

## Supported Object Classes

The system can detect and track the following types of objects:
- Backpacks and bags
- Laptops and electronics
- Cell phones
- Books and documents
- Umbrellas
- Bottles
- Keys and wallets
- Suitcases

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Download YOLOv8 Model

The system will automatically download the YOLOv8 model on first use, or you can pre-download it:

```bash
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### 3. Configure Detection Settings

Access the AI Detection interface at `/admin/ai-detection` and configure:

- **Stationary Threshold**: Minimum time (minutes) an object must remain still to be considered lost
- **Confidence Threshold**: Minimum detection confidence (0.0 - 1.0)
- **Proximity Threshold**: Distance threshold for tracking the same object across frames
- **Auto-Reporting**: Enable/disable automatic reporting to the database
- **Monitored Classes**: Select which object types to detect
- **Location Info**: Default location name and camera information

### 4. Upload and Process Videos

1. Navigate to the AI Detection dashboard
2. Click "Upload Video" and select your video file
3. The system will automatically start processing
4. Monitor progress in real-time
5. Review detected lost objects and manually report if needed

## API Endpoints

### Upload Video
```
POST /api/admin/ai-detection/upload
Content-Type: multipart/form-data

Body:
- video: File (video file)
- settings: JSON (detection settings)
```

### Get Videos List
```
GET /api/admin/ai-detection/videos
```

### Start/Restart Analysis
```
POST /api/admin/ai-detection/analyze/{videoId}
Body: { settings: DetectionSettings }
```

### Report Lost Object
```
POST /api/admin/ai-detection/report-lost
Body: { videoId: number, objectId: string }
```

### Get Video Frame
```
GET /api/admin/ai-detection/frame/{videoId}/{frameNumber}
```

### Delete Video
```
DELETE /api/admin/ai-detection/videos/{videoId}
```

## Detection Process

1. **Video Upload**: Admin uploads video file with detection settings
2. **Frame Processing**: System processes video frames using YOLOv8
3. **Object Detection**: Identifies objects in each frame with confidence scores
4. **Object Tracking**: Tracks objects across frames to determine movement patterns
5. **Stationary Analysis**: Identifies objects that remain in the same location
6. **Lost Object Classification**: Objects stationary beyond threshold are marked as lost
7. **Frame Capture**: Best quality frame is captured for evidence
8. **Auto-Reporting**: If enabled, automatically creates database entries

## Performance Considerations

- **Frame Skipping**: Processes every 30th frame by default for performance
- **Model Size**: Uses YOLOv8n (nano) for faster processing. Upgrade to YOLOv8s/m/l for better accuracy
- **Video Resolution**: Higher resolution videos take longer to process
- **Hardware**: GPU acceleration recommended for larger videos

## Fallback Mode

If YOLOv8 is not available, the system automatically falls back to mock detection mode for development and testing purposes.

## File Structure

```
├── app/api/admin/ai-detection/
│   ├── upload/route.ts          # Video upload handler
│   ├── videos/route.ts          # Video management
│   ├── analyze/[id]/route.ts    # Analysis trigger
│   ├── report-lost/route.ts     # Manual reporting
│   └── frame/[videoId]/[frame]/route.ts  # Frame serving
├── scripts/
│   ├── yolo_detector.py         # Python YOLOv8 script
│   └── requirements.txt         # Python dependencies
├── lib/
│   └── ai-detection.ts          # TypeScript service wrapper
└── app/admin/ai-detection/
    └── page.tsx                 # Admin interface
```

## Configuration Options

### Detection Settings

```typescript
interface DetectionSettings {
  stationaryThreshold: number     // Minutes object must be stationary
  confidenceThreshold: number     // Minimum detection confidence (0.0-1.0)
  proximityThreshold: number      // Pixel distance for object tracking
  enableAutoReporting: boolean    // Auto-report detected objects
  monitoredClasses: string[]      // Object classes to monitor
  locationName: string            // Default location for reports
  cameraInfo: string             // Camera identification
}
```

### Default Values

- Stationary Threshold: 5 minutes
- Confidence Threshold: 0.7 (70%)
- Proximity Threshold: 50 pixels
- Auto-Reporting: Enabled
- Monitored Classes: ['backpack', 'handbag', 'laptop', 'cell phone', 'book']

## Troubleshooting

### YOLOv8 Installation Issues
```bash
# Install PyTorch first
pip install torch torchvision

# Then install ultralytics
pip install ultralytics
```

### Video Processing Errors
- Check video format compatibility (MP4, AVI, MOV supported)
- Ensure video file is not corrupted
- Verify sufficient disk space for processing

### Performance Issues
- Reduce video resolution before upload
- Increase frame skip value in settings
- Use GPU acceleration if available

## Security Considerations

- Video files are stored securely in the uploads directory
- Admin authentication required for all operations
- Automatic cleanup of temporary processing files
- Frame captures are served through authenticated endpoints

## Integration with Items Database

Detected lost objects are automatically integrated with the main items database:

- **Title**: Generated from object class
- **Description**: Includes AI detection details and confidence
- **Category**: Mapped from object class
- **Location**: From detection settings
- **Images**: Captured frame from detection
- **Metadata**: AI analysis data and detection parameters

This creates a seamless workflow from video surveillance to lost item management.