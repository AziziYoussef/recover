import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface ActivityLog {
  id: number
  timestamp: string
  action: string
  category: "auth" | "user" | "item" | "admin" | "system" | "security"
  level: "info" | "warning" | "error" | "success"
  userId?: number
  userName?: string
  userEmail?: string
  itemId?: number
  itemName?: string
  ipAddress: string
  userAgent: string
  details: string
  metadata?: any
  location?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const dateRange = searchParams.get('dateRange')

    // Mock activity logs
    const mockLogs: ActivityLog[] = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        action: "User Login",
        category: "auth",
        level: "info",
        userId: 123,
        userName: "John Doe",
        userEmail: "john.doe@example.com",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: "User successfully logged in",
        location: "New York, NY"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        action: "Item Reported",
        category: "item",
        level: "success",
        userId: 456,
        userName: "Jane Smith",
        userEmail: "jane.smith@example.com",
        itemId: 789,
        itemName: "iPhone 13 Pro",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
        details: "New lost item reported: iPhone 13 Pro",
        location: "Los Angeles, CA"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        action: "Failed Login Attempt",
        category: "security",
        level: "warning",
        userEmail: "suspicious@example.com",
        ipAddress: "10.0.0.50",
        userAgent: "curl/7.68.0",
        details: "Multiple failed login attempts detected",
        location: "Unknown"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        action: "Admin Access",
        category: "admin",
        level: "info",
        userId: 1,
        userName: "System Administrator",
        userEmail: "admin@recovr.com",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        details: "Admin accessed user management panel",
        location: "San Francisco, CA"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        action: "System Error",
        category: "system",
        level: "error",
        ipAddress: "127.0.0.1",
        userAgent: "System",
        details: "Database connection timeout",
        metadata: { error: "Connection timeout after 30s", query: "SELECT * FROM items" }
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        action: "User Registration",
        category: "user",
        level: "success",
        userId: 789,
        userName: "Alice Johnson",
        userEmail: "alice.johnson@example.com",
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        details: "New user registered successfully",
        location: "Chicago, IL"
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: "Item Claimed",
        category: "item",
        level: "success",
        userId: 234,
        userName: "Bob Wilson",
        userEmail: "bob.wilson@example.com",
        itemId: 567,
        itemName: "Blue Backpack",
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        details: "User claimed item: Blue Backpack",
        location: "Boston, MA"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        action: "Security Alert",
        category: "security",
        level: "warning",
        ipAddress: "203.0.113.0",
        userAgent: "Bot/1.0",
        details: "Suspicious activity detected from IP address",
        location: "Unknown",
        metadata: { threatType: "bruteforce", attempts: 15 }
      }
    ]

    // Apply filters
    let filteredLogs = mockLogs

    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.userName?.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search)
      )
    }

    if (category && category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const now = Date.now()
      let cutoffTime = now

      switch (dateRange) {
        case '1h':
          cutoffTime = now - (60 * 60 * 1000)
          break
        case '24h':
          cutoffTime = now - (24 * 60 * 60 * 1000)
          break
        case '7d':
          cutoffTime = now - (7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          cutoffTime = now - (30 * 24 * 60 * 60 * 1000)
          break
      }

      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getTime() >= cutoffTime
      )
    }

    return NextResponse.json({ logs: filteredLogs })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}