"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createBudgetClient,
  saveBudgetDraft,
} from "@/app/actions/budgets";
import type { BudgetClientOption } from "@/app/actions/budgets";
import { Budget } from "@/domain/budgets/budget.model";
import {
  addLine,
  createEmptyBudget,
  removeLine,
  updateLineQuantity,
} from "@/domain/budgets/budget.service";
import type { BudgetDiscountPolicy } from "@/lib/budget-discounts";
import BudgetBaseModal from "@/ui/budgets/BudgetBaseModal";
import BudgetLinesPanel from "@/ui/budgets/BudgetLinesPanel";

const BudgetWizardFromCatalog = dynamic(
  () => import("@/ui/budgets/BudgetWizardFromCatalog"),
  { ssr: false }
);

type NewBudgetClientProps = {
  initialClients: BudgetClientOption[];
  initialDiscountPolicy: BudgetDiscountPolicy;
  initialClientError?: string | null;
};

type WizardStep = 1 | 2 | 3;

function getCurrentStep(budget: Budget | null, wizardOpen: boolean): WizardStep {
  if (!budget) return 1;
  if (wizardOpen) return 2;
  return 3;
}

function getStepTitle(step: WizardStep) {
  if (step === 1) return "Datos base del presupuesto";
  if (step === 2) return "Seleccion de partidas";
  return "Revision final";
}

function getStepDescription(step: WizardStep, budget: Budget | null) {
  if (step === 1) {
    return "Define el contexto inicial antes de empezar a anadir partidas.";
  }

  if (step === 2) {
    return "Avanza familia por familia y anade unicamente las partidas que necesites.";
  }

  return budget?.lines.length
    ? "Revisa el presupuesto antes de guardarlo como borrador."
    : "Todavia no hay partidas. Vuelve al selector para seguir construyendo el presupuesto.";
}

function getComplexityLabel(value?: string) {
  switch (value?.toLowerCase()) {
    case "low":
    case "baja":
      return "Baja";
    case "medium":
    case "media":
      return "Media";
    case "high":
    case "alta":
      return "Alta";
    default:
      return value || "-";
  }
}

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

