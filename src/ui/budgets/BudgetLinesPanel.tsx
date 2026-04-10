"use client";

import { BudgetLine } from "@/domain/budgets/budget.model";

export default function BudgetLinesPanel({
  lines,
  onRemove,
}: {
  lines: BudgetLine[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div
          key={line.id}
          className="rounded border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Partida {index + 1}
              </p>

              <h3 className="font-semibold">
                {line.item}
              </h3>

              <p className="text-sm text-gray-600 capitalize">
                Familia: {line.family.replace(/_/g, " ")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(line.id)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Eliminar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded bg-gray-50 p-3">
              <p className="text-gray-500">Cantidad</p>
              <p className="font-medium">
                {line.quantity} {line.unit}
              </p>
            </div>

            <div className="rounded bg-gray-50 p-3">
              <p className="text-gray-500">Precio unitario</p>
              <p className="font-medium">
                {line.unitPrice.toFixed(2)} €
              </p>
            </div>

            <div className="rounded bg-gray-50 p-3">
              <p className="text-gray-500">Total línea</p>
              <p className="font-semibold">
                {line.total.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}