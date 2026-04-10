import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StoredBudgetLine = {
  id?: string;
  catalogItemId?: string;
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

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatComplexity(value?: string) {
  switch (value) {
    case "low":
      return "Baja";
    case "medium":
      return "Media";
    case "high":
      return "Alta";
    default:
      return "-";
  }
}

function formatStatus(value: string) {
  switch (value) {
    case "DRAFT":
      return "Borrador";
    case "SENT":
      return "Enviado";
    case "ACCEPTED":
      return "Aceptado";
    case "REJECTED":
      return "Rechazado";
    default:
      return value;
  }
}

function getStatusClasses(value: string) {
  switch (value) {
    case "DRAFT":
      return "border-gray-200 bg-gray-50 text-gray-700";
    case "SENT":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ACCEPTED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.companyId || session.user.type !== "USER") {
    redirect("/login");
  }

  const budgets = await prisma.budget.findMany({
    where: {
      companyId: session.user.companyId,
    },
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
    <main className="space-y-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <p className="text-sm text-gray-600">
            Borradores y presupuestos guardados de tu empresa.
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

            const total = Number.isFinite(data.total) ? Number(data.total) : 0;
            const surfaceM2 = Number.isFinite(data.dimensions?.surfaceM2)
              ? Number(data.dimensions?.surfaceM2)
              : 0;
            const perimeterML = Number.isFinite(data.dimensions?.perimeterML)
              ? Number(data.dimensions?.perimeterML)
              : 0;
            const lineCount = Array.isArray(data.lines) ? data.lines.length : 0;

            const clientLabel =
              budget.client.email === "pendiente@espres.local"
                ? "Cliente pendiente"
                : budget.client.name;

            return (
              <Link
                key={budget.id}
                href={`/budgets/${budget.id}`}
                className="block rounded border p-4 transition hover:bg-gray-50"
              >
                <article className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {budget.reference}
                        </h2>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClasses(
                            budget.status
                          )}`}
                        >
                          {formatStatus(budget.status)}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          Proyecto:{" "}
                          <strong className="text-black">
                            {data.project?.trim() || "Sin nombre"}
                          </strong>
                        </p>

                        <p>
                          Cliente:{" "}
                          <strong className="text-black">{clientLabel}</strong>
                        </p>

                        <p>
                          {lineCount} {lineCount === 1 ? "partida" : "partidas"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(total)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">{formatDate(data.date)}</p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-sm text-gray-500">Complejidad</p>
                      <p className="font-medium">
                        {formatComplexity(data.complexity)}
                      </p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-sm text-gray-500">Superficie</p>
                      <p className="font-medium">{surfaceM2} m²</p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-sm text-gray-500">Perímetro</p>
                      <p className="font-medium">{perimeterML} ml</p>
                    </div>

                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-sm text-gray-500">Versión</p>
                      <p className="font-medium">
                        v{latestVersion?.version ?? 1}
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