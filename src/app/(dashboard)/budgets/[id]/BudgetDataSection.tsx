type BudgetDataSectionProps = {
  headerCode: string;
  projectName: string;
  clientName: string;
  statusLabel: string;
};

export default function BudgetDataSection({
  headerCode,
  projectName,
  clientName,
  statusLabel,
}: BudgetDataSectionProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Datos del presupuesto
        </h2>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Código
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {headerCode}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Proyecto
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {projectName}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Cliente
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {clientName}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Estado presupuesto
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  );
}