"use client";

type BudgetTotalsProps = {
  subtotal: number;
  totalBeforeDiscount?: number;
  discountPercent?: number;
  discountAmount?: number;
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

function formatPercent(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export default function BudgetTotals({
  subtotal,
  totalBeforeDiscount,
  discountPercent = 0,
  discountAmount = 0,
  total,
}: BudgetTotalsProps) {
  const adjustedTotal = totalBeforeDiscount ?? total;
  const multiplier = subtotal > 0 ? adjustedTotal / subtotal : 1;
  const hasDiscount = discountPercent > 0 && discountAmount > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card-background shadow-sm">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-text-strong">
            Resumen economico
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
              x {formatMultiplier(multiplier)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-text-neutral">Antes de descuento</span>
            <span className="font-medium text-text-strong">
              {formatCurrency(adjustedTotal)}
            </span>
          </div>

          {hasDiscount ? (
            <div className="flex items-center justify-between rounded-md border border-primary-soft bg-primary-soft/20 px-3 py-2 text-sm">
              <span className="font-medium text-primary-strong">
                Descuento {formatPercent(discountPercent)}%
              </span>
              <span className="font-semibold text-primary-strong">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-neutral">Descuento</span>
              <span className="font-medium text-text-strong">0%</span>
            </div>
          )}

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
        El total incluye el ajuste por complejidad y el descuento autorizado por
        rol.
      </div>
    </div>
  );
}
