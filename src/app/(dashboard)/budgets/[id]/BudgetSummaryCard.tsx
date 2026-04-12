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
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Resumen económico
        </h2>
      </div>

      <div className="space-y-4 p-6">
        {/* SUBTOTAL */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span className="font-medium text-neutral-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* TOTAL */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              Total presupuesto
            </span>
            <span className="text-2xl font-semibold tracking-tight text-neutral-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}