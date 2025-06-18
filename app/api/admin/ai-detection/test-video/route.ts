import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { join } from 'path'
import { existsSync } from 'fs'
import { addVideoToDatabase } from '../videos/route'

export async function POST(request: NextRequest) {
  try {
    console.log('Test Video: Request received')
    
    const session = await getServerSession(authOptions)
    console.log('Test Video: Session:', session?.user?.email, session?.user?.role)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      console.log('Test Video: Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Path to the test video
    const videoPath = join(process.cwd(), 'public', 'uploads', 'VID_20250615_115540.mp4')
    
    console.log('Test Video: Looking for video at:', videoPath)
    
    if (!existsSync(videoPath)) {
      console.log('Test Video: Video file not found')
      return NextResponse.json({ error: 'Test video not found. Please upload VID_20250615_115540.mp4 to public/uploads/' }, { status: 404 })
    }

    // Get video file info
    const fs = await import('fs')
    const stats = fs.statSync(videoPath)
    const fileSizeInBytes = stats.size
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(1)

    console.log('Test Video: File found, size:', fileSizeInMB, 'MB')

    // Test settings with fast processing
    const testSettings = {
      stationaryThreshold: 1, // 1 minute for fast testing
      confidenceThreshold: 0.5, // Lower threshold for more detections
      proximityThreshold: 50,
      enableAutoReporting: true,
      monitoredClasses: ["backpack", "handbag", "suitcase", "laptop", "cell phone", "book", "person", "bottle", "umbrella"],
      locationName: "Test Location - Public Uploads",
      cameraInfo: "Test Camera - Manual Processing"
    }

    // Create video analysis record
    const videoAnalysis = {
      id: Date.now(),
      filename: 'VID_20250615_115540.mp4',
      filepath: videoPath,
      uploadedAt: new Date().toISOString(),
      status: 'queued',
      progress: 0,
      duration: 120, // Assume 2 minutes for testing
      fileSize: `${fileSizeInMB} MB`,
      detectedObjects: [],
      lostObjects: [],
      settings: testSettings
    }

    // Store in database
    addVideoToDatabase(videoAnalysis)
    console.log('Test Video: Added to database:', videoAnalysis.id)

    // Start processing in background
    processTestVideoInBackground(videoAnalysis)

    return NextResponse.json({ 
      success: true, 
      video: videoAnalysis,
      message: 'Test video processing started with 1-minute stationary threshold',
      testSettings
    })

  } catch (error) {
    console.error('Error processing test video:', error)
    return NextResponse.json({ error: 'Failed to process test video: ' + error.message }, { status: 500 })
  }
}

async function processTestVideoInBackground(videoAnalysis: any) {
  const { updateVideoInDatabase } = await import('../videos/route')
  const { aiDetectionService } = await import('../../../../../lib/ai-detection')
  
  console.log('Test Video: Starting background processing for:', videoAnalysis.filename)
  
  setTimeout(async () => {
    try {
      // Update status to processing
      updateVideoInDatabase(videoAnalysis.id, { status: 'processing', progress: 10 })
      console.log('Test Video: Status updated to processing')
      
      // Try real AI detection first
      try {
        console.log('Test Video: Attempting real AI detection...')
        const detectionResults = await aiDetectionService.processVideo(
          videoAnalysis.filepath,
          videoAnalysis.settings
        )
        
        console.log('Test Video: AI detection completed, results:', {
          detectedObjects: detectionResults.detected_objects.length,
          lostObjects: detectionResults.lost_objects.length,
          processingStats: detectionResults.processing_stats
        })
        
        // Convert results to expected format
        const detectedObjects = detectionResults.detected_objects.map(obj => ({
          id: obj.id,
          class: obj.class,
          confidence: obj.confidence,
          bbox: obj.bbox,
          firstSeen: obj.frame_number,
          lastSeen: obj.frame_number,
          timestamp: obj.timestamp,
          isStationary: false,
          stationaryDuration: 0,
          isLost: false,
          frames: [{
            timestamp: obj.frame_number,
            bbox: obj.bbox,
            confidence: obj.confidence
          }]
        }))
        
        const lostObjects = detectionResults.lost_objects.map(obj => ({
          id: obj.id,
          objectClass: obj.class,
          confidence: obj.confidence,
          location: {
            x: obj.bbox[0],
            y: obj.bbox[1],
            width: obj.bbox[2],
            height: obj.bbox[3]
          },
          detectedAt: new Date(Date.now() - (obj.duration * 1000)).toISOString(),
          stationaryDuration: Math.round(obj.stationary_duration_minutes),
          captureFrame: `/api/admin/ai-detection/frame/${videoAnalysis.id}/${obj.best_frame}`,
          description: `AI-detected ${obj.class} stationary for ${Math.round(obj.stationary_duration_minutes)} minutes (confidence: ${Math.round(obj.confidence * 100)}%)`,
          category: getCategoryFromClass(obj.class),
          reportedToDb: false,
          aiAnalysis: {
            totalDetections: obj.total_detections,
            averageMovement: obj.average_movement,
            captureTimestamp: obj.capture_timestamp,
            bestFrame: obj.best_frame
          }
        }))
        
        console.log('Test Video: Converted results - detected:', detectedObjects.length, 'lost:', lostObjects.length)
        
        // Auto-report lost objects
        if (videoAnalysis.settings.enableAutoReporting && lostObjects.length > 0) {
          console.log('Test Video: Auto-reporting', lostObjects.length, 'lost objects')
          for (const lostObject of lostObjects) {
            setTimeout(async () => {
              const reportResult = await reportLostObjectToTestDatabase(lostObject, videoAnalysis.settings)
              if (reportResult.success) {
                lostObject.reportedToDb = true
                lostObject.itemId = reportResult.itemId
                console.log('Test Video: Auto-reported object:', lostObject.objectClass, 'as item ID:', reportResult.itemId)
              }
            }, 1000)
          }
        }
        
        // Final update
        updateVideoInDatabase(videoAnalysis.id, { 
          status: 'completed',
          progress: 100,
          detectedObjects,
          lostObjects,
          aiAnalysis: {
            processingStats: detectionResults.processing_stats,
            videoInfo: detectionResults.video_info,
            realAI: true
          }
        })
        
        console.log(`Test Video: Real AI detection completed for ${videoAnalysis.filename}. Found ${lostObjects.length} lost objects.`)
        
      } catch (aiError) {
        console.log('Test Video: Real AI failed, using enhanced mock detection:', aiError.message)
        await processTestVideoWithMock(videoAnalysis)
      }
      
    } catch (error) {
      console.error('Test Video: Error in processing:', error)
      updateVideoInDatabase(videoAnalysis.id, { status: 'failed', error: error.message })
    }
  }, 2000)
}

async function processTestVideoWithMock(videoAnalysis: any) {
  const { updateVideoInDatabase } = await import('../videos/route')
  
  console.log('Test Video: Starting enhanced mock detection')
  
  // Enhanced mock detection with realistic results
  const mockDetectedObjects = []
  const mockLostObjects = []
  
  // Simulate finding objects every 10 seconds for 2 minutes
  for (let second = 0; second < 120; second += 10) {
    if (Math.random() < 0.4) { // 40% chance to find an object every 10 seconds
      const objectClasses = videoAnalysis.settings.monitoredClasses
      const randomClass = objectClasses[Math.floor(Math.random() * objectClasses.length)]
      
      const detectedObject = {
        id: `test_obj_${videoAnalysis.id}_${second}`,
        class: randomClass,
        confidence: Math.max(videoAnalysis.settings.confidenceThreshold, 0.6 + Math.random() * 0.4),
        bbox: [
          Math.floor(Math.random() * 400) + 100, // x
          Math.floor(Math.random() * 300) + 100, // y
          Math.floor(Math.random() * 80) + 60,   // width
          Math.floor(Math.random() * 100) + 80   // height
        ],
        firstSeen: second * 30, // Frame number (30 FPS)
        lastSeen: second * 30,
        timestamp: second,
        isStationary: true,
        stationaryDuration: 0,
        isLost: false,
        frames: [{
          timestamp: second * 30,
          bbox: [Math.floor(Math.random() * 400) + 100, Math.floor(Math.random() * 300) + 100, 70, 90],
          confidence: 0.7 + Math.random() * 0.3
        }]
      }
      
      mockDetectedObjects.push(detectedObject)
      
      // Progress update
      const progress = Math.floor((second / 120) * 90)
      updateVideoInDatabase(videoAnalysis.id, { 
        progress,
        detectedObjects: mockDetectedObjects
      })
      
      await new Promise(resolve => setTimeout(resolve, 200)) // Simulate processing time
    }
  }
  
  console.log('Test Video: Mock detection found', mockDetectedObjects.length, 'objects')
  
  // Create lost objects from stationary detections
  const objectTracks = groupObjectsByLocation(mockDetectedObjects)
  
  for (const [trackKey, objects] of Object.entries(objectTracks)) {
    if (objects.length >= 3) { // Need multiple detections
      const firstObj = objects[0]
      const lastObj = objects[objects.length - 1]
      const duration = lastObj.timestamp - firstObj.timestamp
      
      if (duration >= (videoAnalysis.settings.stationaryThreshold * 60)) { // Convert minutes to seconds
        const avgConfidence = objects.reduce((sum: number, obj: any) => sum + obj.confidence, 0) / objects.length
        
        const lostObject = {
          id: `test_lost_${videoAnalysis.id}_${firstObj.timestamp}`,
          objectClass: firstObj.class,
          confidence: avgConfidence,
          location: {
            x: firstObj.bbox[0],
            y: firstObj.bbox[1],
            width: firstObj.bbox[2],
            height: firstObj.bbox[3]
          },
          detectedAt: new Date(Date.now() - ((120 - firstObj.timestamp) * 1000)).toISOString(),
          stationaryDuration: Math.round(duration / 60),
          captureFrame: `/api/admin/ai-detection/frame/${videoAnalysis.id}/${firstObj.firstSeen}`,
          description: `Test: ${firstObj.class} remained stationary for ${Math.round(duration / 60)} minutes (detected ${objects.length} times)`,
          category: getCategoryFromClass(firstObj.class),
          reportedToDb: false,
          aiAnalysis: {
            totalDetections: objects.length,
            averageMovement: Math.random() * 15, // Low movement
            captureTimestamp: firstObj.timestamp,
            bestFrame: firstObj.firstSeen,
            testMode: true
          }
        }
        
        mockLostObjects.push(lostObject)
      }
    }
  }
  
  console.log('Test Video: Created', mockLostObjects.length, 'lost objects from', Object.keys(objectTracks).length, 'tracks')
  
  // Auto-report lost objects
  if (videoAnalysis.settings.enableAutoReporting && mockLostObjects.length > 0) {
    console.log('Test Video: Auto-reporting', mockLostObjects.length, 'mock lost objects')
    for (const lostObject of mockLostObjects) {
      setTimeout(async () => {
        const reportResult = await reportLostObjectToTestDatabase(lostObject, videoAnalysis.settings)
        if (reportResult.success) {
          lostObject.reportedToDb = true
          lostObject.itemId = reportResult.itemId
          console.log('Test Video: Auto-reported mock object:', lostObject.objectClass, 'as item ID:', reportResult.itemId)
        }
      }, 1000)
    }
  }
  
  // Final update
  updateVideoInDatabase(videoAnalysis.id, { 
    status: 'completed',
    progress: 100,
    detectedObjects: mockDetectedObjects,
    lostObjects: mockLostObjects,
    aiAnalysis: {
      processingStats: {
        frames_processed: 240,
        objects_detected: mockDetectedObjects.length,
        tracks_created: Object.keys(objectTracks).length,
        lost_objects_found: mockLostObjects.length
      },
      videoInfo: {
        path: videoAnalysis.filepath,
        duration: 120,
        fps: 30,
        total_frames: 3600
      },
      testMode: true
    }
  })
  
  console.log(`Test Video: Mock processing completed for ${videoAnalysis.filename}. Found ${mockLostObjects.length} lost objects.`)
}

function groupObjectsByLocation(objects: any[]): { [key: string]: any[] } {
  const tracks: { [key: string]: any[] } = {}
  
  for (const obj of objects) {
    // Group objects by class and approximate location
    const locationKey = `${obj.class}_${Math.floor(obj.bbox[0] / 100)}_${Math.floor(obj.bbox[1] / 100)}`
    
    if (!tracks[locationKey]) {
      tracks[locationKey] = []
    }
    tracks[locationKey].push(obj)
  }
  
  // Sort each track by timestamp
  for (const track of Object.values(tracks)) {
    track.sort((a, b) => a.timestamp - b.timestamp)
  }
  
  return tracks
}

function getCategoryFromClass(objectClass: string): string {
  const categoryMap: { [key: string]: string } = {
    'backpack': 'bags',
    'handbag': 'bags', 
    'suitcase': 'bags',
    'laptop': 'electronics',
    'cell phone': 'electronics',
    'book': 'documents',
    'umbrella': 'accessories',
    'bottle': 'accessories',
    'person': 'other'
  }
  return categoryMap[objectClass] || 'other'
}

async function reportLostObjectToTestDatabase(lostObject: any, settings: any) {
  try {
    console.log('Test Video: Reporting lost object to database:', lostObject.objectClass)
    
    // Simulate database insertion
    const itemData = {
      title: `Lost ${capitalizeFirst(lostObject.objectClass)} (AI Test)`,
      description: `${lostObject.description}\n\nThis item was detected using AI video analysis in test mode.`,
      category: lostObject.category,
      location: settings.locationName || 'Test Location',
      status: 'lost',
      images: [lostObject.captureFrame],
      reportedBy: 'AI Detection System (Test)',
      contactInfo: 'test@system.com',
      metadata: {
        aiDetected: true,
        testMode: true,
        confidence: Math.round(lostObject.confidence * 100),
        stationaryDuration: lostObject.stationaryDuration,
        detectedAt: lostObject.detectedAt,
        cameraInfo: settings.cameraInfo || 'Test Camera',
        videoFile: 'VID_20250615_115540.mp4',
        aiAnalysis: lostObject.aiAnalysis
      }
    }
    
    // Simulate successful insertion
    const itemId = Date.now() + Math.floor(Math.random() * 1000)
    
    console.log('Test Video: Successfully reported item with ID:', itemId)
    
    return {
      success: true,
      itemId,
      itemData
    }
    
  } catch (error) {
    console.error('Test Video: Error reporting to database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}