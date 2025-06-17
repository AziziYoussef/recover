import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Map frontend category format to backend format
function mapCategoryToBackend(category: string): string {
  const categoryMap: Record<string, string> = {
    'electronics': 'ELECTRONICS',
    'clothing': 'CLOTHING', 
    'bag': 'BAGS',
    'bags': 'BAGS',
    'accessory': 'ACCESSORIES',
    'accessories': 'ACCESSORIES',
    'document': 'DOCUMENTS',
    'documents': 'DOCUMENTS',
    'keys': 'KEYS',
    'jewelry': 'JEWELRY',
    'books': 'BOOKS',
    'sports': 'SPORTS',
    'other': 'MISCELLANEOUS',
    'miscellaneous': 'MISCELLANEOUS'
  };
  
  return categoryMap[category.toLowerCase()] || category.toUpperCase();
}

// GET /api/lost - Get lost items
export async function GET(request: NextRequest) {
  try {
    // Get search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy');
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '20';
    
    // Normalize category format for backend
    const normalizedCategory = category && category !== 'all' && category !== 'ALL' ? 
      mapCategoryToBackend(category) : null;

    // Build the API URL with query parameters
    let url = `${API_BASE_URL}/api/items/lost?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (normalizedCategory) url += `&category=${encodeURIComponent(normalizedCategory)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;
    if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;

    console.log(`Fetching lost items from backend URL: ${url}`);
    
    // Fetch data from Spring Boot backend
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
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Lost items data received from backend:', data);
    
    return NextResponse.json({
      content: data.items || [],
      totalElements: data.totalItems || 0,
      totalPages: data.totalPages || 0,
      currentPage: data.currentPage || 0,
      hasMore: data.hasMore || false
    });
  } catch (error) {
    console.error('Error fetching lost items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lost items' },
      { status: 500 }
    );
  }
}