"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Package, Calendar, MapPin, User, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AdvancedSearch from "@/components/ui/advanced-search"

interface LostItem {
  id: number
  name: string
  description: string
  category: string
  location: string
  imageUrl: string
  reportedAt: string
  reportedByUsername: string
  claimed: boolean
}

interface SearchFilters {
  query: string
  category: string
  status: string
  location: string
  dateFrom: string
  dateTo: string
  sortBy: string
}

export default function LostItemsPage() {
  const [items, setItems] = useState<LostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    query: "",
    category: "ALL",
    status: "LOST",
    location: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "newest"
  })

  const searchLostItems = async (filters: SearchFilters, page = 0, append = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "12",
        ...(filters.query && { query: filters.query }),
        ...(filters.category !== "ALL" && filters.category !== "all" && { category: filters.category }),
        ...(filters.location && { location: filters.location }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.sortBy && { sortBy: filters.sortBy })
      })

      // Use our frontend API route instead of calling backend directly
      const response = await fetch(`/api/lost?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Impossible de charger les objets perdus`)
      }

      const data = await response.json()
      
      // Transform the data to match the expected format
      const transformedItems = data.content.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category || 'MISCELLANEOUS',
        location: item.location,
        imageUrl: item.imageUrl || '/placeholder.svg',
        reportedAt: item.reportedAt,
        reportedByUsername: item.reportedByUsername || 'Anonymous',
        claimed: item.status === 'CLAIMED',
        latitude: item.latitude,
        longitude: item.longitude
      }))
      
      if (append) {
        setItems(prev => [...prev, ...transformedItems])
      } else {
        setItems(transformedItems)
      }
      
      setCurrentPage(data.currentPage || 0)
      setTotalPages(data.totalPages || 1)
      setTotalItems(data.totalElements || transformedItems.length)
      setHasMore(data.hasMore || false)

      // Store current filters for load more functionality
      setCurrentFilters(filters)

    } catch (err) {
      console.error("Error fetching lost items:", err)
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    searchLostItems({
      query: "",
      category: "ALL",
      status: "LOST",
      location: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "newest"
    })
  }, [])

  const handleSearch = (filters: SearchFilters) => {
    setCurrentPage(0)
    searchLostItems(filters, 0, false)
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    searchLostItems(currentFilters, nextPage, true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getCategoryColor = (category: string) => {
    const normalizedCategory = category?.toUpperCase() || 'MISCELLANEOUS'
    const colors: Record<string, string> = {
      ELECTRONICS: "bg-blue-100 text-blue-800",
      CLOTHING: "bg-purple-100 text-purple-800",
      BAGS: "bg-green-100 text-green-800",
      ACCESSORIES: "bg-yellow-100 text-yellow-800",
      DOCUMENTS: "bg-red-100 text-red-800",
      KEYS: "bg-gray-100 text-gray-800",
      JEWELRY: "bg-pink-100 text-pink-800",
      BOOKS: "bg-indigo-100 text-indigo-800",
      SPORTS: "bg-orange-100 text-orange-800",
      MISCELLANEOUS: "bg-slate-100 text-slate-800",
      BAG: "bg-green-100 text-green-800", // Handle frontend format
      ACCESSORY: "bg-yellow-100 text-yellow-800",
      DOCUMENT: "bg-red-100 text-red-800",
      OTHER: "bg-slate-100 text-slate-800"
    }
    return colors[normalizedCategory] || "bg-gray-100 text-gray-800"
  }

  const getCategoryLabel = (category: string) => {
    const normalizedCategory = category?.toUpperCase() || 'MISCELLANEOUS'
    const labels: Record<string, string> = {
      ELECTRONICS: "Électronique",
      CLOTHING: "Vêtements", 
      BAGS: "Sacs",
      ACCESSORIES: "Accessoires",
      DOCUMENTS: "Documents",
      KEYS: "Clés",
      JEWELRY: "Bijoux",
      BOOKS: "Livres",
      SPORTS: "Sport",
      MISCELLANEOUS: "Divers",
      BAG: "Sacs", // Handle frontend format
      ACCESSORY: "Accessoires",
      DOCUMENT: "Documents",
      OTHER: "Divers"
    }
    return labels[normalizedCategory] || normalizedCategory
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Package className="h-8 w-8 text-red-600" />
          Objets Perdus
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Recherchez parmi les objets signalés comme perdus. Utilisez les filtres pour affiner votre recherche 
          et retrouver plus facilement ce que vous cherchez.
        </p>
        {totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            {totalItems} objet{totalItems > 1 ? 's' : ''} perdu{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search Component */}
      <AdvancedSearch 
        onSearch={handleSearch}
        loading={loading}
        showStatusFilter={false}
        defaultStatus="LOST"
        placeholder="Rechercher parmi les objets perdus..."
      />

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement des objets perdus...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun objet perdu trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Aucun objet ne correspond à vos critères de recherche.
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre terme de recherche.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      {items.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 w-full bg-gray-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {item.claimed && (
                    <Badge className="absolute top-2 right-2 bg-green-600">
                      Réclamé
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                    <Badge className={getCategoryColor(item.category)}>
                      {getCategoryLabel(item.category)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{item.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.reportedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Signalé par {item.reportedByUsername}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <Link href={`/items/${item.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button 
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Charger plus d'objets
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center text-sm text-muted-foreground">
            Page {currentPage + 1} sur {totalPages} • {totalItems} objet{totalItems > 1 ? 's' : ''} au total
          </div>
        </>
      )}
    </div>
  )
}