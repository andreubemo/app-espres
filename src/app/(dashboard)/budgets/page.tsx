import { redirect } from "next/navigation";

import { getInternalUserContext } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

import SectionCard from "@/ui/common/SectionCard";
import StatusBadge from "@/ui/common/StatusBadge";
import BudgetListActions from "@/ui/budgets/BudgetListActions";
import BudgetsFiltersBar from "@/ui/budgets/BudgetsFiltersBar";
import { Badge } from "@/ui/primitives/Badge";
import { Card } from "@/ui/primitives/Card";

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
    createdBudget?: string;
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

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[128px] rounded-md border border-[#e2ded8] bg-[#f4f2ef] px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase leading-4 text-[#5f5a52]">
        {label}
      </p>
      <p className="truncate text-sm font-semibold leading-5 text-text-strong">
        {value}
      </p>
    </div>
  );
}

export default async function BudgetsPage({ searchParams }: PageProps) {
  const user = await getInternalUserContext();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = resolvedSearchParams?.q?.trim() || "";
  const status = resolvedSearchParams?.status?.trim() || "";
  const createdBudgetId = resolvedSearchParams?.createdBudget?.trim() || "";

  const budgets = await prisma.budget.findMany({
    where: {
      companyId: user.companyId,
    },
    select: {
      id: true,
      reference: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          version: true,
          data: true,
        },
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
    const clientLabel = budget.client.name;

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
    <main className="min-h-screen bg-surface">
      {createdBudgetId ? (
        <style>{`
          @keyframes budget-created-flash {
            0% {
              border-color: #dedbd6;
              box-shadow: 0 1px 2px rgba(31, 31, 31, 0.05), 0 10px 24px rgba(31, 31, 31, 0.04);
              background: #fbfaf7;
            }
            18% {
              border-color: #a9683d;
              box-shadow: 0 0 0 4px rgba(169, 104, 61, 0.18), 0 14px 30px rgba(169, 104, 61, 0.12);
              background: #fff7f0;
            }
            100% {
              border-color: #dedbd6;
              box-shadow: 0 1px 2px rgba(31, 31, 31, 0.05), 0 10px 24px rgba(31, 31, 31, 0.04);
              background: #fbfaf7;
            }
          }

          .budget-created-flash {
            animation: budget-created-flash 1.8s ease-out 1;
          }
        `}</style>
      ) : null}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase text-primary">
            Gestión de presupuestos
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
            Presupuestos
          </h1>
          <p className="max-w-2xl text-sm leading-5 text-text-neutral">
            Borradores y presupuestos guardados de tu empresa.
          </p>
        </header>

        <SectionCard contentClassName="p-0">
          <BudgetsFiltersBar
            defaultQuery={q}
            defaultStatus={status}
            resultsCount={filteredBudgets.length}
          />
        </SectionCard>

        {filteredBudgets.length === 0 ? (
          <SectionCard className="border-dashed border-primary-soft">
            <div className="mx-auto max-w-md space-y-2 text-center">
              <h2 className="text-lg font-semibold text-text-strong">
                {q || status
                  ? "No se han encontrado presupuestos"
                  : "No hay presupuestos todav\u00eda"}
              </h2>

              <p className="text-sm text-text-neutral">
                {q || status
                  ? "Prueba a cambiar la b\u00fasqueda o limpiar los filtros actuales."
                  : "Cuando guardes tu primer presupuesto aparecer\u00e1 aqu\u00ed con su total, cliente, estado y acceso directo al detalle."}
              </p>
            </div>
          </SectionCard>
        ) : (
          <section className="space-y-3">
            {filteredBudgets.map((budget) => {
              const latestVersion = budget.versions[0];
              const data = (latestVersion?.data ?? {}) as StoredBudgetData;
              const { total, lines } = getBudgetTotals(data);

              const surfaceM2 = Number.isFinite(data.dimensions?.surfaceM2)
                ? Number(data.dimensions?.surfaceM2)
                : 0;

              const lineCount = lines.length;

              const clientLabel = budget.client.name;
              const ownerLabel = budget.createdBy.email;

              const projectLabel = data.project?.trim() || "Sin nombre";
              const codeLabel = data.code?.trim() || budget.reference;
              const isCreatedBudget = budget.id === createdBudgetId;

              return (
                <Card
                  key={budget.id}
                  className={[
                    "group transition hover:border-[#c9c2b8] hover:shadow-[0_2px_4px_rgba(31,31,31,0.06),0_14px_30px_rgba(31,31,31,0.06)]",
                    isCreatedBudget ? "budget-created-flash" : "",
                  ].join(" ")}
                  padding="none"
                  variant="elevated"
                >
                  <article className="space-y-3 p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-[#24211f]">
                            {codeLabel}
                          </h2>

                          <StatusBadge status={budget.status} />

                          <Badge variant="neutral">
                            v{latestVersion?.version ?? 1}
                          </Badge>
                        </div>

                        <div className="grid gap-x-4 gap-y-1 text-sm leading-5 text-text-neutral sm:grid-cols-2 xl:flex xl:flex-wrap">
                          <p className="min-w-0">
                            Proyecto:{" "}
                            <strong className="font-semibold text-text-strong">
                              {projectLabel}
                            </strong>
                          </p>

                          <p className="min-w-0">
                            Cliente:{" "}
                            <strong className="font-semibold text-text-strong">
                              {clientLabel}
                            </strong>
                          </p>

                          <p className="min-w-0">
                            Responsable:{" "}
                            <strong className="font-semibold text-text-strong">
                              {ownerLabel}
                            </strong>
                          </p>

                          <p>
                            {lineCount}{" "}
                            {lineCount === 1 ? "partida" : "partidas"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <BudgetListActions
                          budgetId={budget.id}
                          reference={codeLabel}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-2 border-t border-border pt-3">
                      <div className="min-w-[156px] rounded-md border border-[#d8d3cc] bg-[#f4f2ef] px-3 py-1.5">
                        <p className="text-[10px] font-semibold uppercase leading-4 text-[#5f5a52]">
                          Total
                        </p>
                        <p className="text-lg font-semibold leading-6 text-text-strong">
                          {formatCurrency(total)}
                        </p>
                      </div>
                      <CompactMetric
                        label="Fecha"
                        value={formatDate(data.date)}
                      />

                      <CompactMetric
                        label="Complejidad"
                        value={formatComplexity(data.complexity)}
                      />

                      <CompactMetric
                        label="Superficie"
                        value={`${formatNumber(surfaceM2)} m\u00b2`}
                      />
                    </div>
                  </article>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
