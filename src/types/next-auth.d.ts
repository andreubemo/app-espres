import "next-auth"
import type { Role } from "@/generated/prisma"

type SessionUserType = "USER" | "CLIENT"
type SessionRole = Role | "CLIENT"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: SessionRole
      companyId: string
      type: SessionUserType
    }
  }

  interface User {
    id: string
    role: SessionRole
    companyId: string
    type: SessionUserType
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: SessionRole
    companyId: string
    type: SessionUserType
  }
}
