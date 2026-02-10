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
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <main className="p-8 space-y-6">
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
        }}
      />

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
            onClick={() => setWizardOpen(true)}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Añadir partida
          </button>
        )}
      </header>

      {budget && (
  <BudgetWizardFromCatalog
    open={wizardOpen}
    onClose={() => setWizardOpen(false)}
    onAdd={(line) => {
      setBudget((b) => (b ? addLine(b, line) : b));
    }}
  />
)}


      <section className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded border p-4">
          {budget?.lines.length ? (
            <BudgetLinesPanel
              lines={budget.lines}
              onRemove={(id) =>
                setBudget((b) => (b ? removeLine(b, id) : b))
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              No hay partidas añadidas.
            </p>
          )}
        </div>

        <aside className="rounded border p-4">
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
