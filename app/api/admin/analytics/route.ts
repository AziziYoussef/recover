import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Mock analytics data for development
    const analyticsData = {
      userGrowth: [
        { month: "Jan", users: 145, items: 234, resolved: 189 },
        { month: "Feb", users: 178, items: 267, resolved: 201 },
        { month: "Mar", users: 203, items: 291, resolved: 225 },
        { month: "Apr", users: 234, items: 323, resolved: 254 },
        { month: "May", users: 267, items: 356, resolved: 278 },
        { month: "Jun", users: 298, items: 389, resolved: 302 }
      ],
      itemsByCategory: [
        { category: "Electronics", count: 145, percentage: 35, trend: 12 },
        { category: "Clothing", count: 89, percentage: 22, trend: -3 },
        { category: "Bags", count: 67, percentage: 16, trend: 8 },
        { category: "Documents", count: 45, percentage: 11, trend: 5 },
        { category: "Keys", count: 38, percentage: 9, trend: -2 },
        { category: "Other", count: 28, percentage: 7, trend: 1 }
      ],
      itemsByStatus: [
        { status: "Lost", count: 156, percentage: 38, color: "#ef4444" },
        { status: "Found", count: 134, percentage: 33, color: "#22c55e" },
        { status: "Claimed", count: 89, percentage: 22, color: "#3b82f6" },
        { status: "Returned", count: 33, percentage: 8, color: "#8b5cf6" }
      ],
      locationAnalytics: [
        { location: "Library - Main Floor", items: 45, resolved: 38, successRate: 84 },
        { location: "Student Center", items: 32, resolved: 28, successRate: 88 },
        { location: "Gym & Sports Center", items: 28, resolved: 22, successRate: 79 },
        { location: "Cafeteria", items: 24, resolved: 21, successRate: 88 },
        { location: "Parking Lot A", items: 19, resolved: 15, successRate: 79 }
      ],
      timeAnalytics: [
        { hour: 8, reports: 12, claims: 8 },
        { hour: 9, reports: 18, claims: 14 },
        { hour: 10, reports: 25, claims: 19 },
        { hour: 11, reports: 31, claims: 24 },
        { hour: 12, reports: 28, claims: 22 },
        { hour: 13, reports: 34, claims: 26 },
        { hour: 14, reports: 42, claims: 31 },
        { hour: 15, reports: 38, claims: 29 },
        { hour: 16, reports: 29, claims: 23 },
        { hour: 17, reports: 22, claims: 18 },
        { hour: 18, reports: 15, claims: 12 }
      ],
      performanceMetrics: {
        avgResolutionTime: 2.4,
        successRate: 78,
        activeUsers: 1247,
        totalValue: 125000
      },
      trends: [
        { metric: "User Registration", current: 298, previous: 267, change: 12, trend: "up" },
        { metric: "Item Reports", current: 389, previous: 356, change: 9, trend: "up" },
        { metric: "Resolution Rate", current: 78, previous: 72, change: 8, trend: "up" },
        { metric: "Response Time", current: 2.4, previous: 2.8, change: -14, trend: "down" }
      ]
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}