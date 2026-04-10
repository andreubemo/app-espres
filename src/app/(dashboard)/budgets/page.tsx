import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
  subtotal?: number;
  total?: number;
};

export default async function BudgetsPage() {
  const budgets = await prisma.budget.findMany({
    include: {
      client: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <p className="text-sm text-gray-600">
            Listado de borradores guardados en base de datos.
          </p>
        </div>

        <Link
          href="/budgets/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Nuevo presupuesto
        </Link>
      </header>

      {budgets.length === 0 ? (
        <div className="rounded border p-4 text-sm text-gray-500">
          No hay presupuestos guardados todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const latestVersion = budget.versions[0];
            const data = (latestVersion?.data ?? {}) as StoredBudgetData;

            return (
              <Link
                key={budget.id}
                href={`/budgets/${budget.id}`}
                className="block rounded border p-4 transition hover:bg-gray-50"
              >
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="font-semibold">{budget.reference}</h2>

                      <p className="text-sm text-gray-600">
                        Proyecto: {data.project || "Sin nombre"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Cliente: {budget.client.name}
                      </p>

                      <p className="text-sm text-gray-600">
                        Estado: {budget.status}
                      </p>
                    </div>

                    <div className="text-right text-sm">
                      <p className="text-gray-500">Total</p>
                      <p className="text-lg font-semibold">
                        {(data.total ?? 0).toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Fecha</p>
                      <p className="font-medium">{data.date || "-"}</p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Complejidad</p>
                      <p className="font-medium">{data.complexity || "-"}</p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Superficie</p>
                      <p className="font-medium">
                        {data.dimensions?.surfaceM2 ?? 0} m²
                      </p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Perímetro</p>
                      <p className="font-medium">
                        {data.dimensions?.perimeterML ?? 0} ml
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}