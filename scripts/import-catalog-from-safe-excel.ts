import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const EXCEL_PATH =
  process.env.EXCEL_PATH ??
  path.resolve(process.cwd(), "excel-presupuestos-2026-eswood-v5-seguro-import.xlsx");

const SHEET_NAME = process.env.SHEET_NAME ?? "CATALOGO_IMPORT";
const COMPANY_NAME = process.env.COMPANY_NAME ?? "Espres Carpintería";
const DRY_RUN = process.env.DRY_RUN === "true";
const REPLACE_ALL_CATALOG_ITEMS = process.env.REPLACE_ALL_CATALOG_ITEMS === "true";
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 200);

type CatalogExcelRow = {
  source_sheet?: string | null;
  source_row?: number | null;
  section_header_row?: number | null;
  section_title?: string | null;
  family_key?: string | null;
  item_key?: string | null;
  family?: string | null;
  subfamily?: string | null;
  material?: string | null;
  item_name?: string | null;
  comments?: string | null;
  input1_label?: string | null;
  input2_label?: string | null;
  input3_label?: string | null;
  measure_unit?: string | null;
  quantity_label?: string | null;
  price_label?: string | null;
  unit_price_base?: number | string | null;
  unit_price_raw?: number | string | null;
  measure_current?: number | string | null;
  measure_formula?: string | null;
  qty_current?: number | string | null;
  real_price_current?: number | string | null;
  real_price_formula?: string | null;
  company_cost_current?: number | string | null;
  company_cost_formula?: string | null;
  markup_current?: number | string | null;
  markup_formula?: string | null;
  total_current?: number | string | null;
  total_formula?: string | null;
};

type NormalizedCatalogRow = {
  sourceSheet: string;
  sourceRow: number;
  sectionTitle: string | null;
  familyKey: string;
  itemKey: string;
  family: string;
  subfamily: string | null;
  material: string | null;
  itemName: string;
  comments: string | null;
  input1Label: string | null;
  input2Label: string | null;
  input3Label: string | null;
  measureUnit: string | null;
  quantityLabel: string | null;
  priceLabel: string | null;
  unitPriceBase: number;
  unitPriceRaw: number | null;
  measureCurrent: number | null;
  qtyCurrent: number | null;
  realPriceCurrent: number | null;
  companyCostCurrent: number | null;
  markupCurrent: number | null;
  totalCurrent: number | null;
};

const REQUIRED_EXCEL_COLUMNS = [
  "source_sheet",
  "source_row",
  "family_key",
  "item_key",
  "family",
  "item_name",
  "unit_price_base",
] as const;

function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function toNullableString(value: unknown): string | null {
  if (isNil(value)) return null;
  const stringValue = String(value).trim();
  return stringValue === "" ? null : stringValue;
}

function toNullableNumber(value: unknown): number | null {
  if (isNil(value) || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = String(value).replace(",", ".").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function requireString(
  value: string | null,
  fieldName: string,
  excelRowNumber: number
): string {
  if (!value) {
    throw new Error(
      `Fila Excel ${excelRowNumber}: falta el campo obligatorio "${fieldName}".`
    );
  }

  return value;
}

function requireNumber(
  value: number | null,
  fieldName: string,
  excelRowNumber: number
): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(
      `Fila Excel ${excelRowNumber}: el campo obligatorio "${fieldName}" no es válido.`
    );
  }

  return value;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }

  return chunks;
}

