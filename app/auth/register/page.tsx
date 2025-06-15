"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

// Form validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log("Attempting to register:", data.email);
      
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.message || "Registration failed")
        setLoading(false)
        return
      }

      const result = await response.json()
      setSuccess(true)
      
      // Redirect to sign in page after short delay
      setTimeout(() => {
        router.push("/auth/signin")
      }, 2000)
    } catch (err) {
      setError("An error occurred during registration. Please make sure the backend server is running.")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-muted-foreground mt-3">Register to report and find lost items</p>
          
          {/* Development mode notice */}
          <Alert className="mt-6 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Make sure the Spring Boot backend is running on port 8080 before registering
            </AlertDescription>
          </Alert>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Register</CardTitle>
            <CardDescription className="text-center">Enter your details to create a new account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <AlertDescription>
                    Registration successful! Redirecting to sign in...
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="johndoe" 
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  {...register("password")} 
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 234 567 8900" 
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full" disabled={loading || success}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 