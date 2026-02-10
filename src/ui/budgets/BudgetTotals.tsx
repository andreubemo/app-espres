"use client";

export default function BudgetTotals({ subtotal, total }: { subtotal: number; total: number }) {
  return (
    <div className="border-t pt-2">
      <div>Subtotal: {subtotal.toFixed(2)} €</div>
      <div className="font-bold">Total: {total.toFixed(2)} €</div>
    </div>
  );
}