function readCatalogSheet(): NormalizedCatalogRow[] {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No existe el archivo Excel: ${EXCEL_PATH}`);
  }

  const workbook = XLSX.readFile(EXCEL_PATH, {
    cellFormula: true,
    cellNF: false,
    cellText: false,
  });

  const worksheet = workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    throw new Error(`No existe la hoja "${SHEET_NAME}" en ${EXCEL_PATH}`);
  }

  const rawRows = XLSX.utils.sheet_to_json<CatalogExcelRow>(worksheet, {
    range: 1,
    defval: null,
    raw: true,
  });

  if (rawRows.length === 0) {
    throw new Error(`La hoja "${SHEET_NAME}" está vacía.`);
  }

  const missingColumns = REQUIRED_EXCEL_COLUMNS.filter(
    (column) => !(column in rawRows[0])
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Faltan columnas obligatorias en "${SHEET_NAME}": ${missingColumns.join(", ")}`
    );
  }

  const normalizedRows: NormalizedCatalogRow[] = [];

  rawRows.forEach((row, index) => {
    const excelRowNumber = index + 3;

    const sourceSheetMaybe = toNullableString(row.source_sheet);
    const sourceRowMaybe = toNullableNumber(row.source_row);
    const familyKeyMaybe = toNullableString(row.family_key);
    const itemKeyMaybe = toNullableString(row.item_key);
    const familyMaybe = toNullableString(row.family);
    const itemNameMaybe = toNullableString(row.item_name);
    const unitPriceBaseMaybe = toNullableNumber(row.unit_price_base);

    const isCompletelyEmpty =
      !sourceSheetMaybe &&
      sourceRowMaybe === null &&
      !familyKeyMaybe &&
      !itemKeyMaybe &&
      !familyMaybe &&
      !itemNameMaybe &&
      unitPriceBaseMaybe === null;

    if (isCompletelyEmpty) {
      return;
    }

    const missingCoreFields: string[] = [];

    if (!sourceSheetMaybe) missingCoreFields.push("source_sheet");
    if (sourceRowMaybe === null) missingCoreFields.push("source_row");
    if (!familyKeyMaybe) missingCoreFields.push("family_key");
    if (!itemKeyMaybe) missingCoreFields.push("item_key");
    if (!familyMaybe) missingCoreFields.push("family");
    if (!itemNameMaybe) missingCoreFields.push("item_name");
    if (unitPriceBaseMaybe === null) missingCoreFields.push("unit_price_base");

    if (missingCoreFields.length > 0) {
      console.warn(
        `Aviso: se omite la fila Excel ${excelRowNumber} por faltar campos obligatorios: ${missingCoreFields.join(", ")}`
      );
      return;
    }

    const sourceSheet = requireString(
      sourceSheetMaybe,
      "source_sheet",
      excelRowNumber
    );
    const sourceRow = requireNumber(
      sourceRowMaybe,
      "source_row",
      excelRowNumber
    );
    const familyKey = requireString(
      familyKeyMaybe,
      "family_key",
      excelRowNumber
    );
    const itemKey = requireString(itemKeyMaybe, "item_key", excelRowNumber);
    const family = requireString(familyMaybe, "family", excelRowNumber);
    const itemName = requireString(itemNameMaybe, "item_name", excelRowNumber);
    const unitPriceBase = requireNumber(
      unitPriceBaseMaybe,
      "unit_price_base",
      excelRowNumber
    );

    normalizedRows.push({
      sourceSheet,
      sourceRow,
      sectionTitle: toNullableString(row.section_title),
      familyKey,
      itemKey,
      family,
      subfamily: toNullableString(row.subfamily),
      material: toNullableString(row.material),
      itemName,
      comments: toNullableString(row.comments),
      input1Label: toNullableString(row.input1_label),
      input2Label: toNullableString(row.input2_label),
      input3Label: toNullableString(row.input3_label),
      measureUnit: toNullableString(row.measure_unit),
      quantityLabel: toNullableString(row.quantity_label),
      priceLabel: toNullableString(row.price_label),
      unitPriceBase,
      unitPriceRaw: toNullableNumber(row.unit_price_raw),
      measureCurrent: toNullableNumber(row.measure_current),
      qtyCurrent: toNullableNumber(row.qty_current),
      realPriceCurrent: toNullableNumber(row.real_price_current),
      companyCostCurrent: toNullableNumber(row.company_cost_current),
      markupCurrent: toNullableNumber(row.markup_current),
      totalCurrent: toNullableNumber(row.total_current),
    });
  });

  if (normalizedRows.length === 0) {
    throw new Error(`No se han encontrado filas válidas en "${SHEET_NAME}".`);
  }

  return normalizedRows;
}

async function resolveCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error(`No existe la empresa "${COMPANY_NAME}" en la base de datos.`);
  }

  return company.id;
}

async function main() {
  const rows = readCatalogSheet();
  const companyId = await resolveCompanyId();

  const dataToInsert = rows.map((row) => ({
    companyId,
    sourceSheet: row.sourceSheet,
    sourceRow: row.sourceRow,
    sectionTitle: row.sectionTitle,
    familyKey: row.familyKey,
    itemKey: row.itemKey,
    family: row.family,
    subfamily: row.subfamily,
    material: row.material,
    itemName: row.itemName,
    comments: row.comments,
    input1Label: row.input1Label,
    input2Label: row.input2Label,
    input3Label: row.input3Label,
    measureUnit: row.measureUnit,
    quantityLabel: row.quantityLabel,
    priceLabel: row.priceLabel,
    unitPriceBase: row.unitPriceBase,
    unitPriceRaw: row.unitPriceRaw,
    measureCurrent: row.measureCurrent,
    qtyCurrent: row.qtyCurrent,
    realPriceCurrent: row.realPriceCurrent,
    companyCostCurrent: row.companyCostCurrent,
    markupCurrent: row.markupCurrent,
    totalCurrent: row.totalCurrent,
    isActive: true,
  }));

  console.log(`Archivo: ${EXCEL_PATH}`);
  console.log(`Hoja: ${SHEET_NAME}`);
  console.log(`Filas válidas detectadas: ${rows.length}`);
  console.log(`CatalogItem preparados para insertar: ${dataToInsert.length}`);

  if (DRY_RUN) {
    console.log("DRY_RUN=true -> no se escribe nada en la base de datos.");
    console.log("Primeros 3 registros preparados:");
    console.dir(dataToInsert.slice(0, 3), { depth: null });
    return;
  }

  if (!REPLACE_ALL_CATALOG_ITEMS) {
    throw new Error(
      [
        "Este script está protegido contra borrados accidentales.",
        "Ejecuta con REPLACE_ALL_CATALOG_ITEMS=true para reemplazar el catálogo actual.",
      ].join(" ")
    );
  }

  const chunks = chunkArray(dataToInsert, CHUNK_SIZE);

  await prisma.$transaction(async (tx) => {
    await tx.catalogItem.deleteMany({
      where: { companyId },
    });

    for (const chunk of chunks) {
      await tx.catalogItem.createMany({
        data: chunk,
      });
    }
  });

  console.log(
    `Importación completada. ${dataToInsert.length} catalogItems cargados en Prisma.`
  );
}

main()
  .catch((error) => {
    console.error("Error importando catálogo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });