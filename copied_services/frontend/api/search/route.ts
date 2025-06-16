import { NextResponse } from "next/server"

// Mock database for lost objects (same as in lost-objects route)
const MOCK_LOST_OBJECTS = [
  {
    id: 1,
    name: "Black Backpack",
    location: "Library, 2nd Floor",
    date: "2025-05-15",
    time: "14:30",
    image: "/placeholder.svg?height=200&width=200",
    category: "bag",
    description: "Black backpack with red logo, contains laptop and notebooks",
    status: "found",
    coordinates: { x: 150, y: 120 },
  },
  {
    id: 2,
    name: "Blue Smartphone",
    location: "Cafeteria",
    date: "2025-05-16",
    time: "12:15",
    image: "/placeholder.svg?height=200&width=200",
    category: "electronics",
    description: "Samsung Galaxy S22, blue case with scratches on screen",
    status: "found",
    coordinates: { x: 320, y: 280 },
  },
  // More objects would be here in a real implementation
]

// POST /api/search
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // This would be where the image matching algorithm would run
    // For now, we'll simulate results with mock data and random match scores

    if (data.searchType === "photo") {
      // In a real implementation, this would:
      // 1. Process the uploaded image
      // 2. Extract features or embeddings
      // 3. Compare with database images
      // 4. Return matches with confidence scores

      // For demo purposes, return mock results with simulated match scores
      const results = MOCK_LOST_OBJECTS.filter((obj) => obj.category === (data.category || obj.category))
        .map((obj) => ({
          ...obj,
          matchScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-99
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5) // Return top 5 matches

      return NextResponse.json({ results })
    } else if (data.searchType === "details") {
      // Filter objects based on provided details
      let filteredObjects = [...MOCK_LOST_OBJECTS]

      if (data.category) {
        filteredObjects = filteredObjects.filter((obj) => obj.category === data.category)
      }

      if (data.color) {
        filteredObjects = filteredObjects.filter((obj) =>
          obj.description.toLowerCase().includes(data.color.toLowerCase()),
        )
      }

      if (data.description) {
        const keywords = data.description.toLowerCase().split(" ")
        filteredObjects = filteredObjects.filter((obj) =>
          keywords.some(
            (keyword) => obj.name.toLowerCase().includes(keyword) || obj.description.toLowerCase().includes(keyword),
          ),
        )
      }

      if (data.location) {
        filteredObjects = filteredObjects.filter((obj) =>
          obj.location.toLowerCase().includes(data.location.toLowerCase()),
        )
      }

      // Calculate a simple relevance score
      const results = filteredObjects
        .map((obj) => {
          let score = 70 // Base score

          // Increase score based on matches
          if (data.category && obj.category === data.category) score += 10
          if (data.color && obj.description.toLowerCase().includes(data.color.toLowerCase())) score += 5
          if (data.location && obj.location.toLowerCase().includes(data.location.toLowerCase())) score += 5

          return {
            ...obj,
            matchScore: Math.min(score, 99), // Cap at 99
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)

      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: "Invalid search type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process search request" }, { status: 500 })
  }
}
