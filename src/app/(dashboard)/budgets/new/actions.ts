"use server"

import { getServerSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBudgetAction(data: {
  code: string
  project: string
  clientId: string
}) {
  const session = await getServerSession()

  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  const budget = await prisma.budget.create({
    data: {
      reference: data.code,
      project: data.project,
      clientId: data.clientId,
      companyId: session.user.companyId,
      createdById: session.user.id,
    },
  })

  await prisma.budgetVersion.create({
    data: {
      budgetId: budget.id,
      version: 1,
      sent: false,
      data: {},
    },
  })

  revalidatePath("/budgets")

  redirect(`/budgets/${budget.id}`)
}
