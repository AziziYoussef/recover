import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive" | "suspended"
  joinDate: string
  lastLogin: string
  itemsReported: number
  itemsClaimed: number
  emailVerified: boolean
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const dateRange = searchParams.get('dateRange')

    // Build query parameters for backend
    const backendParams = new URLSearchParams()
    if (search) backendParams.append('search', search)
    if (role && role !== 'all') backendParams.append('role', role)
    if (status && status !== 'all') backendParams.append('status', status)
    if (dateRange && dateRange !== 'all') backendParams.append('dateRange', dateRange)

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/users?${backendParams}`)
      
      if (response.ok) {
        const backendData = await response.json()
        // Transform backend data to match frontend interface
        const users: User[] = backendData.map((user: any) => ({
          id: user.id,
          name: user.username || user.name,
          email: user.email,
          role: user.role || 'user',
          status: user.enabled ? 'active' : 'inactive',
          joinDate: user.createdAt || new Date().toISOString(),
          lastLogin: user.lastLogin || new Date().toISOString(),
          itemsReported: user.itemsReported || 0,
          itemsClaimed: user.itemsClaimed || 0,
          emailVerified: user.emailVerified || false
        }))
        
        return NextResponse.json({ users })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock data')
    }

    // Mock data for development/testing
    const mockUsers: User[] = [
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "admin",
        status: "active",
        joinDate: "2024-01-15T00:00:00Z",
        lastLogin: "2024-06-17T10:30:00Z",
        itemsReported: 5,
        itemsClaimed: 2,
        emailVerified: true
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "user",
        status: "active",
        joinDate: "2024-02-20T00:00:00Z",
        lastLogin: "2024-06-16T15:45:00Z",
        itemsReported: 3,
        itemsClaimed: 1,
        emailVerified: true
      },
      {
        id: 3,
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        role: "moderator",
        status: "active",
        joinDate: "2024-03-10T00:00:00Z",
        lastLogin: "2024-06-15T09:20:00Z",
        itemsReported: 8,
        itemsClaimed: 4,
        emailVerified: false
      },
      {
        id: 4,
        name: "Alice Brown",
        email: "alice.brown@example.com",
        role: "user",
        status: "suspended",
        joinDate: "2024-04-05T00:00:00Z",
        lastLogin: "2024-06-10T14:15:00Z",
        itemsReported: 1,
        itemsClaimed: 0,
        emailVerified: true
      },
      {
        id: 5,
        name: "Charlie Wilson",
        email: "charlie.wilson@example.com",
        role: "user",
        status: "inactive",
        joinDate: "2024-05-12T00:00:00Z",
        lastLogin: "2024-05-20T11:30:00Z",
        itemsReported: 0,
        itemsClaimed: 0,
        emailVerified: false
      }
    ]

    // Apply filters to mock data
    let filteredUsers = mockUsers

    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}