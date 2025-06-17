"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Settings } from "lucide-react"
import Link from "next/link"
import EditProfileModal from "@/components/edit-profile-modal"
import SimpleProfileModal from "@/components/simple-profile-modal"
import UltraSimpleModal from "@/components/ultra-simple-modal"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  // Load saved profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userProfile')
      if (saved) {
        try {
          const profile = JSON.parse(saved)
          console.log("📱 Loaded profile from localStorage:", profile)
          setUserProfile(profile)
        } catch (e) {
          console.error("Error parsing saved profile:", e)
        }
      }
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/auth/signin")
  }

  // Debug session data
  console.log("Dashboard session data:", session)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {userProfile?.name || session.user?.name}! Manage your profile and view your activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{userProfile?.name || session.user?.name || "Not provided"}</p>
                {userProfile && (
                  <p className="text-xs text-green-600">✅ Updated profile</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{session.user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div>
                  <Badge variant={session.user?.role === 'admin' ? 'default' : 'secondary'}>
                    {session.user?.role === 'admin' ? 'Administrator' : 'User'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Recently joined</p>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/report">
                📝 Report Lost Item
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/search">
                🔍 Search Items
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/lost-objects">
                📋 View All Items
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/map">
                🗺️ View Map
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent actions and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity to show.</p>
              <p className="text-sm mt-2">Start by reporting a lost item or searching for found items!</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel Access */}
        {session.user?.role === 'admin' && (
          <Card className="md:col-span-2 lg:col-span-3 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-700 dark:text-orange-300">Administrator Panel</CardTitle>
              <CardDescription className="text-orange-600 dark:text-orange-400">
                You have administrator privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Access Admin Panel
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Profile Modal */}
      <UltraSimpleModal
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
    </div>
  )
}