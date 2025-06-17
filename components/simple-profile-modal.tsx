"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"

interface SimpleProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SimpleProfileModal({ open, onOpenChange }: SimpleProfileModalProps) {
  const { data: session, update: updateSession } = useSession()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    console.log("🔥 SAVE BUTTON CLICKED!")
    console.log("Current data:", { firstName, lastName, email })
    console.log("Session before update:", session)
    
    setIsSaving(true)
    
    try {
      console.log("🔄 Trying to update session...")
      
      // Simple update without deep merge
      const result = await updateSession({
        user: {
          id: session?.user?.id,
          name: `${firstName} ${lastName}`,
          email: email,
          role: session?.user?.role,
          roles: session?.user?.roles
        }
      })
      
      console.log("✅ Session update result:", result)
      
      setSuccess(true)
      
      // Close after showing success
      setTimeout(() => {
        console.log("🚪 Closing modal...")
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
      
    } catch (err) {
      console.error("❌ Save error:", err)
      alert("Error: " + err.message)
    } finally {
      setIsSaving(false)
      console.log("🏁 Save process finished")
    }
  }

  // Initialize form when modal opens
  React.useEffect(() => {
    console.log("🚀 Modal open state changed:", open)
    console.log("📱 Session data:", session)
    
    if (open && session?.user) {
      const fullName = session.user.name || ""
      const nameParts = fullName.split(" ")
      setFirstName(nameParts[0] || "")
      setLastName(nameParts.slice(1).join(" ") || "")
      setEmail(session.user.email || "")
      
      console.log("📝 Form initialized with:", {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: session.user.email || ""
      })
    }
  }, [open, session])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Simple Profile Edit</DialogTitle>
          <DialogDescription>
            Test version - edit your basic profile information.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            Profile updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => {
              console.log("🧪 TEST BUTTON CLICKED!")
              alert("Test button works!")
            }}
          >
            Test
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}