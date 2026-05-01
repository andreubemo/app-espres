"use client";

type BudgetTotalsProps = {
  subtotal: number;
  total: number;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatMultiplier(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 1;

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export default function BudgetTotals({ subtotal, total }: BudgetTotalsProps) {
  const multiplier = subtotal > 0 ? total / subtotal : 1;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card-background shadow-sm">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-text-strong">
            Resumen económico
          </h3>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-neutral">Subtotal</span>
            <span className="font-medium text-text-strong">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-text-neutral">Factor complejidad</span>
            <span className="font-medium text-text-strong">
              × {formatMultiplier(multiplier)}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-surface px-3 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-text-neutral">
                Total final
              </span>
              <span className="text-xl font-semibold tracking-tight text-text-strong">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-5 text-text-neutral">
        El total incluye el ajuste por complejidad del proyecto.
      </div>
    </div>
  );
}
