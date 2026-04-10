"use client";

export default function BudgetTotals({
  subtotal,
  total,
}: {
  subtotal: number;
  total: number;
}) {
  const multiplier = subtotal > 0 ? total / subtotal : 1;

  return (
    <div className="space-y-4">
      <div className="rounded border p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">
            {subtotal.toFixed(2)} €
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Factor complejidad</span>
          <span className="font-medium">
            × {multiplier.toFixed(2)}
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        El total incluye el ajuste por complejidad del proyecto.
      </div>
    </div>
  );
}