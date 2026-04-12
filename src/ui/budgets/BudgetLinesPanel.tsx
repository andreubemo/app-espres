"use client";

import { BudgetLine } from "@/domain/budgets/budget.model";

type BudgetLinesPanelProps = {
  lines: BudgetLine[];
  onRemove: (id: string) => void;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function formatFamilyLabel(value?: string) {
  if (!value) return "-";

  return value.replace(/_/g, " ").trim();
}

export default function BudgetLinesPanel({
  lines,
  onRemove,
}: BudgetLinesPanelProps) {
  return (
    <div className="space-y-4">
      {lines.map((line, index) => (
        <article
          key={line.id}
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  Partida {index + 1}
                </span>

                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 capitalize">
                  {formatFamilyLabel(line.family)}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold leading-snug text-neutral-900">
                  {line.item}
                </h3>

                {line.material ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {line.material}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Total línea
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
                  {formatCurrency(line.total)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(line.id)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 sm:mt-3"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Cantidad
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {formatNumber(line.quantity)} {line.unit}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Precio unitario
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {formatCurrency(line.unitPrice)}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Total línea
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {formatCurrency(line.total)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}