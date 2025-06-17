"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  Search,
  Trash2,
  Edit,
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Clock
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

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

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [reportName, setReportName] = useState("")
  const [reportType, setReportType] = useState("")
  const [dateRange, setDateRange] = useState("30d")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const generateReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/generate`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchReports()
      }
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const downloadReport = async (reportId: number, format: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/download?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const createReport = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reportName,
          type: reportType,
          template: selectedTemplate,
          dateRange,
          filters: selectedFilters
        }),
      })
      
      if (response.ok) {
        setShowCreateDialog(false)
        setReportName("")
        setReportType("")
        setSelectedTemplate("")
        setSelectedFilters([])
        fetchReports()
      }
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  const deleteReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchReports()
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "generating":
        return <Badge className="bg-blue-100 text-blue-800">Generating...</Badge>
      case "scheduled":
        return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "users":
        return <Users className="h-4 w-4" />
      case "items":
        return <Package className="h-4 w-4" />
      case "analytics":
        return <BarChart3 className="h-4 w-4" />
      case "activity":
        return <Clock className="h-4 w-4" />
      case "financial":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Generate and manage system reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "User Report", type: "users", description: "Export user data and statistics", icon: Users },
          { title: "Items Report", type: "items", description: "Lost and found items analysis", icon: Package },
          { title: "Analytics Report", type: "analytics", description: "Performance and trends", icon: BarChart3 },
          { title: "Activity Report", type: "activity", description: "System activity logs", icon: Clock }
        ].map((quick) => (
          <Card key={quick.type} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <quick.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{quick.title}</p>
                  <p className="text-xs text-gray-600">{quick.description}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full mt-3"
                onClick={() => {
                  setReportType(quick.type)
                  setReportName(quick.title)
                  setShowCreateDialog(true)
                }}
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{report.name}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      {report.lastGenerated && (
                        <span className="text-xs text-gray-500">
                          Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                        </span>
                      )}
                      {report.fileSize && (
                        <span className="text-xs text-gray-500">
                          Size: {report.fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(report.status)}
                  
                  <div className="flex items-center space-x-1">
                    {report.status === "completed" && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadReport(report.id, 'pdf')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadReport(report.id, 'csv')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadReport(report.id, 'excel')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Excel
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateReport(report.id)}
                      disabled={report.status === "generating"}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports found</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  Create Your First Report
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Configure your report settings and filters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Users Report</SelectItem>
                  <SelectItem value="items">Items Report</SelectItem>
                  <SelectItem value="analytics">Analytics Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Export Formats</Label>
              <div className="flex space-x-4 mt-2">
                {["PDF", "CSV", "Excel"].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox 
                      id={format}
                      checked={selectedFilters.includes(format)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFilters([...selectedFilters, format])
                        } else {
                          setSelectedFilters(selectedFilters.filter(f => f !== format))
                        }
                      }}
                    />
                    <Label htmlFor={format}>{format}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createReport} disabled={!reportName || !reportType}>
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}