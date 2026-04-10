import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      companyId: string
      type: string
    }
  }

  interface User {
    id: string
    role: string
    companyId: string
    type: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    companyId: string
    type: string
  }
}
