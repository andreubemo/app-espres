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

export default function NewBudgetPage() {
  const router = useRouter();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [wizardOpen, setWizardOpen] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    <main className="space-y-6 p-8">
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

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Nuevo presupuesto</h1>

          {budget && (
            <p className="space-y-1 text-sm text-gray-600">
              <span>
                Código <strong>{budget.code}</strong> · Proyecto{" "}
                <strong>{budget.project}</strong>
              </span>
              <br />
              <span>
                {budget.dimensions.width}m × {budget.dimensions.length}m ·{" "}
                {budget.dimensions.surfaceM2} m² ·{" "}
                {budget.dimensions.perimeterML} ml
              </span>
              <br />
              <span>
                {budget.lines.length} partidas · {budget.total.toFixed(2)} €
              </span>
            </p>
          )}
        </div>

        {budget && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWizardOpen((open) => !open)}
              className="rounded border px-4 py-2"
              type="button"
            >
              {wizardOpen ? "Ocultar selector" : "Mostrar selector"}
            </button>

            <button
              onClick={handleSaveDraft}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              type="button"
              disabled={!canSave}
            >
              {isSaving ? "Guardando..." : "Guardar borrador"}
            </button>
          </div>
        )}
      </header>

      {saveMessage && <div className="rounded border p-3 text-sm">{saveMessage}</div>}

      {budget && (
        <BudgetWizardFromCatalog
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onAdd={(line) => {
            setBudget((current) => (current ? addLine(current, line) : current));
          }}
        />
      )}

      {/* CUERPO */}
      <section className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded border p-4">
          <h2 className="mb-3 font-semibold">Partidas</h2>

          {budget?.lines.length ? (
            <BudgetLinesPanel
              lines={budget.lines}
              onRemove={(id) =>
                setBudget((current) =>
                  current ? removeLine(current, id) : current
                )
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              No hay partidas añadidas todavía.
            </p>
          )}
        </div>

        <aside className="space-y-4 rounded border p-4">
          <h2 className="font-semibold">Resumen</h2>

          {budget && (
            <BudgetTotals subtotal={budget.subtotal} total={budget.total} />
          )}
        </aside>
      </section>
    </main>
  );
}