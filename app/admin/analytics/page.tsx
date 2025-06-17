"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MapPin,
  Clock
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AnalyticsData {
  userGrowth: MonthlyData[]
  itemsByCategory: CategoryData[]
  itemsByStatus: StatusData[]
  locationAnalytics: LocationData[]
  timeAnalytics: TimeData[]
  performanceMetrics: PerformanceData
  trends: TrendData[]
}

interface MonthlyData {
  month: string
  users: number
  items: number
  resolved: number
}

interface CategoryData {
  category: string
  count: number
  percentage: number
  trend: number
}

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

interface LocationData {
  location: string
  items: number
  resolved: number
  successRate: number
}

interface TimeData {
  hour: number
  reports: number
  claims: number
}

interface PerformanceData {
  avgResolutionTime: number
  successRate: number
  activeUsers: number
  totalValue: number
}

interface TrendData {
  metric: string
  current: number
  previous: number
  change: number
  trend: "up" | "down"
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedView, setSelectedView] = useState("overview")

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const exportAnalytics = async (format: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=${format}&timeRange=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${timeRange}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Comprehensive insights and data analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportAnalytics('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportAnalytics('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "Users" },
          { id: "items", label: "Items" },
          { id: "locations", label: "Locations" },
          { id: "performance", label: "Performance" }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedView === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.performanceMetrics.successRate || 0}%
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.performanceMetrics.avgResolutionTime || 0}h
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -8% faster
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.performanceMetrics.activeUsers || 0}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% this week
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics?.performanceMetrics.totalValue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% increase
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {selectedView === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User & Item Growth</CardTitle>
              <CardDescription>Monthly growth trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Chart visualization would be here</p>
                  <p className="text-sm">Users: +156 this month</p>
                  <p className="text-sm">Items: +234 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Items by Category</CardTitle>
              <CardDescription>Distribution of reported items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Electronics", count: 145, percentage: 35, color: "bg-blue-500" },
                  { category: "Clothing", count: 89, percentage: 22, color: "bg-green-500" },
                  { category: "Bags", count: 67, percentage: 16, color: "bg-purple-500" },
                  { category: "Documents", count: 45, percentage: 11, color: "bg-orange-500" },
                  { category: "Keys", count: 38, percentage: 9, color: "bg-red-500" },
                  { category: "Other", count: 28, percentage: 7, color: "bg-gray-500" }
                ].map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{item.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-10">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Analytics */}
      {selectedView === "locations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
              <CardDescription>Most active locations for lost & found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { location: "Library - Main Floor", items: 45, resolved: 38, rate: 84 },
                  { location: "Student Center", items: 32, resolved: 28, rate: 88 },
                  { location: "Gym & Sports Center", items: 28, resolved: 22, rate: 79 },
                  { location: "Cafeteria", items: 24, resolved: 21, rate: 88 },
                  { location: "Parking Lot A", items: 19, resolved: 15, rate: 79 }
                ].map((loc) => (
                  <div key={loc.location} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{loc.location}</p>
                        <p className="text-xs text-gray-600">{loc.items} items reported</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{loc.rate}%</p>
                      <p className="text-xs text-gray-600">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity</CardTitle>
              <CardDescription>Peak times for reports and claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Hourly activity chart would be here</p>
                  <p className="text-sm">Peak: 2-4 PM (34 reports)</p>
                  <p className="text-sm">Low: 4-6 AM (2 reports)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Key performance indicators over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                metric: "Response Time", 
                current: "2.4h", 
                previous: "2.8h", 
                change: -14,
                trend: "down" as const,
                description: "Average time to first response"
              },
              { 
                metric: "User Satisfaction", 
                current: "4.8/5", 
                previous: "4.6/5", 
                change: 4,
                trend: "up" as const,
                description: "Average user rating"
              },
              { 
                metric: "Item Recovery Rate", 
                current: "78%", 
                previous: "72%", 
                change: 8,
                trend: "up" as const,
                description: "Successfully returned items"
              }
            ].map((trend) => (
              <div key={trend.metric} className="text-center p-4 border rounded-lg">
                <p className="text-sm font-medium text-gray-600">{trend.metric}</p>
                <p className="text-2xl font-bold text-gray-900 my-2">{trend.current}</p>
                <div className="flex items-center justify-center space-x-1">
                  {trend.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-green-600">
                    {Math.abs(trend.change)}% {trend.trend === "up" ? "increase" : "decrease"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{trend.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}