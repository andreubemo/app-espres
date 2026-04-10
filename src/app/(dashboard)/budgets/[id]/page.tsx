import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
  lines?: Array<{
    id?: string;
    family?: string;
    item?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  subtotal?: number;
  total?: number;
};

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      client: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!budget) {
    notFound();
  }

  const latestVersion = budget.versions[0];
  const data = (latestVersion?.data ?? {}) as StoredBudgetData;

  return (
    <main className="p-8 space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-gray-500">Presupuesto</p>
        <h1 className="text-2xl font-bold">{budget.reference}</h1>
        <p className="text-sm text-gray-600">
          Proyecto: {data.project || "Sin nombre"}
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{budget.client.name}</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="font-medium">{data.date || "-"}</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Complejidad</p>
          <p className="font-medium">{data.complexity || "-"}</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Estado</p>
          <p className="font-medium">{budget.status}</p>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Ancho</p>
          <p className="font-medium">{data.dimensions?.width ?? 0} m</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Largo</p>
          <p className="font-medium">{data.dimensions?.length ?? 0} m</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Superficie</p>
          <p className="font-medium">{data.dimensions?.surfaceM2 ?? 0} m²</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Perímetro</p>
          <p className="font-medium">{data.dimensions?.perimeterML ?? 0} ml</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Partidas</h2>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">
              {(data.total ?? 0).toFixed(2)} €
            </p>
          </div>
        </div>

        {!data.lines?.length ? (
          <div className="rounded border p-4 text-sm text-gray-500">
            Este presupuesto no tiene partidas.
          </div>
        ) : (
          <div className="space-y-3">
            {data.lines.map((line, index) => (
              <article
                key={line.id ?? `${line.item}-${index}`}
                className="rounded border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Partida {index + 1}
                    </p>
                    <h3 className="font-semibold">{line.item || "-"}</h3>
                    <p className="text-sm text-gray-600">
                      Familia: {line.family || "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total línea</p>
                    <p className="font-semibold">
                      {Number(line.total ?? 0).toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-gray-500">Cantidad</p>
                    <p className="font-medium">
                      {line.quantity ?? 0} {line.unit || ""}
                    </p>
                  </div>

                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-gray-500">Precio unitario</p>
                    <p className="font-medium">
                      {Number(line.unitPrice ?? 0).toFixed(2)} €
                    </p>
                  </div>

                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-gray-500">Unidad</p>
                    <p className="font-medium">{line.unit || "-"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Subtotal</p>
          <p className="text-lg font-semibold">
            {(data.subtotal ?? 0).toFixed(2)} €
          </p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold">
            {(data.total ?? 0).toFixed(2)} €
          </p>
        </div>
      </section>
    </main>
  );
}