"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

import { Budget } from "@/domain/budgets/budget.model";
import { Prisma } from "@/generated/prisma";
import { requireInternalUser } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

type StoredBudgetLine = {
  id?: string;
  catalogItemId?: string | null;
  familyKey?: string | null;
  itemKey?: string | null;
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
  dimensions?: {
    width?: number;
    length?: number;
    surfaceM2?: number;
    perimeterML?: number;
  };
  lines?: StoredBudgetLine[];
  subtotal?: number;
  total?: number;
};

function buildBudgetSnapshot(input: Budget): Prisma.InputJsonValue {
  return {
    code: input.code,
    project: input.project,
    date: input.date,
    complexity: input.complexity,
    dimensions: {
      width: input.dimensions.width,
      length: input.dimensions.length,
      surfaceM2: input.dimensions.surfaceM2,
      perimeterML: input.dimensions.perimeterML,
    },
    lines: input.lines.map((line) => ({
      id: line.id,
      catalogItemId: line.catalogItemId,
      familyKey: line.familyKey ?? null,
      itemKey: line.itemKey ?? null,
      family: line.family,
      item: line.item,
      material: line.material ?? null,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
    subtotal: input.subtotal,
    total: input.total,
  };
}

function parseStoredBudgetData(data: Prisma.JsonValue): StoredBudgetData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as StoredBudgetData;
}

function cloneStoredBudgetData(data: StoredBudgetData): Prisma.InputJsonValue {
  return {
    code: data.code ?? "",
    project: data.project ?? "",
    date: data.date ?? "",
    complexity: data.complexity ?? "",
    dimensions: {
      width: data.dimensions?.width ?? 0,
      length: data.dimensions?.length ?? 0,
      surfaceM2: data.dimensions?.surfaceM2 ?? 0,
      perimeterML: data.dimensions?.perimeterML ?? 0,
    },
    lines: Array.isArray(data.lines)
      ? data.lines.map((line) => ({
          id: line.id ?? null,
          catalogItemId: line.catalogItemId ?? null,
          familyKey: line.familyKey ?? null,
          itemKey: line.itemKey ?? null,
          family: line.family ?? "",
          item: line.item ?? "",
          material: line.material ?? null,
          unit: line.unit ?? "",
          quantity: line.quantity ?? 0,
          unitPrice: line.unitPrice ?? 0,
          total: line.total ?? 0,
        }))
      : [],
    subtotal: data.subtotal ?? 0,
    total: data.total ?? 0,
  };
}

async function getAuthenticatedUserContext() {
  const user = await requireInternalUser();

  return {
    userId: user.id,
    companyId: user.companyId,
  };
}

async function getOrCreatePendingClient(companyId: string) {
  const pendingEmail = "pendiente@espres.local";

  const existingClient = await prisma.client.findFirst({
    where: {
      companyId,
      email: pendingEmail,
    },
  });

  if (existingClient) {
    return existingClient;
  }

  const hashedPassword = await bcrypt.hash("pendiente", 10);

  return prisma.client.create({
    data: {
      name: "Cliente pendiente",
      email: pendingEmail,
      password: hashedPassword,
      companyId,
    },
  });
}

async function getOwnedBudgetForAction(budgetId: string, companyId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      companyId,
    },
    include: {
      client: true,
      versions: {
        orderBy: { version: "desc" },
      },
    },
  });

  if (!budget) {
    throw new Error("No se ha encontrado el presupuesto.");
  }

  return budget;
}

function ensureBudgetHasVersion(
  versions: Array<{ version: number; data: Prisma.JsonValue }>
) {
  const latestVersion = versions[0];

  if (!latestVersion) {
    throw new Error("El presupuesto no tiene ninguna versión guardada.");
  }

  return latestVersion;
}

function buildDuplicateReference(reference: string) {
  return `${reference}-COPIA`;
}

