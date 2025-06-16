import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/admin/items/[id] (pour valider ou mettre à jour un objet)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
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
    
    console.log(`Updating item at: ${backendUrl} with status: ${status}`);
    
    // Faire l'appel au backend pour mettre à jour l'objet
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
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
      description: updatedItem.description,
      category: updatedItem.category,
      location: updatedItem.location,
      imageUrl: updatedItem.imageUrl,
      reportedAt: updatedItem.reportedAt,
      reportedByUsername: updatedItem.reportedByUsername
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing item ID" },
        { status: 400 }
      );
    }

    // En production vous devriez implémenter l'authentification ici
    const backendUrl = `${API_BASE_URL}/api/items/${id}`;
    
    console.log(`Deleting item at: ${backendUrl}`);
    
    // Faire l'appel au backend pour supprimer l'objet
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
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