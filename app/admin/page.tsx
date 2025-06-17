"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  Mail
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registered":
        return <Users className="h-4 w-4 text-blue-500" />
      case "item_reported":
        return <Package className="h-4 w-4 text-orange-500" />
      case "item_claimed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "item_returned":
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "user_registered":
        return "bg-blue-100 text-blue-800"
      case "item_reported":
        return "bg-orange-100 text-orange-800"
      case "item_claimed":
        return "bg-green-100 text-green-800"
      case "item_returned":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
            <Button 
              onClick={fetchDashboardData} 
              className="mt-4"
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{stats?.newUsersToday || 0} today
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalItems || 0}</p>
                  <Badge className="ml-2 bg-orange-100 text-orange-800">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{stats?.newItemsToday || 0} today
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Claimed</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalClaimed || 0}</p>
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats?.totalItems ? Math.round((stats.totalClaimed / stats.totalItems) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingClaims || 0}</p>
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Urgent
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Item Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lost Items</span>
                <div className="flex items-center">
                  <span className="font-medium">{stats?.totalLost || 0}</span>
                  <div className="ml-2 h-2 w-16 bg-red-100 rounded-full">
                    <div 
                      className="h-2 bg-red-500 rounded-full" 
                      style={{ 
                        width: stats?.totalItems ? `${(stats.totalLost / stats.totalItems) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Found Items</span>
                <div className="flex items-center">
                  <span className="font-medium">{stats?.totalFound || 0}</span>
                  <div className="ml-2 h-2 w-16 bg-green-100 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ 
                        width: stats?.totalItems ? `${(stats.totalFound / stats.totalItems) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Returned Items</span>
                <div className="flex items-center">
                  <span className="font-medium">{stats?.totalReturned || 0}</span>
                  <div className="ml-2 h-2 w-16 bg-blue-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ 
                        width: stats?.totalItems ? `${(stats.totalReturned / stats.totalItems) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Popular Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.popularLocations?.slice(0, 3).map((location, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate">{location.location}</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{location.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {location.percentage}%
                    </Badge>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-medium">{stats?.activeUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Registrations</span>
                <span className="font-medium">{stats?.newUsersToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Items Reported Today</span>
                <span className="font-medium">{stats?.newItemsToday || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity?.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge className={getActivityBadgeColor(activity.type)}>
                  {activity.type.replace('_', ' ')}
                </Badge>
              </div>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}