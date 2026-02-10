'use client';

import { useState } from 'react';

import { Budget } from '@/domain/budgets/budget.model';
import {
  createEmptyBudget,
  addLine,
  removeLine,
} from '@/domain/budgets/budget.service';

import BudgetBaseModal from '@/ui/budgets/BudgetBaseModal';
import BudgetWizardFromCatalog from '@/ui/budgets/BudgetWizardFromCatalog';
import BudgetLinesPanel from '@/ui/budgets/BudgetLinesPanel';
import BudgetTotals from '@/ui/budgets/BudgetTotals';

export default function NewBudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <main className="p-8 space-y-6">
      {/* MODAL DATOS BASE */}
      <BudgetBaseModal
        open={!budget}
        onSubmit={(data) => {
          setBudget(
            createEmptyBudget({
              code: data.code,
              project: data.project,
              date: data.date,
              surfaceM2: data.surfaceM2,
              complexity: data.complexity,
            })
          );
          setWizardOpen(true);
        }}
      />

      {/* CABECERA */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nuevo presupuesto</h1>
          {budget && (
            <p className="text-sm text-gray-600">
              Código <strong>{budget.code}</strong> · Proyecto{' '}
              <strong>{budget.project}</strong>
            </p>
          )}
        </div>

        {budget && (
          <button
            onClick={() => setWizardOpen((o) => !o)}
            className="rounded border px-4 py-2"
          >
            {wizardOpen ? 'Ocultar selector' : 'Mostrar selector'}
          </button>
        )}
      </header>

      {/* WIZARD SIEMPRE DISPONIBLE */}
      {budget && (
        <BudgetWizardFromCatalog
          open={wizardOpen}
          onAdd={(line) => {
            setBudget((b) => (b ? addLine(b, line) : b));
          }}
        />
      )}

      {/* CUERPO SIEMPRE VISIBLE */}
      <section className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded border p-4">
          <h2 className="mb-3 font-semibold">Partidas</h2>

          {budget?.lines.length ? (
            <BudgetLinesPanel
              lines={budget.lines}
              onRemove={(id) =>
                setBudget((b) => (b ? removeLine(b, id) : b))
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              No hay partidas añadidas todavía.
            </p>
          )}
        </div>

        <aside className="rounded border p-4 space-y-4">
          <h2 className="font-semibold">Resumen</h2>

          {budget && (
            <BudgetTotals
              subtotal={budget.subtotal}
              total={budget.total}
            />
          )}
        </aside>
      </section>
    </main>
  );
}
