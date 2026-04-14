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
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Nuevo presupuesto
                  </p>

                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                    {getStepTitle(currentStep)}
                  </h1>

                  <p className="max-w-2xl text-sm text-neutral-600">
                    {getStepDescription(currentStep, budget)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 1
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    1. Base
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 2
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    2. Partidas
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      currentStep === 3
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    3. Revisión
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[560px]">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Paso actual
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {currentStep} de 3
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Partidas
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {budget?.lines.length ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-3 xl:col-span-1 xl:text-right">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Total actual
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                    {formatCurrency(budget?.total ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {budget ? (
              <div className="grid gap-4 border-t border-neutral-200 pt-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Código
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {budget.code}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Proyecto
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {budget.project}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Dimensiones
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {budget.dimensions.width} m × {budget.dimensions.length} m
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {budget.dimensions.surfaceM2} m² ·{" "}
                    {budget.dimensions.perimeterML} ml
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Complejidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {getComplexityLabel(budget.complexity)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Empieza definiendo los datos base del presupuesto. En cuanto los
                completes, se abrirá el flujo guiado de partidas.
              </div>
            )}
          </div>
        </section>

        {saveMessage && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
            {saveMessage}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
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
                <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">
                        Paso 2 · Selección de partidas
                      </h2>
                      <p className="text-sm text-neutral-500">
                        Añade partidas familia por familia desde el selector guiado.
                      </p>
                    </div>

                    <button
                      onClick={() => setWizardOpen((open) => !open)}
                      className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
                      type="button"
                    >
                      {wizardOpen ? "Ocultar selector" : "Mostrar selector"}
                    </button>
                  </div>

                  <div className="p-6">
                    <div
                      className={`rounded-xl border px-4 py-4 text-sm ${
                        wizardOpen
                          ? "border-neutral-200 bg-neutral-50 text-neutral-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
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

                <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">
                        Paso 3 · Revisión final
                      </h2>
                      <p className="text-sm text-neutral-500">
                        Revisa las partidas añadidas antes de guardar el borrador.
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
                      {budget.lines.length}{" "}
                      {budget.lines.length === 1 ? "partida" : "partidas"}
                    </div>
                  </div>

                  <div className="p-6">
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
                      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                        No hay partidas añadidas todavía. Abre el selector guiado
                        para empezar a construir el presupuesto.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-[calc(var(--app-header-height)+8px)] xl:self-start">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Resumen
                </h2>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Estado del flujo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {currentStep === 1
                      ? "Pendiente de datos base"
                      : currentStep === 2
                      ? "Construyendo partidas"
                      : "Listo para revisión y guardado"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Partidas
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                      {budget?.lines.length ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Complejidad
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                      {budget ? getComplexityLabel(budget.complexity) : "-"}
                    </p>
                  </div>
                </div>

                {budget ? (
                  <BudgetTotals subtotal={budget.subtotal} total={budget.total} />
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
                    El resumen económico aparecerá cuando completes los datos base
                    del presupuesto.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Acciones
                </h2>
              </div>

              <div className="space-y-3 p-6">
                <button
                  onClick={() => setWizardOpen(true)}
                  type="button"
                  disabled={!budget}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  Abrir selector guiado
                </button>

                <button
                  onClick={handleSaveDraft}
                  className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  type="button"
                  disabled={!canSave}
                >
                  {isSaving ? "Guardando..." : "Guardar borrador"}
                </button>

                <p className="text-xs leading-5 text-neutral-500">
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