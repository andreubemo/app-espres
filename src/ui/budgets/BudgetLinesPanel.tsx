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
    <div className="space-y-2">
      {lines.map((l) => (
        <div key={l.id} className="flex justify-between border p-2 text-sm">
          <div>
            <strong>{l.family}</strong> – {l.item}
          </div>
          <div className="flex gap-2">
            <span>{l.total.toFixed(2)} €</span>
            <button onClick={() => onRemove(l.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
