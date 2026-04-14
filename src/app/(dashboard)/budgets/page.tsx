import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import PageHeader from "@/ui/common/PageHeader";
import SectionCard from "@/ui/common/SectionCard";
import StatusBadge from "@/ui/common/StatusBadge";
import StatCard from "@/ui/common/StatCard";
import BudgetsFiltersBar from "@/ui/budgets/BudgetsFiltersBar";

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

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
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

  const total = typeof data.total === "number" ? data.total : subtotal;

  return { subtotal, total, lines };
}

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function BudgetsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !session.user.companyId ||
    session.user.type !== "USER"
  ) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = resolvedSearchParams?.q?.trim() || "";
  const status = resolvedSearchParams?.status?.trim() || "";

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

  const filteredBudgets = budgets.filter((budget) => {
    const latestVersion = budget.versions[0];
    const data = (latestVersion?.data ?? {}) as StoredBudgetData;

    const codeLabel = data.code?.trim() || budget.reference || "";
    const projectLabel = data.project?.trim() || "";
    const clientLabel =
      budget.client.email === "pendiente@espres.local"
        ? "Cliente pendiente"
        : budget.client.name;

    const matchesStatus = !status || budget.status === status;

    const matchesQuery =
      !q ||
      matchesSearch(codeLabel, q) ||
      matchesSearch(projectLabel, q) ||
      matchesSearch(clientLabel, q) ||
      matchesSearch(budget.reference, q);

    return matchesStatus && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
        <PageHeader
          eyebrow="Gestión de presupuestos"
          title="Presupuestos"
          description="Borradores y presupuestos guardados de tu empresa."
        />

        <SectionCard contentClassName="p-0">
          <BudgetsFiltersBar
            defaultQuery={q}
            defaultStatus={status}
            resultsCount={filteredBudgets.length}
          />
        </SectionCard>

        {filteredBudgets.length === 0 ? (
          <SectionCard className="border-dashed border-neutral-300">
            <div className="mx-auto max-w-md space-y-2 text-center">
              <h2 className="text-lg font-semibold text-neutral-900">
                {q || status
                  ? "No se han encontrado presupuestos"
                  : "No hay presupuestos todavía"}
              </h2>

              <p className="text-sm text-neutral-500">
                {q || status
                  ? "Prueba a cambiar la búsqueda o limpiar los filtros actuales."
                  : "Cuando guardes tu primer presupuesto aparecerá aquí con su total, cliente, estado y acceso directo al detalle."}
              </p>
            </div>
          </SectionCard>
        ) : (
          <section className="space-y-4">
            {filteredBudgets.map((budget) => {
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

                          <StatusBadge status={budget.status} />

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
                            {lineCount}{" "}
                            {lineCount === 1 ? "partida" : "partidas"}
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
                      <StatCard label="Fecha" value={formatDate(data.date)} />

                      <StatCard
                        label="Complejidad"
                        value={formatComplexity(data.complexity)}
                      />

                      <StatCard
                        label="Superficie"
                        value={`${formatNumber(surfaceM2)} m²`}
                      />

                      <StatCard
                        label="Perímetro"
                        value={`${formatNumber(perimeterML)} ml`}
                      />

                      <StatCard
                        label="Referencia"
                        value={budget.reference}
                      />
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