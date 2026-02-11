"use server"

import { createMaterial } from "@/server/services/material.service"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

export async function createMaterialAction(data: {
  name: string
  description?: string
  unit: string
  price: number
}) {
  const session = await getServerSession()

  // Control por rol
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  await createMaterial({
    name: data.name,
    description: data.description,
    unit: data.unit,
    price: data.price,
    companyId: session.user.companyId, // Siempre desde sesión
  })

  revalidatePath("/materials")
}
