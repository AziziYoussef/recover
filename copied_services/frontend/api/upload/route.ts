import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadImage } from "@/lib/cloudinary";
import { extractImageFeatures } from "@/lib/ai/feature-extraction";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Check authentication
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (err) {
      console.warn("Session error:", err);
    }
    
    // In development, allow uploads without authentication
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse form data with file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const imageData = await uploadImage(buffer);

    // Extract image features for AI matching (if available)
    let features = null;
    try {
      features = await extractImageFeatures(imageData.url);
    } catch (error) {
      console.warn("Feature extraction failed:", error);
      // Continue without features if extraction fails
    }

    return NextResponse.json({
      success: true,
      image: {
        url: imageData.url,
        publicId: imageData.publicId,
        width: imageData.width,
        height: imageData.height,
        features,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}

// Configure Next.js to handle larger file sizes
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
}; 