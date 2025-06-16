"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Search, Layers, List } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"

// Import MapViewer component dynamically to avoid SSR issues
const MapViewer = dynamic(() => import("@/components/map-viewer"), { ssr: false })

// Object type that matches our map data
interface MapObject {
  id: number
  name: string
  location: string
  date: string
  image: string
  category: string
  description: string
  reportedBy: string
  status: string
  coordinates: {
    lat: number
    lng: number
    x?: number
    y?: number
  }
}

// Mock data for initial development
const MOCK_OBJECT_LOCATIONS: MapObject[] = [
  {
    id: 1,
    name: "Black Backpack",
    location: "Library, 2nd Floor",
    date: "2025-05-15",
    image: "/placeholder.svg?height=100&width=100",
    category: "bag",
    description: "Black leather backpack with laptop compartment",
    reportedBy: "John Doe",
    status: "LOST",
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
      x: 150,
      y: 120,
    },
  },
  {
    id: 2,
    name: "Blue Smartphone",
    location: "Cafeteria",
    date: "2025-05-16",
    image: "/placeholder.svg?height=100&width=100",
    category: "electronics",
    description: "Blue iPhone 12 with cracked screen",
    reportedBy: "Jane Smith",
    status: "FOUND",
    coordinates: {
      lat: 40.7138,
      lng: -74.013,
      x: 320,
      y: 280,
    },
  },
  {
    id: 3,
    name: "Red Wallet",
    location: "Gym Area",
    date: "2025-05-17",
    image: "/placeholder.svg?height=100&width=100",
    category: "accessory",
    description: "Red leather wallet with ID cards",
    reportedBy: "Mike Johnson",
    status: "LOST",
    coordinates: {
      lat: 40.7148,
      lng: -74.001,
      x: 450,
      y: 380,
    },
  },
]

