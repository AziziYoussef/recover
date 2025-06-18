import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// In-memory storage for demo (in production, use database)
let videoDatabase: any[] = []

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return all videos from storage
    return NextResponse.json({ 
      videos: videoDatabase.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    })

  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

// Helper function to add video to database (called from upload route)
export function addVideoToDatabase(video: any) {
  videoDatabase.push(video)
}

// Helper function to update video in database
export function updateVideoInDatabase(videoId: number, updates: any) {
  const index = videoDatabase.findIndex(v => v.id === videoId)
  if (index !== -1) {
    videoDatabase[index] = { ...videoDatabase[index], ...updates }
    return videoDatabase[index]
  }
  return null
}

// Helper function to get video from database
export function getVideoFromDatabase(videoId: number) {
  return videoDatabase.find(v => v.id === videoId)
}

// Helper function to remove video from database
export function removeVideoFromDatabase(videoId: number) {
  const index = videoDatabase.findIndex(v => v.id === videoId)
  if (index !== -1) {
    return videoDatabase.splice(index, 1)[0]
  }
  return null
}