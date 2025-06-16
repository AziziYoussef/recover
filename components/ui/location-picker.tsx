"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search, Target, X } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet to avoid SSR issues
const L = typeof window !== 'undefined' ? require('leaflet') : null

interface Location {
  latitude: number
  longitude: number
  address: string
}

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void
  initialLocation?: Location
  placeholder?: string
}

const LocationPicker = ({ onLocationSelect, initialLocation, placeholder = "Cliquez sur la carte pour sélectionner un lieu" }: LocationPickerProps) => {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return

    // Fix Leaflet icon issues
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: '/marker-icon.png',
      iconRetinaUrl: '/marker-icon-2x.png',
      shadowUrl: '/marker-shadow.png',
    })

    try {
      // Default center (you can change this to your preferred location)
      const defaultCenter = initialLocation 
        ? [initialLocation.latitude, initialLocation.longitude]
        : [48.8566, 2.3522] // Paris center

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        scrollWheelZoom: true
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add initial marker if location exists
      if (initialLocation) {
        markerRef.current = L.marker([initialLocation.latitude, initialLocation.longitude])
          .addTo(map)
          .bindPopup(initialLocation.address)
      }

      // Handle map clicks
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(map)

        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          )
          const data = await response.json()
          
          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          
          const location: Location = {
            latitude: lat,
            longitude: lng,
            address: address
          }

          setSelectedLocation(location)
          onLocationSelect(location)

          // Update marker popup
          markerRef.current.bindPopup(address).openPopup()
        } catch (error) {
          console.error('Error getting address:', error)
          const location: Location = {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }
          setSelectedLocation(location)
          onLocationSelect(location)
        }
      })

      mapRef.current = map
      setIsLoadingMap(false)

    } catch (error) {
      console.error('Error initializing map:', error)
      setIsLoadingMap(false)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapRef.current) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()

      if (data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        // Center map on search result
        mapRef.current.setView([lat, lng], 15)

        // Remove existing marker
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current)
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)

        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: result.display_name
        }

        setSelectedLocation(location)
        onLocationSelect(location)

        // Update marker popup
        markerRef.current.bindPopup(result.display_name).openPopup()
      }
    } catch (error) {
      console.error('Error searching location:', error)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15)

            // Remove existing marker
            if (markerRef.current) {
              mapRef.current.removeLayer(markerRef.current)
            }

            // Add new marker
            markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)

            // Get address
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
              )
              const data = await response.json()
              
              const location: Location = {
                latitude: lat,
                longitude: lng,
                address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              }

              setSelectedLocation(location)
              onLocationSelect(location)

              markerRef.current.bindPopup(location.address).openPopup()
            } catch (error) {
              console.error('Error getting address:', error)
            }
          }
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsGettingLocation(false)
        }
      )
    } else {
      console.error('Geolocation is not supported')
      setIsGettingLocation(false)
    }
  }

  // Clear selection
  const clearSelection = () => {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }
    setSelectedLocation(null)
    onLocationSelect({
      latitude: 0,
      longitude: 0,
      address: ''
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Sélectionner le lieu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and controls */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            onClick={getCurrentLocation} 
            variant="outline" 
            size="icon"
            disabled={isGettingLocation}
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected location display */}
        {selectedLocation && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-600">Lieu sélectionné :</p>
              <p className="text-sm text-muted-foreground break-words">{selectedLocation.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
            <Button onClick={clearSelection} variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Map container */}
        <div className="relative">
          <div 
            ref={mapContainerRef}
            className="h-[300px] w-full rounded-md border"
            style={{ height: "300px" }}
          />
          
          {isLoadingMap && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
            </div>
          )}
          
          {!selectedLocation && !isLoadingMap && (
            <div className="absolute top-2 left-2 right-2 bg-white/90 p-2 rounded shadow-sm">
              <p className="text-xs text-center text-muted-foreground">
                {placeholder}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Cliquez sur la carte pour sélectionner un lieu</p>
          <p>• Utilisez la recherche pour trouver une adresse spécifique</p>
          <p>• Cliquez sur la cible pour utiliser votre position actuelle</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default LocationPicker