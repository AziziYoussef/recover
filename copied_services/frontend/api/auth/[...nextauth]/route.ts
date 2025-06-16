import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-options"

// Export authOptions for use in other files
export { authOptions }

// Export the NextAuth handler
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
