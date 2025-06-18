import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getVideoFromDatabase, updateVideoInDatabase } from '../videos/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, objectId } = await request.json()

    if (!videoId || !objectId) {
      return NextResponse.json({ error: 'Video ID and Object ID are required' }, { status: 400 })
    }

    const video = getVideoFromDatabase(videoId)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Find the lost object
    const lostObjectIndex = video.lostObjects.findIndex((obj: any) => obj.id === objectId)
    if (lostObjectIndex === -1) {
      return NextResponse.json({ error: 'Lost object not found' }, { status: 404 })
    }

    const lostObject = video.lostObjects[lostObjectIndex]
    
    if (lostObject.reportedToDb) {
      return NextResponse.json({ error: 'Object already reported' }, { status: 400 })
    }

    // Report to database
    const reportResult = await reportLostObjectToItemsDatabase(lostObject, video.settings, session.user)
    
    if (reportResult.success) {
      // Update the lost object status
      video.lostObjects[lostObjectIndex] = {
        ...lostObject,
        reportedToDb: true,
        itemId: reportResult.itemId,
        reportedAt: new Date().toISOString(),
        reportedBy: session.user?.name || session.user?.email
      }
      
      // Update video in database
      updateVideoInDatabase(videoId, { lostObjects: video.lostObjects })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Lost object reported successfully',
        itemId: reportResult.itemId,
        lostObject: video.lostObjects[lostObjectIndex]
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to report lost object to database',
        details: reportResult.error 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error reporting lost object:', error)
    return NextResponse.json({ error: 'Failed to report lost object' }, { status: 500 })
  }
}

async function reportLostObjectToItemsDatabase(lostObject: any, settings: any, user: any) {
  try {
    // Prepare item data for the items database
    const itemData = {
      title: `Lost ${capitalizeFirst(lostObject.objectClass)}`,
      description: generateDetailedDescription(lostObject, settings),
      category: lostObject.category,
      location: settings.locationName || 'AI Detected Location',
      status: 'lost',
      images: [lostObject.captureFrame],
      reportedBy: 'AI Detection System',
      contactInfo: user?.email || 'admin@system.com',
      metadata: {
        aiDetected: true,
        confidence: Math.round(lostObject.confidence * 100),
        stationaryDuration: lostObject.stationaryDuration,
        detectedAt: lostObject.detectedAt,
        cameraInfo: settings.cameraInfo || 'Security Camera',
        location: {
          coordinates: lostObject.location,
          description: settings.locationName
        },
        trackingData: lostObject.trackData || {},
        autoReported: true,
        originalVideoId: lostObject.id.split('_')[1] // Extract video ID from object ID
      },
      tags: generateTagsFromObject(lostObject),
      estimatedValue: estimateObjectValue(lostObject.objectClass),
      urgency: calculateUrgency(lostObject),
      aiAnalysis: {
        objectClass: lostObject.objectClass,
        confidence: lostObject.confidence,
        boundingBox: lostObject.location,
        detectionTimestamp: lostObject.detectedAt,
        stationaryDuration: lostObject.stationaryDuration
      }
    }

    // In a real implementation, this would make an API call to your items service
    // For now, simulate the database insertion
    console.log('Reporting lost object to items database:', itemData)
    
    // Simulate API response
    const itemId = Date.now() + Math.floor(Math.random() * 1000)
    
    // In production, you would do:
    // const response = await fetch('/api/items', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(itemData)
    // })
    // const result = await response.json()
    
    return {
      success: true,
      itemId,
      itemData
    }

  } catch (error) {
    console.error('Error reporting to items database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function generateDetailedDescription(lostObject: any, settings: any): string {
  const baseDescription = `AI-detected abandoned ${lostObject.objectClass}`
  const location = settings.locationName ? ` at ${settings.locationName}` : ''
  const duration = ` (stationary for ${lostObject.stationaryDuration} minutes)`
  const confidence = ` with ${Math.round(lostObject.confidence * 100)}% confidence`
  const camera = settings.cameraInfo ? `. Detected by ${settings.cameraInfo}` : ''
  const timestamp = `. Detection time: ${new Date(lostObject.detectedAt).toLocaleString()}`
  
  return baseDescription + location + duration + confidence + camera + timestamp
}

function generateTagsFromObject(lostObject: any): string[] {
  const baseTags = ['ai-detected', 'abandoned', lostObject.category]
  
  // Add object-specific tags
  const objectTags: { [key: string]: string[] } = {
    'laptop': ['electronics', 'computer', 'valuable'],
    'backpack': ['bag', 'student', 'travel'],
    'handbag': ['bag', 'personal', 'accessories'],
    'cell phone': ['electronics', 'mobile', 'personal', 'valuable'],
    'book': ['education', 'reading', 'paper'],
    'suitcase': ['luggage', 'travel', 'large'],
    'umbrella': ['weather', 'accessory'],
    'bottle': ['drink', 'container']
  }
  
  if (objectTags[lostObject.objectClass]) {
    baseTags.push(...objectTags[lostObject.objectClass])
  }
  
  // Add duration-based tags
  if (lostObject.stationaryDuration > 30) {
    baseTags.push('long-abandoned')
  } else if (lostObject.stationaryDuration > 10) {
    baseTags.push('medium-abandoned')
  } else {
    baseTags.push('recently-abandoned')
  }
  
  // Add confidence-based tags
  if (lostObject.confidence > 0.9) {
    baseTags.push('high-confidence')
  } else if (lostObject.confidence > 0.7) {
    baseTags.push('medium-confidence')
  }
  
  return [...new Set(baseTags)] // Remove duplicates
}

function estimateObjectValue(objectClass: string): number {
  const valueEstimates: { [key: string]: number } = {
    'laptop': 800,
    'cell phone': 400,
    'backpack': 50,
    'handbag': 100,
    'suitcase': 150,
    'book': 20,
    'umbrella': 25,
    'bottle': 10
  }
  
  return valueEstimates[objectClass] || 25
}

function calculateUrgency(lostObject: any): 'low' | 'medium' | 'high' {
  const highValueItems = ['laptop', 'cell phone']
  const longAbandoned = lostObject.stationaryDuration > 60 // More than 1 hour
  
  if (highValueItems.includes(lostObject.objectClass)) {
    return 'high'
  }
  
  if (longAbandoned) {
    return 'medium'
  }
  
  return 'low'
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}