export async function saveBudgetDraft(input: Budget) {
  if (!input.code.trim()) {
    throw new Error("El presupuesto debe tener un código.");
  }

  if (!input.project.trim()) {
    throw new Error("El presupuesto debe tener un proyecto.");
  }

  if (!input.lines.length) {
    throw new Error("Añade al menos una partida antes de guardar.");
  }

  const { userId, companyId } = await getAuthenticatedUserContext();
  const client = await getOrCreatePendingClient(companyId);
  const budgetData = buildBudgetSnapshot(input);

  const budget = await prisma.budget.create({
    data: {
      reference: input.code,
      project: input.project,
      status: "DRAFT",
      companyId,
      clientId: client.id,
      createdById: userId,
      versions: {
        create: [
          {
            version: 1,
            sent: false,
            data: budgetData,
          },
        ],
      },
    },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);

  return {
    ok: true,
    budgetId: budget.id,
    reference: budget.reference,
    version: budget.versions[0]?.version ?? 1,
  };
}

export async function markBudgetAsSent(budgetId: string) {
  if (!budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  const { companyId } = await getAuthenticatedUserContext();
  const budget = await getOwnedBudgetForAction(budgetId, companyId);
  const latestVersion = ensureBudgetHasVersion(budget.versions);

  await prisma.$transaction([
    prisma.budget.update({
      where: { id: budget.id },
      data: {
        status: "SENT",
      },
    }),
    prisma.budgetVersion.update({
      where: {
        budgetId_version: {
          budgetId: budget.id,
          version: latestVersion.version,
        },
      },
      data: {
        sent: true,
      },
    }),
  ]);

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);

  return {
    ok: true,
    budgetId: budget.id,
    status: "SENT",
    version: latestVersion.version,
  };
}

export async function createBudgetVersionFromLatest(budgetId: string) {
  if (!budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  const { companyId } = await getAuthenticatedUserContext();
  const budget = await getOwnedBudgetForAction(budgetId, companyId);
  const latestVersion = ensureBudgetHasVersion(budget.versions);

  const latestData = parseStoredBudgetData(latestVersion.data);
  const nextVersionNumber = latestVersion.version + 1;

  const createdVersion = await prisma.budgetVersion.create({
    data: {
      budgetId: budget.id,
      version: nextVersionNumber,
      sent: false,
      data: cloneStoredBudgetData(latestData),
    },
  });

  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      status: "DRAFT",
    },
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);

  return {
    ok: true,
    budgetId: budget.id,
    version: createdVersion.version,
  };
}

export async function duplicateBudgetDraft(budgetId: string) {
  if (!budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  const { companyId, userId } = await getAuthenticatedUserContext();
  const budget = await getOwnedBudgetForAction(budgetId, companyId);
  const latestVersion = ensureBudgetHasVersion(budget.versions);

  const latestData = parseStoredBudgetData(latestVersion.data);
  const duplicatedSnapshot = cloneStoredBudgetData(latestData);

  const duplicatedBudget = await prisma.budget.create({
    data: {
      reference: buildDuplicateReference(budget.reference),
      project: budget.project,
      status: "DRAFT",
      companyId,
      clientId: budget.clientId,
      createdById: userId,
      versions: {
        create: [
          {
            version: 1,
            sent: false,
            data: duplicatedSnapshot,
          },
        ],
      },
    },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);
  revalidatePath(`/budgets/${duplicatedBudget.id}`);

  return {
    ok: true,
    budgetId: duplicatedBudget.id,
    reference: duplicatedBudget.reference,
    version: duplicatedBudget.versions[0]?.version ?? 1,
  };
}

export async function restoreBudgetVersionAsLatest(
  budgetId: string,
  sourceVersionId: string
) {
  if (!budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  if (!sourceVersionId?.trim()) {
    throw new Error("Falta la versión que se quiere restaurar.");
  }

  const { companyId } = await getAuthenticatedUserContext();
  const budget = await getOwnedBudgetForAction(budgetId, companyId);
  const latestVersion = ensureBudgetHasVersion(budget.versions);

  const sourceVersion = budget.versions.find(
    (version) => version.id === sourceVersionId
  );

  if (!sourceVersion) {
    throw new Error("No se ha encontrado la versión seleccionada.");
  }

  const sourceData = parseStoredBudgetData(sourceVersion.data);
  const nextVersionNumber = latestVersion.version + 1;

  const restoredVersion = await prisma.budgetVersion.create({
    data: {
      budgetId: budget.id,
      version: nextVersionNumber,
      sent: false,
      data: cloneStoredBudgetData(sourceData),
    },
  });

  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      status: "DRAFT",
    },
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);

  return {
    ok: true,
    budgetId: budget.id,
    restoredFromVersion: sourceVersion.version,
    version: restoredVersion.version,
  };
}
