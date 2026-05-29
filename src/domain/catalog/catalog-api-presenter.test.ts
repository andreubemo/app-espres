import { describe, expect, it } from "vitest";

import { buildCatalogApiResponse } from "./catalog-api-presenter";

describe("buildCatalogApiResponse", () => {
  it("mantiene la forma esperada por /api/catalog agrupando por familia", () => {
    const response = buildCatalogApiResponse([
      {
        id: "item-1",
        familyKey: "tarima",
        itemKey: "presupuesto_r003_tarima",
        family: " Tarima ",
        material: " Roble ",
        itemName: " Tarima Melamina Nueva ",
        measureUnit: "m2",
        quantityLabel: "Cantidad",
        unitPriceBase: 97.5,
        inputConfig: [{ key: "ancho", column: "E" }],
        formulaConfig: [{ column: "L", formula: "J3*(1+K3)" }],
        defaultValues: { L: 97.5 },
      },
      {
        id: "item-2",
        familyKey: "tarima",
        itemKey: "presupuesto_r004_tarima",
        family: "Tarima",
        material: null,
        itemName: null,
        measureUnit: null,
        quantityLabel: "ud",
        unitPriceBase: Number.NaN,
      },
    ]);

    expect(response.families).toEqual(["Tarima"]);
    expect(response.itemsByFamily.Tarima).toEqual([
      {
        id: "item-1",
        familyKey: "tarima",
        itemKey: "presupuesto_r003_tarima",
        family: "Tarima",
        material: "Roble",
        item: "Tarima Melamina Nueva",
        unit: "m2",
        unitPrice: 97.5,
        inputConfig: [{ key: "ancho", column: "E" }],
        formulaConfig: [{ column: "L", formula: "J3*(1+K3)" }],
        defaultValues: { L: 97.5 },
      },
      {
        id: "item-2",
        familyKey: "tarima",
        itemKey: "presupuesto_r004_tarima",
        family: "Tarima",
        item: "Sin nombre",
        unit: "ud",
        unitPrice: 0,
        inputConfig: undefined,
        formulaConfig: undefined,
        defaultValues: undefined,
      },
    ]);
  });
});
