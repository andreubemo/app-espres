import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { PRICE_UPDATE_HEADERS, PRICE_UPDATE_SHEET } from "@/domain/prices/price-import";
import { Role } from "@/generated/prisma";
import { getInternalUserContext } from "@/lib/access-control";

export const runtime = "nodejs";

function unauthorized(status: 401 | 403) {
  return NextResponse.json(
    {
      error:
        status === 401
          ? "No autenticado."
          : "Solo OWNER puede descargar esta plantilla.",
    },
    { status }
  );
}

function buildWorkbookBuffer() {
  const readmeRows = [
    ["Plantilla de actualizacion de precios Espres"],
    [""],
    ["Hoja a importar", PRICE_UPDATE_SHEET],
    ["Identificador estable", "item_key"],
    [""],
    [
      "Regla critica",
      "No cambies item_key si solo cambia precio, proveedor o descripcion.",
    ],
    [
      "Ausentes",
      "Si una partida no viene en el Excel, la app la mostrara como ausente y no la borrara.",
    ],
    [
      "Historico",
      "Los presupuestos ya guardados conservan sus precios en BudgetVersion.",
    ],
  ];

  const sampleRows = [
    [...PRICE_UPDATE_HEADERS],
    [
      "coste_madera_tablero_roble_2440_1220_19_m2",
      "MATERIALES",
      "TABLEROS",
      "Tablero roble",
      2440,
      1220,
      19,
      38.5,
      "m2",
      "Proveedor ejemplo",
      "Corte",
      2.5,
      "Transporte",
      0.75,
      "",
      "",
      114.58,
      "PRICE_UPDATE_IMPORT",
      2,
    ],
    [
      "coste_servicios_fabricacion_h",
      "SERVICIOS",
      "MANO DE OBRA",
      "Fabricacion",
      "",
      "",
      "",
      22.4,
      "h",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "PRICE_UPDATE_IMPORT",
      3,
    ],
  ];

  const workbook = XLSX.utils.book_new();
  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeRows);
  const importSheet = XLSX.utils.aoa_to_sheet(sampleRows);

  readmeSheet["!cols"] = [{ wch: 24 }, { wch: 86 }];
  importSheet["!cols"] = PRICE_UPDATE_HEADERS.map((header) => ({
    wch: Math.max(14, header.length + 2),
  }));

  XLSX.utils.book_append_sheet(workbook, readmeSheet, "README");
  XLSX.utils.book_append_sheet(workbook, importSheet, PRICE_UPDATE_SHEET);

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}

export async function GET() {
  const user = await getInternalUserContext();

  if (!user) {
    return unauthorized(401);
  }

  if (user.role !== Role.OWNER) {
    return unauthorized(403);
  }

  const buffer = buildWorkbookBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition":
        'attachment; filename="plantilla-actualizacion-precios-espres.xlsx"',
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
