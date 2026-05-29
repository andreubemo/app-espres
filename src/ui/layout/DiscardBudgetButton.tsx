"use client";

import { XCircle } from "lucide-react";

import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export default function DiscardBudgetButton() {
  const { hasUnsavedChanges, requestDiscard } = useUnsavedChangesGuard();

  return (
    <button
      aria-label={
        hasUnsavedChanges
          ? "Descartar presupuesto sin guardar"
          : "Volver al listado de presupuestos"
      }
      className={[
        "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium shadow-sm transition",
        hasUnsavedChanges
          ? "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-300 hover:bg-amber-100"
          : "border-border bg-card-background text-text-strong hover:border-[#c9c2b8] hover:bg-surface",
      ].join(" ")}
      onClick={requestDiscard}
      type="button"
    >
      <XCircle aria-hidden="true" className="h-4 w-4" />
      Descartar
    </button>
  );
}
