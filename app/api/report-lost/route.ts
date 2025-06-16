import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// POST /api/report-lost - Report a lost item
export async function POST(request: Request) {
  try {
    // Get session for authentication
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (err) {
      console.warn("Session error:", err)
    }
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.location || !data.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Transform frontend data to backend format
    const backendData = {
      name: data.name,
      description: data.description || '',
      category: mapCategoryToBackend(data.category),
      type: 'LOST',
      status: 'LOST',
      location: data.location,
      imageUrl: data.image || null,
      latitude: data.coordinates?.lat || null,
      longitude: data.coordinates?.lng || null
    }

    console.log('Forwarding lost item to Spring Boot backend:', backendData)

    // Forward to Spring Boot backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add JWT token if available
        ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` })
      },
      body: JSON.stringify(backendData)
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error(`Backend responded with status: ${backendResponse.status}`, errorText)
      return NextResponse.json(
        { error: `Failed to create item: ${errorText}` },
        { status: backendResponse.status }
      )
    }

    const backendResult = await backendResponse.json()
    console.log('Backend response:', backendResult)

    return NextResponse.json(
      { message: "Lost item reported successfully", object: backendResult },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating lost item:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

// Helper function to map frontend categories to backend enums
function mapCategoryToBackend(frontendCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    'bag': 'BAGS',
    'electronics': 'ELECTRONICS', 
    'accessory': 'ACCESSORIES',
    'clothing': 'CLOTHING',
    'document': 'DOCUMENTS',
    'other': 'MISCELLANEOUS'
  }
  
  return categoryMap[frontendCategory?.toLowerCase()] || 'MISCELLANEOUS'
}