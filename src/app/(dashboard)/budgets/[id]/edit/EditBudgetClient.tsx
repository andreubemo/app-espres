"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  createBudgetClient,
  updateBudgetDraft,
} from "@/app/actions/budgets";
import { Budget } from "@/domain/budgets/budget.model";
import {
  addLine,
  removeLine,
  updateBudgetBase,
  updateLineQuantity,
} from "@/domain/budgets/budget.service";
import type { BudgetClientOption } from "@/app/actions/budgets";
import type { BudgetDiscountPolicy } from "@/lib/budget-discounts";
import BudgetBaseModal from "@/ui/budgets/BudgetBaseModal";
import BudgetLinesPanel from "@/ui/budgets/BudgetLinesPanel";
import BudgetTotals from "@/ui/budgets/BudgetTotals";

const BudgetWizardFromCatalog = dynamic(
  () => import("@/ui/budgets/BudgetWizardFromCatalog"),
  {
    ssr: false,
  }
);

type EditBudgetClientProps = {
  budgetId: string;
  currentVersion: number;
  initialBudget: Budget;
  clients: BudgetClientOption[];
  discountPolicy: BudgetDiscountPolicy;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function normalizeBudgetForCompare(budget: Budget) {
  return {
    code: budget.code,
    project: budget.project,
    clientId: budget.clientId,
    date: budget.date,
    complexity: budget.complexity,
    notes: budget.notes,
    discountPercent: budget.discountPercent,
    dimensions: {
      width: budget.dimensions.width,
      length: budget.dimensions.length,
      surfaceM2: budget.dimensions.surfaceM2,
      perimeterML: budget.dimensions.perimeterML,
    },
    lines: budget.lines.map((line) => ({
      id: line.id,
      catalogItemId: line.catalogItemId,
      familyKey: line.familyKey ?? null,
      itemKey: line.itemKey ?? null,
      family: line.family,
      item: line.item,
      material: line.material ?? null,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
    subtotal: budget.subtotal,
    totalBeforeDiscount: budget.totalBeforeDiscount,
    discountAmount: budget.discountAmount,
    total: budget.total,
  };
}

export default function EditBudgetClient({
  budgetId,
  currentVersion,
  initialBudget,
  clients: initialClients,
  discountPolicy,
}: EditBudgetClientProps) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget>(initialBudget);
  const [clients, setClients] = useState(initialClients);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingClient, startCreateClientTransition] = useTransition();

  const initialFingerprint = useMemo(
    () => JSON.stringify(normalizeBudgetForCompare(initialBudget)),
    [initialBudget]
  );

  const currentFingerprint = useMemo(
    () => JSON.stringify(normalizeBudgetForCompare(budget)),
    [budget]
  );

  const hasChanges = currentFingerprint !== initialFingerprint;
  const canSave = hasChanges && budget.lines.length > 0 && !isSaving;

  async function handleCreateClient(data: { name: string; email: string }) {
    return new Promise<string>((resolve, reject) => {
      startCreateClientTransition(async () => {
        try {
          setClientError(null);
          const client = await createBudgetClient(data);
          setClients((current) =>
            [...current, client].sort((a, b) => a.name.localeCompare(b.name))
          );
          resolve(client.id);
        } catch (error) {
          const nextMessage =
            error instanceof Error
              ? error.message
              : "No se pudo crear el cliente.";
          setClientError(nextMessage);
          reject(error);
        }
      });
    });
  }

  async function handleSaveChanges() {
    if (!budget.lines.length) {
      setMessage("Añade al menos una partida antes de guardar cambios.");
      return;
    }

    if (!hasChanges) {
      setMessage("No hay cambios pendientes. No se ha creado una versión nueva.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateBudgetDraft({ budgetId, budget });

      if (result.unchanged) {
        setMessage(
          "No hay cambios respecto a la versión actual. No se ha creado una versión nueva."
        );
        return;
      }

      router.push(`/budgets/${budgetId}?updatedVersion=${result.version}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-4 sm:py-6 lg:px-8">
        <section className="space-y-3">
          <Link
            href={`/budgets/${budgetId}`}
            className="inline-flex text-sm font-medium text-text-neutral transition hover:text-text-strong"
          >
            Volver al detalle
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-neutral">
                Edición de presupuesto
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
                {budget.code}
              </h1>
              <p className="mt-1 text-sm text-text-neutral">
                Estás editando la v{currentVersion}. Solo se generará una
                versión nueva cuando guardes cambios reales.
              </p>
            </div>

            <div className="rounded-md border border-border bg-card-background px-4 py-3 text-sm text-text-neutral shadow-sm">
              Total actual:{" "}
              <span className="font-semibold text-text-strong">
                {formatCurrency(budget.total)}
              </span>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-lg border border-border bg-card-background p-4 text-sm text-text-neutral shadow-sm">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <BudgetBaseModal
              open
              initialData={{
                code: budget.code,
                project: budget.project,
                clientId: budget.clientId,
                date: budget.date,
                width: budget.dimensions.width,
                length: budget.dimensions.length,
                complexity: budget.complexity,
                notes: budget.notes,
                discountPercent: budget.discountPercent,
              }}
              stepLabel="Información del presupuesto"
              title="Editar datos base"
              description="Modifica referencia, proyecto, cliente, fecha, dimensiones o complejidad. Si cambian dimensiones o complejidad, se recalculan los totales en esta edición."
              submitLabel="Aplicar datos base"
              summaryTitle="Resumen editado"
              clients={clients}
              discountPolicy={discountPolicy}
              clientError={clientError}
              isCreatingClient={isCreatingClient}
              onCreateClient={handleCreateClient}
              onSubmit={(data) => {
                setBudget((current) => updateBudgetBase(current, data));
                setMessage(
                  "Datos base aplicados en la edición. Guarda cambios para crear la nueva versión."
                );
              }}
            />

            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-strong">
                    Partidas del presupuesto
                  </h2>
                  <p className="text-sm text-text-neutral">
                    Añade nuevas partidas, elimina líneas o ajusta cantidades
                    antes de guardar la nueva versión.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-strong"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Añadir más partidas
                </button>
              </div>

              <div className="p-4">
                {budget.lines.length ? (
                  <BudgetLinesPanel
                    lines={budget.lines}
                    onQuantityChange={(lineId, quantity) => {
                      setBudget((current) =>
                        updateLineQuantity(current, lineId, quantity)
                      );
                      setMessage(null);
                    }}
                    onRemove={(lineId) => {
                      setBudget((current) => removeLine(current, lineId));
                      setMessage(null);
                    }}
                  />
                ) : (
                  <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
                    No hay partidas. Abre el selector para añadir al menos una
                    antes de guardar.
                  </div>
                )}
              </div>
            </section>

            <BudgetWizardFromCatalog
              open={wizardOpen}
              existingLines={budget.lines}
              onUpdateExistingLineQuantity={(lineId, quantity) => {
                setBudget((current) =>
                  updateLineQuantity(current, lineId, quantity)
                );
                setMessage(null);
              }}
              onClose={() => setWizardOpen(false)}
              onAdd={(line) => {
                setBudget((current) => {
                  if (
                    current.lines.some(
                      (existingLine) =>
                        existingLine.catalogItemId === line.catalogItemId
                    )
                  ) {
                    return current;
                  }

                  return addLine(current, line);
                });
                setMessage(null);
              }}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[calc(var(--app-header-height)+8px)] xl:self-start">
            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-lg font-semibold text-text-strong">
                  Guardado
                </h2>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-md border border-border bg-surface px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Estado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {hasChanges
                      ? "Cambios pendientes"
                      : "Sin cambios pendientes"}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Próxima versión
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {hasChanges ? `v${currentVersion + 1}` : `v${currentVersion}`}
                  </p>
                </div>

                <BudgetTotals
                  subtotal={budget.subtotal}
                  totalBeforeDiscount={budget.totalBeforeDiscount}
                  discountPercent={budget.discountPercent}
                  discountAmount={budget.discountAmount}
                  total={budget.total}
                />

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={!canSave}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary-soft"
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>

                <p className="text-xs leading-5 text-text-neutral">
                  Si no hay cambios en datos o partidas, no se crea ninguna
                  versión nueva.
                </p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
