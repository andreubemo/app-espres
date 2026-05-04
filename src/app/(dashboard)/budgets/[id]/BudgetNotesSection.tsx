type BudgetNotesSectionProps = {
  notes?: string;
};

export default function BudgetNotesSection({ notes }: BudgetNotesSectionProps) {
  const visibleNotes = notes?.trim() || "Sin notas para este presupuesto.";

  return (
    <div className="rounded-lg border border-primary-soft bg-primary-soft/20 shadow-sm">
      <div className="border-b border-primary-soft px-4 py-3">
        <h2 className="text-lg font-semibold tracking-[0.08em] text-primary-strong">
          NOTAS
        </h2>
      </div>

      <div className="p-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-text-strong">
          {visibleNotes}
        </p>
      </div>
    </div>
  );
}
