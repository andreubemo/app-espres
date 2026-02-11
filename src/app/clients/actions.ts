"use server"

import { getServerSession } from "@/lib/session"
import { createClient } from "@/server/services/client.service"
import { revalidatePath } from "next/cache"
import bcrypt from "bcrypt"

export async function createClientAction(data: {
  name: string
  email: string
  password: string
}) {
  const session = await getServerSession()

  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  await createClient({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    companyId: session.user.companyId,
  })

  revalidatePath("/clients")
}
