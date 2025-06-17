import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/items/[id] - Get item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching item details for ID: ${id}`);
    
    // Fetch data from Spring Boot backend
    const response = await fetch(`${API_BASE_URL}/api/items/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }
      console.error(`API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Item details received from backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching item details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item details' },
      { status: 500 }
    );
  }
}