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
    return "border-neutral-900 bg-neutral-900 text-white";
  }

  if (version.sent) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return isBusy
    ? "border-neutral-200 bg-neutral-100 text-neutral-400"
    : "border-neutral-200 bg-neutral-50 text-neutral-700";
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
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Historial de versiones
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Consulta versiones anteriores o restaura una versión como nueva.
        </p>
      </div>

      <div className="p-6">
        {versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
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
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
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
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                            Versión actual
                          </span>
                        )}

                        {version.sent && (
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Enviada
                          </span>
                        )}

                        {isViewed && !version.isCurrent && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            Visualizada
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-neutral-600">
                        <p>
                          Creada:{" "}
                          <span className="font-medium text-neutral-900">
                            {formatDateTime(version.createdAt)}
                          </span>
                        </p>
                        <p>
                          Proyecto:{" "}
                          <span className="font-medium text-neutral-900">
                            {version.project || "Sin nombre"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[320px]">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-neutral-200 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-neutral-500">
                            Partidas
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-900">
                            {version.lineCount}
                          </p>
                        </div>

                        <div className="rounded-lg border border-neutral-200 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-neutral-500">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-900">
                            {formatCurrency(version.total)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleViewVersion(version.version)}
                          disabled={isPending}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
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
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
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