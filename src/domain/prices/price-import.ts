import * as XLSX from "xlsx";

export const PRICE_UPDATE_SHEET = "PRICE_UPDATE_IMPORT";
export const BUDGET_SHEET = "PRESUPUESTO";
export const RAW_COST_SHEET = "COSTE";

export const PRICE_UPDATE_HEADERS = [
  "item_key",
  "family",
  "subfamily",
  "description",
  "x_mm",
  "y_mm",
  "thickness_mm",
  "price",
  "unit",
  "provider",
  "extra_1_label",
  "extra_1_value",
  "extra_2_label",
  "extra_2_value",
  "extra_3_label",
  "extra_3_value",
  "board_price",
  "source_sheet",
  "source_row",
] as const;

export type PriceImportSourceType =
  | "normalized_template"
  | "eswood_coste"
  | "eswood_workbook";

export type PriceImportRow = {
  sourceSheet: string | null;
  sourceRow: number | null;
  itemKey: string;
  family: string;
  subfamily: string | null;
  description: string;
  xMm: number | null;
  yMm: number | null;
  thicknessMm: number | null;
  price: number;
  unit: string;
  provider: string | null;
  extra1Label: string | null;
  extra1Value: number | null;
  extra2Label: string | null;
  extra2Value: number | null;
  extra3Label: string | null;
  extra3Value: number | null;
  boardPrice: number | null;
};

export type ParsedPriceWorkbook = {
  sourceType: PriceImportSourceType;
  rows: PriceImportRow[];
  warnings: string[];
  budgetItems?: BudgetTemplateItem[];
  cells?: ExcelWorkbookCellValue[];
};

export type BudgetTemplateInput = {
  key: string;
  column: string;
  label: string;
  defaultValue: number | string | null;
};

export type BudgetTemplateFormula = {
  column: string;
  label: string | null;
  formula: string;
};

export type BudgetTemplateItem = {
  sourceSheet: typeof BUDGET_SHEET;
  sourceRow: number;
  sectionTitle: string | null;
  familyKey: string;
  itemKey: string;
  family: string;
  subfamily: string | null;
  material: string | null;
  itemName: string;
  measureUnit: string | null;
  quantityLabel: string | null;
  inputs: BudgetTemplateInput[];
  formulas: BudgetTemplateFormula[];
  defaults: Record<string, number | string | null>;
};

export type ExcelWorkbookCellValue = {
  sheetName: string;
  cellAddress: string;
  valueNumber: number | null;
  valueText: string | null;
  formula: string | null;
};

type NormalizedTemplateRow = {
  item_key?: unknown;
  family?: unknown;
  subfamily?: unknown;
  description?: unknown;
  x_mm?: unknown;
  y_mm?: unknown;
  thickness_mm?: unknown;
  price?: unknown;
  unit?: unknown;
  provider?: unknown;
  extra_1_label?: unknown;
  extra_1_value?: unknown;
  extra_2_label?: unknown;
  extra_2_value?: unknown;
  extra_3_label?: unknown;
  extra_3_value?: unknown;
  board_price?: unknown;
  source_sheet?: unknown;
  source_row?: unknown;
};

type RawCostRow = {
  FAMILIA?: unknown;
  "SUB.FAMILIA MATERIAL"?: unknown;
  DESCRIPICON?: unknown;
  "X (mm)"?: unknown;
  "Y   (mm)"?: unknown;
  "Y (mm)"?: unknown;
  "Grosor (mm)"?: unknown;
  PRECIO?: unknown;
  UNI?: unknown;
  PROVEEDOR?: unknown;
  "€ "?: unknown;
  "€ _1"?: unknown;
  "€ _2"?: unknown;
  "€"?: unknown;
  Concepto?: unknown;
  Concepto_1?: unknown;
  Concepto_2?: unknown;
  __EMPTY?: unknown;
  __EMPTY_1?: unknown;
  __EMPTY_2?: unknown;
  __EMPTY_3?: unknown;
  __EMPTY_4?: unknown;
  "__EMPTY_5"?: unknown;
  "€/Tablero"?: unknown;
};

function toNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  const next = String(value).trim();
  return next ? next : null;
}

