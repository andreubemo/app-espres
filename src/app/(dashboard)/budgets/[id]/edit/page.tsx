import { notFound, redirect } from "next/navigation";

import { Budget, BudgetComplexity, BudgetLine } from "@/domain/budgets/budget.model";
import { getBudgetClientOptions } from "@/app/actions/budgets";
import { getInternalUserContext } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import type { StoredBudgetData, StoredBudgetLine } from "../budget-detail.types";
import EditBudgetClient from "./EditBudgetClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

function normalizeComplexity(value?: string): BudgetComplexity {
  switch (value?.toLowerCase()) {
    case "low":
    case "baja":
      return "low";
    case "high":
    case "alta":
      return "high";
    case "medium":
    case "media":
    default:
      return "medium";
  }
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSnapshotFromVersionData(data: unknown): StoredBudgetData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as StoredBudgetData;
}

function getLineQuantity(line: StoredBudgetLine) {
  return toNumber(line.snapshot?.quantity ?? line.quantity);
}

function getLineUnitPrice(line: StoredBudgetLine) {
  return toNumber(line.snapshot?.unitPrice ?? line.unitPrice);
}

function getLineTotal(line: StoredBudgetLine) {
  const explicitTotal = line.snapshot?.total ?? line.total;
  if (typeof explicitTotal === "number") return explicitTotal;

  return getLineQuantity(line) * getLineUnitPrice(line);
}

function buildBudgetLine(line: StoredBudgetLine, index: number): BudgetLine {
  const quantity = getLineQuantity(line);
  const unitPrice = getLineUnitPrice(line);

  return {
    id:
      line.id ||
      line.catalogItemId ||
      line.itemKey ||
      `line-${index + 1}`,
    catalogItemId:
      line.catalogItemId ||
      line.itemKey ||
      line.id ||
      `manual-${index + 1}`,
    familyKey: line.familyKey || undefined,
    itemKey: line.itemKey || undefined,
    family: line.snapshot?.family || line.family || line.familyKey || "-",
    item: line.snapshot?.item || line.item || line.itemKey || "-",
    material: line.material || undefined,
    unit: line.snapshot?.unit || line.unit || "ud.",
    quantity,
    unitPrice,
    total: getLineTotal(line),
  };
}

export default async function EditBudgetPage({ params }: PageProps) {
  const user = await getInternalUserContext();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const budget = await prisma.budget.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    select: {
      id: true,
      reference: true,
      project: true,
      clientId: true,
      versions: {
        orderBy: { version: "desc" },
        select: {
          version: true,
          data: true,
        },
      },
    },
  });

  if (!budget) {
    notFound();
  }

  const latestVersion = budget.versions[0];

  if (!latestVersion) {
    notFound();
  }

  const data = getSnapshotFromVersionData(latestVersion.data);
  const lines = Array.isArray(data.lines)
    ? data.lines.map((line, index) => buildBudgetLine(line, index))
    : [];
  const subtotal =
    typeof data.subtotal === "number"
      ? data.subtotal
      : lines.reduce((acc, line) => acc + line.total, 0);
  const total = typeof data.total === "number" ? data.total : subtotal;

  const initialBudget: Budget = {
    code: data.code?.trim() || budget.reference,
    project: data.project?.trim() || budget.project,
    clientId: data.clientId?.trim() || budget.clientId,
    date: data.date || new Date().toISOString().slice(0, 10),
    complexity: normalizeComplexity(data.complexity),
    dimensions: {
      width: toNumber(data.dimensions?.width),
      length: toNumber(data.dimensions?.length),
      surfaceM2: toNumber(data.dimensions?.surfaceM2),
      perimeterML: toNumber(data.dimensions?.perimeterML),
    },
    lines,
    subtotal,
    total,
  };

  const clients = await getBudgetClientOptions();

  return (
    <EditBudgetClient
      budgetId={budget.id}
      currentVersion={latestVersion.version}
      initialBudget={initialBudget}
      clients={clients}
    />
  );
}
