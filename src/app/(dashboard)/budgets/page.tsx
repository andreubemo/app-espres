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
  snapshot?: {
    family?: string;
    item?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  };
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

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function formatComplexity(value?: string) {
  switch (value?.toLowerCase()) {
    case "low":
    case "baja":
      return "Baja";
    case "medium":
    case "media":
      return "Media";
    case "high":
    case "alta":
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
    case "APPROVED":
      return "Aceptado";
    case "REJECTED":
      return "Rechazado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return value;
  }
}

function getStatusClasses(value: string) {
  switch (value) {
    case "DRAFT":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    case "SENT":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ACCEPTED":
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-neutral-300 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function getLineTotal(line: StoredBudgetLine) {
  const explicitTotal = line.snapshot?.total ?? line.total;
  if (typeof explicitTotal === "number") return explicitTotal;

  const quantity = line.snapshot?.quantity ?? line.quantity ?? 0;
  const unitPrice = line.snapshot?.unitPrice ?? line.unitPrice ?? 0;

  return quantity * unitPrice;
}

function getBudgetTotals(data: StoredBudgetData) {
  const lines = Array.isArray(data.lines) ? data.lines : [];

  const subtotal =
    typeof data.subtotal === "number"
      ? data.subtotal
      : lines.reduce((acc, line) => acc + getLineTotal(line), 0);

  const total =
    typeof data.total === "number"
      ? data.total
      : subtotal;

  return { subtotal, total, lines };
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
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Gestión de presupuestos
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Presupuestos
              </h1>
            </div>

            <p className="text-sm text-neutral-600">
              Borradores y presupuestos guardados de tu empresa.
            </p>
          </div>

          <Link
            href="/budgets/new"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Nuevo presupuesto
          </Link>
        </header>

        {budgets.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                No hay presupuestos todavía
              </h2>
              <p className="text-sm text-neutral-500">
                Cuando guardes tu primer presupuesto aparecerá aquí con su total,
                cliente, estado y acceso directo al detalle.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            {budgets.map((budget) => {
              const latestVersion = budget.versions[0];
              const data = (latestVersion?.data ?? {}) as StoredBudgetData;
              const { total, lines } = getBudgetTotals(data);

              const surfaceM2 = Number.isFinite(data.dimensions?.surfaceM2)
                ? Number(data.dimensions?.surfaceM2)
                : 0;

              const perimeterML = Number.isFinite(data.dimensions?.perimeterML)
                ? Number(data.dimensions?.perimeterML)
                : 0;

              const lineCount = lines.length;

              const clientLabel =
                budget.client.email === "pendiente@espres.local"
                  ? "Cliente pendiente"
                  : budget.client.name;

              const projectLabel = data.project?.trim() || "Sin nombre";
              const codeLabel = data.code?.trim() || budget.reference;

              return (
                <Link
                  key={budget.id}
                  href={`/budgets/${budget.id}`}
                  className="group block rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                >
                  <article className="space-y-5 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-neutral-900 transition group-hover:text-neutral-700">
                            {codeLabel}
                          </h2>

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              budget.status
                            )}`}
                          >
                            {formatStatus(budget.status)}
                          </span>

                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            v{latestVersion?.version ?? 1}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-neutral-600">
                            Proyecto:{" "}
                            <strong className="font-semibold text-neutral-900">
                              {projectLabel}
                            </strong>
                          </p>

                          <p className="text-sm text-neutral-600">
                            Cliente:{" "}
                            <strong className="font-semibold text-neutral-900">
                              {clientLabel}
                            </strong>
                          </p>

                          <p className="text-sm text-neutral-500">
                            {lineCount} {lineCount === 1 ? "partida" : "partidas"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left lg:min-w-[180px] lg:text-right">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Total
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                          {formatCurrency(total)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatDate(data.date)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Complejidad
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatComplexity(data.complexity)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Superficie
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatNumber(surfaceM2)} m²
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Perímetro
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatNumber(perimeterML)} ml
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Referencia
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {budget.reference}
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
