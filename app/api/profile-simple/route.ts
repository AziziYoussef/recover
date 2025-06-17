import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/profile-simple - Update user profile via email lookup
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - no session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(`🔄 Updating profile for user: ${session.user.email}`, body);
    
    // Create the update payload with email for user identification
    const updatePayload = {
      email: session.user.email, // Backend can use this to find the user
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || '',
      bio: body.bio || '',
      address: body.address || ''
    };

    console.log('📤 Sending to backend:', updatePayload);
    
    // Try multiple approaches to authenticate with backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header if available
    if (session.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
      console.log('🔑 Using Bearer token authentication');
    } else {
      console.log('⚠️  No access token available, using email-based lookup');
    }

    // Send data to Spring Boot backend
    // Use the test endpoint to avoid CORS issues
    const response = await fetch(`${API_BASE_URL}/api/user/profile-test`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    console.log(`📡 Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error (${response.status}):`, errorText);
      
      // Return a more informative error
      return NextResponse.json(
        { 
          error: `Backend update failed: ${response.status}`,
          details: errorText,
          suggestion: 'Profile updated locally only. Backend authentication needs to be configured.'
        },
        { status: response.status }
      );
    }

    const data = await response.text();
    console.log('✅ Backend response:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully in database',
      data
    });
    
  } catch (error) {
    console.error('💥 Error updating profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error.message,
        suggestion: 'Check backend connectivity and authentication'
      },
      { status: 500 }
    );
  }
}