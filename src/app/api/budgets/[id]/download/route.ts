import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { NextResponse } from "next/server";

import { getInternalUserContext } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type StoredBudgetLine = {
  family?: string;
  item?: string;
  material?: string | null;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

type StoredBudgetData = {
  code?: string;
  project?: string;
  date?: string;
  complexity?: string;
  notes?: string;
  discountPercent?: number;
  dimensions?: {
    width?: number;
    length?: number;
    surfaceM2?: number;
    perimeterML?: number;
  };
  lines?: StoredBudgetLine[];
  subtotal?: number;
  totalBeforeDiscount?: number;
  discountAmount?: number;
  total?: number;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const PAGE = {
  margin: 42,
  width: 595.28,
  height: 841.89,
};

const COLORS = {
  ink: "#24211f",
  muted: "#6f675f",
  border: "#ded8cf",
  surface: "#f4f2ef",
  card: "#fffdfa",
  primary: "#a9683d",
  primarySoft: "#f2dfcf",
};

const TABLE = {
  itemX: 52,
  itemW: 238,
  familyX: 300,
  familyW: 56,
  qtyX: 364,
  qtyW: 40,
  unitX: 412,
  unitW: 34,
  priceX: 450,
  priceW: 48,
  totalX: 504,
  totalW: 48,
};

function getSnapshotData(data: unknown): StoredBudgetData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as StoredBudgetData;
}

function getLineTotal(line: StoredBudgetLine) {
  if (typeof line.total === "number") return line.total;

  return (line.quantity ?? 0) * (line.unitPrice ?? 0);
}

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatComplexity(value?: string) {
  switch (value?.toLowerCase()) {
    case "low":
    case "baja":
      return "Baja";
    case "medium":
    case "media":
      return "Media";
    case "high":
    case "alta":
      return "Alta";
    default:
      return value || "-";
  }
}

function buildFileName(reference: string) {
  const safeReference =
    reference
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "presupuesto";

  return `${safeReference}.pdf`;
}

function textOrDash(value?: string | null) {
  return value?.trim() || "-";
}

function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc
    .roundedRect(x, y, width, height, 6)
    .fillAndStroke(COLORS.card, COLORS.border);
}

function drawMetric(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  drawCard(doc, x, y, width, 58);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), x + 12, y + 12, { width: width - 24 });
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(value, x + 12, y + 31, { width: width - 24, ellipsis: true });
}

function formatPercent(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

function drawNotesCard(doc: PDFKit.PDFDocument, notes?: string) {
  const text = notes?.trim() || "Sin notas para este presupuesto.";
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  const textWidth = width - 28;
  const textHeight = doc
    .font("Helvetica")
    .fontSize(9)
    .heightOfString(text, { width: textWidth });
  const height = Math.max(72, textHeight + 48);

  ensureSpace(doc, height + 18);

  const y = doc.y;
  drawCard(doc, x, y, width, height);
  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("NOTAS", x + 14, y + 14, { characterSpacing: 1.2 });
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica")
    .fontSize(9)
    .text(text, x + 14, y + 34, {
      width: textWidth,
      lineGap: 2,
    });

  doc.y = y + height + 22;
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight <= PAGE.height - PAGE.margin) return;
  doc.addPage();
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;

  doc.roundedRect(x, y, width, 24, 4).fill(COLORS.surface);
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8);
  doc.text("PARTIDA", TABLE.itemX, y + 8, { width: TABLE.itemW });
  doc.text("FAMILIA", TABLE.familyX, y + 8, { width: TABLE.familyW });
  doc.text("CANT.", TABLE.qtyX, y + 8, { width: TABLE.qtyW, align: "right" });
  doc.text("UD.", TABLE.unitX, y + 8, { width: TABLE.unitW });
  doc.text("PRECIO", TABLE.priceX, y + 8, {
    width: TABLE.priceW,
    align: "right",
  });
  doc.text("TOTAL", TABLE.totalX, y + 8, {
    width: TABLE.totalW,
    align: "right",
  });

  doc.y = y + 30;
}

