type BudgetDataSectionProps = {
  headerCode: string;
  projectName: string;
  clientName: string;
  responsibleName: string;
  statusLabel: string;
  generatedAtLabel: string;
};

function getStatusBadgeClasses(statusLabel: string) {
  switch (statusLabel) {
    case "Borrador":
      return "border-border bg-surface text-text-neutral";
    case "Enviado":
      return "border-primary-soft bg-primary-soft/20 text-primary-strong";
    case "Aceptado":
      return "border-green-200 bg-green-50 text-green-700";
    case "Rechazado":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-border bg-surface text-text-neutral";
  }
}

export default function BudgetDataSection({
  headerCode,
  projectName,
  clientName,
  responsibleName,
  statusLabel,
  generatedAtLabel,
}: BudgetDataSectionProps) {
  const statusBadgeClasses = getStatusBadgeClasses(statusLabel);

  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Datos del presupuesto
        </h2>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Código
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {headerCode}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Proyecto
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {projectName}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Cliente
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {clientName}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Responsable
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-strong">
            {responsibleName}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Generado
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {generatedAtLabel}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Estado presupuesto
          </p>
          <div className="mt-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
