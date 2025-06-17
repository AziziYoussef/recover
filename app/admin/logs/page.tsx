"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  Eye,
  User,
  Package,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Calendar,
  MapPin
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

interface LogFilter {
  search: string
  category: string
  level: string
  dateRange: string
  userId?: string
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [showLogDetails, setShowLogDetails] = useState(false)
  const [filters, setFilters] = useState<LogFilter>({
    search: "",
    category: "all",
    level: "all",
    dateRange: "24h"
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`/api/admin/logs?${queryParams}`)
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      // Mock data for development
      setLogs([
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
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const exportLogs = async (format: string) => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value)
        }
      })
      queryParams.append('format', format)

      const response = await fetch(`/api/admin/logs/export?${queryParams}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "user":
        return <User className="h-4 w-4" />
      case "item":
        return <Package className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "security":
        return <AlertTriangle className="h-4 w-4" />
      case "system":
        return <Activity className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filters.search && !log.action.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.details.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.userName?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">
            Monitor system activity and user actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportLogs('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportLogs('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.level === 'error').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.level === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.category === 'security').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Select 
              value={filters.category} 
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="item">Items</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.level} 
              onValueChange={(value) => setFilters({ ...filters, level: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({filteredLogs.length} events)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedLog(log)
                  setShowLogDetails(true)
                }}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(log.level)}
                    {getCategoryIcon(log.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-gray-900">{log.action}</p>
                      {getLevelBadge(log.level)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{log.details}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.userName && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.userName}
                        </span>
                      )}
                      {log.location && (
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {log.location}
                        </span>
                      )}
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity logs found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedLog.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Level</label>
                  <div className="mt-1">{getLevelBadge(selectedLog.level)}</div>
                </div>
                {selectedLog.userName && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">User</label>
                      <p className="text-sm text-gray-900">{selectedLog.userName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedLog.userEmail}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                </div>
                {selectedLog.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900">{selectedLog.location}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Details</label>
                <p className="text-sm text-gray-900 mt-1">{selectedLog.details}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">User Agent</label>
                <p className="text-sm text-gray-900 mt-1 break-all">{selectedLog.userAgent}</p>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Data</label>
                  <pre className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}