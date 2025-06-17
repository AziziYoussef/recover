import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface Item {
  id: number
  name: string
  description: string
  category: string
  status: "LOST" | "FOUND" | "CLAIMED" | "RETURNED"
  location: string
  reportedBy: string
  reportedAt: string
  imageUrl?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  isVerified: boolean
  priority: "low" | "medium" | "high"
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const verified = searchParams.get('verified')
    const dateRange = searchParams.get('dateRange')

    // Build query parameters for backend
    const backendParams = new URLSearchParams()
    if (search) backendParams.append('search', search)
    if (status && status !== 'all') backendParams.append('status', status)
    if (category && category !== 'all') backendParams.append('category', category)
    if (verified && verified !== 'all') backendParams.append('verified', verified)
    if (dateRange && dateRange !== 'all') backendParams.append('dateRange', dateRange)

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/items?${backendParams}`)
      
      if (response.ok) {
        const backendData = await response.json()
        // Transform backend data to match frontend interface
        const items: Item[] = backendData.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          status: item.status,
          location: item.location,
          reportedBy: item.reportedBy || item.user?.username || 'Unknown',
          reportedAt: item.reportedAt || item.createdAt,
          imageUrl: item.imageUrl,
          coordinates: item.coordinates ? {
            latitude: item.coordinates.latitude,
            longitude: item.coordinates.longitude
          } : undefined,
          isVerified: item.isVerified || false,
          priority: item.priority || 'medium'
        }))
        
        return NextResponse.json({ items })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock data')
    }

    // Mock data for development/testing
    const mockItems: Item[] = [
      {
        id: 1,
        name: "iPhone 13 Pro",
        description: "Black iPhone 13 Pro with cracked screen protector",
        category: "electronics",
        status: "LOST",
        location: "Library - Second Floor",
        reportedBy: "john.doe@example.com",
        reportedAt: "2024-06-15T14:30:00Z",
        imageUrl: "/api/placeholder/150/150",
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        isVerified: false,
        priority: "high"
      },
      {
        id: 2,
        name: "Blue Backpack",
        description: "Nike blue backpack with laptop compartment",
        category: "bags",
        status: "FOUND",
        location: "Student Center",
        reportedBy: "jane.smith@example.com",
        reportedAt: "2024-06-16T09:15:00Z",
        imageUrl: "/api/placeholder/150/150",
        isVerified: true,
        priority: "medium"
      },
      {
        id: 3,
        name: "Car Keys",
        description: "Toyota car keys with blue keychain",
        category: "keys",
        status: "FOUND",
        location: "Parking Lot B",
        reportedBy: "bob.johnson@example.com",
        reportedAt: "2024-06-16T16:45:00Z",
        coordinates: { latitude: 40.7589, longitude: -73.9851 },
        isVerified: true,
        priority: "high"
      },
      {
        id: 4,
        name: "Gold Watch",
        description: "Vintage gold watch with leather strap",
        category: "jewelry",
        status: "CLAIMED",
        location: "Gym Locker Room",
        reportedBy: "alice.brown@example.com",
        reportedAt: "2024-06-14T11:20:00Z",
        imageUrl: "/api/placeholder/150/150",
        isVerified: true,
        priority: "high"
      },
      {
        id: 5,
        name: "Red Notebook",
        description: "Small red notebook with class notes",
        category: "documents",
        status: "LOST",
        location: "Chemistry Lab",
        reportedBy: "charlie.wilson@example.com",
        reportedAt: "2024-06-17T08:30:00Z",
        isVerified: false,
        priority: "low"
      },
      {
        id: 6,
        name: "Wireless Headphones",
        description: "Sony WH-1000XM4 black headphones",
        category: "electronics",
        status: "RETURNED",
        location: "Music Building",
        reportedBy: "diana.lee@example.com",
        reportedAt: "2024-06-13T13:15:00Z",
        imageUrl: "/api/placeholder/150/150",
        isVerified: true,
        priority: "medium"
      }
    ]

    // Apply filters to mock data
    let filteredItems = mockItems

    if (search) {
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === status)
    }

    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category)
    }

    if (verified && verified !== 'all') {
      const isVerified = verified === 'verified'
      filteredItems = filteredItems.filter(item => item.isVerified === isVerified)
    }

    return NextResponse.json({ items: filteredItems })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

// PUT /api/admin/items/[id] (pour valider un objet)
export async function PUT(request: NextRequest) {
  try {
    // Extraire l'ID de l'objet et le nouveau statut
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const data = await request.json();
    const { status } = data;

    // Vérifier les données requises
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // En production vous devriez implémenter l'authentification ici
    const backendUrl = `${API_BASE_URL}/api/items/${id}`;
    
    // Faire l'appel au backend pour mettre à jour l'objet
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    const updatedItem = await response.json();
    
    // Transformer la réponse au format attendu par le frontend
    const transformedItem = {
      id: updatedItem.id,
      name: updatedItem.name,
      status: updatedItem.status,
      // Autres champs nécessaires
    };
    
    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/items/[id]
export async function DELETE(request: NextRequest) {
  try {
    // Extraire l'ID de l'objet
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing item ID" },
        { status: 400 }
      );
    }

    // En production vous devriez implémenter l'authentification ici
    const backendUrl = `${API_BASE_URL}/api/items/${id}`;
    
    // Faire l'appel au backend pour supprimer l'objet
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
} 