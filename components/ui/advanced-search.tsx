"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Calendar, MapPin, Tag, SortAsc } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SearchFilters {
  query: string
  category: string
  status: string
  location: string
  dateFrom: string
  dateTo: string
  sortBy: string
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
  showStatusFilter?: boolean
  defaultStatus?: string
  placeholder?: string
}

const categories = [
  { value: "ALL", label: "Toutes les catégories" },
  { value: "ELECTRONICS", label: "Électronique" },
  { value: "CLOTHING", label: "Vêtements" },
  { value: "BAGS", label: "Sacs" },
  { value: "ACCESSORIES", label: "Accessoires" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "KEYS", label: "Clés" },
  { value: "JEWELRY", label: "Bijoux" },
  { value: "BOOKS", label: "Livres" },
  { value: "SPORTS", label: "Sport" },
  { value: "MISCELLANEOUS", label: "Divers" }
]

const statuses = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "LOST", label: "Perdus" },
  { value: "FOUND", label: "Trouvés" },
  { value: "CLAIMED", label: "Réclamés" }
]

const sortOptions = [
  { value: "newest", label: "Plus récents" },
  { value: "date_asc", label: "Plus anciens" },
  { value: "name", label: "Nom (A-Z)" },
  { value: "category", label: "Catégorie" },
  { value: "location", label: "Lieu" }
]

export default function AdvancedSearch({ 
  onSearch, 
  loading = false, 
  showStatusFilter = true,
  defaultStatus = "ALL",
  placeholder = "Rechercher par nom, description ou lieu..." 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "ALL",
    status: defaultStatus,
    location: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "newest"
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Count active filters
  useEffect(() => {
    let count = 0
    if (filters.query.trim()) count++
    if (filters.category !== "ALL") count++
    if (showStatusFilter && filters.status !== "ALL") count++
    if (filters.location.trim()) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    setActiveFiltersCount(count)
  }, [filters, showStatusFilter])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleClearFilters = () => {
    setFilters({
      query: "",
      category: "ALL",
      status: defaultStatus,
      location: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "newest"
    })
    onSearch({
      query: "",
      category: "ALL",
      status: defaultStatus,
      location: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "newest"
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          Recherche avancée
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="px-6"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showStatusFilter && (
            <div className="flex items-center gap-2">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? "Masquer" : "Afficher"} les filtres avancés
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lieu
                </Label>
                <Input
                  id="location"
                  placeholder="Ex: Bibliothèque, Cafétéria..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Période
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                      Du
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                      Au
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex justify-center pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Effacer tous les filtres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}