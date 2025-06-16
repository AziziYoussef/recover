"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Upload, Loader2, X } from "lucide-react"
import { PageContainer } from "@/components/page-container"

// Form validation schema
const reportSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(10, "Please provide a detailed description"),
  category: z.string().min(1, "Please select a category"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  image: z.string().min(1, "Please upload an image of the item"),
  contactInformation: z.string().optional()
})

type ReportFormValues = z.infer<typeof reportSchema>

export default function ReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      category: "",
      time: "",
      contactInformation: session?.user?.email || ""
    }
  })

  // Set date and image when they change
  if (date) {
    setValue("date", date)
  }

  if (uploadedImage) {
    setValue("image", uploadedImage)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset any previous errors
    setError(null)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File must be an image")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

      setIsUploading(true)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload image to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      setUploadedImage(data.image.url)
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image. Please try again.")
    } finally {
        setIsUploading(false)
    }
  }

  const onSubmit = async (data: ReportFormValues) => {
    if (status === "unauthenticated") {
      // Save form data to session storage and redirect to sign in
      sessionStorage.setItem("reportFormData", JSON.stringify(data))
      router.push("/auth/signin?callbackUrl=/report&reason=report")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Format date for submission
      const formattedDate = format(data.date, "yyyy-MM-dd")

      // Prepare coordinates (in a real app, this would be from a map picker)
      const coordinates = {
        x: Math.floor(Math.random() * 500), // Mock coordinates for demo
        y: Math.floor(Math.random() * 400),
        lat: 40.7128 + (Math.random() * 0.01), // Mock NYC area coordinates
        lng: -74.006 + (Math.random() * 0.01)
      }

      // Submit to API
      const response = await fetch("/api/lost-objects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          date: formattedDate,
          coordinates
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to submit report")
      }

      // Success
      setSuccess(true)
      reset()
      setUploadedImage(null)
      
      // Redirect to confirmation page after a short delay
    setTimeout(() => {
        router.push("/lost-objects")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your report")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Report a Found Item</h1>
          <p className="text-muted-foreground">
            Fill out the form below with details about the item you found
          </p>
        </div>

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-700">
            <AlertDescription>
              Your item has been reported successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <Card className="transform-gpu">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>
              Provide as much information as possible to help someone find their lost item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Black Backpack"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      onValueChange={(value) => setValue("category", value)}
                      defaultValue=""
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the item in detail (color, brand, distinguishing features, etc.)"
                    rows={4}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date Found</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Approximate Time</Label>
                    <Input
                      id="time"
                      type="time"
                      {...register("time")}
                    />
                    {errors.time && (
                      <p className="text-sm text-destructive">{errors.time.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Found Location</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="location"
                      placeholder="e.g., Library, 2nd Floor"
                      className="flex-1"
                      {...register("location")}
                    />
                    <Button type="button" variant="outline" size="icon" title="Pick location on map">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Upload Image</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 relative">
                    {uploadedImage ? (
                      <div className="relative w-full h-48">
                        <img
                          src={uploadedImage}
                          alt="Uploaded item"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setUploadedImage(null)
                            setValue("image", "")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {isUploading ? (
                          <div className="flex flex-col items-center justify-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading image...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Drag and drop or click to upload</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 5MB)</p>
                            <Input
                              id="image"
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleImageUpload}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                  {errors.image && (
                    <p className="text-sm text-destructive">{errors.image.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInformation">Contact Information (Optional)</Label>
                  <Input
                    id="contactInformation"
                    placeholder="Email or phone number where you can be reached"
                    {...register("contactInformation")}
                    defaultValue={session?.user?.email || ""}
                  />
                </div>
              </div>

              <CardFooter className="px-0 pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isUploading || success}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

