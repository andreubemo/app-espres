type BudgetSummaryCardProps = {
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

export default function BudgetSummaryCard({
  subtotal,
  total,
}: BudgetSummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Resumen económico
        </h2>
      </div>

      <div className="space-y-4 p-4">
        {/* SUBTOTAL */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-neutral">Subtotal</span>
          <span className="font-medium text-text-strong">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* TOTAL */}
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