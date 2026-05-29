import { prisma } from "@/lib/prisma";
import { getInternalUserContext } from "@/lib/access-control";
import { NextResponse } from "next/server";
import { buildCatalogApiResponse } from "@/domain/catalog/catalog-api-presenter";

export async function GET() {
  try {
    const user = await getInternalUserContext();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const catalogItems = await prisma.catalogItem.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      select: {
        id: true,
        sourceSheet: true,
        sourceRow: true,
        familyKey: true,
        itemKey: true,
        family: true,
        material: true,
        itemName: true,
        measureUnit: true,
        quantityLabel: true,
        unitPriceBase: true,
        inputConfig: true,
        formulaConfig: true,
        defaultValues: true,
      },
      orderBy: [{ sourceSheet: "asc" }, { sourceRow: "asc" }],
    });

    return NextResponse.json(buildCatalogApiResponse(catalogItems));
  } catch (error) {
    console.error("Error en /api/catalog:", error);

    return NextResponse.json(
      { error: "Error cargando catálogo" },
      { status: 500 }
    );
  }
}
