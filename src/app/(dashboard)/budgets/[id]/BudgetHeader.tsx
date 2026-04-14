import BudgetDetailActions from "./BudgetDetailActions";
import StatusBadge from "@/ui/common/StatusBadge";
import StatCard from "@/ui/common/StatCard";

type BudgetHeaderProps = {
  budgetId: string;
  status: string;
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
              <StatusBadge status={status} />

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
            <StatCard label="Fecha" value={dateLabel} />

            <StatCard label="Complejidad" value={complexityLabel} />

            <StatCard
              label="Total presupuesto"
              value={totalLabel}
              align="right"
              className="sm:col-span-2 xl:col-span-1"
            />
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