"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateItem(
  id: number,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const priceRaw = formData.get("price");
  const price = Number(priceRaw);

  if (!name || !category || !unit || Number.isNaN(price)) {
    throw new Error("Datos inválidos");
  }

  await prisma.item.update({
    where: { id },
    data: { name, category, unit, price },
  });

  // 🔄 refresca la página (App Router)
  revalidatePath("/");
}
