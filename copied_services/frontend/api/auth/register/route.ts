import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

// User registration schema for validation
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactInformation: z.string().optional(),
});

// Define the User type to avoid type errors
type MockUser = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  contactInformation?: string;
};

// Mock database for development
let mockUsers: MockUser[] = [
  {
    _id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: bcrypt.hashSync("password123", 12),
    role: "user",
    contactInformation: "555-123-4567",
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, contactInformation } = validation.data;

    // In development, simulate database operations with mock data
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user in mock database
    const newUser: MockUser = {
      _id: `user-${mockUsers.length + 1}`,
      name,
      email,
      password: hashedPassword,
      contactInformation,
      role: "user",
    };
    
    mockUsers.push(newUser);

    // Remove password from response
    const safeUser = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };

    console.log("User registered successfully:", email);
    
    return NextResponse.json(
      { message: "User registered successfully", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 