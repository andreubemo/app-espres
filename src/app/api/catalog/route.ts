import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type CatalogItem = {
  id: string;
  family: string;
  material: string;
  item: string;
  unit: string;
  unitPrice: number;
};

export async function GET() {
  try {
    const materials = await prisma.material.findMany();

    const familiesMap = new Map<string, CatalogItem[]>();

    materials.forEach((m) => {
      // ⚠️ IMPORTANTE: viene de "name | subfamily | material | item"
      const parts = m.name.split("|").map((p) => p.trim());

      const family = parts[0] || "Sin familia";

      if (!familiesMap.has(family)) {
        familiesMap.set(family, []);
      }

      familiesMap.get(family)!.push({
        id: m.id,
        family,
        material: parts[2] || "",
        item: parts[3] || parts[1] || m.name,
        unit: m.unit,
        unitPrice: m.price,
      });
    });

    return NextResponse.json({
      families: Array.from(familiesMap.keys()),
      itemsByFamily: Object.fromEntries(familiesMap),
    });
  } catch (error) {
    console.error("Error en /api/catalog:", error);

    return NextResponse.json(
      { error: "Error cargando catálogo" },
      { status: 500 }
    );
  }
}