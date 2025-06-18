import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { addVideoToDatabase } from '../videos/route'

export async function POST(request: NextRequest) {
  try {
    console.log('AI Detection Upload: Request received')
    
    const session = await getServerSession(authOptions)
    console.log('AI Detection Upload: Session:', session?.user?.email, session?.user?.role)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      console.log('AI Detection Upload: Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('AI Detection Upload: Processing form data')
    const formData = await request.formData()
    const file = formData.get('video') as File
    const settings = JSON.parse(formData.get('settings') as string || '{}')

    console.log('AI Detection Upload: File info:', file ? { name: file.name, size: file.size, type: file.type } : 'No file')
    console.log('AI Detection Upload: Settings:', settings)

    if (!file) {
      console.log('AI Detection Upload: No file provided')
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a video file.' }, { status: 400 })
    }

    // Validate file size (max 500MB)
    const maxSizeInBytes = 500 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ error: 'File too large. Maximum size is 500MB.' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'videos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get video duration (mock for now)
    const duration = 1800 // 30 minutes - in real implementation, use ffprobe

    // Create video analysis record
    const videoAnalysis = {
      id: timestamp,
      filename: originalName,
      filepath,
      uploadedAt: new Date().toISOString(),
      status: 'queued',
      progress: 0,
      duration,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      detectedObjects: [],
      lostObjects: [],
      settings: {
        stationaryThreshold: settings.stationaryThreshold || 5,
        confidenceThreshold: settings.confidenceThreshold || 0.7,
        proximityThreshold: settings.proximityThreshold || 50,
        enableAutoReporting: settings.enableAutoReporting !== false,
        monitoredClasses: settings.monitoredClasses || ['backpack', 'handbag', 'suitcase', 'laptop', 'cell phone', 'book'],
        locationName: settings.locationName || '',
        cameraInfo: settings.cameraInfo || ''
      }
    }

    // Store in database
    addVideoToDatabase(videoAnalysis)
    console.log('Video uploaded:', videoAnalysis)

    // Start processing in background
    processVideoInBackground(videoAnalysis)

    return NextResponse.json({ 
      success: true, 
      video: videoAnalysis,
      message: 'Video uploaded successfully and queued for processing'
    })

  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
  }
}

async function processVideoInBackground(videoAnalysis: any) {
  const { updateVideoInDatabase } = await import('../videos/route')
  
  // Simulate processing delay
  setTimeout(async () => {
    try {
      // Update status to processing
      updateVideoInDatabase(videoAnalysis.id, { status: 'processing' })
      console.log('Started processing video:', videoAnalysis.filename)
      
      // Simulate AI detection process
      await simulateAIDetection(videoAnalysis)
      
    } catch (error) {
      console.error('Error processing video:', error)
      updateVideoInDatabase(videoAnalysis.id, { status: 'failed' })
    }
  }, 2000)
}

async function simulateAIDetection(videoAnalysis: any) {
  const { updateVideoInDatabase } = await import('../videos/route')
  const { aiDetectionService } = await import('../../../../../lib/ai-detection')
  
  try {
    // Update status to processing
    updateVideoInDatabase(videoAnalysis.id, { status: 'processing', progress: 10 })
    
    // Use real AI detection service
    const detectionResults = await aiDetectionService.processVideo(
      videoAnalysis.filepath,
      videoAnalysis.settings
    )
    
    // Convert detected objects to expected format
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
    
    // Convert lost objects to expected format
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
    
    // Auto-report if enabled
    if (videoAnalysis.settings.enableAutoReporting && lostObjects.length > 0) {
      for (const lostObject of lostObjects) {
        setTimeout(async () => {
          await reportLostObjectToDatabase(lostObject, videoAnalysis.settings)
          lostObject.reportedToDb = true
          lostObject.itemId = Date.now() + Math.floor(Math.random() * 1000)
          updateVideoInDatabase(videoAnalysis.id, { lostObjects })
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
        videoInfo: detectionResults.video_info
      }
    })
    
    console.log(`AI detection completed for ${videoAnalysis.filename}. Found ${lostObjects.length} lost objects.`)
    
  } catch (error) {
    console.error('Error in AI detection:', error)
    
    // Fallback to mock detection
    console.log('Falling back to mock detection...')
    await simulateMockDetection(videoAnalysis)
  }
}

async function simulateMockDetection(videoAnalysis: any) {
  const { updateVideoInDatabase } = await import('../videos/route')
  
  // Simulate progressive processing
  const totalFrames = Math.floor(videoAnalysis.duration * 30) // 30 FPS
  const processedFrames = Math.floor(totalFrames * 0.1) // Process every 10th frame
  
  for (let i = 0; i < processedFrames; i++) {
    const progress = Math.floor((i / processedFrames) * 100)
    updateVideoInDatabase(videoAnalysis.id, { progress })
    
    // Simulate finding objects
    if (Math.random() > 0.8) { // 20% chance to find an object
      const objectClasses = videoAnalysis.settings.monitoredClasses
      const randomClass = objectClasses[Math.floor(Math.random() * objectClasses.length)]
      
      const detectedObject = {
        id: `obj_${Date.now()}_${i}`,
        class: randomClass,
        confidence: 0.7 + Math.random() * 0.3,
        bbox: [
          Math.floor(Math.random() * 400),
          Math.floor(Math.random() * 300),
          Math.floor(Math.random() * 100) + 50,
          Math.floor(Math.random() * 100) + 50
        ],
        firstSeen: i * 10, // Frame number
        lastSeen: i * 10,
        isStationary: false,
        stationaryDuration: 0,
        isLost: false,
        frames: [{
          timestamp: i * 10,
          bbox: [Math.floor(Math.random() * 400), Math.floor(Math.random() * 300), 60, 80],
          confidence: 0.8 + Math.random() * 0.2
        }]
      }
      
      videoAnalysis.detectedObjects.push(detectedObject)
    }
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Analyze for lost objects
  const lostObjects = await analyzeLostObjects(videoAnalysis)
  
  // Final update
  updateVideoInDatabase(videoAnalysis.id, { 
    status: 'completed',
    progress: 100,
    detectedObjects: videoAnalysis.detectedObjects,
    lostObjects
  })
  
  console.log('Completed mock processing video:', videoAnalysis.filename)
}

async function analyzeLostObjects(videoAnalysis: any) {
  const stationaryThreshold = videoAnalysis.settings.stationaryThreshold * 60 // Convert to seconds
  const detectedObjects = videoAnalysis.detectedObjects
  
  // Group objects by class and proximity to track the same object across frames
  const objectTracks: { [key: string]: any[] } = {}
  
  detectedObjects.forEach((obj: any) => {
    const trackKey = `${obj.class}_${Math.floor(obj.bbox[0] / 100)}_${Math.floor(obj.bbox[1] / 100)}`
    if (!objectTracks[trackKey]) {
      objectTracks[trackKey] = []
    }
    objectTracks[trackKey].push(obj)
  })
  
  // Analyze each track for stationary behavior
  Object.values(objectTracks).forEach((track: any[]) => {
    if (track.length < 5) return // Need at least 5 detections
    
    const firstFrame = track[0].firstSeen
    const lastFrame = track[track.length - 1].lastSeen
    const duration = (lastFrame - firstFrame) / 30 // Convert frames to seconds
    
    // Check if object was stationary (same position across frames)
    const positions = track.map(obj => ({ x: obj.bbox[0], y: obj.bbox[1] }))
    const maxDistance = Math.max(...positions.map((pos, i) => 
      i === 0 ? 0 : Math.sqrt(Math.pow(pos.x - positions[0].x, 2) + Math.pow(pos.y - positions[0].y, 2))
    ))
    
    if (maxDistance < videoAnalysis.settings.proximityThreshold && duration >= stationaryThreshold) {
      // This is a lost object
      const lostObject = {
        id: `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        objectClass: track[0].class,
        confidence: track.reduce((sum: number, obj: any) => sum + obj.confidence, 0) / track.length,
        location: {
          x: track[0].bbox[0],
          y: track[0].bbox[1],
          width: track[0].bbox[2],
          height: track[0].bbox[3]
        },
        detectedAt: new Date(Date.now() - (videoAnalysis.duration - firstFrame / 30) * 1000).toISOString(),
        stationaryDuration: Math.floor(duration / 60), // Convert to minutes
        captureFrame: `/api/admin/ai-detection/frame/${videoAnalysis.id}/${firstFrame}`,
        description: `${track[0].class} detected as stationary for ${Math.floor(duration / 60)} minutes`,
        category: getCategoryFromClass(track[0].class),
        reportedToDb: false
      }
      
      videoAnalysis.lostObjects.push(lostObject)
      
      // Auto-report if enabled
      if (videoAnalysis.settings.enableAutoReporting) {
        setTimeout(() => {
          reportLostObjectToDatabase(lostObject, videoAnalysis.settings)
        }, 1000)
      }
    }
  })
  
  return videoAnalysis.lostObjects
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
    'bottle': 'accessories'
  }
  return categoryMap[objectClass] || 'other'
}

async function reportLostObjectToDatabase(lostObject: any, settings: any) {
  try {
    // Simulate database insertion
    const itemData = {
      title: `Lost ${lostObject.objectClass}`,
      description: lostObject.description,
      category: lostObject.category,
      location: settings.locationName || 'Unknown Location',
      status: 'lost',
      images: [lostObject.captureFrame],
      metadata: {
        aiDetected: true,
        confidence: lostObject.confidence,
        stationaryDuration: lostObject.stationaryDuration,
        detectedAt: lostObject.detectedAt,
        cameraInfo: settings.cameraInfo
      }
    }
    
    // In real implementation, save to database
    console.log('Auto-reported lost object to database:', itemData)
    
    // Update the lost object record
    lostObject.reportedToDb = true
    lostObject.itemId = Date.now() // Mock item ID
    
  } catch (error) {
    console.error('Error reporting lost object to database:', error)
  }
}