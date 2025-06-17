import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

interface Report {
  id: number
  name: string
  type: "users" | "items" | "analytics" | "activity" | "financial" | "custom"
  description: string
  createdAt: string
  lastGenerated: string
  status: "scheduled" | "generating" | "completed" | "failed"
  schedule?: string
  filters: any
  fileSize?: string
  downloadUrl?: string
}

interface ReportTemplate {
  id: string
  name: string
  type: string
  description: string
  fields: string[]
  filters: string[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock reports data
    const reports: Report[] = [
      {
        id: 1,
        name: "Monthly User Report",
        type: "users",
        description: "Comprehensive user statistics and activity report",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastGenerated: new Date(Date.now() - 3600000).toISOString(),
        status: "completed",
        filters: { dateRange: "30d" },
        fileSize: "2.4 MB"
      },
      {
        id: 2,
        name: "Lost Items Analysis",
        type: "items",
        description: "Analysis of lost items by category and location",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        lastGenerated: new Date(Date.now() - 7200000).toISOString(),
        status: "completed",
        filters: { status: "lost", dateRange: "7d" },
        fileSize: "1.8 MB"
      },
      {
        id: 3,
        name: "System Performance Report",
        type: "analytics",
        description: "System performance metrics and analytics",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        lastGenerated: new Date().toISOString(),
        status: "generating",
        filters: { dateRange: "30d" }
      },
      {
        id: 4,
        name: "Activity Log Summary",
        type: "activity",
        description: "Summary of system activities and user actions",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        lastGenerated: new Date(Date.now() - 14400000).toISOString(),
        status: "completed",
        filters: { level: "all", dateRange: "7d" },
        fileSize: "3.1 MB"
      }
    ]

    const templates: ReportTemplate[] = [
      {
        id: "user_template",
        name: "User Report Template",
        type: "users",
        description: "Standard user reporting template",
        fields: ["name", "email", "joinDate", "lastLogin", "itemsReported"],
        filters: ["dateRange", "role", "status"]
      },
      {
        id: "item_template",
        name: "Item Report Template",
        type: "items",
        description: "Standard item reporting template",
        fields: ["name", "category", "status", "location", "reportedAt"],
        filters: ["status", "category", "dateRange", "location"]
      },
      {
        id: "analytics_template",
        name: "Analytics Report Template",
        type: "analytics",
        description: "System analytics and metrics template",
        fields: ["userGrowth", "itemStats", "performanceMetrics"],
        filters: ["timeRange", "metrics"]
      }
    ]

    return NextResponse.json({ reports, templates })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'admin' && !session.user?.roles?.includes('ROLE_ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, type, template, dateRange, filters } = await request.json()

    // Mock report creation
    const newReport: Report = {
      id: Date.now(),
      name,
      type,
      description: `Generated ${type} report`,
      createdAt: new Date().toISOString(),
      lastGenerated: new Date().toISOString(),
      status: "generating",
      filters: { dateRange, ...filters }
    }

    // Simulate report generation delay
    setTimeout(() => {
      // In real implementation, update the report status to "completed"
    }, 5000)

    return NextResponse.json({ success: true, report: newReport })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}