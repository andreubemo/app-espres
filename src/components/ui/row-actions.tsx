"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateItem(id: number, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();

  if (!name || !category || !unit || !priceRaw) {
    throw new Error("Todos los campos son obligatorios");
  }

  const price = Number(priceRaw);
  if (Number.isNaN(price)) {
    throw new Error("Precio inválido");
  }

  const updated = await prisma.item.update({
    where: { id },
    data: {
      name,
      category,
      unit,
      price,
    },
  });

  revalidatePath("/");

  return updated;
}