export default function MapPage() {
  const [objects, setObjects] = useState<MapObject[]>(MOCK_OBJECT_LOCATIONS)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedObject, setSelectedObject] = useState<MapObject | null>(null)
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Fetch both lost and found items from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        // Fetch both lost and found items
        const [lostResponse, foundResponse] = await Promise.all([
          fetch('/api/lost'),
          fetch('/api/found')
        ])
        
        let allItems: any[] = []
        
        if (lostResponse.ok) {
          const lostData = await lostResponse.json()
          const lostItems = lostData.content || []
          allItems = [...allItems, ...lostItems.map((item: any) => ({ ...item, status: 'LOST' }))]
        }
        
        if (foundResponse.ok) {
          const foundData = await foundResponse.json()
          const foundItems = foundData.content || []
          allItems = [...allItems, ...foundItems.map((item: any) => ({ ...item, status: 'FOUND' }))]
        }
        
        // Transform the API data to match the expected format, only include items with valid coordinates
        const transformedObjects = allItems
          .filter((item: any) => item.latitude && item.longitude) // Only include items with valid coordinates
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            location: item.location,
            date: item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : 'N/A',
            image: item.imageUrl || '/placeholder.svg?height=100&width=100',
            category: item.category?.toLowerCase() || 'other',
            description: item.description || '',
            reportedBy: item.reportedByUsername || 'Anonymous',
            status: item.status,
            coordinates: {
              lat: item.latitude,
              lng: item.longitude,
              x: Math.floor(Math.random() * 500), // Keep for backward compatibility
              y: Math.floor(Math.random() * 400)
            }
          }))
        
        setObjects(transformedObjects)
      } catch (error) {
        console.error("Error fetching object locations:", error)
        // Fallback to mock data
        setObjects(MOCK_OBJECT_LOCATIONS)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Filter objects by category, search query, date, and status
  const filteredObjects = objects.filter(obj => {
    const categoryMatch = selectedCategory === "all" || obj.category === selectedCategory
    const statusMatch = statusFilter === "all" || obj.status === statusFilter
    const searchMatch = !searchQuery || 
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Date filtering
    let dateMatch = true
    if (dateFilter !== "all") {
      const objDate = new Date(obj.date)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          dateMatch = objDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateMatch = objDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateMatch = objDate >= monthAgo
          break
      }
    }
    
    return categoryMatch && statusMatch && searchMatch && dateMatch
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Objects Map</h1>
          <p className="text-muted-foreground">Find and locate lost and found items on the interactive map</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Narrow down your search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="LOST">Lost Items</SelectItem>
                      <SelectItem value="FOUND">Found Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bag">Bags</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="accessory">Accessories</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by name, location, description..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatusFilter("all")
                    setSelectedCategory("all")
                    setSearchQuery("")
                    setDateFilter("all")
                    setSelectedObject(null)
                  }}
                >
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">
                    {statusFilter === "LOST" ? "Lost Objects" : 
                     statusFilter === "FOUND" ? "Found Objects" : 
                     "All Objects"} ({filteredObjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : filteredObjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No objects found matching your criteria
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredObjects.map((obj) => (
                        <div
                          key={obj.id}
                          className={`flex items-center p-3 border rounded-md hover:bg-muted transition cursor-pointer ${selectedObject?.id === obj.id ? 'bg-blue-50 border-blue-200' : ''}`}
                          onClick={() => setSelectedObject(obj)}
                        >
                          <div className="w-12 h-12 rounded-md mr-3 overflow-hidden">
                            <img
                              src={obj.image}
                              alt={obj.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{obj.name}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{obj.location}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {obj.status === 'LOST' ? 'Lost' : 'Found'} on: {obj.date}
                            </div>
                            <div className={`text-xs font-medium mt-1 ${obj.status === 'LOST' ? 'text-red-600' : 'text-green-600'}`}>
                              {obj.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Map view */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="map" className="w-full">
              <TabsList>
                <TabsTrigger value="map">
                  <Layers className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="map">
                <Card>
                  <CardContent className="p-0 relative overflow-hidden">
                    <div className="w-full h-[600px]">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Loading map...</p>
                        </div>
                      ) : filteredObjects.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No objects with valid coordinates found matching your criteria</p>
                        </div>
                      ) : (
                        <MapViewer 
                          objects={filteredObjects} 
                          selectedObject={selectedObject}
                          onObjectSelect={setSelectedObject}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="list">
                <Card>
                  <CardContent>
                    <div className="space-y-4 py-4">
                      {filteredObjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No objects found matching your criteria
                        </div>
                      ) : (
                        filteredObjects.map((obj) => (
                          <Card 
                            key={obj.id} 
                            className={`cursor-pointer transition-colors ${selectedObject?.id === obj.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedObject(obj)}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="sm:w-1/4">
                                  <img
                                    src={obj.image}
                                    alt={obj.name}
                                    className="w-full aspect-square object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold">{obj.name}</h3>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{obj.location}</span>
                                    </div>
                                    <p className="text-sm">{obj.status === 'LOST' ? 'Lost' : 'Found'} on: {obj.date}</p>
                                    <p className="text-sm">Reported by: {obj.reportedBy}</p>
                                    <p className="text-sm capitalize">Category: {obj.category}</p>
                                    <p className={`text-sm font-medium ${obj.status === 'LOST' ? 'text-red-600' : 'text-green-600'}`}>Status: {obj.status}</p>
                                    <p className="text-sm text-muted-foreground mt-2">{obj.description}</p>
                                  </div>
                                  <div className="mt-4">
                                    <Button 
                                      size="sm"
                                      variant={selectedObject?.id === obj.id ? "default" : "outline"}
                                    >
                                      {selectedObject?.id === obj.id ? "Selected" : "Select Object"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Selected Object Details Panel */}
        {selectedObject && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Selected Object Details</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedObject(null)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <img
                        src={selectedObject.image}
                        alt={selectedObject.name}
                        className="w-full max-w-xs aspect-square object-cover rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedObject.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground capitalize">{selectedObject.category}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedObject.status === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {selectedObject.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>{selectedObject.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedObject.status === 'LOST' ? 'Lost' : 'Found'} on:</span>
                        <span>{selectedObject.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Reported by:</span>
                        <span>{selectedObject.reportedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Coordinates:</span>
                        <span>{selectedObject.coordinates.lat.toFixed(6)}, {selectedObject.coordinates.lng.toFixed(6)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Description:</h4>
                      <p className="text-muted-foreground">{selectedObject.description}</p>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button>Contact Reporter</Button>
                      <Button variant="outline">Save to Favorites</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
