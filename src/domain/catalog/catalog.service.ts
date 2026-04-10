import { prisma } from "@/lib/prisma";

export async function getCatalogFamilies() {
  const materials = await prisma.material.findMany({
    select: {
      name: true,
    },
  });

  // extraemos la "familia" desde el nombre
  const families = new Set<string>();

  materials.forEach((m) => {
    const parts = m.name.split("|");
    if (parts.length > 0) {
      families.add(parts[0].trim());
    }
  });

  return Array.from(families);
}

export async function getItemsByFamily(family: string) {
  const materials = await prisma.material.findMany();

  return materials
    .filter((m) => m.name.startsWith(family))
    .map((m) => {
      const parts = m.name.split("|").map((p) => p.trim());

      return {
        id: m.id,
        family: parts[0] || family,
        material: parts[2] || "",
        item: parts[3] || m.name,
        unit: m.unit,
        unitPrice: m.price,
      };
    });
}