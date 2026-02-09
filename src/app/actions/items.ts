"use server";

import { prisma } from "@/lib/prisma";

export async function getItems() {
  const items = await prisma.item.findMany({
    orderBy: { id: "asc" },
  });

  // 🔥 NORMALIZACIÓN PARA CLIENT COMPONENTS
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    price: Number(item.price), // Decimal → number
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}
