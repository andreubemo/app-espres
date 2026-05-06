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

type VersionActionsProps = {
  version: BudgetVersionHistoryItem;
  isPending: boolean;
  onRestore: (versionId: string) => void;
  onView: (versionNumber: number) => void;
  variant?: "desktop" | "mobile";
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

function getVersionBadgeClasses(version: BudgetVersionHistoryItem) {
  if (version.isCurrent) {
    return "border-primary bg-primary text-white";
  }

  if (version.isViewed) {
    return "border-primary-soft bg-primary-soft/20 text-primary-strong";
  }

  return "border-border bg-card-background text-text-neutral";
}

function VersionBadge({ version }: { version: BudgetVersionHistoryItem }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getVersionBadgeClasses(
        version
      )}`}
    >
      v{version.version}
    </span>
  );
}

function VersionStatePills({
  version,
}: {
  version: BudgetVersionHistoryItem;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {version.isCurrent ? (
        <span className="inline-flex items-center rounded-full border border-border bg-card-background px-2.5 py-1 text-xs font-medium text-text-neutral">
          Actual
        </span>
      ) : null}

      {version.sent ? (
        <span className="inline-flex items-center rounded-full border border-primary-soft bg-primary-soft/20 px-2.5 py-1 text-xs font-medium text-primary-strong">
          Enviada
        </span>
      ) : null}

      {version.isViewed && !version.isCurrent ? (
        <span className="inline-flex items-center rounded-full border border-primary-soft bg-primary-soft/20 px-2.5 py-1 text-xs font-medium text-primary-strong">
          Visualizada
        </span>
      ) : null}
    </div>
  );
}

function VersionActions({
  version,
  isPending,
  onRestore,
  onView,
  variant = "desktop",
}: VersionActionsProps) {
  const canRestore = !version.isCurrent && !isPending;
  const isMobile = variant === "mobile";
  const baseButtonClass = isMobile
    ? "h-10 w-full rounded-md px-3 text-sm"
    : "h-9 rounded-md px-3 text-xs";

  return (
    <div
      className={
        isMobile
          ? "grid grid-cols-2 gap-2"
          : "flex items-center justify-end gap-2"
      }
    >
      <button
        type="button"
        onClick={() => onView(version.version)}
        disabled={isPending}
        aria-label={`Ver versión ${version.version}`}
        className={[
          baseButtonClass,
          "border border-border bg-card-background font-medium text-text-strong transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55",
        ].join(" ")}
      >
        {version.isCurrent
          ? "Ver actual"
          : version.isViewed
            ? "Viendo"
            : "Ver"}
      </button>

      <button
        type="button"
        onClick={() => onRestore(version.id)}
        disabled={!canRestore}
        aria-label={`Restaurar versión ${version.version} como nueva`}
        className={[
          baseButtonClass,
          "border border-border bg-card-background font-medium text-text-strong transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55",
        ].join(" ")}
      >
        {version.isCurrent ? "Actual" : isPending ? "..." : "Restaurar"}
      </button>
    </div>
  );
}

export default function BudgetVersionHistory({
  budgetId,
  versions,
}: BudgetVersionHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentVersion = versions.find((version) => version.isCurrent);

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

    if (versionNumber === currentVersion?.version) {
      params.delete("viewVersion");
    } else {
      params.set("viewVersion", String(versionNumber));
    }

    const queryString = params.toString();
    router.push(`/budgets/${budgetId}${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-strong">
            Historial de versiones
          </h2>
          <p className="text-sm text-text-neutral">
            Compara versiones, vuelve a una anterior o salta a la actual.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {currentVersion ? <VersionBadge version={currentVersion} /> : null}
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-neutral">
            {versions.length} {versions.length === 1 ? "versión" : "versiones"}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {versions.length === 0 ? (
          <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
            Este presupuesto todavía no tiene historial de versiones.
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {versions.map((version) => (
                <article
                  key={version.id}
                  className={[
                    "rounded-lg border bg-surface p-3",
                    version.isViewed
                      ? "border-primary-soft shadow-[0_0_0_1px_rgba(242,96,12,0.12)]"
                      : "border-border",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <VersionBadge version={version} />
                        <VersionStatePills version={version} />
                      </div>

                      <p className="truncate text-sm font-semibold text-text-strong">
                        {version.project || "Sin nombre"}
                      </p>
                    </div>

                    <p className="shrink-0 text-right text-sm font-semibold text-text-strong">
                      {formatCurrency(version.total)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-neutral">
                    <div className="rounded-md border border-border bg-card-background px-2.5 py-2">
                      <p className="uppercase tracking-wide">Creada</p>
                      <p className="mt-1 font-medium text-text-strong">
                        {formatDateTime(version.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-md border border-border bg-card-background px-2.5 py-2">
                      <p className="uppercase tracking-wide">Partidas</p>
                      <p className="mt-1 font-medium text-text-strong">
                        {version.lineCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <VersionActions
                      version={version}
                      isPending={isPending}
                      onRestore={handleRestore}
                      onView={handleViewVersion}
                      variant="mobile"
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="min-w-[920px] w-full border-collapse text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-text-neutral">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Versión</th>
                    <th className="px-4 py-3 font-semibold">Creada</th>
                    <th className="px-4 py-3 font-semibold">Proyecto</th>
                    <th className="px-4 py-3 font-semibold">Partidas</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card-background">
                  {versions.map((version) => (
                    <tr
                      key={version.id}
                      className={
                        version.isViewed
                          ? "bg-primary-soft/10"
                          : "transition hover:bg-surface"
                      }
                    >
                      <td className="px-4 py-3">
                        <VersionBadge version={version} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-neutral">
                        {formatDateTime(version.createdAt)}
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-text-strong">
                          {version.project || "Sin nombre"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-strong">
                        {version.lineCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-text-strong">
                        {formatCurrency(version.total)}
                      </td>
                      <td className="px-4 py-3">
                        <VersionStatePills version={version} />
                      </td>
                      <td className="px-4 py-3">
                        <VersionActions
                          version={version}
                          isPending={isPending}
                          onRestore={handleRestore}
                          onView={handleViewVersion}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
