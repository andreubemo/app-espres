"use server";

import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { Budget } from "@/domain/budgets/budget.model";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

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

async function getAuthenticatedUserContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Debes iniciar sesión para guardar presupuestos.");
  }

  if (!session.user.companyId) {
    throw new Error("Tu usuario no tiene empresa asociada.");
  }

  if (session.user.type !== "USER") {
    throw new Error(
      "Solo un usuario interno puede crear y guardar presupuestos."
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      companyId: session.user.companyId,
    },
  });

  if (!user) {
    throw new Error(
      "No se ha encontrado el usuario autenticado en la base de datos."
    );
  }

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

  return {
    ok: true,
    budgetId: budget.id,
    reference: budget.reference,
    version: budget.versions[0]?.version ?? 1,
  };
}