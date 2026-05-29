import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  Prisma,
  PrismaClient,
  Role,
} from "../src/generated/prisma/index.js";
import { parsePriceWorkbook } from "../src/domain/prices/price-import";

const prisma = new PrismaClient();

const DEFAULT_EXCEL_PATH =
  "C:\\Users\\Usuario\\Desktop\\PLANTILLA - Presupuesto ESWood-Alex - V1.3.xlsx";
const excelPathArg = process.argv.slice(2).find((arg) => arg !== "--");
const EXCEL_PATH = path.resolve(
  excelPathArg ?? process.env.EXCEL_PATH ?? DEFAULT_EXCEL_PATH
);
const COMPANY_ID = process.env.COMPANY_ID?.trim();
const COMPANY_NAME = process.env.COMPANY_NAME?.trim();
const CREATED_BY_EMAIL = process.env.CREATED_BY_EMAIL?.trim();
const DRY_RUN = process.env.DRY_RUN === "true";
const PARSE_ONLY = process.env.PARSE_ONLY === "true";

function rowHasValidPrice(row: { price: number }) {
  return Number.isFinite(row.price) && row.price >= 0;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function resolveCompany() {
  if (COMPANY_ID) {
    const company = await prisma.company.findUnique({
      where: { id: COMPANY_ID },
      select: { id: true, name: true },
    });

    if (!company) {
      throw new Error(`No existe ninguna empresa con COMPANY_ID=${COMPANY_ID}.`);
    }

    return company;
  }

  if (COMPANY_NAME) {
    const company = await prisma.company.findFirst({
      where: { name: COMPANY_NAME },
      select: { id: true, name: true },
    });

    if (!company) {
      throw new Error(`No existe ninguna empresa con COMPANY_NAME=${COMPANY_NAME}.`);
    }

    return company;
  }

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (companies.length === 0) {
    throw new Error("No hay empresas en la base de datos.");
  }

  const espresCompany =
    companies.find((company) =>
      company.name.toLocaleLowerCase("es").includes("espres")
    ) ?? null;

  if (espresCompany) return espresCompany;

  if (companies.length === 1) return companies[0];

  throw new Error(
    "Hay varias empresas. Ejecuta con COMPANY_ID o COMPANY_NAME para evitar importar en la empresa equivocada."
  );
}

async function resolveOwner(companyId: string) {
  const where = {
    companyId,
    role: Role.OWNER,
    ...(CREATED_BY_EMAIL ? { email: CREATED_BY_EMAIL } : {}),
  };

  const owner = await prisma.user.findFirst({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  if (!owner) {
    throw new Error(
      CREATED_BY_EMAIL
        ? `No existe OWNER ${CREATED_BY_EMAIL} en la empresa seleccionada.`
        : "No existe ningun OWNER en la empresa seleccionada."
    );
  }

  return owner;
}

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No existe el archivo Excel: ${EXCEL_PATH}`);
  }

  const workbookBuffer = fs.readFileSync(EXCEL_PATH);
  const parsed = parsePriceWorkbook(workbookBuffer.buffer.slice(
    workbookBuffer.byteOffset,
    workbookBuffer.byteOffset + workbookBuffer.byteLength
  ));
  const validPriceRows = parsed.rows.filter(rowHasValidPrice);
  const invalidPriceRows = parsed.rows.filter((row) => !rowHasValidPrice(row));
  const budgetItems = parsed.budgetItems ?? [];
  const workbookCells = parsed.cells ?? [];

  const duplicatedPriceKeys = validPriceRows
    .map((row) => row.itemKey)
    .filter((itemKey, index, keys) => keys.indexOf(itemKey) !== index);

  if (duplicatedPriceKeys.length) {
    throw new Error(
      `El Excel contiene item_key duplicados: ${[...new Set(duplicatedPriceKeys)]
        .slice(0, 10)
        .join(", ")}`
    );
  }

  const duplicatedBudgetKeys = budgetItems
    .map((item) => item.itemKey)
    .filter((itemKey, index, keys) => keys.indexOf(itemKey) !== index);

  if (duplicatedBudgetKeys.length) {
    throw new Error(
      `El Excel contiene partidas de presupuesto duplicadas: ${[
        ...new Set(duplicatedBudgetKeys),
      ]
        .slice(0, 10)
        .join(", ")}`
    );
  }

  console.log(`Archivo: ${EXCEL_PATH}`);
  console.log(`Tipo detectado: ${parsed.sourceType}`);
  console.log(`Costes detectados: ${parsed.rows.length}`);
  console.log(`Costes validos: ${validPriceRows.length}`);
  console.log(`Costes omitidos por error: ${invalidPriceRows.length}`);
  console.log(`Partidas presupuesto detectadas: ${budgetItems.length}`);
  console.log(`Celdas Excel detectadas: ${workbookCells.length}`);

  if (parsed.warnings.length) {
    console.log("Avisos:");
    for (const warning of parsed.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (PARSE_ONLY) {
    console.log("PARSE_ONLY=true -> Excel validado sin conectar con la base de datos.");
    return;
  }

  const company = await resolveCompany();
  const owner = await resolveOwner(company.id);

  console.log(`Empresa: ${company.name}`);
  console.log(`OWNER auditoria: ${owner.email}`);

  if (DRY_RUN) {
    console.log("DRY_RUN=true -> no se escribe nada en la base de datos.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.catalogItem.deleteMany({ where: { companyId: company.id } });
      await tx.excelWorkbookCell.deleteMany({ where: { companyId: company.id } });
      await tx.catalogPriceItem.deleteMany({ where: { companyId: company.id } });

      for (const chunk of chunkArray(budgetItems, 200)) {
        await tx.catalogItem.createMany({
          data: chunk.map((item) => ({
            companyId: company.id,
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
            priceLabel: "\u20ac TOTAL",
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

      for (const chunk of chunkArray(workbookCells, 500)) {
        await tx.excelWorkbookCell.createMany({
          data: chunk.map((cell) => ({
            companyId: company.id,
            sheetName: cell.sheetName,
            cellAddress: cell.cellAddress,
            valueNumber: cell.valueNumber,
            valueText: cell.valueText,
            formula: cell.formula,
          })),
        });
      }

      for (const chunk of chunkArray(validPriceRows, 200)) {
        await tx.catalogPriceItem.createMany({
          data: chunk.map((row) => ({
            companyId: company.id,
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
          })),
        });
      }

      await tx.catalogPriceImportBatch.create({
        data: {
          companyId: company.id,
          createdById: owner.id,
          fileName: path.basename(EXCEL_PATH),
          sourceType: parsed.sourceType,
          summary: {
            total: parsed.rows.length,
            valid: validPriceRows.length,
            errors: invalidPriceRows.length,
            budgetItems: budgetItems.length,
            workbookCells: workbookCells.length,
            warnings: parsed.warnings,
          } as Prisma.InputJsonValue,
        },
      });
    },
    { timeout: 30_000 }
  );

  console.log("Importacion completada.");
}

main()
  .catch((error) => {
    console.error("Error importando Excel maestro:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
