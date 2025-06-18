"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Play, 
  Pause, 
  Square,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Video,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  MapPin,
  Settings,
  Zap,
  Target
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

interface VideoAnalysis {
  id: number
  filename: string
  uploadedAt: string
  status: "uploading" | "queued" | "processing" | "completed" | "failed"
  progress: number
  duration: number
  fileSize: string
  detectedObjects: DetectedObject[]
  lostObjects: LostObject[]
  settings: AnalysisSettings
}

interface DetectedObject {
  id: string
  class: string
  confidence: number
  bbox: [number, number, number, number]
  firstSeen: number
  lastSeen: number
  isStationary: boolean
  stationaryDuration: number
  isLost: boolean
  frames: ObjectFrame[]
}

interface LostObject {
  id: string
  objectClass: string
  confidence: number
  location: {
    x: number
    y: number
    width: number
    height: number
  }
  detectedAt: string
  stationaryDuration: number
  captureFrame: string
  description: string
  category: string
  reportedToDb: boolean
  itemId?: number
}

interface ObjectFrame {
  timestamp: number
  bbox: [number, number, number, number]
  confidence: number
}

interface AnalysisSettings {
  stationaryThreshold: number // minutes
  confidenceThreshold: number
  proximityThreshold: number // pixels
  enableAutoReporting: boolean
  monitoredClasses: string[]
  locationName: string
  cameraInfo: string
}