function toRequiredString(value: unknown, fallback = "") {
  return toNullableString(value) ?? fallback;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function dimensionPart(value: number | null) {
  if (value === null) return "";
  return String(value).replace(/[^0-9a-zA-Z]+/g, "_");
}

export function derivePriceItemKey(input: {
  sourceRow?: number | null;
  family: string;
  subfamily?: string | null;
  description: string;
  xMm?: number | null;
  yMm?: number | null;
  thicknessMm?: number | null;
  unit?: string | null;
}) {
  return [
    "coste",
    input.sourceRow ? `r${String(input.sourceRow).padStart(3, "0")}` : "",
    slugify(input.family),
    slugify(input.subfamily ?? ""),
    slugify(input.description),
    dimensionPart(input.xMm ?? null),
    dimensionPart(input.yMm ?? null),
    dimensionPart(input.thicknessMm ?? null),
    slugify(input.unit ?? ""),
  ]
    .filter(Boolean)
    .join("_");
}

function getRawCostValue(row: Record<string, unknown>, key: string) {
  return row[key] ?? null;
}

function getFirstRawCostValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getRawCostValue(row, key);

    if (value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

const INPUT_COLUMNS = ["E", "F", "G", "H", "I"] as const;
const FORMULA_COLUMNS = [
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "AF",
  "AG",
  "AH",
] as const;

const BUDGET_RESULT_LABELS: Record<string, string> = {
  J: "COSTE TOT",
  K: "Markup %",
  L: "€ TOTAL",
  M: "BEN.EMP",
};

function getSheetCell(sheet: XLSX.WorkSheet, address: string) {
  return sheet[address] as XLSX.CellObject | undefined;
}

function getCellValue(sheet: XLSX.WorkSheet, address: string) {
  const cell = getSheetCell(sheet, address);
  return cell?.v ?? null;
}

function getCellFormula(sheet: XLSX.WorkSheet, address: string) {
  const cell = getSheetCell(sheet, address);
  return typeof cell?.f === "string" ? cell.f : null;
}

function getCellText(sheet: XLSX.WorkSheet, address: string) {
  return toNullableString(getCellValue(sheet, address));
}

function deriveBudgetItemKey(input: {
  sourceRow: number;
  family: string;
  subfamily?: string | null;
  material?: string | null;
  itemName: string;
}) {
  return [
    "presupuesto",
    `r${String(input.sourceRow).padStart(3, "0")}`,
    slugify(input.family),
    slugify(input.subfamily ?? ""),
    slugify(input.material ?? ""),
    slugify(input.itemName),
  ]
    .filter(Boolean)
    .join("_");
}

function deriveFamilyKey(family: string) {
  return slugify(family) || "sin_familia";
}

function normalizeInputKey(label: string, column: string) {
  return slugify(label) || column.toLowerCase();
}

function buildFallbackItemName(input: {
  sectionTitle: string | null;
  family: string;
  subfamily: string | null;
  material: string | null;
}) {
  return [input.sectionTitle, input.subfamily, input.material]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" - ") || input.family;
}

function parseBudgetTemplateItems(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets[BUDGET_SHEET];
  if (!sheet) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  let currentSectionTitle: string | null = null;
  let currentInputLabels: Record<string, string> = {};
  let currentComponentLabels: Record<string, string | null> = {};
  const items: BudgetTemplateItem[] = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const sourceRow = rowIndex + 1;
    const familyCell = getCellText(sheet, `A${sourceRow}`);

    if (familyCell === "FAMILIA") {
      currentSectionTitle = getCellText(sheet, `D${sourceRow}`);
      currentInputLabels = Object.fromEntries(
        INPUT_COLUMNS.map((column) => [
          column,
          getCellText(sheet, `${column}${sourceRow}`) ?? "",
        ])
      );
      currentComponentLabels = Object.fromEntries(
        FORMULA_COLUMNS.map((column) => [
          column,
          BUDGET_RESULT_LABELS[column] ??
            getCellText(sheet, `${column}${sourceRow}`),
        ])
      );
      continue;
    }

    if (!familyCell || familyCell === "TOTAL") continue;

    const family = familyCell;
    const subfamily = getCellText(sheet, `B${sourceRow}`);
    const material = getCellText(sheet, `C${sourceRow}`);
    const itemName =
      getCellText(sheet, `D${sourceRow}`) ??
      buildFallbackItemName({
        sectionTitle: currentSectionTitle,
        family,
        subfamily,
        material,
      });

    const formulas = FORMULA_COLUMNS.flatMap((column) => {
      const formula = getCellFormula(sheet, `${column}${sourceRow}`);
      if (!formula) return [];

      return [
        {
          column,
          label: currentComponentLabels[column] ?? null,
          formula,
        },
      ];
    });

    if (!formulas.length) continue;

    const inputs = INPUT_COLUMNS.flatMap((column) => {
      const label = currentInputLabels[column]?.trim();
      if (!label) return [];

      return [
        {
          key: normalizeInputKey(label, column),
          column,
          label,
          defaultValue: getCellValue(sheet, `${column}${sourceRow}`) as
            | number
            | string
            | null,
        },
      ];
    });

    const defaults = Object.fromEntries(
      [...INPUT_COLUMNS, ...FORMULA_COLUMNS].map((column) => [
        column,
        getCellValue(sheet, `${column}${sourceRow}`) as
          | number
          | string
          | null,
      ])
    );

    items.push({
      sourceSheet: BUDGET_SHEET,
      sourceRow,
      sectionTitle: currentSectionTitle,
      familyKey: deriveFamilyKey(family),
      itemKey: deriveBudgetItemKey({
        sourceRow,
        family,
        subfamily,
        material,
        itemName,
      }),
      family,
      subfamily,
      material,
      itemName,
      measureUnit: currentInputLabels.H ?? null,
      quantityLabel: currentInputLabels.I ?? null,
      inputs,
      formulas,
      defaults,
    });
  }

  return items;
}

