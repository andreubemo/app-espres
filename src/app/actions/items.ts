import { prisma } from "@/lib/prisma";

export async function getItems() {
  const items = await prisma.item.findMany({
    orderBy: { id: "asc" },
  });

  // 🔥 CONVERSIÓN A OBJETOS PLANOS
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    price: Number(item.price), // ← CLAVE
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}