async function createPdfBuffer(
  budget: {
    reference: string;
    project: string;
    status: string;
    client: { name: string };
    createdBy: { email: string };
    versions: Array<{ version: number; data: unknown }>;
  },
  data: StoredBudgetData,
  subtotal: number,
  totalBeforeDiscount: number,
  discountPercent: number,
  discountAmount: number,
  total: number
) {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    bufferPages: true,
    info: {
      Title: `Presupuesto ${data.code || budget.reference}`,
      Author: "Espres",
    },
  });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const reference = data.code?.trim() || budget.reference;
  const project = data.project?.trim() || budget.project;
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const dimensions = data.dimensions ?? {};
  const latestVersion = budget.versions[0]?.version ?? 1;

  doc
    .rect(0, 0, PAGE.width, 112)
    .fill(COLORS.surface)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("ESPRES", PAGE.margin, 34, { characterSpacing: 1.5 });

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(reference, PAGE.margin, 52, { width: 320, ellipsis: true });

  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(project, PAGE.margin, 82, { width: 320, ellipsis: true });

  doc
    .roundedRect(430, 40, 86, 26, 13)
    .fill(COLORS.primarySoft)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(budget.status, 430, 49, { width: 86, align: "center" });

  const metricsY = 134;
  const gap = 10;
  const metricW = (PAGE.width - PAGE.margin * 2 - gap * 3) / 4;

  drawMetric(doc, "Cliente", textOrDash(budget.client.name), PAGE.margin, metricsY, metricW);
  drawMetric(
    doc,
    "Responsable",
    textOrDash(budget.createdBy.email),
    PAGE.margin + (metricW + gap),
    metricsY,
    metricW
  );
  drawMetric(
    doc,
    "Fecha",
    formatDate(data.date),
    PAGE.margin + (metricW + gap) * 2,
    metricsY,
    metricW
  );
  drawMetric(
    doc,
    "Version",
    `v${latestVersion}`,
    PAGE.margin + (metricW + gap) * 3,
    metricsY,
    metricW
  );

  doc.y = metricsY + 86;

  const summaryY = doc.y;
  const summaryGap = 18;
  const summaryW = (PAGE.width - PAGE.margin * 2 - summaryGap) / 2;

  drawCard(doc, PAGE.margin, summaryY, summaryW, 96);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("DATOS DEL PRESUPUESTO", PAGE.margin + 14, summaryY + 14);
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica")
    .fontSize(10)
    .text(`Superficie: ${formatNumber(dimensions.surfaceM2)} m2`, PAGE.margin + 14, summaryY + 36)
    .text(`Perimetro: ${formatNumber(dimensions.perimeterML)} ml`, PAGE.margin + 14, summaryY + 56)
    .text(`Complejidad: ${formatComplexity(data.complexity)}`, PAGE.margin + 14, summaryY + 76);

  const summary2X = PAGE.margin + summaryW + summaryGap;
  drawCard(doc, summary2X, summaryY, summaryW, 96);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("RESUMEN ECONOMICO", summary2X + 14, summaryY + 14);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text("Subtotal", summary2X + 14, summaryY + 38, { width: 92 })
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .text(formatCurrency(subtotal), summary2X + 120, summaryY + 38, {
      width: summaryW - 134,
      align: "right",
    });

  if (discountPercent > 0 && discountAmount > 0) {
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(9)
      .text(`Antes dto.`, summary2X + 14, summaryY + 57, { width: 92 })
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .text(formatCurrency(totalBeforeDiscount), summary2X + 120, summaryY + 57, {
        width: summaryW - 134,
        align: "right",
      })
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .text(`Dto. ${formatPercent(discountPercent)}%`, summary2X + 14, summaryY + 74, {
        width: 92,
      })
      .text(`-${formatCurrency(discountAmount)}`, summary2X + 120, summaryY + 74, {
        width: summaryW - 134,
        align: "right",
      });
  }

  const totalLabelY = discountPercent > 0 && discountAmount > 0 ? 82 : 64;
  const totalValueY = discountPercent > 0 && discountAmount > 0 ? 76 : 58;

  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(10)
    .text("Total", summary2X + 14, summaryY + totalLabelY, { width: 92 })
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(formatCurrency(total), summary2X + 100, summaryY + totalValueY, {
      width: summaryW - 114,
      align: "right",
    });

  doc.y = summaryY + 122;

  drawNotesCard(doc, data.notes);

  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Partidas", PAGE.margin, doc.y);
  doc.y += 22;
  drawTableHeader(doc, doc.y);

  lines.forEach((line, index) => {
    ensureSpace(doc, 62);

    if (doc.y < 80) {
      drawTableHeader(doc, doc.y);
    }

    const x = PAGE.margin;
    const y = doc.y;
    const width = PAGE.width - PAGE.margin * 2;
    const rowHeight = line.material ? 48 : 38;

    doc
      .rect(x, y, width, rowHeight)
      .fill(index % 2 === 0 ? "#ffffff" : "#faf8f5");
    doc
      .moveTo(x, y + rowHeight)
      .lineTo(x + width, y + rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(textOrDash(line.item), TABLE.itemX, y + 8, {
        width: TABLE.itemW,
        height: 24,
        ellipsis: true,
      });

    if (line.material) {
      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8)
        .text(line.material, TABLE.itemX, y + 25, {
          width: TABLE.itemW,
          height: 14,
          ellipsis: true,
        });
    }

    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(textOrDash(line.family), TABLE.familyX, y + 8, {
        width: TABLE.familyW,
        height: 24,
        ellipsis: true,
      });

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica")
      .fontSize(9)
      .text(formatNumber(line.quantity), TABLE.qtyX, y + 8, {
        width: TABLE.qtyW,
        align: "right",
      })
      .text(textOrDash(line.unit), TABLE.unitX, y + 8, { width: TABLE.unitW })
      .text(formatCurrency(line.unitPrice), TABLE.priceX, y + 8, {
        width: TABLE.priceW,
        align: "right",
      })
      .font("Helvetica-Bold")
      .text(formatCurrency(getLineTotal(line)), TABLE.totalX, y + 8, {
        width: TABLE.totalW,
        align: "right",
      });

    doc.y = y + rowHeight;
  });

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i += 1) {
    doc.switchToPage(i);
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Presupuesto ${reference} - Pagina ${i + 1}/${pages.count}`,
        PAGE.margin,
        PAGE.height - 30,
        { width: PAGE.width - PAGE.margin * 2, align: "center" }
      );
  }

  doc.end();

  return done;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getInternalUserContext();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const budget = await prisma.budget.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    select: {
      reference: true,
      project: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          version: true,
          data: true,
        },
      },
    },
  });

  if (!budget) {
    return NextResponse.json(
      { error: "No se ha encontrado el presupuesto." },
      { status: 404 }
    );
  }

  const latestVersion = budget.versions[0];
  const data = getSnapshotData(latestVersion?.data ?? {});
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const subtotal =
    typeof data.subtotal === "number"
      ? data.subtotal
      : lines.reduce((acc, line) => acc + getLineTotal(line), 0);
  const totalBeforeDiscount =
    typeof data.totalBeforeDiscount === "number"
      ? data.totalBeforeDiscount
      : data.total ?? subtotal;
  const discountPercent =
    typeof data.discountPercent === "number" ? data.discountPercent : 0;
  const discountAmount =
    typeof data.discountAmount === "number" ? data.discountAmount : 0;
  const total = typeof data.total === "number" ? data.total : subtotal;
  const reference = data.code?.trim() || budget.reference;
  const pdf = await createPdfBuffer(
    budget,
    data,
    subtotal,
    totalBeforeDiscount,
    discountPercent,
    discountAmount,
    total
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Disposition": `attachment; filename="${buildFileName(
        reference
      )}"`,
      "Content-Type": "application/pdf",
    },
  });
}
