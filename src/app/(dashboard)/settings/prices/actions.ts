"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma, Role } from "@/generated/prisma";
import {
  parsePriceWorkbook,
  type BudgetTemplateItem,
  type ExcelWorkbookCellValue,
  type PriceImportRow,
} from "@/domain/prices/price-import";
import { requireAnyRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const PRICES_PATH = "/settings/prices";
const OWNER_ONLY = [Role.OWNER];

export type PricePreviewStatus =
  | "new"
  | "changed"
  | "unchanged"
  | "absent"
  | "error";

export type PricePreviewRow = PriceImportRow & {
  status: PricePreviewStatus;
  errors: string[];
  changes: string[];
  existingPrice: number | null;
  existingProvider: string | null;
};

export type PriceImportState = {
  error?: string | null;
  notice?: string | null;
  fileName?: string | null;
  sourceType?: string | null;
  warnings?: string[];
  summary?: {
    total: number;
    valid: number;
    new: number;
    changed: number;
    unchanged: number;
    absent: number;
    errors: number;
  };
  catalogSummary?: {
    budgetItems: number;
    workbookCells: number;
  };
  rows?: PricePreviewRow[];
  budgetItems?: BudgetTemplateItem[];
  cells?: ExcelWorkbookCellValue[];
};

function redirectWith(type: "notice" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${PRICES_PATH}?${params.toString()}`);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value || null;
}

function readNullableNumber(formData: FormData, key: string) {
  const value = readString(formData, key).replace(",", ".");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRequiredNumber(formData: FormData, key: string) {
  const value = readNullableNumber(formData, key);
  if (value === null) {
    redirectWith("error", `El campo ${key} debe ser numerico.`);
  }

  return value;
}

function valuesDiffer(a: unknown, b: unknown) {
  return (a ?? null) !== (b ?? null);
}

function getRowErrors(row: PriceImportRow) {
  const errors: string[] = [];

  if (!row.itemKey.trim()) errors.push("Falta item_key.");
  if (!row.family.trim()) errors.push("Falta familia.");
  if (!row.description.trim()) errors.push("Falta descripcion.");
  if (!row.unit.trim()) errors.push("Falta unidad.");
  if (!Number.isFinite(row.price) || row.price < 0) {
    errors.push("Precio invalido.");
  }

  return errors;
}

async function buildPreviewRows(companyId: string, rows: PriceImportRow[]) {
  const importKeys = rows
    .map((row) => row.itemKey.trim())
    .filter((itemKey) => itemKey.length > 0);
  const existingItems = await prisma.catalogPriceItem.findMany({
    where: {
      companyId,
      OR: importKeys.length
        ? [
            {
              itemKey: {
                in: importKeys,
              },
            },
            {
              isActive: true,
            },
          ]
        : [
            {
              isActive: true,
            },
          ],
    },
  });
  const existingByKey = new Map(
    existingItems.map((item) => [item.itemKey, item])
  );
  const importedKeys = new Set<string>();

  const previewRows = rows.map((row): PricePreviewRow => {
    const errors = getRowErrors(row);
    if (row.itemKey && importedKeys.has(row.itemKey)) {
      errors.push("item_key duplicado en el archivo.");
    }
    importedKeys.add(row.itemKey);

    const existing = existingByKey.get(row.itemKey);
    const changes: string[] = [];

    if (existing) {
      if (valuesDiffer(existing.price, row.price)) changes.push("precio");
      if (valuesDiffer(existing.unit, row.unit)) changes.push("unidad");
      if (valuesDiffer(existing.provider, row.provider)) changes.push("proveedor");
      if (valuesDiffer(existing.family, row.family)) changes.push("familia");
      if (valuesDiffer(existing.subfamily, row.subfamily)) changes.push("subfamilia");
      if (valuesDiffer(existing.description, row.description)) {
        changes.push("descripcion");
      }
      if (
        valuesDiffer(existing.xMm, row.xMm) ||
        valuesDiffer(existing.yMm, row.yMm) ||
        valuesDiffer(existing.thicknessMm, row.thicknessMm)
      ) {
        changes.push("dimensiones");
      }
    }

    return {
      ...row,
      status: errors.length
        ? "error"
        : !existing
          ? "new"
          : changes.length
            ? "changed"
            : "unchanged",
      errors,
      changes,
      existingPrice: existing?.price ?? null,
      existingProvider: existing?.provider ?? null,
    };
  });

  const absentRows: PricePreviewRow[] = existingItems
    .filter((item) => item.isActive && !importedKeys.has(item.itemKey))
    .map((item) => ({
      sourceSheet: item.sourceSheet,
      sourceRow: item.sourceRow,
      itemKey: item.itemKey,
      family: item.family,
      subfamily: item.subfamily,
      description: item.description,
      xMm: item.xMm,
      yMm: item.yMm,
      thicknessMm: item.thicknessMm,
      price: item.price,
      unit: item.unit,
      provider: item.provider,
      extra1Label: item.extra1Label,
      extra1Value: item.extra1Value,
      extra2Label: item.extra2Label,
      extra2Value: item.extra2Value,
      extra3Label: item.extra3Label,
      extra3Value: item.extra3Value,
      boardPrice: item.boardPrice,
      status: "absent",
      errors: [],
      changes: ["ausente en el archivo"],
      existingPrice: item.price,
      existingProvider: item.provider,
    }));

  return [...previewRows, ...absentRows];
}

function summarizeRows(rows: PricePreviewRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status !== "error").length,
    new: rows.filter((row) => row.status === "new").length,
    changed: rows.filter((row) => row.status === "changed").length,
    unchanged: rows.filter((row) => row.status === "unchanged").length,
    absent: rows.filter((row) => row.status === "absent").length,
    errors: rows.filter((row) => row.status === "error").length,
  };
}

function parseRowsJson(value: string): PricePreviewRow[] {
  const parsed = JSON.parse(value) as PricePreviewRow[];

  if (!Array.isArray(parsed)) {
    throw new Error("La previsualizacion no tiene formato valido.");
  }

  return parsed;
}

function parseBudgetItemsJson(value: string): BudgetTemplateItem[] {
  if (!value) return [];
  const parsed = JSON.parse(value) as BudgetTemplateItem[];

  if (!Array.isArray(parsed)) {
    throw new Error("El catalogo de presupuesto no tiene formato valido.");
  }

  return parsed;
}

function parseCellsJson(value: string): ExcelWorkbookCellValue[] {
  if (!value) return [];
  const parsed = JSON.parse(value) as ExcelWorkbookCellValue[];

  if (!Array.isArray(parsed)) {
    throw new Error("Las celdas del Excel no tienen formato valido.");
  }

  return parsed;
}

export async function previewPriceImportAction(
  _previousState: PriceImportState,
  formData: FormData
): Promise<PriceImportState> {
  const actor = await requireAnyRole(OWNER_ONLY);
  const file = formData.get("excelFile");

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Selecciona un archivo Excel.",
      rows: [],
    };
  }

  try {
    const parsedWorkbook = parsePriceWorkbook(await file.arrayBuffer());
    const rows = await buildPreviewRows(actor.companyId, parsedWorkbook.rows);

    return {
      notice: "Archivo analizado. Revisa el resumen antes de aplicar cambios.",
      fileName: file.name,
      sourceType: parsedWorkbook.sourceType,
      warnings: parsedWorkbook.warnings,
      summary: summarizeRows(rows),
      rows,
      catalogSummary: parsedWorkbook.budgetItems
        ? {
            budgetItems: parsedWorkbook.budgetItems.length,
            workbookCells: parsedWorkbook.cells?.length ?? 0,
          }
        : undefined,
      budgetItems: parsedWorkbook.budgetItems,
      cells: parsedWorkbook.cells,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo analizar el archivo Excel.",
      rows: [],
    };
  }
}

export async function applyPriceImportAction(
  _previousState: PriceImportState,
  formData: FormData
): Promise<PriceImportState> {
  const actor = await requireAnyRole(OWNER_ONLY);
  const rowsJson = readString(formData, "rowsJson");
  const budgetItemsJson = readString(formData, "budgetItemsJson");
  const cellsJson = readString(formData, "cellsJson");
  const fileName = readNullableString(formData, "fileName");
  const sourceType = readString(formData, "sourceType") || "unknown";

  if (!rowsJson) {
    return { error: "Falta la previsualizacion a aplicar.", rows: [] };
  }

  try {
    const rows = parseRowsJson(rowsJson);
    const budgetItems = parseBudgetItemsJson(budgetItemsJson);
    const cells = parseCellsJson(cellsJson);
    const blockingErrors = rows.filter((row) => row.status === "error");

    if (blockingErrors.length && !budgetItems.length) {
      return {
        error: "Corrige los errores del archivo antes de aplicar la importacion.",
        rows,
        summary: summarizeRows(rows),
      };
    }

    const actionableRows = rows.filter(
      (row) => row.status === "new" || row.status === "changed"
    );

    if (!actionableRows.length && !budgetItems.length && !cells.length) {
      return {
        notice: "No habia precios nuevos o modificados que aplicar.",
        rows,
        summary: summarizeRows(rows),
      };
    }

    await prisma.$transaction(async (tx) => {
      if (budgetItems.length) {
        await tx.catalogItem.deleteMany({
          where: {
            companyId: actor.companyId,
          },
        });

        await tx.catalogItem.createMany({
          data: budgetItems.map((item) => ({
            companyId: actor.companyId,
            sourceSheet: item.sourceSheet,
            sourceRow: item.sourceRow,
            sectionTitle: item.sectionTitle,
            familyKey: item.familyKey,
            itemKey: item.itemKey,
            family: item.family,
            subfamily: item.subfamily,
            material: item.material,
            itemName: item.itemName,
            input1Label: item.inputs[0]?.label ?? null,
            input2Label: item.inputs[1]?.label ?? null,
            input3Label: item.inputs[2]?.label ?? null,
            measureUnit: item.measureUnit,
            quantityLabel: item.quantityLabel,
            priceLabel: "€ TOTAL",
            unitPriceBase:
              typeof item.defaults.L === "number" ? item.defaults.L : 0,
            unitPriceRaw:
              typeof item.defaults.J === "number" ? item.defaults.J : null,
            inputConfig: item.inputs as Prisma.InputJsonValue,
            formulaConfig: item.formulas as Prisma.InputJsonValue,
            componentConfig: {
              sectionTitle: item.sectionTitle,
              resultColumns: ["J", "K", "L", "M"],
            } as Prisma.InputJsonValue,
            defaultValues: item.defaults as Prisma.InputJsonValue,
            isActive: true,
          })),
        });
      }

      if (cells.length) {
        await tx.excelWorkbookCell.deleteMany({
          where: {
            companyId: actor.companyId,
          },
        });

        await tx.excelWorkbookCell.createMany({
          data: cells.map((cell) => ({
            companyId: actor.companyId,
            sheetName: cell.sheetName,
            cellAddress: cell.cellAddress,
            valueNumber: cell.valueNumber,
            valueText: cell.valueText,
            formula: cell.formula,
          })),
        });
      }

      for (const row of actionableRows) {
        const errors = getRowErrors(row);
        if (errors.length) {
          throw new Error(`${row.itemKey}: ${errors.join(" ")}`);
        }

        await tx.catalogPriceItem.upsert({
          where: {
            companyId_itemKey: {
              companyId: actor.companyId,
              itemKey: row.itemKey,
            },
          },
          create: {
            companyId: actor.companyId,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
            itemKey: row.itemKey,
            family: row.family,
            subfamily: row.subfamily,
            description: row.description,
            xMm: row.xMm,
            yMm: row.yMm,
            thicknessMm: row.thicknessMm,
            unit: row.unit,
            price: row.price,
            provider: row.provider,
            extra1Label: row.extra1Label,
            extra1Value: row.extra1Value,
            extra2Label: row.extra2Label,
            extra2Value: row.extra2Value,
            extra3Label: row.extra3Label,
            extra3Value: row.extra3Value,
            boardPrice: row.boardPrice,
            isActive: true,
          },
          update: {
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
            family: row.family,
            subfamily: row.subfamily,
            description: row.description,
            xMm: row.xMm,
            yMm: row.yMm,
            thicknessMm: row.thicknessMm,
            unit: row.unit,
            price: row.price,
            provider: row.provider,
            extra1Label: row.extra1Label,
            extra1Value: row.extra1Value,
            extra2Label: row.extra2Label,
            extra2Value: row.extra2Value,
            extra3Label: row.extra3Label,
            extra3Value: row.extra3Value,
            boardPrice: row.boardPrice,
            isActive: true,
          },
        });
      }

      await tx.catalogPriceImportBatch.create({
        data: {
          companyId: actor.companyId,
          createdById: actor.id,
          fileName,
          sourceType,
          summary: {
            ...summarizeRows(rows),
            budgetItems: budgetItems.length,
            workbookCells: cells.length,
          } as Prisma.InputJsonValue,
        },
      });
    });

    revalidatePath(PRICES_PATH);
    revalidatePath("/budgets");
    revalidatePath("/budgets/new");

    return {
      notice:
        budgetItems.length || cells.length
          ? `${budgetItems.length} partidas y ${actionableRows.length} costes aplicados correctamente.`
          : `${actionableRows.length} precios aplicados correctamente.`,
      fileName,
      sourceType,
      rows,
      summary: summarizeRows(rows),
      catalogSummary: budgetItems.length
        ? {
            budgetItems: budgetItems.length,
            workbookCells: cells.length,
          }
        : undefined,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron aplicar los precios.",
      rows: [],
    };
  }
}

export async function createPriceItemAction(formData: FormData) {
  const actor = await requireAnyRole(OWNER_ONLY);
  const itemKey = readString(formData, "itemKey");
  const family = readString(formData, "family");
  const description = readString(formData, "description");
  const unit = readString(formData, "unit");
  const price = readRequiredNumber(formData, "price");

  if (!itemKey || !family || !description || !unit) {
    redirectWith("error", "Item key, familia, descripcion, unidad y precio son obligatorios.");
  }

  try {
    await prisma.catalogPriceItem.create({
      data: {
        companyId: actor.companyId,
        itemKey,
        family,
        subfamily: readNullableString(formData, "subfamily"),
        description,
        xMm: readNullableNumber(formData, "xMm"),
        yMm: readNullableNumber(formData, "yMm"),
        thicknessMm: readNullableNumber(formData, "thicknessMm"),
        unit,
        price,
        provider: readNullableString(formData, "provider"),
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002"
    ) {
      redirectWith("error", "Ya existe un precio con ese item_key.");
    }

    throw error;
  }

  revalidatePath(PRICES_PATH);
  redirectWith("notice", "Precio creado correctamente.");
}

export async function updatePriceItemAction(formData: FormData) {
  const actor = await requireAnyRole(OWNER_ONLY);
  const priceItemId = readString(formData, "priceItemId");
  const family = readString(formData, "family");
  const description = readString(formData, "description");
  const unit = readString(formData, "unit");
  const price = readRequiredNumber(formData, "price");

  if (!priceItemId || !family || !description || !unit) {
    redirectWith("error", "Familia, descripcion, unidad y precio son obligatorios.");
  }

  const existing = await prisma.catalogPriceItem.findFirst({
    where: {
      id: priceItemId,
      companyId: actor.companyId,
    },
    select: {
      id: true,
      sourceRow: true,
    },
  });

  if (!existing) {
    redirectWith("error", "Precio no encontrado.");
  }

  const provider = readNullableString(formData, "provider");

  await prisma.$transaction(async (tx) => {
    await tx.catalogPriceItem.update({
      where: {
        id: existing.id,
      },
      data: {
        family,
        subfamily: readNullableString(formData, "subfamily"),
        description,
        xMm: readNullableNumber(formData, "xMm"),
        yMm: readNullableNumber(formData, "yMm"),
        thicknessMm: readNullableNumber(formData, "thicknessMm"),
        unit,
        price,
        provider,
      },
    });

    if (existing.sourceRow) {
      const baseWhere = {
        companyId_sheetName_cellAddress: {
          companyId: actor.companyId,
          sheetName: "COSTE",
          cellAddress: `G${existing.sourceRow}`,
        },
      };

      await tx.excelWorkbookCell.upsert({
        where: baseWhere,
        create: {
          companyId: actor.companyId,
          sheetName: "COSTE",
          cellAddress: `G${existing.sourceRow}`,
          valueNumber: price,
        },
        update: {
          valueNumber: price,
          valueText: null,
          formula: null,
        },
      });

      await tx.excelWorkbookCell.upsert({
        where: {
          companyId_sheetName_cellAddress: {
            companyId: actor.companyId,
            sheetName: "COSTE",
            cellAddress: `H${existing.sourceRow}`,
          },
        },
        create: {
          companyId: actor.companyId,
          sheetName: "COSTE",
          cellAddress: `H${existing.sourceRow}`,
          valueText: unit,
        },
        update: {
          valueNumber: null,
          valueText: unit,
          formula: null,
        },
      });

      await tx.excelWorkbookCell.upsert({
        where: {
          companyId_sheetName_cellAddress: {
            companyId: actor.companyId,
            sheetName: "COSTE",
            cellAddress: `I${existing.sourceRow}`,
          },
        },
        create: {
          companyId: actor.companyId,
          sheetName: "COSTE",
          cellAddress: `I${existing.sourceRow}`,
          valueText: provider,
        },
        update: {
          valueNumber: null,
          valueText: provider,
          formula: null,
        },
      });
    }
  });

  revalidatePath(PRICES_PATH);
  redirectWith("notice", "Precio actualizado correctamente.");
}

export async function setPriceItemActiveAction(formData: FormData) {
  const actor = await requireAnyRole(OWNER_ONLY);
  const priceItemId = readString(formData, "priceItemId");
  const active = readString(formData, "active") === "1";

  if (!priceItemId) {
    redirectWith("error", "Falta el precio a actualizar.");
  }

  const result = await prisma.catalogPriceItem.updateMany({
    where: {
      id: priceItemId,
      companyId: actor.companyId,
    },
    data: {
      isActive: active,
    },
  });

  if (result.count === 0) {
    redirectWith("error", "Precio no encontrado.");
  }

  revalidatePath(PRICES_PATH);
  redirectWith("notice", active ? "Precio reactivado." : "Precio desactivado.");
}
