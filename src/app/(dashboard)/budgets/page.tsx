import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function BudgetsPage() {
  const budgets = await prisma.budget.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
    },
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presupuestos</h1>

        <Link
          href="/budgets/new"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Nuevo presupuesto
        </Link>
      </div>

      {budgets.length === 0 ? (
        <p>No hay presupuestos todavía.</p>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {budget.reference} - {budget.project}
                </p>
                <p className="text-sm text-gray-500">
                  Cliente: {budget.client?.name}
                </p>
              </div>

              <Link
                href={`/budgets/${budget.id}`}
                className="text-blue-600 underline"
              >
                Ver
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
