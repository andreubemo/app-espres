"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  duplicateBudgetDraft,
  markBudgetAsSent,
} from "@/app/actions/budgets";

type BudgetDetailActionsProps = {
  budgetId: string;
  status: string;
  isHistoricalView?: boolean;
  viewedVersionNumber?: number;
};

export default function BudgetDetailActions({
  budgetId,
  status,
  isHistoricalView = false,
  viewedVersionNumber,
}: BudgetDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canMarkAsSent = status === "DRAFT" && !isHistoricalView;
  const canEdit = status !== "REJECTED" && !isHistoricalView;
  const canDuplicate = !isHistoricalView;

  function handleMarkAsSent() {
    startTransition(async () => {
      await markBudgetAsSent(budgetId);
      router.push(`/budgets/${budgetId}?markedSent=1`);
      router.refresh();
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateBudgetDraft(budgetId);
      router.push(`/budgets/${result.budgetId}?duplicated=1`);
      router.refresh();
    });
  }

  if (isHistoricalView) {
    return (
      <div className="rounded-md border border-primary-soft bg-primary-soft/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-strong">
          Modo solo lectura
        </p>
        <p className="mt-2 text-sm text-primary-strong">
          Estás visualizando la versión histórica
          {typeof viewedVersionNumber === "number" ? ` v${viewedVersionNumber}` : ""}
          . Las acciones sobre el presupuesto actual están desactivadas en esta
          vista.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
          Acciones
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={canEdit ? `/budgets/${budgetId}/edit` : "#"}
          aria-disabled={!canEdit}
          className={[
            "rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-strong",
            !canEdit
              ? "pointer-events-none cursor-not-allowed bg-primary-soft"
              : "",
          ].join(" ")}
        >
          Editar presupuesto
        </Link>

        <button
          type="button"
          onClick={handleMarkAsSent}
          disabled={isPending || !canMarkAsSent}
          className="rounded-md border border-primary-soft bg-primary-soft/20 px-5 py-2.5 text-sm font-medium text-primary-strong transition hover:bg-primary-soft/30 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55"
        >
          {isPending ? "Procesando..." : "Marcar como enviado"}
        </button>

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isPending || !canDuplicate}
          className="rounded-md border border-border bg-card-background px-5 py-2.5 text-sm font-medium text-text-neutral transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55"
        >
          {isPending ? "Procesando..." : "Duplicar"}
        </button>
      </div>

      <div className="grid gap-3 text-xs text-text-neutral md:grid-cols-3">
        <p>
          Edita datos o partidas. Si guardas cambios reales, se crea la
          siguiente versión automáticamente.
        </p>
        <p>
          Cambia el estado a enviado y marca la versión actual como enviada.
        </p>
        <p>
          Crea un nuevo presupuesto borrador copiando cliente, referencia y
          snapshot actual.
        </p>
      </div>
    </div>
  );
}
