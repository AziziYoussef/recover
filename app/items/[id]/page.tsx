"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, MapPin, Calendar, User, Mail, Phone, MessageSquare, Flag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ItemDetails {
  id: number
  name: string
  description: string
  category: string
  location: string
  imageUrl: string
  reportedAt: string
  reportedByUsername: string
  reportedByEmail?: string
  reportedByPhone?: string
  status: string
  latitude?: number
  longitude?: number
  contactInformation?: string
  claimed: boolean
}

export default function ItemDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<ItemDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await fetch(`/api/items/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Item not found")
            return
          }
          throw new Error(`Error ${response.status}: Failed to load item details`)
        }

        const data = await response.json()
        setItem(data)
      } catch (err) {
        console.error("Error fetching item details:", err)
        setError(err instanceof Error ? err.message : "Failed to load item details")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchItemDetails()
    }
  }, [params.id])

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
    }
    return labels[normalizedCategory] || normalizedCategory
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LOST':
        return "bg-red-100 text-red-800"
      case 'FOUND':
        return "bg-green-100 text-green-800"
      case 'CLAIMED':
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LOST':
        return "Perdu"
      case 'FOUND':
        return "Trouvé"
      case 'CLAIMED':
        return "Réclamé"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading item details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">Item not found</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <p className="text-muted-foreground">Détails de l'objet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <Card>
            <CardContent className="p-6">
              <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
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
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>

          {/* Location and Map */}
          {(item.latitude && item.longitude) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{item.location}</p>
                <Button variant="outline" asChild>
                  <Link href={`/map?lat=${item.latitude}&lng=${item.longitude}&item=${item.id}`}>
                    Voir sur la carte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status and Details */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut:</span>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Catégorie:</span>
                <Badge className={getCategoryColor(item.category)}>
                  {getCategoryLabel(item.category)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(item.reportedAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{item.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>
                Signalé par
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{item.reportedByUsername}</span>
              </div>

              {item.reportedByEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{item.reportedByEmail}</span>
                </div>
              )}

              {item.reportedByPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{item.reportedByPhone}</span>
                </div>
              )}

              {item.contactInformation && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Informations de contact additionnelles:</p>
                  <p className="text-sm">{item.contactInformation}</p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button className="w-full" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
                
                {item.status === 'FOUND' && !item.claimed && (
                  <Button variant="outline" className="w-full" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    Réclamer cet objet
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}