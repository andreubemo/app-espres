import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type CatalogItemResponse = {
  id: string;
  familyKey?: string;
  itemKey?: string;
  family: string;
  material?: string;
  item: string;
  unit: string;
  unitPrice: number;
};

export async function GET() {
  try {
    const catalogItems = await prisma.catalogItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sourceSheet: "asc" }, { sourceRow: "asc" }],
    });

    const familiesMap = new Map<string, CatalogItemResponse[]>();

    catalogItems.forEach((item) => {
      const family = item.family?.trim() || "Sin familia";

      if (!familiesMap.has(family)) {
        familiesMap.set(family, []);
      }

      familiesMap.get(family)!.push({
        id: item.id,
        familyKey: item.familyKey || undefined,
        itemKey: item.itemKey || undefined,
        family,
        material: item.material?.trim() || undefined,
        item: item.itemName?.trim() || "Sin nombre",
        unit: item.measureUnit?.trim() || item.quantityLabel?.trim() || "ud",
        unitPrice: Number.isFinite(item.unitPriceBase) ? item.unitPriceBase : 0,
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