export type CatalogApiSourceItem = {
  id: string;
  familyKey: string | null;
  itemKey: string | null;
  family: string | null;
  material: string | null;
  itemName: string | null;
  measureUnit: string | null;
  quantityLabel: string | null;
  unitPriceBase: number | null;
  inputConfig?: unknown;
  formulaConfig?: unknown;
  defaultValues?: unknown;
};

export type CatalogItemResponse = {
  id: string;
  familyKey?: string;
  itemKey?: string;
  family: string;
  material?: string;
  item: string;
  unit: string;
  unitPrice: number;
  inputConfig?: unknown;
  formulaConfig?: unknown;
  defaultValues?: unknown;
};

export type CatalogApiResponse = {
  families: string[];
  itemsByFamily: Record<string, CatalogItemResponse[]>;
};

export function buildCatalogApiResponse(
  catalogItems: CatalogApiSourceItem[]
): CatalogApiResponse {
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
      unitPrice:
        typeof item.unitPriceBase === "number" &&
        Number.isFinite(item.unitPriceBase)
          ? item.unitPriceBase
          : 0,
      inputConfig: item.inputConfig ?? undefined,
      formulaConfig: item.formulaConfig ?? undefined,
      defaultValues: item.defaultValues ?? undefined,
    });
  });

  return {
    families: Array.from(familiesMap.keys()),
    itemsByFamily: Object.fromEntries(familiesMap),
  };
}
