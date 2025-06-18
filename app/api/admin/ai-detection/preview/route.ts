import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoFile = searchParams.get('video') || 'VID_20250615_115540.mp4'
    
    // Path to the video
    const videoPath = join(process.cwd(), 'public', 'uploads', videoFile)
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 })
    }

    // Return video file info and streaming URL
    const fs = await import('fs')
    const stats = fs.statSync(videoPath)
    
    return NextResponse.json({
      success: true,
      video: {
        filename: videoFile,
        size: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: `/uploads/${videoFile}`,
        path: videoPath
      }
    })

  } catch (error) {
    console.error('Error in preview route:', error)
    return NextResponse.json({ error: 'Failed to get video preview' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentTime, settings } = await request.json()
    
    // Simulate real-time detection at current video time
    const mockDetections = generateMockDetections(currentTime, settings)
    
    return NextResponse.json({
      success: true,
      currentTime,
      detections: mockDetections,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Error in real-time detection:', error)
    return NextResponse.json({ error: 'Failed to get detections' }, { status: 500 })
  }
}

function generateMockDetections(currentTime: number, settings: any) {
  const detections = []
  
  // Generate 1-3 random detections based on current time
  const numDetections = Math.floor(Math.random() * 3) + (currentTime % 30 < 10 ? 1 : 0)
  
  for (let i = 0; i < numDetections; i++) {
    const objectClass = settings.monitoredClasses[Math.floor(Math.random() * settings.monitoredClasses.length)]
    const confidence = Math.max(settings.confidenceThreshold, 0.6 + Math.random() * 0.4)
    
    // Create realistic bounding boxes that move slightly over time
    const baseX = 100 + (i * 150) + Math.sin(currentTime / 10) * 20
    const baseY = 100 + Math.cos(currentTime / 8) * 30
    
    const detection = {
      id: `live_${i}_${Math.floor(currentTime)}`,
      class: objectClass,
      confidence,
      bbox: [
        Math.max(0, Math.floor(baseX)),
        Math.max(0, Math.floor(baseY)),
        60 + Math.floor(Math.random() * 40),
        80 + Math.floor(Math.random() * 40)
      ],
      isStationary: currentTime > 30 && Math.random() > 0.7, // Some objects become stationary after 30 seconds
      stationaryDuration: Math.max(0, currentTime - 30) / 60, // Minutes stationary
      isLost: currentTime > 60 && Math.random() > 0.8 // Mark as lost after 1 minute occasionally
    }
    
    detections.push(detection)
  }
  
  return detections
}