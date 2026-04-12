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
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Modo solo lectura
        </p>
        <p className="mt-2 text-sm text-amber-800">
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
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Acciones
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCreateNewVersion}
          disabled={isPending || !canCreateNewVersion}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isPending ? "Procesando..." : "Nueva versión"}
        </button>

        <button
          type="button"
          onClick={handleMarkAsSent}
          disabled={isPending || !canMarkAsSent}
          className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          {isPending ? "Procesando..." : "Marcar como enviado"}
        </button>

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isPending || !canDuplicate}
          className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          {isPending ? "Procesando..." : "Duplicar"}
        </button>
      </div>

      <div className="grid gap-3 text-xs text-neutral-500 md:grid-cols-3">
        <p>
          Crea una nueva versión del presupuesto actual para seguir trabajando
          sin perder trazabilidad.
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