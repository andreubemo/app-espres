"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Budget } from "@/domain/budgets/budget.model";
import {
  createEmptyBudget,
  addLine,
  removeLine,
} from "@/domain/budgets/budget.service";

import { saveBudgetDraft } from "@/app/actions/budgets";

import BudgetBaseModal from "@/ui/budgets/BudgetBaseModal";
import BudgetWizardFromCatalog from "@/ui/budgets/BudgetWizardFromCatalog";
import BudgetLinesPanel from "@/ui/budgets/BudgetLinesPanel";
import BudgetTotals from "@/ui/budgets/BudgetTotals";

type WizardStep = 1 | 2 | 3;

function getCurrentStep(budget: Budget | null, wizardOpen: boolean): WizardStep {
  if (!budget) return 1;
  if (wizardOpen) return 2;
  return 3;
}

function getStepTitle(step: WizardStep) {
  switch (step) {
    case 1:
      return "Datos base del presupuesto";
    case 2:
      return "Selección guiada de partidas";
    case 3:
      return "Revisión final";
    default:
      return "Nuevo presupuesto";
  }
}

function getStepDescription(step: WizardStep, budget: Budget | null) {
  switch (step) {
    case 1:
      return "Define el contexto inicial antes de empezar a añadir partidas.";
    case 2:
      return "Avanza familia por familia y añade únicamente las partidas que necesites.";
    case 3:
      return budget?.lines.length
        ? "Revisa el presupuesto antes de guardarlo como borrador."
        : "Todavía no hay partidas. Vuelve al selector para seguir construyendo el presupuesto.";
    default:
      return "";
  }
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

export default function NewBudgetPage() {
  const router = useRouter();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [wizardOpen, setWizardOpen] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = getCurrentStep(budget, wizardOpen);

  const canSave = useMemo(() => {
    return Boolean(budget && budget.lines.length > 0 && !isSaving);
  }, [budget, isSaving]);

  async function handleSaveDraft() {
    if (!budget) return;

    if (budget.lines.length === 0) {
      setSaveMessage("Añade al menos una partida antes de guardar el borrador.");
      return;
    }

    setSaveMessage(null);
    setIsSaving(true);

    try {
      const result = await saveBudgetDraft(budget);

      setSaveMessage(
        `Borrador guardado correctamente. Referencia: ${result.reference}`
      );

      router.push("/budgets");
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
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-4 sm:py-6 lg:px-8">
        <section className="rounded-lg border border-border bg-card-background shadow-sm">
          <div className="space-y-4 p-4 sm:p-4">
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
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 1
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-neutral"
                    }`}
                  >
                    1. Base
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 2
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-neutral"
                    }`}
                  >
                    2. Partidas
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 3
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-neutral"
                    }`}
                  >
                    3. Revisión
                  </span>
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
                    {budget?.lines.length ?? 0}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4 sm:col-span-3 xl:col-span-1 xl:text-right">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Total actual
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-text-strong">
                    {formatCurrency(budget?.total ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {budget ? (
              <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Código
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
                    {budget.dimensions.width} m × {budget.dimensions.length} m
                  </p>
                  <p className="mt-1 text-xs text-text-neutral">
                    {budget.dimensions.surfaceM2} m² ·{" "}
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
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-primary-soft bg-surface p-5 text-sm text-text-neutral">
                Empieza definiendo los datos base del presupuesto. En cuanto los
                completes, se abrirá el flujo guiado de partidas.
              </div>
            )}
          </div>
        </section>

        {saveMessage && (
          <div className="rounded-lg border border-border bg-card-background p-4 text-sm text-text-neutral shadow-sm">
            {saveMessage}
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {!budget ? (
              <BudgetBaseModal
                open={!budget}
                onSubmit={(data) => {
                  setBudget(
                    createEmptyBudget({
                      code: data.code,
                      project: data.project,
                      date: data.date,
                      width: data.width,
                      length: data.length,
                      complexity: data.complexity,
                    })
                  );
                  setWizardOpen(true);
                  setSaveMessage(null);
                }}
              />
            ) : (
              <>
                <section className="rounded-lg border border-border bg-card-background shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-text-strong">
                        Paso 2 · Selección de partidas
                      </h2>
                      <p className="text-sm text-text-neutral">
                        Añade partidas familia por familia desde el selector guiado.
                      </p>
                    </div>

                    <button
                      onClick={() => setWizardOpen((open) => !open)}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-card-background px-4 py-2.5 text-sm font-medium text-text-strong transition hover:bg-surface"
                      type="button"
                    >
                      {wizardOpen ? "Ocultar selector" : "Mostrar selector"}
                    </button>
                  </div>

                  <div className="p-4">
                    <div
                      className={`rounded-md border px-4 py-3 text-sm ${
                        wizardOpen
                          ? "border-border bg-surface text-text-neutral"
                          : "border-primary-soft bg-primary-soft/20 text-primary-strong"
                      }`}
                    >
                      {wizardOpen
                        ? "El asistente de partidas está abierto. Avanza por las familias y añade las líneas que necesites."
                        : "El asistente de partidas está oculto. Puedes revisar las líneas actuales o volver a abrirlo para seguir añadiendo partidas."}
                    </div>
                  </div>
                </section>

                <BudgetWizardFromCatalog
                  open={wizardOpen}
                  onClose={() => setWizardOpen(false)}
                  onAdd={(line) => {
                    setBudget((current) =>
                      current ? addLine(current, line) : current
                    );
                    setSaveMessage(null);
                  }}
                />

                <section className="rounded-lg border border-border bg-card-background shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-text-strong">
                        Paso 3 · Revisión final
                      </h2>
                      <p className="text-sm text-text-neutral">
                        Revisa las partidas añadidas antes de guardar el borrador.
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
                        onRemove={(id) =>
                          setBudget((current) =>
                            current ? removeLine(current, id) : current
                          )
                        }
                      />
                    ) : (
                      <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
                        No hay partidas añadidas todavía. Abre el selector guiado
                        para empezar a construir el presupuesto.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[calc(var(--app-header-height)+8px)] xl:self-start">
            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-lg font-semibold text-text-strong">
                  Resumen
                </h2>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-md border border-border bg-surface px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Estado del flujo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {currentStep === 1
                      ? "Pendiente de datos base"
                      : currentStep === 2
                      ? "Construyendo partidas"
                      : "Listo para revisión y guardado"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Partidas
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-strong">
                      {budget?.lines.length ?? 0}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Complejidad
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-strong">
                      {budget ? getComplexityLabel(budget.complexity) : "-"}
                    </p>
                  </div>
                </div>

                {budget ? (
                  <BudgetTotals subtotal={budget.subtotal} total={budget.total} />
                ) : (
                  <div className="rounded-md border border-dashed border-primary-soft bg-surface p-5 text-sm text-text-neutral">
                    El resumen económico aparecerá cuando completes los datos base
                    del presupuesto.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-lg font-semibold text-text-strong">
                  Acciones
                </h2>
              </div>

              <div className="space-y-3 p-4">
                <button
                  onClick={() => setWizardOpen(true)}
                  type="button"
                  disabled={!budget}
                  className="w-full rounded-md border border-border bg-card-background px-4 py-2.5 text-sm font-medium text-text-strong transition hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-neutral/55"
                >
                  Abrir selector guiado
                </button>

                <button
                  onClick={handleSaveDraft}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary-soft"
                  type="button"
                  disabled={!canSave}
                >
                  {isSaving ? "Guardando..." : "Guardar borrador"}
                </button>

                <p className="text-xs leading-5 text-text-neutral">
                  Solo podrás guardar cuando exista al menos una partida añadida.
                </p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}