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

// Mock data for initial development
const MOCK_OBJECT_LOCATIONS = [
  {
    id: 1,
    name: "Black Backpack",
    location: "Library, 2nd Floor",
    date: "2025-05-15",
    image: "/placeholder.svg?height=100&width=100",
    category: "bag",
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
    coordinates: {
      lat: 40.7148,
      lng: -74.001,
      x: 450,
      y: 380,
    },
  },
]

export default function MapPage() {
  const [objects, setObjects] = useState(MOCK_OBJECT_LOCATIONS)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch found items from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/found')
        if (response.ok) {
          const data = await response.json()
          // Transform the API data to match the expected format
          const transformedObjects = data.content.map((item: any) => ({
            id: item.id,
            name: item.name,
            location: item.location,
            date: item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : 'N/A',
            image: item.imageUrl || '/placeholder.svg?height=100&width=100',
            category: item.category?.toLowerCase() || 'other',
            coordinates: {
              lat: item.latitude || 40.7128,
              lng: item.longitude || -74.006,
              x: Math.floor(Math.random() * 500), // Keep for backward compatibility
              y: Math.floor(Math.random() * 400)
            }
          }))
          setObjects(transformedObjects)
        } else {
          console.error('Failed to fetch found items')
          // Fallback to mock data
          setObjects(MOCK_OBJECT_LOCATIONS)
        }
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
  
  // Filter objects by category and search query
  const filteredObjects = objects.filter(obj => {
    const categoryMatch = selectedCategory === "all" || obj.category === selectedCategory
    const searchMatch = !searchQuery || 
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    return categoryMatch && searchMatch
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Lost Object Map</h1>
          <p className="text-muted-foreground">Locate and track lost items on the map</p>
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
                      placeholder="Search by name or location"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchQuery("")
                  }}
                >
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Found Objects ({filteredObjects.length})</CardTitle>
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
                          className="flex items-center p-2 border rounded-md hover:bg-muted transition cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-md mr-3 overflow-hidden">
                            <img
                              src={obj.image}
                              alt={obj.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{obj.name}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {obj.location}
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
                      {!loading && (
                        <MapViewer objects={filteredObjects} />
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
                          <Card key={obj.id}>
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
                                    <p className="text-sm">Found on: {obj.date}</p>
                                    <p className="text-sm capitalize">Category: {obj.category}</p>
                                  </div>
                                  <div className="mt-4">
                                    <Button size="sm">View Details</Button>
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
      </div>
    </div>
  )
}
