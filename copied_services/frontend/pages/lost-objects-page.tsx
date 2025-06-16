"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, Clock, Filter, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

interface LostObject {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  image: string;
  category: string;
  description?: string;
  status?: string;
}

export default function LostObjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "")
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all")
  const [objects, setObjects] = useState<LostObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  // Load objects when search parameters change
  useEffect(() => {
    const loadObjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          size: "12",
        });
        
        if (searchTerm) params.append("query", searchTerm);
        if (activeCategory !== "all") params.append("category", activeCategory);
        
        // Fetch data from API
        const response = await fetch(`/api/lost-objects?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch objects");
        }
        
        const data = await response.json();
        
        setObjects(data.objects);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        
        // Update URL without reloading page
        const newParams = new URLSearchParams(searchParams);
        if (searchTerm) newParams.set("query", searchTerm);
        if (activeCategory !== "all") newParams.set("category", activeCategory);
        router.push(`/lost-objects?${newParams.toString()}`, { scroll: false });
        
      } catch (err) {
        console.error("Error loading objects:", err);
        setError("Failed to load objects. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadObjects();
  }, [searchTerm, activeCategory, currentPage, router, searchParams]);

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // Reset to first page on new search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(0); // Reset to first page on category change
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Lost Objects</h1>
          <p className="text-muted-foreground">
            Browse through recently detected lost objects or search for specific items
          </p>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Link href="/map">
              <Button variant="outline">View Map</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={handleCategoryChange}>
          <TabsList className="grid grid-cols-5 w-full max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bag">Bags</TabsTrigger>
            <TabsTrigger value="electronics">Electronics</TabsTrigger>
            <TabsTrigger value="accessory">Accessories</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : objects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No objects found. Try adjusting your search criteria.
            </div>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {objects.map((object) => (
                <LostObjectCard key={object.id} object={object} />
              ))}
            </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      Next
                    </Button>
            </div>
                )}
              </>
            )}
            </div>
        </Tabs>
      </div>
    </div>
  )
}

function LostObjectCard({ object }: { object: LostObject }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <Image 
          src={object.image || "/placeholder.svg"} 
          alt={object.name} 
          fill 
          className="object-cover"
        />
      </div>
      <CardHeader>
        <CardTitle>{object.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{object.location}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{object.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{object.time}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/lost-objects/${object.id}`}>
          View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
