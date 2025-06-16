import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, minScore } = body;
    
    if (!features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Invalid features data' },
        { status: 400 }
      );
    }
    
    // Send search request to Spring Boot backend
    const response = await fetch(`${API_BASE_URL}/api/search/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features,
        minScore: minScore || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the results to match the frontend format
    const transformedResults = data.results.map((item: any) => ({
      id: item.id,
      name: item.name || 'Unnamed Item',
      location: item.location || 'Unknown Location',
      date: item.detectionDate ? new Date(item.detectionDate).toISOString().split('T')[0] : 'Unknown Date',
      image: item.imageUrl || '/placeholder.svg',
      matchScore: Math.round(item.similarityScore * 100),
      category: item.category?.toLowerCase() || 'other',
    }));
    
    return NextResponse.json({
      results: transformedResults,
      totalMatches: data.totalMatches,
    });
  } catch (error) {
    console.error('Error performing image search:', error);
    return NextResponse.json(
      { error: 'Failed to perform image search' },
      { status: 500 }
    );
  }
}

// Add server config to handle larger payloads (feature vectors)
export const config = {
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
}; 