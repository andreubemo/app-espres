type BudgetSummaryCardProps = {
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

function formatPercent(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export default function BudgetSummaryCard({
  subtotal,
  totalBeforeDiscount,
  discountPercent = 0,
  discountAmount = 0,
  total,
}: BudgetSummaryCardProps) {
  const adjustedTotal = totalBeforeDiscount ?? total;
  const hasDiscount = discountPercent > 0 && discountAmount > 0;

  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Resumen economico
        </h2>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-neutral">Subtotal</span>
          <span className="font-medium text-text-strong">
            {formatCurrency(subtotal)}
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

        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-neutral">
              Total presupuesto
            </span>
            <span className="text-2xl font-semibold tracking-tight text-text-strong">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
