"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Square,
  Eye,
  Settings,
  ArrowLeft,
  Zap,
  Target,
  AlertTriangle,
  Clock
} from "lucide-react"
import Link from "next/link"

interface Detection {
  id: string
  class: string
  confidence: number
  bbox: [number, number, number, number]
  isStationary: boolean
  stationaryDuration: number
  isLost: boolean
}

interface DetectionSettings {
  stationaryThreshold: number
  confidenceThreshold: number
  monitoredClasses: string[]
}

export default function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [detections, setDetections] = useState<Detection[]>([])
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<DetectionSettings>({
    stationaryThreshold: 1, // 1 minute for testing
    confidenceThreshold: 0.6,
    monitoredClasses: ["backpack", "handbag", "suitcase", "laptop", "cell phone", "book"]
  })

  useEffect(() => {
    loadVideo()
  }, [])

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const interval = setInterval(() => {
        if (videoRef.current) {
          const time = videoRef.current.currentTime
          setCurrentTime(time)
          fetchDetections(time)
        }
      }, 500) // Update detections every 500ms

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const loadVideo = async () => {
    try {
      const response = await fetch('/api/admin/ai-detection/preview')
      const data = await response.json()
      
      if (data.success) {
        setVideoInfo(data.video)
        console.log('Video loaded:', data.video)
      } else {
        console.error('Failed to load video:', data.error)
        alert('Failed to load video: ' + data.error)
      }
    } catch (error) {
      console.error('Error loading video:', error)
      alert('Error loading video')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDetections = async (time: number) => {
    try {
      const response = await fetch('/api/admin/ai-detection/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentTime: time,
          settings
        })
      })

      const data = await response.json()
      if (data.success) {
        setDetections(data.detections)
        drawDetections(data.detections)
      }
    } catch (error) {
      console.error('Error fetching detections:', error)
    }
  }

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size to match video
    canvas.width = video.videoWidth || video.clientWidth
    canvas.height = video.videoHeight || video.clientHeight

    // Draw bounding boxes
    detections.forEach(detection => {
      const [x, y, width, height] = detection.bbox
      
      // Scale coordinates to video size
      const scaleX = canvas.width / 640 // Assuming detections are based on 640px width
      const scaleY = canvas.height / 480 // Assuming detections are based on 480px height
      
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Choose color based on object state
      let color = '#22c55e' // Green for normal objects
      let lineWidth = 2
      
      if (detection.isLost) {
        color = '#ef4444' // Red for lost objects
        lineWidth = 3
      } else if (detection.isStationary) {
        color = '#f59e0b' // Orange for stationary objects
        lineWidth = 2
      }

      // Draw bounding box
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Draw label background
      const label = `${detection.class} (${Math.round(detection.confidence * 100)}%)`
      const labelHeight = 20
      ctx.fillStyle = color
      ctx.fillRect(scaledX, scaledY - labelHeight, ctx.measureText(label).width + 10, labelHeight)

      // Draw label text
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.fillText(label, scaledX + 5, scaledY - 5)

      // Draw stationary indicator
      if (detection.isStationary) {
        const stationaryLabel = `Stationary: ${detection.stationaryDuration.toFixed(1)}min`
        ctx.fillStyle = 'rgba(245, 158, 11, 0.8)'
        ctx.fillRect(scaledX, scaledY + scaledHeight, ctx.measureText(stationaryLabel).width + 10, 16)
        ctx.fillStyle = 'white'
        ctx.font = '10px Arial'
        ctx.fillText(stationaryLabel, scaledX + 5, scaledY + scaledHeight + 12)
      }

      // Draw lost indicator
      if (detection.isLost) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'
        ctx.fillRect(scaledX + scaledWidth - 60, scaledY, 60, 16)
        ctx.fillStyle = 'white'
        ctx.font = 'bold 10px Arial'
        ctx.fillText('LOST ITEM', scaledX + scaledWidth - 55, scaledY + 12)
      }
    })
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(false)
      setDetections([])
      // Clear canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
      fetchDetections(time)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDetectionStats = () => {
    const totalDetections = detections.length
    const stationaryCount = detections.filter(d => d.isStationary).length
    const lostCount = detections.filter(d => d.isLost).length
    
    return { totalDetections, stationaryCount, lostCount }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!videoInfo) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Video Not Found</h3>
            <p className="text-gray-600 mb-4">
              Please upload VID_20250615_115540.mp4 to the public/uploads directory
            </p>
            <Link href="/admin/ai-detection">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to AI Detection
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getDetectionStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Detection Preview</h1>
          <p className="text-gray-600">
            Watch AI object detection in real-time with live bounding boxes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/ai-detection">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Video Info */}
      <Card>
        <CardHeader>
          <CardTitle>Video: {videoInfo.filename}</CardTitle>
          <CardDescription>Size: {videoInfo.size}</CardDescription>
        </CardHeader>
      </Card>

      {/* Detection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Time</p>
                <p className="text-xl font-bold text-gray-900">{formatTime(currentTime)}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Objects Detected</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalDetections}</p>
              </div>
              <Target className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stationary</p>
                <p className="text-xl font-bold text-gray-900">{stats.stationaryCount}</p>
              </div>
              <Eye className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lost Items</p>
                <p className="text-xl font-bold text-gray-900">{stats.lostCount}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <video
              ref={videoRef}
              src={videoInfo.url}
              className="w-full h-auto max-h-96 rounded-lg bg-black"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration)
                }
              }}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime)
                }
              }}
              onEnded={() => {
                setIsPlaying(false)
              }}
            />
            
            {/* Detection Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
              style={{ maxHeight: '384px' }}
            />
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" size="sm" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleTimeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Detections */}
      <Card>
        <CardHeader>
          <CardTitle>Current Detections</CardTitle>
          <CardDescription>
            Objects detected at {formatTime(currentTime)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detections.map(detection => (
                <div key={detection.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{detection.class}</span>
                    <Badge variant="outline">
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Position: [{detection.bbox.join(', ')}]</div>
                    {detection.isStationary && (
                      <div className="text-orange-600">
                        Stationary: {detection.stationaryDuration.toFixed(1)} min
                      </div>
                    )}
                    {detection.isLost && (
                      <div className="text-red-600 font-medium">
                        🚨 LOST ITEM DETECTED
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No objects detected at current time
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-green-500"></div>
              <span className="text-sm">Normal Objects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-orange-500"></div>
              <span className="text-sm">Stationary Objects ({settings.stationaryThreshold}+ min)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-red-500"></div>
              <span className="text-sm">Lost Items (Reported)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}