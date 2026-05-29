import { describe, expect, it } from "vitest";

import {
  getCatalogPriceStats,
  getCatalogStats,
  type CatalogPriceStatsItem,
  type CatalogStatsItem,
} from "./catalog-stats";

function catalogItem(
  overrides: Partial<CatalogStatsItem> = {}
): CatalogStatsItem {
  return {
    companyId: "company-a",
    family: "Tarima",
    isActive: true,
    itemName: "Tarima Melamina",
    material: "Roble",
    sourceRow: 12,
    sourceSheet: "PRESUPUESTO",
    unitPriceBase: 125,
    ...overrides,
  };
}

function priceItem(
  overrides: Partial<CatalogPriceStatsItem> = {}
): CatalogPriceStatsItem {
  return {
    companyId: "company-a",
    description: "Tablero melamina",
    family: "Tablero",
    isActive: true,
    price: 42,
    sourceRow: 18,
    sourceSheet: "COSTE",
    ...overrides,
  };
}

describe("getCatalogStats", () => {
  it("devuelve cero correctamente cuando no hay partidas", () => {
    expect(getCatalogStats([], "company-a")).toEqual({
      activeFamilies: 0,
      activeItems: 0,
      inactiveItems: 0,
      latestSource: null,
      materialItems: 0,
      reviewItems: 0,
      totalItems: 0,
      validBasePriceItems: 0,
    });
  });

  it("cuenta activas, ignora inactivas en contadores operativos y familias unicas", () => {
    const stats = getCatalogStats(
      [
        catalogItem({ family: "Tarima", sourceRow: 10 }),
        catalogItem({ family: "Tarima", sourceRow: 11 }),
        catalogItem({ family: "Muro", material: null, sourceRow: 21 }),
        catalogItem({ family: "Muro", isActive: false, sourceRow: 99 }),
      ],
      "company-a"
    );

    expect(stats.totalItems).toBe(4);
    expect(stats.activeItems).toBe(3);
    expect(stats.inactiveItems).toBe(1);
    expect(stats.activeFamilies).toBe(2);
    expect(stats.materialItems).toBe(2);
    expect(stats.validBasePriceItems).toBe(3);
    expect(stats.latestSource).toEqual({
      row: 21,
      sheet: "PRESUPUESTO",
    });
  });

  it("detecta partidas a revisar por precio base invalido o datos obligatorios vacios", () => {
    const stats = getCatalogStats(
      [
        catalogItem(),
        catalogItem({ itemName: " ", unitPriceBase: 50 }),
        catalogItem({ family: "", unitPriceBase: 50 }),
        catalogItem({ unitPriceBase: 0 }),
      ],
      "company-a"
    );

    expect(stats.validBasePriceItems).toBe(3);
    expect(stats.reviewItems).toBe(3);
  });

  it("no mezcla datos de distintas empresas", () => {
    const stats = getCatalogStats(
      [
        catalogItem({ companyId: "company-a", family: "Tarima" }),
        catalogItem({ companyId: "company-b", family: "Muro" }),
      ],
      "company-a"
    );

    expect(stats.totalItems).toBe(1);
    expect(stats.activeFamilies).toBe(1);
  });
});

describe("getCatalogPriceStats", () => {
  it("cuenta costes editables activos e identifica precios a revisar", () => {
    const stats = getCatalogPriceStats(
      [
        priceItem({ family: "Tablero", price: 42 }),
        priceItem({ family: "Tablero", price: 0 }),
        priceItem({ family: "Personal", price: 15 }),
        priceItem({ family: "Otra empresa", companyId: "company-b" }),
        priceItem({ isActive: false, price: 0 }),
      ],
      "company-a"
    );

    expect(stats.totalPriceItems).toBe(4);
    expect(stats.activePriceItems).toBe(3);
    expect(stats.inactivePriceItems).toBe(1);
    expect(stats.activeFamilies).toBe(2);
    expect(stats.validPriceItems).toBe(2);
    expect(stats.reviewPriceItems).toBe(1);
  });
});
