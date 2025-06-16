"use client"

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'

// Fix the default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
})

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

export interface MapWithNoSSRProps {
  objects: MapObject[]
  selectedObject?: MapObject | null
  onObjectSelect?: (object: MapObject) => void
}

const MapWithNoSSR = ({ objects, selectedObject, onObjectSelect }: MapWithNoSSRProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 9)}`);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Initialize map once component is mounted
  useEffect(() => {
    // Safety check - if already initialized, clean up first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setIsMapInitialized(false);
    }

    // Only initialize if the container is available
    if (!mapContainerRef.current || isMapInitialized) return;

    try {
      // Create the map instance  
      const map = L.map(mapContainerRef.current, {
        center: [40.7128, -74.006],
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: true
      });

      // Add the tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Clear existing markers
      markersRef.current.clear();

      // Add markers
      objects.forEach((obj) => {
        // Use different colors for lost vs found items
        const isLost = obj.status === 'LOST'
        const markerIcon = L.icon({
          iconUrl: isLost ? 
            'data:image/svg+xml;base64,' + btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.4 3.4 10.1 8.2 11.9L12.5 41l4.3-16.6c4.8-1.8 8.2-6.5 8.2-11.9C25 5.6 19.4 0 12.5 0z" fill="#dc2626"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `) :
            'data:image/svg+xml;base64,' + btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.4 3.4 10.1 8.2 11.9L12.5 41l4.3-16.6c4.8-1.8 8.2-6.5 8.2-11.9C25 5.6 19.4 0 12.5 0z" fill="#16a34a"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `),
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })

        const marker = L.marker([obj.coordinates.lat, obj.coordinates.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div class="flex flex-col items-center p-2 min-w-[200px]">
              <img 
                src="${obj.image}" 
                alt="${obj.name}"
                class="w-20 h-20 object-cover my-2 rounded" 
              />
              <h4 class="font-medium text-center">${obj.name}</h4>
              <div class="text-xs text-gray-600 text-center">${obj.location}</div>
              <div class="text-xs text-gray-500 text-center">${obj.status === 'LOST' ? 'Lost' : 'Found'} on: ${obj.date}</div>
              <div class="text-xs text-gray-500 text-center">Reported by: ${obj.reportedBy}</div>
              <div class="text-xs font-medium text-center ${obj.status === 'LOST' ? 'text-red-600' : 'text-green-600'}">${obj.status}</div>
              <div class="text-xs text-gray-600 text-center mt-1 max-w-[180px]">${obj.description}</div>
            </div>
          `);

        // Add click handler for marker selection
        marker.on('click', () => {
          if (onObjectSelect) {
            onObjectSelect(obj);
          }
        });

        // Store marker reference
        markersRef.current.set(obj.id, marker);
      });

      // Save the map instance to ref
      mapRef.current = map;
      setIsMapInitialized(true);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [objects, mapId]);

  // Handle selected object highlighting
  useEffect(() => {
    if (!mapRef.current || !isMapInitialized) return;

    // Reset all markers to their status-based colors
    objects.forEach((obj) => {
      const marker = markersRef.current.get(obj.id);
      if (marker) {
        const isLost = obj.status === 'LOST'
        const isSelected = selectedObject?.id === obj.id
        
        marker.setIcon(L.icon({
          iconUrl: isSelected ? 
            'data:image/svg+xml;base64,' + btoa(`
              <svg width="30" height="49" viewBox="0 0 30 49" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 6.5 4.1 12.1 9.8 14.3L15 49l5.2-19.7C25.9 27.1 30 21.5 30 15C30 6.7 23.3 0 15 0z" fill="#1f2937" stroke="#fff" stroke-width="2"/>
                <circle cx="15" cy="15" r="8" fill="${isLost ? '#dc2626' : '#16a34a'}"/>
              </svg>
            `) :
            (isLost ? 
              'data:image/svg+xml;base64,' + btoa(`
                <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.4 3.4 10.1 8.2 11.9L12.5 41l4.3-16.6c4.8-1.8 8.2-6.5 8.2-11.9C25 5.6 19.4 0 12.5 0z" fill="#dc2626"/>
                  <circle cx="12.5" cy="12.5" r="6" fill="white"/>
                </svg>
              `) :
              'data:image/svg+xml;base64,' + btoa(`
                <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.4 3.4 10.1 8.2 11.9L12.5 41l4.3-16.6c4.8-1.8 8.2-6.5 8.2-11.9C25 5.6 19.4 0 12.5 0z" fill="#16a34a"/>
                  <circle cx="12.5" cy="12.5" r="6" fill="white"/>
                </svg>
              `)),
          iconSize: isSelected ? [30, 49] : [25, 41],
          iconAnchor: isSelected ? [15, 49] : [12, 41],
          popupAnchor: [1, -34]
        }));
      }
    });

    // Center map on selected object and open popup
    if (selectedObject && markersRef.current.has(selectedObject.id)) {
      const selectedMarker = markersRef.current.get(selectedObject.id);
      if (selectedMarker) {
        mapRef.current.setView([selectedObject.coordinates.lat, selectedObject.coordinates.lng], 16);
        selectedMarker.openPopup();
      }
    }
  }, [selectedObject, isMapInitialized, objects]);

  return (
    <div className="w-full h-full">
      <div 
        id={mapId}
        ref={mapContainerRef} 
        className="h-[600px] w-full" 
        style={{ height: "600px", width: "100%" }}
      />
    </div>
  );
}

export default MapWithNoSSR 