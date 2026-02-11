import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email = credentials.email as string
        const password = credentials.password as string
        
        if (!email || !password) {
          return null
        }

        // Primero buscamos en usuarios internos
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (user) {
          const valid = await bcrypt.compare(
            password,
            user.password
          )

          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            type: "USER",
          }
        }

        // Si no es usuario interno, buscamos cliente
        const client = await prisma.client.findFirst({
          where: { email },
        })

        if (client) {
          const valid = await bcrypt.compare(
            password,
            client.password
          )

          if (!valid) return null

          return {
            id: client.id,
            email: client.email,
            role: "CLIENT",
            companyId: client.companyId,
            type: "CLIENT",
          }
        }

        return null
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
        token.type = user.type
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.type = token.type as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
})
