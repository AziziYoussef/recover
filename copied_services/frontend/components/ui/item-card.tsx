import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ItemCardProps {
  id: string
  title: string
  description: string
  category: string
  status: "lost" | "found" | "claimed" | "returned"
  date: string
  time?: string
  location?: string
  image: string
  className?: string
}

export function ItemCard({
  id,
  title,
  description,
  category,
  status,
  date,
  time,
  location,
  image,
  className,
}: ItemCardProps) {
  const statusColors = {
    lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    found: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    claimed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    returned: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  }

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 card-hover", className)}>
      <div className="relative aspect-square w-full overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <Badge className={cn("px-2 py-1", statusColors[status])}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-all duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {description}
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{date}</span>
            {time && (
              <>
                <Clock className="h-3.5 w-3.5 ml-2" />
                <span>{time}</span>
              </>
            )}
          </div>
          {location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/lost-objects/${id}`} className="w-full">
          <Button variant="outline" className="w-full group">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
} 