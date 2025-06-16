"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CameraIcon, Play, Pause, RotateCw, Download, Maximize2, Settings, AlertCircle } from "lucide-react"
import Image from "next/image"

// Mock detection results
const MOCK_DETECTIONS = [
  {
    id: 1,
    objectType: "Backpack",
    confidence: 98.2,
    status: "abandoned",
    timeDetected: "10:15:32",
    boundingBox: { x: 120, y: 150, width: 100, height: 120 },
  },
  {
    id: 2,
    objectType: "Smartphone",
    confidence: 95.7,
    status: "moving",
    timeDetected: "10:15:35",
    boundingBox: { x: 320, y: 220, width: 40, height: 80 },
  },
  {
    id: 3,
    objectType: "Laptop",
    confidence: 97.1,
    status: "stationary",
    timeDetected: "10:15:40",
    boundingBox: { x: 450, y: 180, width: 120, height: 80 },
  },
]

export default function DetectionPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState([80])
  const [detectionMode, setDetectionMode] = useState("real-time")
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [detections, setDetections] = useState(MOCK_DETECTIONS)
  const [selectedDetection, setSelectedDetection] = useState(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)

  // Simulate video feed and detection
  useEffect(() => {
    let animationId
    let frameCount = 0

    const drawVideoFrame = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")

      if (ctx && isPlaying) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw mock video frame (gray background)
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw some mock scene elements
        ctx.fillStyle = "#d1d5db"
        ctx.fillRect(50, 150, 200, 100) // Table
        ctx.fillRect(400, 100, 150, 80) // Shelf
        ctx.fillRect(300, 300, 180, 60) // Bench

        // Draw detected objects with bounding boxes
        if (showBoundingBoxes) {
          detections.forEach((detection) => {
            const { x, y, width, height } = detection.boundingBox
            const isSelected = selectedDetection?.id === detection.id

            // Draw bounding box
            ctx.strokeStyle =
              detection.status === "abandoned"
                ? "#ef4444" // Red for abandoned
                : detection.status === "stationary"
                  ? "#f59e0b" // Amber for stationary
                  : "#22c55e" // Green for moving
            ctx.lineWidth = isSelected ? 3 : 2
            ctx.strokeRect(x, y, width, height)

            // Draw semi-transparent background for label
            if (showLabels) {
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
              ctx.fillRect(x, y - 20, width, 20)

              // Draw label text
              ctx.fillStyle = "#ffffff"
              ctx.font = "12px sans-serif"
              ctx.fillText(`${detection.objectType} (${detection.confidence.toFixed(1)}%)`, x + 5, y - 5)
            }
          })
        }

        // Simulate object movement for the "moving" object
        if (frameCount % 5 === 0) {
          setDetections((prev) =>
            prev.map((det) => {
              if (det.status === "moving") {
                return {
                  ...det,
                  boundingBox: {
                    ...det.boundingBox,
                    x: det.boundingBox.x + (Math.random() > 0.5 ? 1 : -1) * 2,
                    y: det.boundingBox.y + (Math.random() > 0.5 ? 1 : -1) * 2,
                  },
                }
              }
              return det
            }),
          )
        }

        frameCount++
      }

      animationId = requestAnimationFrame(drawVideoFrame)
    }

    drawVideoFrame()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isPlaying, detections, showBoundingBoxes, showLabels, selectedDetection])

  const handleDetectionClick = (detection) => {
    setSelectedDetection(detection)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Object Detection System</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and detection of abandoned objects using computer vision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Video Feed</CardTitle>
                    <CardDescription>Camera 1 - Main Hall</CardDescription>
                  </div>
                  <Badge variant={isPlaying ? "default" : "outline"} className="ml-auto">
                    {isPlaying ? "LIVE" : "PAUSED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    className="w-full h-full"
                    onClick={(e) => {
                      const canvas = canvasRef.current
                      const rect = canvas.getBoundingClientRect()
                      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
                      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

                      // Check if click is inside any bounding box
                      const clicked = detections.find((det) => {
                        const { x: bx, y: by, width, height } = det.boundingBox
                        return x >= bx && x <= bx + width && y >= by && y <= by + height
                      })

                      if (clicked) {
                        handleDetectionClick(clicked)
                      } else {
                        setSelectedDetection(null)
                      }
                    }}
                  />
                  <video ref={videoRef} className="hidden" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Refresh">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Fullscreen">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <Select defaultValue="camera1">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera1">Camera 1 - Main Hall</SelectItem>
                    <SelectItem value="camera2">Camera 2 - Library</SelectItem>
                    <SelectItem value="camera3">Camera 3 - Cafeteria</SelectItem>
                    <SelectItem value="camera4">Camera 4 - Entrance</SelectItem>
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Settings</CardTitle>
                <CardDescription>Configure detection parameters and visualization options</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="real-time" value={detectionMode} onValueChange={setDetectionMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="real-time">Real-time Detection</TabsTrigger>
                    <TabsTrigger value="recorded">Recorded Footage</TabsTrigger>
                  </TabsList>
                  <TabsContent value="real-time" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Confidence Threshold (%)</Label>
                        <span>{confidenceThreshold}%</span>
                      </div>
                      <Slider
                        value={confidenceThreshold}
                        onValueChange={setConfidenceThreshold}
                        min={50}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="bounding-boxes"
                          checked={showBoundingBoxes}
                          onCheckedChange={setShowBoundingBoxes}
                        />
                        <Label htmlFor="bounding-boxes">Show Bounding Boxes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
                        <Label htmlFor="labels">Show Labels</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="tracking" defaultChecked />
                        <Label htmlFor="tracking">Enable Object Tracking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="abandoned" defaultChecked />
                        <Label htmlFor="abandoned">Detect Abandoned Objects</Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Objects are considered abandoned after being stationary for 30 seconds
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="recorded" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">Upload recorded footage to analyze for lost objects</p>
                    <Button variant="outline" className="w-full">
                      <CameraIcon className="mr-2 h-4 w-4" />
                      Upload Video File
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Results</CardTitle>
                <CardDescription>Objects detected in the current frame</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detections.length > 0 ? (
                    detections.map((detection) => (
                      <div
                        key={detection.id}
                        className={`p-3 rounded-lg border ${
                          selectedDetection?.id === detection.id ? "border-primary bg-primary/5" : ""
                        } ${
                          detection.status === "abandoned"
                            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                            : detection.status === "stationary"
                              ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                              : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                        } cursor-pointer`}
                        onClick={() => handleDetectionClick(detection)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{detection.objectType}</div>
                            <div className="text-xs text-muted-foreground">Detected at {detection.timeDetected}</div>
                          </div>
                          <Badge
                            variant={
                              detection.status === "abandoned"
                                ? "destructive"
                                : detection.status === "stationary"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {detection.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm">
                            Confidence: <span className="font-medium">{detection.confidence.toFixed(1)}%</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CameraIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No objects detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Detections
                </Button>
              </CardFooter>
            </Card>

            {selectedDetection && (
              <Card>
                <CardHeader>
                  <CardTitle>Object Details</CardTitle>
                  <CardDescription>Information about the selected object</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src="/placeholder.svg?height=200&width=300"
                          width={300}
                          height={200}
                          alt="Object thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Object Type</p>
                        <p className="font-medium">{selectedDetection.objectType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{selectedDetection.status}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Confidence</p>
                        <p className="font-medium">{selectedDetection.confidence.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Time Detected</p>
                        <p className="font-medium">{selectedDetection.timeDetected}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Save Image
                      </Button>
                      <Button size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Process Object
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
