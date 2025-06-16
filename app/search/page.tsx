"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Search as SearchIcon, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"

interface SearchResult {
  id: string;
  name: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  category: string;
}

export default function SearchPage() {
  const [searchMethod, setSearchMethod] = useState<"image" | "text">("text")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleTextSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const params = new URLSearchParams({
        query: searchTerm,
        size: "20"
      })
      
      const response = await fetch(`${API_BASE_URL}/api/items/search?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to search objects")
      }
      
      const data = await response.json()
      console.log("Search API response:", data)
      
      const transformedResults = data.items ? data.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        location: item.location || 'Lieu non spécifié',
        date: item.reportedAt ? new Date(item.reportedAt).toISOString().split('T')[0] : 'Date inconnue',
        image: item.imageUrl || '/placeholder.svg',
        matchScore: 1.0, // Text search doesn't have match scores
        category: item.category?.toLowerCase() || 'other'
      })) : []
      
      setResults(transformedResults)
      
      if (transformedResults.length === 0) {
        setError("Aucun objet trouvé pour votre recherche")
      }
      
    } catch (err) {
      console.error("Error searching objects:", err)
      setError("Erreur lors de la recherche. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleImageSearch = async () => {
    console.log("Starting image search...", { uploadedImage: !!uploadedImage })
    
    if (!uploadedImage) {
      setError("Aucune image sélectionnée")
      return
    }

    setLoading(true)
    setError(null)
    setResults([]) // Clear previous results

    try {
      console.log("Preparing to upload image for search...")
      
      // Upload image directly to the backend matching service
      const formData = new FormData()
      formData.append("image", uploadedImage)

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = `${API_BASE_URL}/api/matching/search-by-image`;
      
      console.log("Making request to:", url)
      
      const response = await fetch(url, {
        method: "POST",
        body: formData
      })
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log("Search results received:", data)
      
      // Transform the matches to the expected format
      const transformedResults = data.matches ? data.matches.map((match: any) => ({
        id: match.itemId.toString(),
        name: match.itemName,
        location: match.location,
        date: match.reportedAt ? new Date(match.reportedAt).toISOString().split('T')[0] : 'Unknown Date',
        image: match.itemImageUrl || '/placeholder.svg',
        matchScore: match.confidence / 100, // Convert to 0-1 scale for display
        category: match.category?.toLowerCase() || 'other'
      })) : []
      
      console.log("Transformed results:", transformedResults)
      setResults(transformedResults)
      
      if (transformedResults.length === 0) {
        setError("Aucun objet correspondant trouvé")
      }
      
    } catch (err) {
      console.error("Error searching with image:", err)
      setError(`Erreur lors de la recherche: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Rechercher un objet perdu</h1>

        <Tabs defaultValue="text" value={searchMethod} onValueChange={(v) => setSearchMethod(v as "image" | "text")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="text">Recherche par texte</TabsTrigger>
            <TabsTrigger value="image">Recherche par image</TabsTrigger>
        </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>Recherche par texte</CardTitle>
                <CardDescription>
                  Entrez une description de l'objet que vous recherchez
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Ex: Sac à dos noir, téléphone Samsung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
                  />
                  <Button onClick={handleTextSearch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                      <SearchIcon className="h-4 w-4" />
                    )}
                    <span className="ml-2">Rechercher</span>
                      </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
        
          <TabsContent value="image">
          <Card>
            <CardHeader>
                <CardTitle>Recherche par image</CardTitle>
                <CardDescription>
                  Téléchargez une photo de l'objet que vous recherchez
                </CardDescription>
            </CardHeader>
            <CardContent>
                {imagePreview ? (
                  // Image uploaded - show preview and search button
                  <div className="space-y-4">
                    <div className="relative h-48 w-full border-2 border-solid border-gray-200 rounded-lg">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setUploadedImage(null)
                          setImagePreview(null)
                          setResults([])
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleImageSearch} 
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SearchIcon className="h-4 w-4" />
                        )}
                        <span className="ml-2">Rechercher</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedImage(null)
                          setImagePreview(null)
                          setResults([])
                        }}
                      >
                        Changer d'image
                      </Button>
                    </div>
                  </div>
                ) : (
                  // No image - show dropzone
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Glissez-déposez une image ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Formats acceptés: JPG, JPEG, PNG
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results.length > 0 && (
              <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Résultats de la recherche ({results.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((result) => (
                <Card key={result.id}>
                  <div className="relative h-48 w-full">
                              <Image
                      src={result.image}
                                alt={result.name}
                                fill
                      className="object-cover rounded-t-lg"
                              />
                    {result.matchScore && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        {Math.round(result.matchScore * 100)}% match
                      </Badge>
                    )}
                            </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.location}
                                </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(result.date)}
                          </p>
                    <Badge variant="outline" className="mt-2">
                      {result.category}
                    </Badge>
                  </CardContent>
                      </Card>
                    ))}
                  </div>
          </div>
        )}

        {!loading && results.length === 0 && searchTerm && (
          <div className="mt-8 text-center text-muted-foreground">
            Aucun résultat trouvé pour votre recherche
                </div>
              )}
      </div>
    </div>
  )
}
