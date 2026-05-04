"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

import { Budget } from "@/domain/budgets/budget.model";
import {
  COMPLEXITY_FACTOR,
  round,
} from "@/domain/rules/pricing.rules";
import { Prisma } from "@/generated/prisma";
import { requireInternalUser } from "@/lib/access-control";
import {
  assertDiscountAllowedForPolicy,
  getBudgetDiscountPolicy,
  type BudgetDiscountPolicy,
} from "@/lib/budget-discounts";
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
  clientId?: string;
  date?: string;
  complexity?: string;
  notes?: string;
  discountPercent?: number;
  totalBeforeDiscount?: number;
  discountAmount?: number;
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

export type BudgetClientOption = {
  id: string;
  name: string;
  email: string;
};

export type BudgetFormContext = {
  clients: BudgetClientOption[];
  discountPolicy: BudgetDiscountPolicy;
};

function normalizeBudgetMoney(input: Budget, discountPercent: number): Budget {
  const subtotal = round(input.lines.reduce((sum, line) => sum + line.total, 0));
  const totalBeforeDiscount = round(
    subtotal * COMPLEXITY_FACTOR[input.complexity]
  );
  const discountAmount = round(totalBeforeDiscount * (discountPercent / 100));
  const total = round(Math.max(0, totalBeforeDiscount - discountAmount));

  return {
    ...input,
    notes: input.notes?.trim() ?? "",
    discountPercent,
    subtotal,
    totalBeforeDiscount,
    discountAmount,
    total,
  };
}

function buildBudgetSnapshot(input: Budget): Prisma.InputJsonValue {
  return {
    code: input.code,
    project: input.project,
    clientId: input.clientId,
    date: input.date,
    complexity: input.complexity,
    notes: input.notes,
    discountPercent: input.discountPercent,
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
    totalBeforeDiscount: input.totalBeforeDiscount,
    discountAmount: input.discountAmount,
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
    clientId: data.clientId ?? "",
    date: data.date ?? "",
    complexity: data.complexity ?? "",
    notes: data.notes ?? "",
    discountPercent: data.discountPercent ?? 0,
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
    totalBeforeDiscount: data.totalBeforeDiscount ?? data.total ?? 0,
    discountAmount: data.discountAmount ?? 0,
    total: data.total ?? 0,
  };
}

function stringifyComparableBudgetSnapshot(data: Prisma.InputJsonValue) {
  return JSON.stringify(data);
}

async function getAuthenticatedUserContext() {
  const user = await requireInternalUser();

  return {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
  };
}

async function getOwnedBudgetForAction(budgetId: string, companyId: string) {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      companyId,
    },
    include: {
      versions: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          data: true,
        },
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

