"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, User, Mail, Phone, MapPin, Save, X } from "lucide-react"
import { useSession } from "next-auth/react"

// Profile validation schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface UserProfile {
  id: number
  username: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  roles: string[]
  createdAt: string
  updatedAt: string
}

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileUpdate?: (profile: UserProfile) => void
}

export default function EditProfileModal({ open, onOpenChange, onProfileUpdate }: EditProfileModalProps) {
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      address: "",
    }
  })

  // Fetch profile data when modal opens
  useEffect(() => {
    if (open && session?.user) {
      fetchProfile()
    }
  }, [open, session])

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First try to fetch from backend
      const response = await fetch('/api/profile')
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        
        // Update form with profile data
        setValue("firstName", data.firstName || "")
        setValue("lastName", data.lastName || "")
        setValue("email", data.email || "")
        setValue("phone", data.phone || "")
        setValue("bio", data.bio || "")
        setValue("address", data.address || "")
      } else {
        // If backend call fails, use session data as fallback
        console.log("Backend profile fetch failed, using session data")
        
        // Parse name from session if available
        const fullName = session?.user?.name || ""
        const nameParts = fullName.split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""
        
        const fallbackProfile = {
          id: parseInt(session?.user?.id || "0"),
          username: session?.user?.email?.split("@")[0] || "",
          email: session?.user?.email || "",
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          phone: "",
          bio: "",
          address: "",
          avatarUrl: session?.user?.image || "",
          roles: session?.user?.roles || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setProfile(fallbackProfile)
        
        // Update form with session data
        setValue("firstName", firstName)
        setValue("lastName", lastName)
        setValue("email", session?.user?.email || "")
        setValue("phone", "")
        setValue("bio", "")
        setValue("address", "")
      }
      
    } catch (err) {
      console.error("Error fetching profile:", err)
      
      // Use session data as final fallback
      if (session?.user) {
        const fullName = session.user.name || ""
        const nameParts = fullName.split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""
        
        setValue("firstName", firstName)
        setValue("lastName", lastName)
        setValue("email", session.user.email || "")
        setValue("phone", "")
        setValue("bio", "")
        setValue("address", "")
        
        // Set basic profile for display
        setProfile({
          id: parseInt(session.user.id || "0"),
          username: session.user.email?.split("@")[0] || "",
          email: session.user.email || "",
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          phone: "",
          bio: "",
          address: "",
          avatarUrl: session.user.image || "",
          roles: session.user.roles || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } else {
        setError("Unable to load profile data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    console.log("Profile form submitted with data:", data)
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Try to update via backend API first
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // Backend update successful
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setSuccess(true)
        
        // Update session data
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
          }
        })

        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(updatedProfile)
        }

        // Close modal after a short delay
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(false)
        }, 1500)
      } else {
        // Backend update failed, update session only
        console.log("Backend profile update failed, updating session only")
        
        // Update session data with new information
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
          }
        })
        
        // Create updated profile object for local state
        const updatedProfile = {
          ...profile,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || "",
          bio: data.bio || "",
          address: data.address || "",
          fullName: `${data.firstName} ${data.lastName}`,
          updatedAt: new Date().toISOString()
        }
        
        setProfile(updatedProfile)
        setSuccess(true)
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate(updatedProfile)
        }

        // Show success message and close
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(false)
        }, 1500)
      }

    } catch (err: any) {
      console.error("Profile update error:", err)
      
      // Even if there's an error, try to update the session with basic info
      try {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
          }
        })
        
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(false)
        }, 1500)
      } catch (sessionErr) {
        setError("Unable to update profile. Please try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setError(null)
    setSuccess(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your profile information. Your changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading profile...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-700">
            <AlertDescription>Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {!isLoading && profile && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Debug info */}
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <div>Form errors: {JSON.stringify(errors)}</div>
              <div>Profile loaded: {profile ? 'Yes' : 'No'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  {...register("firstName")}
                  disabled={isSaving}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  {...register("lastName")}
                  disabled={isSaving}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register("email")}
                disabled={isSaving}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...register("phone")}
                disabled={isSaving}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address (Optional)
              </Label>
              <Input
                id="address"
                placeholder="Enter your address"
                {...register("address")}
                disabled={isSaving}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a little about yourself..."
                rows={3}
                {...register("bio")}
                disabled={isSaving}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  console.log("Test button clicked")
                  console.log("Current form errors:", errors)
                  console.log("Form is valid:", Object.keys(errors).length === 0)
                }}
              >
                Test
              </Button>
              <Button
                type="submit"
                disabled={isSaving || success}
                onClick={() => console.log("Save button clicked")}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}