import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/admin/items
export async function GET(request: NextRequest) {
  try {
    // Vérifier la session ou authentification
    const session = await getServerSession(authOptions);
    
    // Si nous sommes en production et qu'il n'y a pas de session, retourner une erreur 401
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Pour les besoins de l'application, nous allons utiliser /api/items pour le moment
    // En production, vous devriez implémenter une authentification réelle avec JWT
    const url = `${API_BASE_URL}/api/items`;
    
    console.log(`Admin fetching from backend URL: ${url}`);
    
    // Faire l'appel au backend
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    // Récupérer les données
    const data = await response.json();
    console.log('Data received from backend:', data);
    
    // Transformer les données au format attendu par le frontend admin
    const transformedData = data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      description: item.description,
      location: item.location,
      category: item.category,
      imageUrl: item.imageUrl,
      reportedAt: item.reportedAt,
      reportedByUsername: item.reportedByUsername
    }));
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching admin items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin items' },
      { status: 500 }
    );
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