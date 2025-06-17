import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface DashboardStats {
  totalUsers: number
  totalItems: number
  totalLost: number
  totalFound: number
  totalClaimed: number
  totalReturned: number
  pendingClaims: number
  activeUsers: number
  newUsersToday: number
  newItemsToday: number
  recentActivity: ActivityItem[]
  popularLocations: LocationStat[]
  monthlyStats: MonthlyData[]
}

interface ActivityItem {
  id: number
  type: "user_registered" | "item_reported" | "item_claimed" | "item_returned"
  description: string
  timestamp: string
  user: string
}

interface LocationStat {
  location: string
  count: number
  percentage: number
}

interface MonthlyData {
  month: string
  lost: number
  found: number
  claimed: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch data from backend API
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    
    const [usersResponse, itemsResponse, activitiesResponse] = await Promise.all([
      fetch(`${baseUrl}/api/admin/users/stats`),
      fetch(`${baseUrl}/api/admin/items/stats`),
      fetch(`${baseUrl}/api/admin/activities/recent`)
    ])

    let totalUsers = 0, newUsersToday = 0, activeUsers = 0
    let totalItems = 0, totalLost = 0, totalFound = 0, totalClaimed = 0, totalReturned = 0, pendingClaims = 0, newItemsToday = 0
    let recentActivity: ActivityItem[] = []

    // Parse users data
    if (usersResponse.ok) {
      const userData = await usersResponse.json()
      totalUsers = userData.totalUsers || 0
      newUsersToday = userData.newUsersToday || 0
      activeUsers = userData.activeUsers || 0
    }

    // Parse items data
    if (itemsResponse.ok) {
      const itemData = await itemsResponse.json()
      totalItems = itemData.totalItems || 0
      totalLost = itemData.totalLost || 0
      totalFound = itemData.totalFound || 0
      totalClaimed = itemData.totalClaimed || 0
      totalReturned = itemData.totalReturned || 0
      pendingClaims = itemData.pendingClaims || 0
      newItemsToday = itemData.newItemsToday || 0
    }

    // Parse activities data
    if (activitiesResponse.ok) {
      const activityData = await activitiesResponse.json()
      recentActivity = activityData.activities || []
    }

    // Mock data for popular locations and monthly stats (will be replaced with real data)
    const popularLocations: LocationStat[] = [
      { location: "Campus Library", count: 15, percentage: 25 },
      { location: "Student Center", count: 12, percentage: 20 },
      { location: "Downtown Area", count: 10, percentage: 17 }
    ]

    const monthlyStats: MonthlyData[] = [
      { month: "Jan", lost: 45, found: 38, claimed: 25 },
      { month: "Feb", lost: 52, found: 41, claimed: 28 },
      { month: "Mar", lost: 48, found: 45, claimed: 32 },
      { month: "Apr", lost: 56, found: 48, claimed: 35 },
      { month: "May", lost: 61, found: 52, claimed: 38 },
      { month: "Jun", lost: 58, found: 55, claimed: 42 }
    ]

    const dashboardData: DashboardStats = {
      totalUsers,
      totalItems,
      totalLost,
      totalFound,
      totalClaimed,
      totalReturned,
      pendingClaims,
      activeUsers,
      newUsersToday,
      newItemsToday,
      recentActivity,
      popularLocations,
      monthlyStats
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}