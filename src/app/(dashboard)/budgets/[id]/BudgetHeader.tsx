import BudgetDetailActions from "./BudgetDetailActions";
import StatusBadge from "@/ui/common/StatusBadge";
import StatCard from "@/ui/common/StatCard";

type BudgetHeaderProps = {
  budgetId: string;
  status: string;
  headerCode: string;
  projectName: string;
  clientName: string;
  responsibleName: string;
  viewedVersionNumber: number;
  isHistoricalView: boolean;
  dateLabel: string;
  generatedAtLabel: string;
  complexityLabel: string;
  totalLabel: string;
};

export default function BudgetHeader({
  budgetId,
  status,
  headerCode,
  projectName,
  clientName,
  responsibleName,
  viewedVersionNumber,
  isHistoricalView,
  dateLabel,
  generatedAtLabel,
  complexityLabel,
  totalLabel,
}: BudgetHeaderProps) {
  return (
    <section className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="space-y-4 p-4 sm:p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-neutral">
                Detalle de presupuesto
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
                {headerCode}
              </h1>

              <p className="text-sm text-text-neutral">
                Proyecto: {projectName}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={status} />

              <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-neutral">
                Cliente: {clientName}
              </span>

              <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-neutral">
                Responsable: {responsibleName}
              </span>

              <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-neutral">
                v{viewedVersionNumber}
              </span>

              {!isHistoricalView ? (
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-neutral">
                  Versión actual
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-primary-soft bg-primary-soft/20 px-3 py-1 text-xs font-medium text-primary-strong">
                  Solo lectura
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[720px] xl:grid-cols-4">
            <StatCard label="Fecha" value={dateLabel} />

            <StatCard label="Generado" value={generatedAtLabel} />

            <StatCard label="Complejidad" value={complexityLabel} />

            <StatCard
              label="Total presupuesto"
              value={totalLabel}
              align="right"
              className="sm:col-span-2 xl:col-span-1"
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
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
