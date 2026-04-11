import BudgetDetailActions from "./BudgetDetailActions";

type BudgetHeaderProps = {
  budgetId: string;
  status: string;
  statusLabel: string;
  statusBadgeClasses: string;
  headerCode: string;
  projectName: string;
  clientName: string;
  viewedVersionNumber: number;
  isHistoricalView: boolean;
  dateLabel: string;
  complexityLabel: string;
  totalLabel: string;
};

export default function BudgetHeader({
  budgetId,
  status,
  statusLabel,
  statusBadgeClasses,
  headerCode,
  projectName,
  clientName,
  viewedVersionNumber,
  isHistoricalView,
  dateLabel,
  complexityLabel,
  totalLabel,
}: BudgetHeaderProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Detalle de presupuesto
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                {headerCode}
              </h1>

              <p className="text-sm text-neutral-600">
                Proyecto: {projectName}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses}`}
              >
                {statusLabel}
              </span>

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                Cliente: {clientName}
              </span>

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                v{viewedVersionNumber}
              </span>

              {!isHistoricalView ? (
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  Versión actual
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Solo lectura
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px] xl:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Fecha
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {dateLabel}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Complejidad
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {complexityLabel}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2 xl:col-span-1 xl:text-right">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Total presupuesto
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                {totalLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <BudgetDetailActions
            budgetId={budgetId}
            status={status}
            isHistoricalView={isHistoricalView}
            viewedVersionNumber={viewedVersionNumber}
          />
        </div>
      </div>
    </section>
  );
}