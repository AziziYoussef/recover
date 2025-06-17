"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Eye,
  MapPin,
  Calendar,
  User,
  Package,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface Item {
  id: number
  name: string
  description: string
  category: string
  status: "LOST" | "FOUND" | "CLAIMED" | "RETURNED"
  location: string
  reportedBy: string
  reportedAt: string
  imageUrl?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  isVerified: boolean
  priority: "low" | "medium" | "high"
}

interface ItemFilters {
  search: string
  status: string
  category: string
  verified: string
  dateRange: string
}

export default function ItemsManagement() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [filters, setFilters] = useState<ItemFilters>({
    search: "",
    status: "all",
    category: "all",
    verified: "all",
    dateRange: "all"
  })
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status !== 'all') queryParams.append('status', filters.status)
      if (filters.category !== 'all') queryParams.append('category', filters.category)
      if (filters.verified !== 'all') queryParams.append('verified', filters.verified)
      if (filters.dateRange !== 'all') queryParams.append('dateRange', filters.dateRange)

      const response = await fetch(`/api/admin/items?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`)
      }
      
      const data = await response.json()
      setItems(data.items || [])
    } catch (err) {
      console.error("Error fetching items:", err)
      setError(err instanceof Error ? err.message : "Failed to load items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [filters])

  const handleItemSelect = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchItems()
      } else {
        throw new Error('Failed to update item status')
      }
    } catch (error) {
      console.error('Error updating item status:', error)
    }
  }

  const handleVerifyItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchItems()
      } else {
        throw new Error('Failed to verify item')
      }
    } catch (error) {
      console.error('Error verifying item:', error)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/admin/items/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchItems()
        setShowDeleteDialog(false)
        setItemToDelete(null)
      } else {
        throw new Error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return

    try {
      const response = await fetch('/api/admin/items/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemIds: selectedItems, 
          action 
        }),
      })

      if (response.ok) {
        fetchItems()
        setSelectedItems([])
      } else {
        throw new Error(`Failed to ${action} items`)
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LOST":
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>
      case "FOUND":
        return <Badge className="bg-green-100 text-green-800">Found</Badge>
      case "CLAIMED":
        return <Badge className="bg-blue-100 text-blue-800">Claimed</Badge>
      case "RETURNED":
        return <Badge className="bg-purple-100 text-purple-800">Returned</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const filteredItems = items.filter(item => {
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false
    }
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false
    }
    if (filters.verified !== 'all') {
      const isVerified = filters.verified === 'verified'
      if (item.isVerified !== isVerified) {
        return false
      }
    }
    return true
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Items Management</h1>
          <p className="text-gray-600">
            Manage lost and found items, verify submissions, and track status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="FOUND">Found</SelectItem>
                <SelectItem value="CLAIMED">Claimed</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="bags">Bags</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="keys">Keys</SelectItem>
                <SelectItem value="jewelry">Jewelry</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.verified} onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('verify')}>
                  <Check className="h-4 w-4 mr-2" />
                  Verify
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Items ({filteredItems.length})</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleItemSelect(item.id)}
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {getStatusBadge(item.status)}
                      {!item.isVerified && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </p>
                      <p className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {item.reportedBy}
                      </p>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.reportedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      {getPriorityBadge(item.priority)}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setViewingItem(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewingItem(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!item.isVerified && (
                        <DropdownMenuItem onClick={() => handleVerifyItem(item.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Verify Item
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, "CLAIMED")}>
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Claimed
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setItemToDelete(item)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Details Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{viewingItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(viewingItem.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{viewingItem.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">{viewingItem.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reported By</label>
                  <p className="text-sm text-gray-900">{viewingItem.reportedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reported At</label>
                  <p className="text-sm text-gray-900">{new Date(viewingItem.reportedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1">{viewingItem.description}</p>
              </div>
              {viewingItem.imageUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Image</label>
                  <img src={viewingItem.imageUrl} alt={viewingItem.name} className="mt-1 max-w-full h-64 object-cover rounded-lg" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 