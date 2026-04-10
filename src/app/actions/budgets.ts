"use server";

import { prisma } from "@/lib/prisma";
import { Budget } from "@/domain/budgets/budget.model";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function saveBudgetDraft(input: Budget) {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!company) {
    throw new Error(
      "No existe ninguna empresa en la base de datos. Ejecuta primero el seed de empresa/usuario."
    );
  }

  const user = await prisma.user.findFirst({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error(
      "No existe ningún usuario para la empresa actual. Ejecuta primero el seed de usuario."
    );
  }

  let client = await prisma.client.findFirst({
    where: {
      companyId: company.id,
      email: "pendiente@espres.local",
    },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: "Cliente pendiente",
        email: "pendiente@espres.local",
        password: "pendiente",
        companyId: company.id,
      },
    });
  }

  const budgetData: Prisma.InputJsonValue = {
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
      family: line.family,
      item: line.item,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
    subtotal: input.subtotal,
    total: input.total,
  };

  const budget = await prisma.budget.create({
    data: {
      reference: input.code,
      status: "DRAFT",
      companyId: company.id,
      clientId: client.id,
      createdById: user.id,
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
  });

  revalidatePath("/budgets");

  return {
    ok: true,
    budgetId: budget.id,
    reference: budget.reference,
  };
}