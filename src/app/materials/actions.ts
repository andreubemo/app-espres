"use server"

import { createMaterial } from "@/server/services/material.service"
import { revalidatePath } from "next/cache"

export async function createMaterialAction(data: {
  name: string
  description?: string
  unit: string
  price: number
  companyId: string
}) {
  await createMaterial(data)

  revalidatePath("/materials")
}
