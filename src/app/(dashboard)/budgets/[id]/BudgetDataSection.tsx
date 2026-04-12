type BudgetDataSectionProps = {
  headerCode: string;
  projectName: string;
  clientName: string;
  statusLabel: string;
};

function getStatusBadgeClasses(statusLabel: string) {
  switch (statusLabel) {
    case "Borrador":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    case "Enviado":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Aceptado":
      return "border-green-200 bg-green-50 text-green-700";
    case "Rechazado":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

export default function BudgetDataSection({
  headerCode,
  projectName,
  clientName,
  statusLabel,
}: BudgetDataSectionProps) {
  const statusBadgeClasses = getStatusBadgeClasses(statusLabel);

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

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2 xl:col-span-1">
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