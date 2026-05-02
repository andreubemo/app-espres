"use client";

import { BudgetLine } from "@/domain/budgets/budget.model";

type BudgetLinesPanelProps = {
  lines: BudgetLine[];
  onRemove: (id: string) => void;
  onQuantityChange?: (id: string, quantity: number) => void;
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
  onQuantityChange,
}: BudgetLinesPanelProps) {
  const canEditQuantity = Boolean(onQuantityChange);

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <article
          key={line.id}
          className="rounded-lg border border-border bg-card-background p-3 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-neutral">
                  Partida {index + 1}
                </span>

                <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-neutral capitalize">
                  {formatFamilyLabel(line.family)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold leading-snug text-text-strong">
                  {line.item}
                </h3>

                {line.material ? (
                  <p className="mt-0.5 text-xs text-text-neutral">
                    {line.material}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-xs uppercase text-text-neutral">
                  Total línea
                </p>
                <p className="mt-0.5 text-base font-semibold tracking-tight text-text-strong">
                  {formatCurrency(line.total)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(line.id)}
                className="rounded-md border border-border bg-card-background px-3 py-1.5 text-sm font-medium text-text-neutral transition hover:bg-surface hover:text-text-strong sm:mt-2"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-2.5">
              <p className="text-xs uppercase text-text-neutral">Cantidad</p>
              {canEditQuantity ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) =>
                      onQuantityChange?.(line.id, Number(event.target.value))
                    }
                    onFocus={(event) => event.target.select()}
                    className="h-9 w-full rounded-md border border-border bg-card-background px-2 text-sm font-semibold text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                    aria-label={`Cantidad de ${line.item}`}
                  />
                  <span className="shrink-0 text-sm font-semibold text-text-strong">
                    {line.unit}
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 text-sm font-semibold text-text-strong">
                  {formatNumber(line.quantity)} {line.unit}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface p-2.5">
              <p className="text-xs uppercase text-text-neutral">
                Precio unitario
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text-strong">
                {formatCurrency(line.unitPrice)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-2.5">
              <p className="text-xs uppercase text-text-neutral">Total línea</p>
              <p className="mt-0.5 text-sm font-semibold text-text-strong">
                {formatCurrency(line.total)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
