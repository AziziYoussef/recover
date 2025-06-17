"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Shield, 
  AlertTriangle,
  Lock,
  Unlock,
  Ban,
  Eye,
  RefreshCw,
  Download,
  Search,
  Filter,
  Key,
  UserX,
  Activity,
  Globe,
  Clock,
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

interface SecurityThreat {
  id: number
  type: "brute_force" | "suspicious_activity" | "malware" | "ddos" | "data_breach"
  severity: "low" | "medium" | "high" | "critical"
  ipAddress: string
  userAgent: string
  location: string
  timestamp: string
  description: string
  blocked: boolean
  attempts: number
}

interface BlockedIP {
  id: number
  ipAddress: string
  reason: string
  blockedAt: string
  expiresAt?: string
  permanent: boolean
  attempts: number
  lastAttempt: string
}

interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: "low" | "medium" | "high"
  conditions: any
}

interface LoginAttempt {
  id: number
  email: string
  ipAddress: string
  location: string
  success: boolean
  timestamp: string
  userAgent: string
  failureReason?: string
}

export default function SecurityManagement() {
  const [threats, setThreats] = useState<SecurityThreat[]>([])
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("threats")
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null)
  const [showThreatDetails, setShowThreatDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      setThreats([
        {
          id: 1,
          type: "brute_force",
          severity: "high",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          location: "Unknown",
          timestamp: new Date().toISOString(),
          description: "Multiple failed login attempts detected",
          blocked: true,
          attempts: 15
        },
        {
          id: 2,
          type: "suspicious_activity",
          severity: "medium",
          ipAddress: "10.0.0.50",
          userAgent: "curl/7.68.0",
          location: "Russia",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          description: "Automated scanning behavior detected",
          blocked: false,
          attempts: 8
        },
        {
          id: 3,
          type: "ddos",
          severity: "critical",
          ipAddress: "203.0.113.0",
          userAgent: "Bot/1.0",
          location: "China",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          description: "High frequency requests from single IP",
          blocked: true,
          attempts: 500
        }
      ])

      setBlockedIPs([
        {
          id: 1,
          ipAddress: "192.168.1.100",
          reason: "Brute force attack",
          blockedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          permanent: false,
          attempts: 15,
          lastAttempt: new Date().toISOString()
        },
        {
          id: 2,
          ipAddress: "203.0.113.0",
          reason: "DDoS attack",
          blockedAt: new Date(Date.now() - 600000).toISOString(),
          permanent: true,
          attempts: 500,
          lastAttempt: new Date(Date.now() - 300000).toISOString()
        }
      ])

      setPolicies([
        {
          id: "rate_limit",
          name: "Rate Limiting",
          description: "Limit requests per IP address",
          enabled: true,
          severity: "medium",
          conditions: { maxRequests: 100, timeWindow: 300 }
        },
        {
          id: "geo_blocking",
          name: "Geo-blocking",
          description: "Block requests from specific countries",
          enabled: false,
          severity: "high",
          conditions: { blockedCountries: ["CN", "RU"] }
        },
        {
          id: "login_protection",
          name: "Login Protection",
          description: "Protect against brute force login attempts",
          enabled: true,
          severity: "high",
          conditions: { maxAttempts: 5, lockoutTime: 900 }
        }
      ])

      setLoginAttempts([
        {
          id: 1,
          email: "john.doe@example.com",
          ipAddress: "192.168.1.101",
          location: "New York, USA",
          success: true,
          timestamp: new Date().toISOString(),
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        {
          id: 2,
          email: "attacker@malicious.com",
          ipAddress: "192.168.1.100",
          location: "Unknown",
          success: false,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          userAgent: "curl/7.68.0",
          failureReason: "Invalid credentials"
        }
      ])
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const blockIP = async (ipAddress: string, reason: string, permanent: boolean = false) => {
    try {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipAddress, reason, permanent }),
      })
      
      if (response.ok) {
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error blocking IP:', error)
    }
  }

  const unblockIP = async (ipAddress: string) => {
    try {
      const response = await fetch('/api/admin/security/unblock-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipAddress }),
      })
      
      if (response.ok) {
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error unblocking IP:', error)
    }
  }

  const togglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/security/policies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ policyId, enabled }),
      })
      
      if (response.ok) {
        setPolicies(policies.map(policy => 
          policy.id === policyId ? { ...policy, enabled } : policy
        ))
      }
    } catch (error) {
      console.error('Error updating policy:', error)
    }
  }

  const exportSecurityReport = async () => {
    try {
      const response = await fetch('/api/admin/security/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting security report:', error)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getThreatIcon = (type: string) => {
    switch (type) {
      case "brute_force":
        return <Key className="h-4 w-4" />
      case "suspicious_activity":
        return <Eye className="h-4 w-4" />
      case "malware":
        return <Ban className="h-4 w-4" />
      case "ddos":
        return <Activity className="h-4 w-4" />
      case "data_breach":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const filteredThreats = threats.filter(threat => {
    if (searchTerm && !threat.ipAddress.includes(searchTerm) && 
        !threat.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (severityFilter !== "all" && threat.severity !== severityFilter) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Security Management</h1>
          <p className="text-gray-600">
            Monitor and manage system security threats
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Threats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {threats.filter(t => !t.blocked).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
                <p className="text-2xl font-bold text-gray-900">{blockedIPs.length}</p>
              </div>
              <Ban className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.filter(p => p.enabled).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loginAttempts.filter(a => !a.success).length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="logins">Login Attempts</TabsTrigger>
        </TabsList>

        {/* Threats Tab */}
        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle>Security Threats</CardTitle>
              <CardDescription>
                Monitor and respond to security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search threats..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Threats List */}
              <div className="space-y-4">
                {filteredThreats.map((threat) => (
                  <div 
                    key={threat.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getThreatIcon(threat.type)}
                        {getSeverityBadge(threat.severity)}
                      </div>
                      <div>
                        <p className="font-medium">{threat.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {threat.ipAddress}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {threat.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(threat.timestamp).toLocaleString()}
                          </span>
                          <span>{threat.attempts} attempts</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {threat.blocked ? (
                        <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedThreat(threat)
                          setShowThreatDetails(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!threat.blocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => blockIP(threat.ipAddress, threat.description)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
              <CardDescription>
                Manage blocked IP addresses and access restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockedIPs.map((ip) => (
                  <div 
                    key={ip.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{ip.ipAddress}</p>
                      <p className="text-sm text-gray-600">{ip.reason}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Blocked: {new Date(ip.blockedAt).toLocaleString()}</span>
                        {ip.expiresAt && !ip.permanent && (
                          <span>Expires: {new Date(ip.expiresAt).toLocaleString()}</span>
                        )}
                        {ip.permanent && <span>Permanent block</span>}
                        <span>{ip.attempts} attempts</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {ip.permanent ? (
                        <Badge className="bg-red-100 text-red-800">Permanent</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">Temporary</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockIP(ip.ipAddress)}
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Configure and manage security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div 
                    key={policy.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{policy.name}</p>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {getSeverityBadge(policy.severity)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={policy.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePolicy(policy.id, !policy.enabled)}
                      >
                        {policy.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {policy.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts Tab */}
        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle>Login Attempts</CardTitle>
              <CardDescription>
                Monitor user login attempts and authentication events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loginAttempts.map((attempt) => (
                  <div 
                    key={attempt.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{attempt.email}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {attempt.ipAddress}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {attempt.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(attempt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {!attempt.success && attempt.failureReason && (
                        <p className="text-sm text-red-600 mt-1">{attempt.failureReason}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {attempt.success ? (
                        <Badge className="bg-green-100 text-green-800">Success</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Threat Details Dialog */}
      <Dialog open={showThreatDetails} onOpenChange={setShowThreatDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Threat Details</DialogTitle>
            <DialogDescription>
              Detailed information about this security threat
            </DialogDescription>
          </DialogHeader>
          
          {selectedThreat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Threat Type</Label>
                  <p className="text-sm text-gray-900 capitalize">{selectedThreat.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedThreat.severity)}</div>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm text-gray-900">{selectedThreat.ipAddress}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-gray-900">{selectedThreat.location}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedThreat.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Attempts</Label>
                  <p className="text-sm text-gray-900">{selectedThreat.attempts}</p>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedThreat.description}</p>
              </div>
              
              <div>
                <Label>User Agent</Label>
                <p className="text-sm text-gray-900 mt-1 break-all">{selectedThreat.userAgent}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThreatDetails(false)}>
              Close
            </Button>
            {selectedThreat && !selectedThreat.blocked && (
              <Button 
                onClick={() => {
                  blockIP(selectedThreat.ipAddress, selectedThreat.description)
                  setShowThreatDetails(false)
                }}
              >
                Block IP
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}