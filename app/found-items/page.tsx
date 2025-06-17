"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Search as SearchIcon, Calendar, MapPin, User, Eye, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AdvancedSearch from "@/components/ui/advanced-search"

interface FoundItem {
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

export default function FoundItemsPage() {
  const [items, setItems] = useState<FoundItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const searchFoundItems = async (filters: SearchFilters, page = 0, append = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "12",
        ...(filters.query && { query: filters.query }),
        ...(filters.category !== "ALL" && { category: filters.category }),
        ...(filters.location && { location: filters.location }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.sortBy && { sortBy: filters.sortBy })
      })

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/api/items/found?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Impossible de charger les objets trouvés`)
      }

      const data = await response.json()
      
      if (append) {
        setItems(prev => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }
      
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)
      setTotalItems(data.totalItems)
      setHasMore(data.hasMore)

    } catch (err) {
      console.error("Error fetching found items:", err)
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    searchFoundItems({
      query: "",
      category: "ALL",
      status: "FOUND",
      location: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "newest"
    })
  }, [])

  const handleSearch = (filters: SearchFilters) => {
    setCurrentPage(0)
    searchFoundItems(filters, 0, false)
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    searchFoundItems({
      query: "",
      category: "ALL", 
      status: "FOUND",
      location: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "newest"
    }, nextPage, true)
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
      MISCELLANEOUS: "bg-slate-100 text-slate-800"
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  const getCategoryLabel = (category: string) => {
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
      MISCELLANEOUS: "Divers"
    }
    return labels[category] || category
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
          Objets Trouvés
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Parcourez les objets qui ont été trouvés et signalés. Vous reconnaissez quelque chose qui vous appartient ? 
          Contactez la personne qui l'a trouvé !
        </p>
        {totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            {totalItems} objet{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''} disponible{totalItems > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search Component */}
      <AdvancedSearch 
        onSearch={handleSearch}
        loading={loading}
        showStatusFilter={false}
        defaultStatus="FOUND"
        placeholder="Rechercher parmi les objets trouvés..."
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
          <span className="ml-2 text-muted-foreground">Chargement des objets trouvés...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun objet trouvé</h3>
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
                      <CheckCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-green-600">
                    Trouvé
                  </Badge>
                  {item.claimed && (
                    <Badge className="absolute top-2 right-2 bg-blue-600">
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
                      <span>Trouvé par {item.reportedByUsername}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm" asChild>
                      <Link href={`/items/${item.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Link>
                    </Button>
                    {!item.claimed && (
                      <Button className="flex-1" size="sm">
                        C'est à moi !
                      </Button>
                    )}
                  </div>
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