export default function AIVideoDetection() {
  const [videos, setVideos] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDetectionDetails, setShowDetectionDetails] = useState(false)
  const [globalSettings, setGlobalSettings] = useState<AnalysisSettings>({
    stationaryThreshold: 1, // Changed to 1 minute for faster testing
    confidenceThreshold: 0.6, // Lowered for more detections
    proximityThreshold: 50,
    enableAutoReporting: true,
    monitoredClasses: ["backpack", "handbag", "suitcase", "laptop", "cell phone", "book"],
    locationName: "Test Location",
    cameraInfo: "Test Camera 01"
  })
  const [dragOver, setDragOver] = useState(false)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/ai-detection/videos')
      
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      // Mock data for development
      setVideos([
        {
          id: 1,
          filename: "security_camera_01_2024-06-17.mp4",
          uploadedAt: new Date().toISOString(),
          status: "completed",
          progress: 100,
          duration: 1800, // 30 minutes
          fileSize: "256 MB",
          detectedObjects: [],
          lostObjects: [
            {
              id: "obj_001",
              objectClass: "backpack",
              confidence: 0.89,
              location: { x: 150, y: 200, width: 80, height: 120 },
              detectedAt: new Date(Date.now() - 600000).toISOString(),
              stationaryDuration: 8,
              captureFrame: "/api/placeholder/400/300",
              description: "Blue backpack left unattended near library entrance",
              category: "bags",
              reportedToDb: true,
              itemId: 1001
            },
            {
              id: "obj_002",
              objectClass: "laptop",
              confidence: 0.92,
              location: { x: 300, y: 150, width: 60, height: 40 },
              detectedAt: new Date(Date.now() - 1200000).toISOString(),
              stationaryDuration: 12,
              captureFrame: "/api/placeholder/400/300",
              description: "Silver laptop left on study table",
              category: "electronics",
              reportedToDb: false
            }
          ],
          settings: globalSettings
        },
        {
          id: 2,
          filename: "parking_lot_camera_2024-06-17.mp4",
          uploadedAt: new Date(Date.now() - 3600000).toISOString(),
          status: "processing",
          progress: 65,
          duration: 3600,
          fileSize: "512 MB",
          detectedObjects: [],
          lostObjects: [],
          settings: globalSettings
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchVideos, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleVideoUpload = async (file: File) => {
    try {
      console.log('Starting video upload:', file.name, file.size, file.type)
      setUploading(true)
      const formData = new FormData()
      formData.append('video', file)
      formData.append('settings', JSON.stringify(globalSettings))

      console.log('Sending upload request...')
      const response = await fetch('/api/admin/ai-detection/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      const responseData = await response.json()
      console.log('Upload response data:', responseData)

      if (response.ok) {
        console.log('Upload successful, refreshing video list')
        fetchVideos()
        alert('Video uploaded successfully!')
      } else {
        console.error('Upload failed:', responseData)
        alert(`Upload failed: ${responseData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert(`Upload error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const startAnalysis = async (videoId: number) => {
    try {
      const response = await fetch(`/api/admin/ai-detection/analyze/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: globalSettings }),
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error starting analysis:', error)
    }
  }

  const reportLostObject = async (videoId: number, objectId: string) => {
    try {
      const response = await fetch('/api/admin/ai-detection/report-lost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, objectId }),
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error reporting lost object:', error)
    }
  }

  const handleTestVideo = async () => {
    try {
      console.log('Starting test video processing...')
      setUploading(true)

      const response = await fetch('/api/admin/ai-detection/test-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseData = await response.json()
      console.log('Test video response:', responseData)

      if (response.ok) {
        console.log('Test video processing started successfully')
        fetchVideos()
        alert(`Test video processing started!\n\nSettings:\n- Stationary threshold: ${responseData.testSettings.stationaryThreshold} minute(s)\n- Confidence threshold: ${responseData.testSettings.confidenceThreshold}\n- Auto-reporting: ${responseData.testSettings.enableAutoReporting ? 'Enabled' : 'Disabled'}\n\nCheck the video queue for progress.`)
      } else {
        console.error('Test video failed:', responseData)
        alert(`Test video failed: ${responseData.error}`)
      }
    } catch (error) {
      console.error('Error starting test video:', error)
      alert(`Test video error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      console.log('File dropped:', videoFile.name, videoFile.size, videoFile.type)
      handleVideoUpload(videoFile)
    } else {
      alert('Please drop a video file')
    }
  }

  const deleteVideo = async (videoId: number) => {
    if (confirm('Are you sure you want to delete this video and all its analysis data?')) {
      try {
        const response = await fetch(`/api/admin/ai-detection/videos/${videoId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          fetchVideos()
        }
      } catch (error) {
        console.error('Error deleting video:', error)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploading":
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>
      case "queued":
        return <Badge className="bg-yellow-100 text-yellow-800">Queued</Badge>
      case "processing":
        return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getObjectIcon = (objectClass: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      "backpack": <Target className="h-4 w-4" />,
      "handbag": <Target className="h-4 w-4" />,
      "suitcase": <Target className="h-4 w-4" />,
      "laptop": <Target className="h-4 w-4" />,
      "cell phone": <Target className="h-4 w-4" />,
      "book": <Target className="h-4 w-4" />
    }
    return iconMap[objectClass] || <Target className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Video Detection</h1>
          <p className="text-gray-600">
            Upload videos for automatic lost object detection using AI
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={fetchVideos}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestVideo}
            disabled={uploading}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Video
          </Button>
          <Link href="/admin/ai-detection/preview">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Eye className="h-4 w-4 mr-2" />
              Live Preview
            </Button>
          </Link>
          <div>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={(e) => {
                console.log('File input changed:', e.target.files)
                const file = e.target.files?.[0]
                if (file) {
                  console.log('File selected:', file.name, file.size, file.type)
                  handleVideoUpload(file)
                }
              }}
              className="hidden"
            />
            <Button 
              disabled={uploading}
              onClick={() => {
                console.log('Upload button clicked')
                const fileInput = document.getElementById('video-upload') as HTMLInputElement
                if (fileInput) {
                  console.log('Triggering file input click')
                  fileInput.click()
                } else {
                  console.error('File input not found')
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Video"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {videos.filter(v => v.status === "processing").length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lost Objects Found</p>
                <p className="text-2xl font-bold text-gray-900">
                  {videos.reduce((sum, v) => sum + v.lostObjects.length, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Reported</p>
                <p className="text-2xl font-bold text-gray-900">
                  {videos.reduce((sum, v) => sum + v.lostObjects.filter(o => o.reportedToDb).length, 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag and Drop Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop video files here or click to upload
            </h3>
            <p className="text-gray-600 mb-4">
              Supports MP4, AVI, MOV, and other video formats
            </p>
            <input
              id="video-upload-main"
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => {
                console.log('Main file input changed:', e.target.files)
                const file = e.target.files?.[0]
                if (file) {
                  console.log('File selected from main input:', file.name, file.size, file.type)
                  handleVideoUpload(file)
                }
              }}
              className="hidden"
            />
            <Button 
              disabled={uploading}
              onClick={() => {
                console.log('Main upload area clicked')
                const fileInput = document.getElementById('video-upload-main') as HTMLInputElement
                if (fileInput) {
                  console.log('Triggering main file input click')
                  fileInput.click()
                } else {
                  console.error('Main file input not found')
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Choose Video Files"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>Video Analysis Queue</CardTitle>
          <CardDescription>
            Monitor video processing and detected lost objects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{video.filename}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Duration: {formatDuration(video.duration)}</span>
                        <span>Size: {video.fileSize}</span>
                        <span>Uploaded: {new Date(video.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(video.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVideo(video)
                        setShowDetectionDetails(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {video.status === "completed" || video.status === "failed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startAnalysis(video.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {video.status === "processing" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Processing...</span>
                      <span>{video.progress}%</span>
                    </div>
                    <Progress value={video.progress} />
                  </div>
                )}

                {/* Lost Objects Summary */}
                {video.lostObjects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Detected Lost Objects:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {video.lostObjects.map((obj) => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getObjectIcon(obj.objectClass)}
                            <div>
                              <p className="text-sm font-medium capitalize">{obj.objectClass}</p>
                              <p className="text-xs text-gray-600">
                                Stationary: {obj.stationaryDuration}min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {obj.reportedToDb ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Reported</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => reportLostObject(video.id, obj.id)}
                                className="text-xs px-2 py-1"
                              >
                                Report
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {videos.length === 0 && (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No videos uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload a video to start AI-powered lost object detection
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Detection Settings</DialogTitle>
            <DialogDescription>
              Configure the AI detection parameters for optimal results
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stationaryThreshold">Stationary Threshold (minutes)</Label>
                <Input
                  id="stationaryThreshold"
                  type="number"
                  value={globalSettings.stationaryThreshold}
                  onChange={(e) => setGlobalSettings({
                    ...globalSettings,
                    stationaryThreshold: parseInt(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-600 mt-1">
                  How long an object must remain stationary to be considered lost (1 min = fast testing)
                </p>
              </div>
              
              <div>
                <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={globalSettings.confidenceThreshold}
                  onChange={(e) => setGlobalSettings({
                    ...globalSettings,
                    confidenceThreshold: parseFloat(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum confidence level for object detection (0.0 - 1.0)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proximityThreshold">Proximity Threshold (pixels)</Label>
                <Input
                  id="proximityThreshold"
                  type="number"
                  value={globalSettings.proximityThreshold}
                  onChange={(e) => setGlobalSettings({
                    ...globalSettings,
                    proximityThreshold: parseInt(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Distance threshold for tracking the same object across frames
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableAutoReporting">Auto-Report Lost Objects</Label>
                  <p className="text-sm text-gray-600">
                    Automatically add detected lost objects to the database
                  </p>
                </div>
                <Switch
                  id="enableAutoReporting"
                  checked={globalSettings.enableAutoReporting}
                  onCheckedChange={(checked) => setGlobalSettings({
                    ...globalSettings,
                    enableAutoReporting: checked
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locationName">Default Location Name</Label>
                <Input
                  id="locationName"
                  value={globalSettings.locationName}
                  onChange={(e) => setGlobalSettings({
                    ...globalSettings,
                    locationName: e.target.value
                  })}
                  placeholder="e.g., Main Library"
                />
              </div>

              <div>
                <Label htmlFor="cameraInfo">Camera Information</Label>
                <Input
                  id="cameraInfo"
                  value={globalSettings.cameraInfo}
                  onChange={(e) => setGlobalSettings({
                    ...globalSettings,
                    cameraInfo: e.target.value
                  })}
                  placeholder="e.g., Camera 01 - Entrance"
                />
              </div>
            </div>

            <div>
              <Label>Monitored Object Classes</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["backpack", "handbag", "suitcase", "laptop", "cell phone", "book", "umbrella", "bottle"].map((objClass) => (
                  <div key={objClass} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={objClass}
                      checked={globalSettings.monitoredClasses.includes(objClass)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGlobalSettings({
                            ...globalSettings,
                            monitoredClasses: [...globalSettings.monitoredClasses, objClass]
                          })
                        } else {
                          setGlobalSettings({
                            ...globalSettings,
                            monitoredClasses: globalSettings.monitoredClasses.filter(c => c !== objClass)
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={objClass} className="text-sm capitalize">{objClass}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detection Details Dialog */}
      <Dialog open={showDetectionDetails} onOpenChange={setShowDetectionDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detection Results</DialogTitle>
            <DialogDescription>
              Detailed analysis results for {selectedVideo?.filename}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="space-y-6">
              {/* Video Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedVideo.status)}</div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="text-sm text-gray-900">{formatDuration(selectedVideo.duration)}</p>
                </div>
                <div>
                  <Label>File Size</Label>
                  <p className="text-sm text-gray-900">{selectedVideo.fileSize}</p>
                </div>
              </div>

              {/* Lost Objects Details */}
              {selectedVideo.lostObjects.length > 0 ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Detected Lost Objects</h3>
                  <div className="space-y-4">
                    {selectedVideo.lostObjects.map((obj) => (
                      <div key={obj.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <img 
                              src={obj.captureFrame} 
                              alt={`Detected ${obj.objectClass}`}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium capitalize">{obj.objectClass}</h4>
                              <Badge>Confidence: {Math.round(obj.confidence * 100)}%</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{obj.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Detected at:</span>
                                <br />
                                {new Date(obj.detectedAt).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Stationary duration:</span>
                                <br />
                                {obj.stationaryDuration} minutes
                              </div>
                              <div>
                                <span className="font-medium">Category:</span>
                                <br />
                                <Badge variant="outline">{obj.category}</Badge>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <br />
                                {obj.reportedToDb ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Reported (ID: {obj.itemId})
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Pending Report
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!obj.reportedToDb && (
                              <Button 
                                size="sm" 
                                onClick={() => reportLostObject(selectedVideo.id, obj.id)}
                              >
                                Report as Lost Item
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lost objects detected in this video</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetectionDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}