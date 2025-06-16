import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Get the time range from query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'week';

    // Fetch all dashboard data in parallel
    const [stats, recentDetections, categoryDistribution, recoveryRate] = await Promise.all([
      // Get overall statistics
      fetch(`${API_BASE_URL}/api/dashboard/stats?timeRange=${timeRange}`).then(res => res.json()),
      
      // Get recent detections
      fetch(`${API_BASE_URL}/api/detection/recent?limit=5`).then(res => res.json()),
      
      // Get category distribution
      fetch(`${API_BASE_URL}/api/dashboard/categories`).then(res => res.json()),
      
      // Get recovery rate over time
      fetch(`${API_BASE_URL}/api/dashboard/recovery-rate?timeRange=${timeRange}`).then(res => res.json())
    ]);

    // Transform the data to match the frontend format
    const transformedData = {
      stats: {
        totalDetections: stats.totalDetections,
        detectionChange: stats.detectionChange,
        recoveryRate: stats.recoveryRate,
        recoveryChange: stats.recoveryChange,
        activeUsers: stats.activeUsers,
        userChange: stats.userChange,
      },
      recentDetections: recentDetections.map((detection: any) => ({
        id: detection.id,
        name: detection.name || 'Unnamed Item',
        location: detection.location || 'Unknown Location',
        timestamp: detection.detectionDate,
        image: detection.imageUrl || '/placeholder.svg',
        confidence: Math.round(detection.confidence * 100),
      })),
      categoryDistribution: categoryDistribution.map((cat: any) => ({
        name: cat.name,
        value: cat.count,
      })),
      recoveryRate: recoveryRate.map((rate: any) => ({
        name: rate.month,
        rate: rate.percentage,
      })),
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 