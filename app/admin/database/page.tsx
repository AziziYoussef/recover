"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  HardDrive,
  Clock,
  Users,
  Package,
  Settings,
  Play,
  Square,
  RotateCcw,
  Archive,
  Search
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DatabaseInfo {
  status: "online" | "offline" | "maintenance"
  version: string
  size: number
  freeSpace: number
  connections: number
  maxConnections: number
  uptime: number
  lastBackup: string
}

interface TableInfo {
  name: string
  rows: number
  size: string
  engine: string
  lastUpdated: string
  status: "ok" | "corrupted" | "optimizing"
}

interface BackupInfo {
  id: number
  filename: string
  size: string
  createdAt: string
  type: "full" | "incremental" | "differential"
  status: "completed" | "in_progress" | "failed"
  description?: string
}

interface QueryLog {
  id: number
  query: string
  duration: number
  timestamp: string
  user: string
  database: string
  status: "success" | "error"
}

export default function DatabaseManagement() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showQueryDialog, setShowQueryDialog] = useState(false)
  const [backupType, setBackupType] = useState("full")
  const [customQuery, setCustomQuery] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      setDbInfo({
        status: "online",
        version: "MySQL 8.0.28",
        size: 2.4 * 1024 * 1024 * 1024, // 2.4 GB
        freeSpace: 15.6 * 1024 * 1024 * 1024, // 15.6 GB
        connections: 23,
        maxConnections: 100,
        uptime: 2592000, // 30 days in seconds
        lastBackup: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      })

      setTables([
        {
          name: "users",
          rows: 1247,
          size: "45.2 MB",
          engine: "InnoDB",
          lastUpdated: new Date().toISOString(),
          status: "ok"
        },
        {
          name: "items",
          rows: 3891,
          size: "78.5 MB",
          engine: "InnoDB",
          lastUpdated: new Date(Date.now() - 300000).toISOString(),
          status: "ok"
        },
        {
          name: "categories",
          rows: 25,
          size: "1.2 MB",
          engine: "InnoDB",
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
          status: "ok"
        },
        {
          name: "activity_logs",
          rows: 15623,
          size: "234.7 MB",
          engine: "InnoDB",
          lastUpdated: new Date(Date.now() - 60000).toISOString(),
          status: "ok"
        },
        {
          name: "images",
          rows: 2156,
          size: "156.8 MB",
          engine: "InnoDB",
          lastUpdated: new Date(Date.now() - 1800000).toISOString(),
          status: "ok"
        }
      ])

      setBackups([
        {
          id: 1,
          filename: "recovr_backup_2024-06-17_full.sql",
          size: "2.1 GB",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          type: "full",
          status: "completed",
          description: "Daily automatic backup"
        },
        {
          id: 2,
          filename: "recovr_backup_2024-06-16_incremental.sql",
          size: "45.2 MB",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          type: "incremental",
          status: "completed",
          description: "Incremental backup"
        },
        {
          id: 3,
          filename: "recovr_backup_2024-06-15_full.sql",
          size: "2.0 GB",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          type: "full",
          status: "completed",
          description: "Weekly full backup"
        }
      ])

      setQueryLogs([
        {
          id: 1,
          query: "SELECT * FROM items WHERE status = 'LOST' ORDER BY created_at DESC LIMIT 50",
          duration: 0.045,
          timestamp: new Date().toISOString(),
          user: "app_user",
          database: "recovr_db",
          status: "success"
        },
        {
          id: 2,
          query: "UPDATE users SET last_login = NOW() WHERE id = 123",
          duration: 0.012,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          user: "app_user",
          database: "recovr_db",
          status: "success"
        },
        {
          id: 3,
          query: "SELECT COUNT(*) FROM items WHERE category = 'electronics'",
          duration: 0.089,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          user: "analytics_user",
          database: "recovr_db",
          status: "success"
        }
      ])
    } catch (error) {
      console.error('Error fetching database info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: backupType }),
      })
      
      if (response.ok) {
        setShowBackupDialog(false)
        fetchDatabaseInfo()
      }
    } catch (error) {
      console.error('Error creating backup:', error)
    }
  }

  const downloadBackup = async (backupId: number) => {
    try {
      const response = await fetch(`/api/admin/database/backup/${backupId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId}.sql`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
    }
  }

  const deleteBackup = async (backupId: number) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      try {
        const response = await fetch(`/api/admin/database/backup/${backupId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchDatabaseInfo()
        }
      } catch (error) {
        console.error('Error deleting backup:', error)
      }
    }
  }

  const executeQuery = async () => {
    try {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: customQuery }),
      })
      
      if (response.ok) {
        setShowQueryDialog(false)
        setCustomQuery("")
        fetchDatabaseInfo()
      }
    } catch (error) {
      console.error('Error executing query:', error)
    }
  }

  const optimizeTable = async (tableName: string) => {
    try {
      const response = await fetch('/api/admin/database/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: tableName }),
      })
      
      if (response.ok) {
        fetchDatabaseInfo()
      }
    } catch (error) {
      console.error('Error optimizing table:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>
      case "offline":
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case "ok":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case "corrupted":
        return <Badge className="bg-red-100 text-red-800">Corrupted</Badge>
      case "optimizing":
        return <Badge className="bg-blue-100 text-blue-800">Optimizing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
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
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600">
            Monitor and manage database operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDatabaseInfo}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBackupDialog(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQueryDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Run Query
          </Button>
        </div>
      </div>

      {/* Database Status */}
      {dbInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-2">{getStatusBadge(dbInfo.status)}</div>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(dbInfo.size)}</p>
                  <Progress value={(dbInfo.size / (dbInfo.size + dbInfo.freeSpace)) * 100} className="mt-2" />
                </div>
                <HardDrive className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dbInfo.connections}/{dbInfo.maxConnections}
                  </p>
                  <Progress value={(dbInfo.connections / dbInfo.maxConnections) * 100} className="mt-2" />
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUptime(dbInfo.uptime)}</p>
                  <p className="text-sm text-gray-500 mt-1">{dbInfo.version}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="queries">Query Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Information</CardTitle>
              </CardHeader>
              <CardContent>
                {dbInfo && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Version:</span>
                      <span className="text-sm">{dbInfo.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Size:</span>
                      <span className="text-sm">{formatBytes(dbInfo.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Free Space:</span>
                      <span className="text-sm">{formatBytes(dbInfo.freeSpace)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Active Connections:</span>
                      <span className="text-sm">{dbInfo.connections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Backup:</span>
                      <span className="text-sm">{new Date(dbInfo.lastBackup).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setShowBackupDialog(true)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Create Database Backup
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Optimize All Tables
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowQueryDialog(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Execute Custom Query
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Database Schema
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                Manage and monitor database tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tables.map((table) => (
                  <div 
                    key={table.name} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{table.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{table.rows.toLocaleString()} rows</span>
                        <span>{table.size}</span>
                        <span>{table.engine}</span>
                        <span>Updated: {new Date(table.lastUpdated).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(table.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => optimizeTable(table.name)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Database Backups</CardTitle>
              <CardDescription>
                Manage database backups and restore points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div 
                    key={backup.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{backup.size}</span>
                        <span className="capitalize">{backup.type} backup</span>
                        <span>{new Date(backup.createdAt).toLocaleString()}</span>
                      </div>
                      {backup.description && (
                        <p className="text-sm text-gray-500 mt-1">{backup.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(backup.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Logs Tab */}
        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle>Query Logs</CardTitle>
              <CardDescription>
                Monitor database query performance and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded mb-2 overflow-x-auto">
                          {log.query}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Duration: {log.duration}s</span>
                          <span>User: {log.user}</span>
                          <span>Database: {log.database}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Create a new backup of the database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="backupType">Backup Type</Label>
              <Select value={backupType} onValueChange={setBackupType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                  <SelectItem value="differential">Differential Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createBackup}>
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Query Dialog */}
      <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Execute Custom Query</DialogTitle>
            <DialogDescription>
              Run a custom SQL query on the database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customQuery">SQL Query</Label>
              <Textarea
                id="customQuery"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={8}
                placeholder="SELECT * FROM users WHERE ..."
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Be careful when executing custom queries. Always backup your data first.</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQueryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeQuery} disabled={!customQuery.trim()}>
              <Play className="h-4 w-4 mr-2" />
              Execute Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}