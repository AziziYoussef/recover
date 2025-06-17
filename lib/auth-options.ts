import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"

// Add custom types to extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string
    role?: string
    roles?: string[]
    accessToken?: string
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      roles?: string[]
    }
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    roles?: string[]
    accessToken?: string
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Temporary admin login for development
          if (credentials.email === 'admin@recovr.com' && credentials.password === 'admin123') {
            return {
              id: '1',
              name: 'System Administrator',
              email: 'admin@recovr.com',
              role: 'admin',
              roles: ['ROLE_ADMIN'],
              accessToken: 'dev-admin-token',
              image: null
            }
          }

          // Call Spring Boot backend for authentication
          const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.email, // Backend expects username but we'll use email
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            console.log('Authentication failed:', response.status)
            return null
          }

          const data = await response.json()

          if (data.token) {
            return {
              id: data.id.toString(),
              name: data.username,
              email: data.email,
              role: data.roles?.[0]?.replace('ROLE_', '').toLowerCase() || 'user',
              roles: data.roles || [],
              accessToken: data.token,
              image: null
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          
          // Fallback admin login if backend is not available
          if (credentials.email === 'admin@recovr.com' && credentials.password === 'admin123') {
            return {
              id: '1',
              name: 'System Administrator',
              email: 'admin@recovr.com',
              role: 'admin',
              roles: ['ROLE_ADMIN'],
              accessToken: 'dev-admin-token',
              image: null
            }
          }
          
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roles = user.roles
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.roles = token.roles
      }
      session.accessToken = token.accessToken
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "ThisIsATemporarySecretForDevelopmentOnly",
  debug: process.env.NODE_ENV === "development",
} 