export default function NewBudgetClient({
  initialClients,
  initialDiscountPolicy,
  initialClientError = null,
}: NewBudgetClientProps) {
  const router = useRouter();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [clients, setClients] =
    useState<BudgetClientOption[]>(initialClients);
  const [clientError, setClientError] = useState<string | null>(
    initialClientError
  );
  const [wizardOpen, setWizardOpen] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingClient, startCreateClientTransition] = useTransition();

  const currentStep = getCurrentStep(budget, wizardOpen);
  const canSave = useMemo(
    () => Boolean(budget && budget.lines.length > 0 && !isSaving),
    [budget, isSaving]
  );

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
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo crear el cliente.";
          setClientError(message);
          reject(error);
        }
      });
    });
  }

  async function handleSaveDraft() {
    if (!budget) return;

    if (budget.lines.length === 0) {
      setSaveMessage("Anade al menos una partida antes de guardar el borrador.");
      setWizardOpen(true);
      return;
    }

    setSaveMessage(null);
    setIsSaving(true);

    try {
      const result = await saveBudgetDraft(budget);

      router.push(`/budgets?createdBudget=${result.budgetId}`);
      router.refresh();
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el borrador."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="-mt-4 min-h-screen bg-surface sm:-mt-5">
      {budget ? (
        <div className="fixed inset-x-0 top-[var(--app-header-height)] z-30 border-b border-border bg-surface/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 items-start justify-between gap-3 lg:block">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-neutral">
                  Campos obligatorios
                </p>
                <p className="mt-1 text-sm font-medium text-text-strong">
                  {budget.lines.length
                    ? `${budget.lines.length} partida${
                        budget.lines.length === 1 ? "" : "s"
                      } anadida${budget.lines.length === 1 ? "" : "s"}.`
                    : "Falta anadir al menos una partida."}
                </p>
              </div>

              <span className="inline-flex h-10 shrink-0 items-center rounded-md border border-border bg-card-background px-3 text-sm font-semibold text-text-strong lg:hidden">
                {formatCurrency(budget.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <span className="hidden h-10 shrink-0 items-center rounded-md border border-border bg-card-background px-3 text-sm font-semibold text-text-strong lg:inline-flex">
                {formatCurrency(budget.total)}
              </span>

              <button
                className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-[13px] font-medium text-white transition hover:bg-primary-strong sm:px-4 sm:text-sm"
                disabled={isSaving}
                onClick={() => setWizardOpen(true)}
                type="button"
              >
                Seleccionar partidas
              </button>

              <button
                onClick={handleSaveDraft}
                className={[
                  "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition sm:px-4 sm:text-sm",
                  canSave
                    ? "bg-primary text-white hover:bg-primary-strong"
                    : "cursor-not-allowed border border-border bg-card-background text-text-neutral opacity-60",
                ].join(" ")}
                disabled={!canSave}
                type="button"
              >
                {isSaving ? "Guardando..." : "Guardar borrador"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={[
          "mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:px-4 lg:px-8",
          budget
            ? "pb-3 pt-[112px] sm:pb-6 lg:pt-[76px]"
            : "pb-3 pt-0 sm:pb-6 sm:pt-0",
        ].join(" ")}
      >
        {budget ? (
          <section className="rounded-lg border border-border bg-card-background shadow-sm">
            <div className="space-y-4 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-neutral">
                      Nuevo presupuesto
                    </p>

                    <h1 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
                      {getStepTitle(currentStep)}
                    </h1>

                    <p className="max-w-2xl text-sm text-text-neutral">
                      {getStepDescription(currentStep, budget)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["Base", "Partidas", "Revision"] as const).map(
                      (label, index) => {
                        const step = (index + 1) as WizardStep;
                        const active = currentStep === step;

                        return (
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-4",
                              active
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-surface text-text-neutral",
                            ].join(" ")}
                            key={label}
                          >
                            {index + 1}. {label}
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:w-[560px]">
                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Paso actual
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-strong">
                      {currentStep} de 3
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Partidas
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-strong">
                      {budget.lines.length}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-surface p-4 sm:col-span-3 xl:col-span-1 xl:text-right">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Total actual
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-text-strong">
                      {formatCurrency(budget.total)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Codigo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {budget.code}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Proyecto
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {budget.project}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Dimensiones
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {budget.dimensions.width} m x {budget.dimensions.length} m
                  </p>
                  <p className="mt-1 text-xs text-text-neutral">
                    {budget.dimensions.surfaceM2} m2 /{" "}
                    {budget.dimensions.perimeterML} ml
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Complejidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {getComplexityLabel(budget.complexity)}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Descuento
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {budget.discountPercent}%
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4 md:col-span-2 xl:col-span-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-neutral">
                    NOTAS
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-strong">
                    {budget.notes || "Sin notas para este presupuesto."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {saveMessage ? (
          <div className="rounded-lg border border-border bg-card-background p-4 text-sm text-text-neutral shadow-sm">
            {saveMessage}
          </div>
        ) : null}

        <section className="space-y-4">
          {!budget ? (
            <BudgetBaseModal
              clientError={clientError}
              clients={clients}
              discountPolicy={initialDiscountPolicy}
              isCreatingClient={isCreatingClient}
              key={initialDiscountPolicy.role}
              onCreateClient={handleCreateClient}
              onSubmit={(data) => {
                setBudget(
                  createEmptyBudget({
                    code: data.code,
                    project: data.project,
                    clientId: data.clientId,
                    date: data.date,
                    width: data.width,
                    length: data.length,
                    complexity: data.complexity,
                    notes: data.notes,
                    discountPercent: data.discountPercent,
                  })
                );
                setWizardOpen(true);
                setSaveMessage(null);
              }}
              open={!budget}
            />
          ) : (
            <>
              <section className="rounded-lg border border-border bg-card-background shadow-sm">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-lg font-semibold text-text-strong">
                    Paso 2 - Seleccion de partidas
                  </h2>
                  <p className="text-sm text-text-neutral">
                    Anade partidas familia por familia desde el selector guiado.
                  </p>
                </div>

                <div className="p-4">
                  <div
                    className={[
                      "rounded-md border px-4 py-3 text-sm",
                      wizardOpen
                        ? "border-border bg-surface text-text-neutral"
                        : "border-primary-soft bg-primary-soft/20 text-primary-strong",
                    ].join(" ")}
                  >
                    {wizardOpen
                      ? "El asistente de partidas esta abierto. Avanza por las familias y anade las lineas que necesites."
                      : "El asistente de partidas esta oculto. Puedes revisar las lineas actuales o volver a abrirlo para seguir anadiendo partidas."}
                  </div>
                </div>
              </section>

              <BudgetWizardFromCatalog
                existingLines={budget.lines}
                onAdd={(line) => {
                  setBudget((current) => {
                    if (!current) return current;

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
                  setSaveMessage(null);
                }}
                onClose={() => setWizardOpen(false)}
                onUpdateExistingLineQuantity={(lineId, quantity) => {
                  setBudget((current) =>
                    current
                      ? updateLineQuantity(current, lineId, quantity)
                      : current
                  );
                  setSaveMessage(null);
                }}
                open={wizardOpen}
              />

              <section className="rounded-lg border border-border bg-card-background shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-text-strong">
                      Paso 3 - Revision final
                    </h2>
                    <p className="text-sm text-text-neutral">
                      Revisa las partidas anadidas antes de guardar el borrador.
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-neutral">
                    {budget.lines.length}{" "}
                    {budget.lines.length === 1 ? "partida" : "partidas"}
                  </div>
                </div>

                <div className="p-4">
                  {budget.lines.length ? (
                    <BudgetLinesPanel
                      lines={budget.lines}
                      onRemove={(id) => {
                        setBudget((current) =>
                          current ? removeLine(current, id) : current
                        );
                        setSaveMessage(null);
                      }}
                    />
                  ) : (
                    <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
                      No hay partidas anadidas todavia. Abre el selector guiado
                      para empezar a construir el presupuesto.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
