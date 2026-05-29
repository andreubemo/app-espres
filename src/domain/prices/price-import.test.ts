import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { calculateBudgetTemplateItem } from "./excel-formula-evaluator";
import { parsePriceWorkbook } from "./price-import";

function formulaCell(formula: string, value: number): XLSX.CellObject {
  return {
    t: "n",
    f: formula,
    v: value,
  };
}

function buildWorkbookBuffer() {
  const workbook = XLSX.utils.book_new();

  const budgetSheet = XLSX.utils.aoa_to_sheet([
    ["Plantilla sintetica para tests"],
    [
      "FAMILIA",
      "SUBFAMILIA",
      "MATERIAL",
      "Tarimas principales",
      "Ancho",
      "Largo",
      "Merma",
      "m2",
      "Cantidad",
      "COSTE TOT",
      "Markup %",
      "€ TOTAL",
      "BEN.EMP",
      "Funcion",
    ],
    [
      "Tarima",
      "Melamina",
      "Roble",
      "Tarima Melamina Nueva",
      2,
      3,
      0.1,
      6,
      1,
      formulaCell("E3*F3*COSTE!$G$3", 75),
      formulaCell("30%", 0.3),
      formulaCell("J3*(1+K3)", 97.5),
      formulaCell("L3-J3", 22.5),
      formulaCell("ROUNDUP(SUM(J3,M3),0)", 98),
    ],
  ]);

  const costSheet = XLSX.utils.aoa_to_sheet([
    ["Hoja de costes sintetica"],
    [
      "FAMILIA",
      "SUB.FAMILIA MATERIAL",
      "DESCRIPICON",
      "X (mm)",
      "Y   (mm)",
      "Grosor (mm)",
      "PRECIO",
      "UNI",
      "PROVEEDOR",
      "€",
      "Concepto",
      "€",
      "Concepto",
      "€",
      "Concepto",
      "€/Tablero",
    ],
    [
      "Tarima",
      "Melamina",
      "Roble",
      2800,
      2070,
      19,
      12.5,
      "m2",
      "Proveedor A",
      1.2,
      "Transporte",
      2.3,
      "Corte",
      3.4,
      "Manipulado",
      99,
    ],
    [
      "Tarima",
      "Melamina",
      "Roble",
      2800,
      2070,
      19,
      13.25,
      "m2",
      "Proveedor B",
      null,
      null,
      null,
      null,
      null,
      null,
      102,
    ],
    [
      "Personal",
      "Externo",
      "Herramientas",
      null,
      null,
      null,
      null,
      "dia",
      "Proveedor C",
    ],
  ]);

  XLSX.utils.book_append_sheet(workbook, budgetSheet, "PRESUPUESTO");
  XLSX.utils.book_append_sheet(workbook, costSheet, "COSTE");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
}

describe("parsePriceWorkbook", () => {
  it("lee el formato maestro con costes, partidas, materiales y celdas", () => {
    const parsed = parsePriceWorkbook(buildWorkbookBuffer());

    expect(parsed.sourceType).toBe("eswood_workbook");
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.budgetItems).toHaveLength(1);
    expect(parsed.cells?.length).toBeGreaterThan(10);
    expect(parsed.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("item_key explicito"),
        expect.stringContaining("fila 5"),
      ])
    );

    const firstCost = parsed.rows[0];
    expect(firstCost.family).toBe("Tarima");
    expect(firstCost.subfamily).toBe("Melamina");
    expect(firstCost.description).toBe("Roble");
    expect(firstCost.price).toBe(12.5);
    expect(firstCost.unit).toBe("m2");
    expect(firstCost.provider).toBe("Proveedor A");
    expect(firstCost.boardPrice).toBe(99);

    const validRows = parsed.rows.filter((row) => Number.isFinite(row.price));
    expect(validRows).toHaveLength(2);
    expect(new Set(parsed.rows.map((row) => row.itemKey)).size).toBe(
      parsed.rows.length
    );

    const item = parsed.budgetItems?.[0];
    expect(item).toMatchObject({
      family: "Tarima",
      subfamily: "Melamina",
      material: "Roble",
      itemName: "Tarima Melamina Nueva",
      measureUnit: "m2",
      quantityLabel: "Cantidad",
    });
    expect(item?.itemKey).toContain("presupuesto_r003");
    expect(item?.formulas.map((formula) => formula.column)).toEqual([
      "J",
      "K",
      "L",
      "M",
      "N",
    ]);
  });

  it("evalua formulas de coste, markup, total y funciones Excel soportadas", () => {
    const parsed = parsePriceWorkbook(buildWorkbookBuffer());
    const item = parsed.budgetItems?.[0];

    if (!item || !parsed.cells) {
      throw new Error("El fixture no genero partida de presupuesto.");
    }

    const result = calculateBudgetTemplateItem({
      item,
      cells: parsed.cells,
      inputValues: {
        E: 2,
        F: 3,
        G: 0.1,
        H: 6,
        I: 1,
      },
    });

    expect(result.costTotal).toBe(75);
    expect(result.markup).toBe(0.3);
    expect(result.sellTotal).toBe(97.5);
    expect(result.profit).toBe(22.5);
    expect(result.results.N).toBe(98);
  });
});
