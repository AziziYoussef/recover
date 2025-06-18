import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { removeVideoFromDatabase } from '../route'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

export async function DELETE(
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

    // Get video info before deletion
    const video = removeVideoFromDatabase(videoId)
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete the physical file
    try {
      if (video.filepath && existsSync(video.filepath)) {
        await unlink(video.filepath)
      }
    } catch (fileError) {
      console.error('Error deleting video file:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Video deleted successfully',
      deletedVideo: {
        id: video.id,
        filename: video.filename
      }
    })

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}