function parseWorkbookCells(workbook: XLSX.WorkBook) {
  const cells: ExcelWorkbookCellValue[] = [];

  [BUDGET_SHEET, RAW_COST_SHEET].forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet?.["!ref"]) return;

    const range = XLSX.utils.decode_range(sheet["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let column = range.s.c; column <= range.e.c; column += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: column });
        const cell = getSheetCell(sheet, cellAddress);
        if (!cell || (cell.v === undefined && !cell.f)) continue;

        const valueNumber =
          typeof cell.v === "number" && Number.isFinite(cell.v) ? cell.v : null;
        const valueText =
          valueNumber === null && cell.v !== undefined && cell.v !== null
            ? String(cell.v)
            : null;

        cells.push({
          sheetName,
          cellAddress,
          valueNumber,
          valueText,
          formula: typeof cell.f === "string" ? cell.f : null,
        });
      }
    }
  });

  return cells;
}

function normalizeParsedRows(rows: PriceImportRow[]) {
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const label = row.sourceRow ? `fila ${row.sourceRow}` : `fila ${index + 1}`;
    const errors: string[] = [];

    if (!row.itemKey) errors.push("item_key");
    if (!row.family) errors.push("family");
    if (!row.description) errors.push("description");
    if (!row.unit) errors.push("unit");
    if (!Number.isFinite(row.price) || row.price < 0) errors.push("price");

    if (errors.length) {
      warnings.push(`${label}: fila con campos invalidos: ${errors.join(", ")}.`);
    }
  });

  return { rows, warnings };
}

function parseNormalizedTemplate(workbook: XLSX.WorkBook): ParsedPriceWorkbook {
  const sheet = workbook.Sheets[PRICE_UPDATE_SHEET];
  const rawRows = XLSX.utils.sheet_to_json<NormalizedTemplateRow>(sheet, {
    defval: null,
    raw: true,
  });

  const rows = rawRows.map((row, index): PriceImportRow => {
    const family = toRequiredString(row.family);
    const description = toRequiredString(row.description);
    const unit = toRequiredString(row.unit);
    const xMm = toNullableNumber(row.x_mm);
    const yMm = toNullableNumber(row.y_mm);
    const thicknessMm = toNullableNumber(row.thickness_mm);
    const itemKey =
      toNullableString(row.item_key) ??
      derivePriceItemKey({
        family,
        subfamily: toNullableString(row.subfamily),
        description,
        xMm,
        yMm,
        thicknessMm,
        unit,
      });

    return {
      sourceSheet: toNullableString(row.source_sheet) ?? PRICE_UPDATE_SHEET,
      sourceRow: toNullableNumber(row.source_row) ?? index + 2,
      itemKey,
      family,
      subfamily: toNullableString(row.subfamily),
      description,
      xMm,
      yMm,
      thicknessMm,
      price: toNullableNumber(row.price) ?? Number.NaN,
      unit,
      provider: toNullableString(row.provider),
      extra1Label: toNullableString(row.extra_1_label),
      extra1Value: toNullableNumber(row.extra_1_value),
      extra2Label: toNullableString(row.extra_2_label),
      extra2Value: toNullableNumber(row.extra_2_value),
      extra3Label: toNullableString(row.extra_3_label),
      extra3Value: toNullableNumber(row.extra_3_value),
      boardPrice: toNullableNumber(row.board_price),
    };
  });

  const normalized = normalizeParsedRows(rows);

  return {
    sourceType: "normalized_template",
    rows: normalized.rows,
    warnings: normalized.warnings,
  };
}

