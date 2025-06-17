"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"

interface UltraSimpleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UltraSimpleModal({ open, onOpenChange }: UltraSimpleModalProps) {
  const { data: session, update: updateSession } = useSession()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [message, setMessage] = useState("")

  // Initialize with session data when modal opens
  React.useEffect(() => {
    if (open && session?.user) {
      const fullName = session.user.name || ""
      const nameParts = fullName.split(" ")
      setFirstName(nameParts[0] || "")
      setLastName(nameParts.slice(1).join(" ") || "")
      console.log("🚀 Modal opened with session:", session.user)
    }
  }, [open, session])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ultra Simple Test Modal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>
          
          <div>
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>
          
          {message && (
            <div className="p-3 bg-green-100 text-green-800 rounded">
              {message}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Cancel clicked")
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => {
              console.log("Alert test clicked")
              alert("Alert button works!")
            }}
          >
            Alert Test
          </Button>
          
          <Button 
            onClick={async () => {
              console.log("💾 Save clicked with:", { firstName, lastName })
              setMessage("🔄 Saving...")
              
              try {
                const newName = `${firstName} ${lastName}`.trim()
                
                // Step 1: Try to save to database via backend
                console.log("🏛️ Attempting to save to database...")
                
                try {
                  const dbResponse = await fetch('/api/profile-simple', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      firstName,
                      lastName,
                      phone: '',
                      bio: '',
                      address: ''
                    }),
                  })

                  if (dbResponse.ok) {
                    const result = await dbResponse.json()
                    console.log("✅ Database update successful:", result)
                    setMessage(`✅ Saved to database: ${newName}`)
                    
                    // Update session after successful DB save
                    await updateSession({
                      ...session,
                      user: {
                        ...session?.user,
                        name: newName
                      }
                    })
                    
                    // Clear localStorage since DB is updated
                    localStorage.removeItem('userProfile')
                    
                    setTimeout(() => {
                      onOpenChange(false)
                      setMessage("")
                      window.location.reload()
                    }, 2000)
                    return
                  } else {
                    const error = await dbResponse.json()
                    console.log("⚠️ Database update failed:", error)
                    setMessage(`⚠️ DB failed: ${error.suggestion || 'Using local save'}`)
                  }
                } catch (dbError) {
                  console.log("⚠️ Database connection failed:", dbError)
                  setMessage("⚠️ DB offline - saving locally")
                }
                
                // Step 2: Fallback to localStorage if DB fails
                console.log("💾 Falling back to localStorage...")
                const userProfile = {
                  firstName,
                  lastName, 
                  name: newName,
                  email: session?.user?.email,
                  savedAt: new Date().toISOString(),
                  source: 'localStorage-fallback'
                }
                localStorage.setItem('userProfile', JSON.stringify(userProfile))
                console.log("💾 Saved to localStorage:", userProfile)
                
                // Update session
                await updateSession({
                  ...session,
                  user: {
                    ...session?.user,
                    name: newName
                  }
                })
                
                setMessage(`💾 Saved locally: ${newName}`)
                
                setTimeout(() => {
                  onOpenChange(false)
                  setMessage("")
                  window.location.reload()
                }, 2000)
                
              } catch (error) {
                console.error("❌ Error saving:", error)
                setMessage("❌ Error saving!")
              }
            }}
          >
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}