import { prisma } from "@/lib/prisma"

export default async function BudgetsPage() {
  const budgets = await prisma.budget.findMany({
    include: {
      client: true,
    },
  })

  return (
    <div>
      <h1>Presupuestos</h1>

      <ul>
        {budgets.map((budget) => (
          <li key={budget.id}>
            {budget.reference} - {budget.project} - {budget.client.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
