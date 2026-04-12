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

export default function BudgetTotals({
  subtotal,
  total,
}: BudgetTotalsProps) {
  const multiplier = subtotal > 0 ? total / subtotal : 1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="text-base font-semibold text-neutral-900">
            Resumen económico
          </h3>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-medium text-neutral-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Factor complejidad</span>
            <span className="font-medium text-neutral-900">
              × {formatMultiplier(multiplier)}
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-neutral-700">
                Total final
              </span>
              <span className="text-2xl font-semibold tracking-tight text-neutral-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">
        El total incluye el ajuste por complejidad del proyecto.
      </div>
    </div>
  );
}