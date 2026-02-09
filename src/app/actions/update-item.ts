"use server";

import { prisma } from "@/lib/prisma";

export async function updateItem(id: number, formData: FormData) {
  const name = String(formData.get("name"));
  const category = String(formData.get("category"));
  const unit = String(formData.get("unit"));
  const price = Number(formData.get("price"));

  if (!name || !category || !unit || isNaN(price)) {
    throw new Error("Datos inválidos");
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

  return updated;
}
