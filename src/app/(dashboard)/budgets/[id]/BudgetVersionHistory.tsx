"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { restoreBudgetVersionAsLatest } from "@/app/actions/budgets";

type BudgetVersionHistoryItem = {
  id: string;
  version: number;
  sent: boolean;
  createdAt: string;
  project: string;
  lineCount: number;
  total: number;
  isCurrent: boolean;
  isViewed?: boolean;
};

type BudgetVersionHistoryProps = {
  budgetId: string;
  versions: BudgetVersionHistoryItem[];
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getVersionBadgeClasses(
  version: BudgetVersionHistoryItem,
  isBusy: boolean
) {
  if (version.isCurrent) {
    return "border-primary bg-primary text-white";
  }

  if (version.sent) {
    return "border-primary-soft bg-primary-soft/20 text-primary-strong";
  }

  return isBusy
    ? "border-border bg-surface text-text-neutral/55"
    : "border-border bg-surface text-text-neutral";
}

export default function BudgetVersionHistory({
  budgetId,
  versions,
}: BudgetVersionHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleRestore(versionId: string) {
    startTransition(async () => {
      const result = await restoreBudgetVersionAsLatest(budgetId, versionId);

      router.push(
        `/budgets/${budgetId}?restoredFrom=${result.restoredFromVersion}&restoredTo=${result.version}`
      );
      router.refresh();
    });
  }

  function handleViewVersion(versionNumber: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (versionNumber === versions.find((version) => version.isCurrent)?.version) {
      params.delete("viewVersion");
    } else {
      params.set("viewVersion", String(versionNumber));
    }

    router.push(`/budgets/${budgetId}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Historial de versiones
        </h2>
        <p className="mt-1 text-sm text-text-neutral">
          Consulta versiones anteriores o restaura una versión como nueva.
        </p>
      </div>

      <div className="p-4">
        {versions.length === 0 ? (
          <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
            Este presupuesto todavía no tiene historial de versiones.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => {
              const canRestore = !version.isCurrent && !isPending;
              const isViewed = Boolean(version.isViewed);

              return (
                <article
                  key={version.id}
                  className="rounded-md border border-border bg-surface p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getVersionBadgeClasses(
                            version,
                            isPending
                          )}`}
                        >
                          v{version.version}
                        </span>

                        {version.isCurrent && (
                          <span className="inline-flex items-center rounded-full border border-border bg-card-background px-3 py-1 text-xs font-medium text-text-neutral">
                            Versión actual
                          </span>
                        )}

                        {version.sent && (
                          <span className="inline-flex items-center rounded-full border border-primary-soft bg-primary-soft/20 px-3 py-1 text-xs font-medium text-primary-strong">
                            Enviada
                          </span>
                        )}

                        {isViewed && !version.isCurrent && (
                          <span className="inline-flex items-center rounded-full border border-primary-soft bg-primary-soft/20 px-3 py-1 text-xs font-medium text-primary-strong">
                            Visualizada
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-text-neutral">
                        <p>
                          Creada:{" "}
                          <span className="font-medium text-text-strong">
                            {formatDateTime(version.createdAt)}
                          </span>
                        </p>
                        <p>
                          Proyecto:{" "}
                          <span className="font-medium text-text-strong">
                            {version.project || "Sin nombre"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[320px]">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-card-background p-3">
                          <p className="text-xs uppercase tracking-wide text-text-neutral">
                            Partidas
                          </p>
                          <p className="mt-1 text-sm font-semibold text-text-strong">
                            {version.lineCount}
                          </p>
                        </div>

                        <div className="rounded-lg border border-border bg-card-background p-3">
                          <p className="text-xs uppercase tracking-wide text-text-neutral">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-semibold text-text-strong">
                            {formatCurrency(version.total)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleViewVersion(version.version)}
                          disabled={isPending}
                          className="w-full rounded-md border border-border bg-card-background px-4 py-2.5 text-sm font-medium text-text-strong transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55"
                        >
                          {version.isCurrent
                            ? "Ver versión actual"
                            : isViewed
                            ? "Versión visualizada"
                            : "Ver esta versión"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestore(version.id)}
                          disabled={!canRestore}
                          className="w-full rounded-md border border-border bg-card-background px-4 py-2.5 text-sm font-medium text-text-strong transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55"
                        >
                          {version.isCurrent
                            ? "Versión actual"
                            : isPending
                            ? "Restaurando..."
                            : "Restaurar como nueva"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
