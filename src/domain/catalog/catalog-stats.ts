export type CatalogStatsItem = {
  companyId: string;
  family: string | null;
  isActive: boolean;
  itemName: string | null;
  material: string | null;
  sourceRow: number | null;
  sourceSheet: string | null;
  unitPriceBase: number | null;
};

export type CatalogPriceStatsItem = {
  companyId: string;
  description: string | null;
  family: string | null;
  isActive: boolean;
  price: number | null;
  sourceRow: number | null;
  sourceSheet: string | null;
};

export type CatalogStats = {
  activeFamilies: number;
  activeItems: number;
  inactiveItems: number;
  latestSource: {
    row: number;
    sheet: string;
  } | null;
  materialItems: number;
  reviewItems: number;
  totalItems: number;
  validBasePriceItems: number;
};

export type CatalogPriceStats = {
  activeFamilies: number;
  activePriceItems: number;
  inactivePriceItems: number;
  latestSource: {
    row: number;
    sheet: string;
  } | null;
  reviewPriceItems: number;
  totalPriceItems: number;
  validPriceItems: number;
};

function normalizeText(value: string | null) {
  return value?.trim() ?? "";
}

function isPositiveNumber(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function latestSourceOf(
  items: Array<{ sourceRow: number | null; sourceSheet: string | null }>
) {
  return items.reduce<CatalogStats["latestSource"]>((latest, item) => {
    if (!item.sourceSheet || typeof item.sourceRow !== "number") {
      return latest;
    }

    if (!latest || item.sourceRow > latest.row) {
      return {
        row: item.sourceRow,
        sheet: item.sourceSheet,
      };
    }

    return latest;
  }, null);
}

export function getCatalogStats(
  items: CatalogStatsItem[],
  companyId: string
): CatalogStats {
  const companyItems = items.filter((item) => item.companyId === companyId);
  const activeItems = companyItems.filter((item) => item.isActive);
  const activeFamilies = new Set(
    activeItems
      .map((item) => normalizeText(item.family))
      .filter((family) => family.length > 0)
  );

  return {
    activeFamilies: activeFamilies.size,
    activeItems: activeItems.length,
    inactiveItems: companyItems.length - activeItems.length,
    latestSource: latestSourceOf(activeItems),
    materialItems: activeItems.filter(
      (item) => normalizeText(item.material).length > 0
    ).length,
    reviewItems: activeItems.filter((item) => {
      return (
        normalizeText(item.family).length === 0 ||
        normalizeText(item.itemName).length === 0 ||
        !isPositiveNumber(item.unitPriceBase)
      );
    }).length,
    totalItems: companyItems.length,
    validBasePriceItems: activeItems.filter((item) =>
      isPositiveNumber(item.unitPriceBase)
    ).length,
  };
}

export function getCatalogPriceStats(
  items: CatalogPriceStatsItem[],
  companyId: string
): CatalogPriceStats {
  const companyItems = items.filter((item) => item.companyId === companyId);
  const activeItems = companyItems.filter((item) => item.isActive);
  const activeFamilies = new Set(
    activeItems
      .map((item) => normalizeText(item.family))
      .filter((family) => family.length > 0)
  );

  return {
    activeFamilies: activeFamilies.size,
    activePriceItems: activeItems.length,
    inactivePriceItems: companyItems.length - activeItems.length,
    latestSource: latestSourceOf(activeItems),
    reviewPriceItems: activeItems.filter((item) => {
      return (
        normalizeText(item.family).length === 0 ||
        normalizeText(item.description).length === 0 ||
        !isPositiveNumber(item.price)
      );
    }).length,
    totalPriceItems: companyItems.length,
    validPriceItems: activeItems.filter((item) => isPositiveNumber(item.price))
      .length,
  };
}