function parseRawCostSheet(workbook: XLSX.WorkBook): ParsedPriceWorkbook {
  const sheet = workbook.Sheets[RAW_COST_SHEET];
  const rawRows = XLSX.utils.sheet_to_json<RawCostRow>(sheet, {
    range: 1,
    defval: null,
    raw: true,
  });

  const rows = rawRows.map((row, index): PriceImportRow => {
    const record = row as Record<string, unknown>;
    const family = toRequiredString(record.FAMILIA);
    const subfamily = toNullableString(record["SUB.FAMILIA MATERIAL"]);
    const description = toRequiredString(record.DESCRIPICON, subfamily ?? family);
    const xMm = toNullableNumber(record["X (mm)"]);
    const yMm = toNullableNumber(record["Y   (mm)"] ?? record["Y (mm)"]);
    const thicknessMm = toNullableNumber(record["Grosor (mm)"]);
    const unit = toRequiredString(record.UNI);
    const sourceRow = index + 3;

    return {
      sourceSheet: RAW_COST_SHEET,
      sourceRow,
      itemKey: derivePriceItemKey({
        sourceRow,
        family,
        subfamily,
        description,
        xMm,
        yMm,
        thicknessMm,
        unit,
      }),
      family,
      subfamily,
      description,
      xMm,
      yMm,
      thicknessMm,
      price: toNullableNumber(record.PRECIO) ?? Number.NaN,
      unit,
      provider: toNullableString(record.PROVEEDOR),
      extra1Value: toNullableNumber(
        getFirstRawCostValue(record, ["€ ", "€", "__EMPTY"])
      ),
      extra1Label: toNullableString(
        getFirstRawCostValue(record, ["Concepto", "__EMPTY_1"])
      ),
      extra2Value: toNullableNumber(
        getFirstRawCostValue(record, ["€ _1", "__EMPTY_2"])
      ),
      extra2Label: toNullableString(
        getFirstRawCostValue(record, ["Concepto_1", "__EMPTY_3"])
      ),
      extra3Value: toNullableNumber(
        getFirstRawCostValue(record, ["€ _2", "__EMPTY_4"])
      ),
      extra3Label: toNullableString(
        getFirstRawCostValue(record, ["Concepto_2", "__EMPTY_5"])
      ),
      boardPrice: toNullableNumber(getRawCostValue(record, "€/Tablero")),
    };
  });

  const normalized = normalizeParsedRows(rows);
  const hasBudgetSheet = workbook.SheetNames.includes(BUDGET_SHEET);

  return {
    sourceType: hasBudgetSheet ? "eswood_workbook" : "eswood_coste",
    rows: normalized.rows,
    warnings: [
      "El archivo no contiene item_key explicito; se han generado claves derivadas desde hoja, fila, familia, descripcion, dimensiones y unidad.",
      ...normalized.warnings,
    ],
    budgetItems: hasBudgetSheet
      ? parseBudgetTemplateItems(workbook)
      : undefined,
    cells: hasBudgetSheet ? parseWorkbookCells(workbook) : undefined,
  };
}

export function parsePriceWorkbook(buffer: ArrayBuffer): ParsedPriceWorkbook {
  const workbook = XLSX.read(buffer, {
    cellFormula: true,
    cellNF: false,
    cellText: false,
  });

  if (workbook.SheetNames.includes(PRICE_UPDATE_SHEET)) {
    return parseNormalizedTemplate(workbook);
  }

  if (workbook.SheetNames.includes(RAW_COST_SHEET)) {
    return parseRawCostSheet(workbook);
  }

  throw new Error(
    `El Excel debe incluir la hoja "${PRICE_UPDATE_SHEET}" o la hoja "${RAW_COST_SHEET}".`
  );
}
