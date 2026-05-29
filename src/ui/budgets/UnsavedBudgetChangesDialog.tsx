"use client";

import { Button } from "@/ui/primitives/Button";

type UnsavedBudgetChangesDialogProps = {
  error?: string | null;
  isSaving?: boolean;
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
};

export default function UnsavedBudgetChangesDialog({
  error = null,
  isSaving = false,
  open,
  onCancel,
  onDiscard,
  onSaveDraft,
}: UnsavedBudgetChangesDialogProps) {
  if (!open) return null;

  return (
    <div
      aria-labelledby="unsaved-budget-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-text-strong/45 p-4"
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card-background shadow-xl">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-neutral">
            Nuevo presupuesto
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-tight text-text-strong"
            id="unsaved-budget-title"
          >
            Presupuesto sin guardar
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm leading-6 text-text-neutral">
            Hay informacion sin guardar en este presupuesto. Si abandonas esta
            pantalla, los datos introducidos y las partidas seleccionadas
            podrian perderse. Puedes guardar el presupuesto como borrador antes
            de salir o descartarlo definitivamente.
          </p>

          {error ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            disabled={isSaving}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Seguir editando
          </Button>
          <Button
            disabled={isSaving}
            onClick={onDiscard}
            type="button"
            variant="secondary"
          >
            Descartar cambios
          </Button>
          <Button
            disabled={isSaving}
            onClick={onSaveDraft}
            type="button"
            variant="primary"
          >
            {isSaving ? "Guardando..." : "Guardar borrador"}
          </Button>
        </div>
      </div>
    </div>
  );
}