export async function getBudgetClientOptions(): Promise<BudgetClientOption[]> {
  const { companyId } = await getAuthenticatedUserContext();

  return prisma.client.findMany({
    where: {
      companyId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function getBudgetFormContext(): Promise<BudgetFormContext> {
  const { companyId, role } = await getAuthenticatedUserContext();
  const clients = await prisma.client.findMany({
    where: {
      companyId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return {
    clients,
    discountPolicy: getBudgetDiscountPolicy(role),
  };
}

export async function createBudgetClient(input: {
  name: string;
  email: string;
}): Promise<BudgetClientOption> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    throw new Error("El cliente debe tener nombre.");
  }

  if (!email) {
    throw new Error("El cliente debe tener email.");
  }

  const { companyId } = await getAuthenticatedUserContext();
  const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 12);

  const client = await prisma.client.create({
    data: {
      name,
      email,
      password: hashedPassword,
      companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  revalidatePath("/clients");

  return client;
}

export async function saveBudgetDraft(input: Budget) {
  const { userId, companyId, role } = await getAuthenticatedUserContext();
  const discountPolicy = getBudgetDiscountPolicy(role);
  const discountPercent = assertDiscountAllowedForPolicy(
    input.discountPercent,
    discountPolicy
  );
  const normalizedBudget = normalizeBudgetMoney(input, discountPercent);

  if (!normalizedBudget.code.trim()) {
    throw new Error("El presupuesto debe tener un código.");
  }

  if (!normalizedBudget.project.trim()) {
    throw new Error("El presupuesto debe tener un proyecto.");
  }

  if (!normalizedBudget.clientId.trim()) {
    throw new Error("Selecciona un cliente para el presupuesto.");
  }

  if (!normalizedBudget.lines.length) {
    throw new Error("Añade al menos una partida antes de guardar.");
  }

  const client = await prisma.client.findFirst({
    where: {
      id: normalizedBudget.clientId,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    throw new Error("El cliente seleccionado no existe.");
  }

  const budgetData = buildBudgetSnapshot(normalizedBudget);

  const budget = await prisma.budget.create({
    data: {
      reference: normalizedBudget.code,
      project: normalizedBudget.project,
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

export async function updateBudgetDraft(input: {
  budgetId: string;
  budget: Budget;
}) {
  const { companyId, role } = await getAuthenticatedUserContext();
  const discountPolicy = getBudgetDiscountPolicy(role);
  const discountPercent = assertDiscountAllowedForPolicy(
    input.budget.discountPercent,
    discountPolicy
  );
  const nextBudget = normalizeBudgetMoney(input.budget, discountPercent);

  if (!input.budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  if (!nextBudget.code.trim()) {
    throw new Error("El presupuesto debe tener un código.");
  }

  if (!nextBudget.project.trim()) {
    throw new Error("El presupuesto debe tener un proyecto.");
  }

  if (!nextBudget.clientId.trim()) {
    throw new Error("Selecciona un cliente para el presupuesto.");
  }

  if (!nextBudget.lines.length) {
    throw new Error("Añade al menos una partida antes de guardar.");
  }

  const storedBudget = await getOwnedBudgetForAction(input.budgetId, companyId);
  const latestVersion = ensureBudgetHasVersion(storedBudget.versions);

  const client = await prisma.client.findFirst({
    where: {
      id: nextBudget.clientId,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    throw new Error("El cliente seleccionado no existe.");
  }

  const latestData = parseStoredBudgetData(latestVersion.data);
  const currentSnapshot = cloneStoredBudgetData({
    ...latestData,
    code: latestData.code ?? storedBudget.reference,
    project: latestData.project ?? storedBudget.project,
    clientId: latestData.clientId ?? storedBudget.clientId,
  });
  const nextSnapshot = buildBudgetSnapshot(nextBudget);

  if (
    stringifyComparableBudgetSnapshot(currentSnapshot) ===
    stringifyComparableBudgetSnapshot(nextSnapshot)
  ) {
    return {
      ok: true,
      unchanged: true,
      budgetId: storedBudget.id,
      reference: storedBudget.reference,
      version: latestVersion.version,
    };
  }

  const nextVersionNumber = latestVersion.version + 1;

  const createdVersion = await prisma.$transaction(async (tx) => {
    await tx.budget.update({
      where: { id: storedBudget.id },
      data: {
        reference: nextBudget.code,
        project: nextBudget.project,
        clientId: client.id,
        status: "DRAFT",
      },
    });

    return tx.budgetVersion.create({
      data: {
        budgetId: storedBudget.id,
        version: nextVersionNumber,
        sent: false,
        data: nextSnapshot,
      },
    });
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${storedBudget.id}`);
  revalidatePath(`/budgets/${storedBudget.id}/edit`);

  return {
    ok: true,
    unchanged: false,
    budgetId: storedBudget.id,
    reference: nextBudget.code,
    version: createdVersion.version,
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

export async function deleteBudget(budgetId: string) {
  if (!budgetId?.trim()) {
    throw new Error("Falta el identificador del presupuesto.");
  }

  const { companyId } = await getAuthenticatedUserContext();
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      companyId,
    },
    select: {
      id: true,
      reference: true,
    },
  });

  if (!budget) {
    throw new Error("No se ha encontrado el presupuesto.");
  }

  await prisma.$transaction([
    prisma.budgetVersion.deleteMany({
      where: {
        budgetId: budget.id,
      },
    }),
    prisma.budget.delete({
      where: {
        id: budget.id,
      },
    }),
  ]);

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${budget.id}`);

  return {
    ok: true,
    budgetId: budget.id,
    reference: budget.reference,
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
