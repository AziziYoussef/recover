"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Package, CheckCircle, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SearchNavigation() {
  const pathname = usePathname()

  const navigationItems = [
    {
      href: "/search",
      label: "Recherche Globale",
      icon: Search,
      description: "Recherche par texte et image dans tous les objets",
      isActive: pathname === "/search"
    },
    {
      href: "/lost-items", 
      label: "Objets Perdus",
      icon: Package,
      description: "Parcourir les objets signalés comme perdus",
      isActive: pathname === "/lost-items"
    },
    {
      href: "/found-items",
      label: "Objets Trouvés", 
      icon: CheckCircle,
      description: "Voir les objets qui ont été trouvés",
      isActive: pathname === "/found-items"
    }
  ]

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant={item.isActive ? "default" : "outline"}
                  className={cn(
                    "w-full h-auto p-4 flex flex-col items-center gap-2 text-center",
                    item.isActive && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{item.label}</div>
                    <div className="text-xs opacity-75 leading-tight">
                      {item.description}
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}