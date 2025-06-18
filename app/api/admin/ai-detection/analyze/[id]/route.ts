import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getVideoFromDatabase, updateVideoInDatabase } from '../../videos/route'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = parseInt(params.id)
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const { settings } = await request.json()
    
    const video = getVideoFromDatabase(videoId)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update video settings
    const updatedSettings = {
      ...video.settings,
      ...settings
    }

    // Reset analysis data
    updateVideoInDatabase(videoId, {
      status: 'queued',
      progress: 0,
      detectedObjects: [],
      lostObjects: [],
      settings: updatedSettings
    })

    // Start analysis in background
    setTimeout(async () => {
      await reprocessVideo(videoId)
    }, 1000)

    return NextResponse.json({ 
      success: true, 
      message: 'Video analysis restarted with new settings' 
    })

  } catch (error) {
    console.error('Error starting video analysis:', error)
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 })
  }
}

async function reprocessVideo(videoId: number) {
  try {
    const video = getVideoFromDatabase(videoId)
    if (!video) return

    // Update status to processing
    updateVideoInDatabase(videoId, { status: 'processing' })

    // Simulate AI processing with enhanced object detection
    const totalFrames = Math.floor(video.duration * 30) // 30 FPS
    const processedFrames = Math.floor(totalFrames * 0.05) // Process every 20th frame for better performance
    
    const detectedObjects: any[] = []
    const objectTracks: { [key: string]: any[] } = {}

    for (let i = 0; i < processedFrames; i++) {
      const progress = Math.floor((i / processedFrames) * 90) // Reserve 10% for final analysis
      updateVideoInDatabase(videoId, { progress })

      // Simulate YOLOv8 detection with higher accuracy
      const detectionProbability = 0.15 // 15% chance per frame
      
      if (Math.random() < detectionProbability) {
        const objectClasses = video.settings.monitoredClasses || ['backpack', 'handbag', 'laptop']
        const randomClass = objectClasses[Math.floor(Math.random() * objectClasses.length)]
        
        // Generate more realistic bounding boxes
        const x = Math.floor(Math.random() * 640) // Assuming 640x480 video
        const y = Math.floor(Math.random() * 480)
        const width = Math.floor(Math.random() * 100) + 50
        const height = Math.floor(Math.random() * 120) + 60
        
        const confidence = Math.max(video.settings.confidenceThreshold, 0.6 + Math.random() * 0.4)
        
        const detectedObject = {
          id: `obj_${videoId}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          class: randomClass,
          confidence,
          bbox: [x, y, width, height],
          firstSeen: i * 20, // Frame number (every 20th frame)
          lastSeen: i * 20,
          timestamp: (i * 20) / 30, // Time in seconds
          isStationary: false,
          stationaryDuration: 0,
          isLost: false,
          frames: [{
            timestamp: i * 20,
            bbox: [x, y, width, height],
            confidence
          }]
        }
        
        detectedObjects.push(detectedObject)
        
        // Group objects for tracking
        const trackKey = `${randomClass}_${Math.floor(x / 100)}_${Math.floor(y / 100)}`
        if (!objectTracks[trackKey]) {
          objectTracks[trackKey] = []
        }
        objectTracks[trackKey].push(detectedObject)
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Update with detected objects
    updateVideoInDatabase(videoId, { 
      detectedObjects,
      progress: 90 
    })

    // Analyze for lost objects
    const lostObjects = await analyzeLostObjectsAdvanced(objectTracks, video.settings)
    
    // Auto-report lost objects if enabled
    if (video.settings.enableAutoReporting && lostObjects.length > 0) {
      for (const lostObject of lostObjects) {
        await reportLostObjectToDatabase(lostObject, video.settings)
      }
    }

    // Final update
    updateVideoInDatabase(videoId, { 
      status: 'completed',
      progress: 100,
      lostObjects
    })

    console.log(`Video analysis completed for ${video.filename}. Found ${lostObjects.length} lost objects.`)

  } catch (error) {
    console.error('Error reprocessing video:', error)
    updateVideoInDatabase(videoId, { status: 'failed' })
  }
}

async function analyzeLostObjectsAdvanced(objectTracks: { [key: string]: any[] }, settings: any) {
  const lostObjects: any[] = []
  const stationaryThreshold = (settings.stationaryThreshold || 5) * 60 // Convert to seconds
  
  for (const [trackKey, track] of Object.entries(objectTracks)) {
    if (track.length < 3) continue // Need at least 3 detections for reliable tracking
    
    // Sort by timestamp
    track.sort((a, b) => a.timestamp - b.timestamp)
    
    const firstDetection = track[0]
    const lastDetection = track[track.length - 1]
    const totalDuration = lastDetection.timestamp - firstDetection.timestamp
    
    // Calculate average position
    const avgX = track.reduce((sum, obj) => sum + obj.bbox[0], 0) / track.length
    const avgY = track.reduce((sum, obj) => sum + obj.bbox[1], 0) / track.length
    
    // Check if object stayed in roughly the same position
    const maxMovement = Math.max(...track.map(obj => 
      Math.sqrt(Math.pow(obj.bbox[0] - avgX, 2) + Math.pow(obj.bbox[1] - avgY, 2))
    ))
    
    // Object is considered stationary if it moved less than proximityThreshold pixels
    const isStationary = maxMovement < (settings.proximityThreshold || 50)
    
    if (isStationary && totalDuration >= stationaryThreshold) {
      const avgConfidence = track.reduce((sum, obj) => sum + obj.confidence, 0) / track.length
      
      const lostObject = {
        id: `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        objectClass: firstDetection.class,
        confidence: avgConfidence,
        location: {
          x: Math.round(avgX),
          y: Math.round(avgY),
          width: Math.round(firstDetection.bbox[2]),
          height: Math.round(firstDetection.bbox[3])
        },
        detectedAt: new Date(Date.now() - (totalDuration * 1000)).toISOString(),
        stationaryDuration: Math.round(totalDuration / 60), // Convert to minutes
        captureFrame: generateMockFrameUrl(),
        description: generateObjectDescription(firstDetection.class, Math.round(totalDuration / 60), settings),
        category: getCategoryFromClass(firstDetection.class),
        reportedToDb: false,
        trackData: {
          totalDetections: track.length,
          maxMovement: Math.round(maxMovement),
          trackDuration: Math.round(totalDuration)
        }
      }
      
      lostObjects.push(lostObject)
    }
  }
  
  return lostObjects
}

function generateObjectDescription(objectClass: string, duration: number, settings: any): string {
  const location = settings.locationName || 'monitored area'
  const camera = settings.cameraInfo || 'security camera'
  
  return `${objectClass} detected as abandoned in ${location} for ${duration} minutes. Captured by ${camera} using AI detection system.`
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
    'keys': 'accessories',
    'wallet': 'accessories'
  }
  return categoryMap[objectClass] || 'other'
}

function generateMockFrameUrl(): string {
  // In real implementation, this would extract and save the actual frame
  return `/api/placeholder/400/300`
}

async function reportLostObjectToDatabase(lostObject: any, settings: any) {
  try {
    // Simulate API call to items endpoint
    const itemData = {
      title: `Lost ${lostObject.objectClass}`,
      description: lostObject.description,
      category: lostObject.category,
      location: settings.locationName || 'Unknown Location',
      status: 'lost',
      images: [lostObject.captureFrame],
      reportedBy: 'AI Detection System',
      metadata: {
        aiDetected: true,
        confidence: Math.round(lostObject.confidence * 100),
        stationaryDuration: lostObject.stationaryDuration,
        detectedAt: lostObject.detectedAt,
        cameraInfo: settings.cameraInfo || 'Unknown Camera',
        trackData: lostObject.trackData
      }
    }
    
    console.log('Auto-reporting lost object:', itemData)
    
    // Mark as reported
    lostObject.reportedToDb = true
    lostObject.itemId = Date.now() + Math.floor(Math.random() * 1000)
    
    return itemData
    
  } catch (error) {
    console.error('Error auto-reporting lost object:', error)
    return null
  }
}