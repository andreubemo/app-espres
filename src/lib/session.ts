import { auth } from "@/lib/auth"

export async function getServerSession() {
  const session = await auth()

  if (!session?.user) {
    throw new Error("No authenticated user")
  }

  return session
}
