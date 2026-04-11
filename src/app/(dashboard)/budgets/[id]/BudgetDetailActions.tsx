"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createBudgetVersionFromLatest,
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
  const canCreateNewVersion = status !== "REJECTED" && !isHistoricalView;
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

  function handleCreateNewVersion() {
    startTransition(async () => {
      const result = await createBudgetVersionFromLatest(budgetId);
      router.push(`/budgets/${budgetId}?createdVersion=${result.version}`);
      router.refresh();
    });
  }

  if (isHistoricalView) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          Modo solo lectura
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Estás visualizando la versión histórica
          {typeof viewedVersionNumber === "number" ? ` v${viewedVersionNumber}` : ""}
          . Las acciones sobre el presupuesto actual están desactivadas en esta vista.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Acciones
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleMarkAsSent}
          disabled={isPending || !canMarkAsSent}
          className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          {isPending ? "Procesando..." : "Marcar como enviado"}
        </button>

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isPending || !canDuplicate}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          {isPending ? "Procesando..." : "Duplicar"}
        </button>

        <button
          type="button"
          onClick={handleCreateNewVersion}
          disabled={isPending || !canCreateNewVersion}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-300"
        >
          {isPending ? "Procesando..." : "Nueva versión"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-neutral-500 sm:grid-cols-3">
        <p>
          {canMarkAsSent
            ? "Cambia el estado a enviado y marca la versión actual como enviada."
            : "Solo puedes marcar como enviado un presupuesto actual en borrador."}
        </p>
        <p>
          Crea un nuevo presupuesto borrador copiando cliente, referencia y
          snapshot actual.
        </p>
        <p>Genera una nueva versión desde el último snapshot guardado.</p>
      </div>
    </div>
  );
}