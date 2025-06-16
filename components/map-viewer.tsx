"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

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

// Dynamically import the Map component to avoid SSR issues
const MapWithNoSSRComponent = dynamic(
  () => import('./map-with-no-ssr'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <p>Loading map resources...</p>
      </div>
    )
  }
)

// This component will only be rendered on the client side
const MapViewer = ({ 
  objects, 
  selectedObject, 
  onObjectSelect 
}: { 
  objects: MapObject[]
  selectedObject?: MapObject | null
  onObjectSelect?: (object: MapObject) => void
}) => {
  return (
    <div className="w-full h-full">
      <MapWithNoSSRComponent 
        objects={objects} 
        selectedObject={selectedObject}
        onObjectSelect={onObjectSelect}
      />
    </div>
  )
}

export default MapViewer 