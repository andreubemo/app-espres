type BudgetVersionContextCardProps = {
  viewedVersionNumber: number;
  currentVersionNumber: number;
  lineCount: number;
  totalVersions: number;
  isHistoricalView: boolean;
};

export default function BudgetVersionContextCard({
  viewedVersionNumber,
  currentVersionNumber,
  lineCount,
  totalVersions,
  isHistoricalView,
}: BudgetVersionContextCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Contexto de versión
        </h2>
      </div>

      <div className="space-y-4 p-4">
        <div
          className={`rounded-md border px-4 py-3 ${
            isHistoricalView
              ? "border-primary-soft bg-primary-soft/20"
              : "border-border bg-surface"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Estado de visualización
          </p>

          <p className="mt-1 text-sm font-semibold text-text-strong">
            {isHistoricalView
              ? `Visualizando la versión v${viewedVersionNumber} en modo solo lectura`
              : `Visualizando la versión actual v${viewedVersionNumber}`}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-text-neutral">Versión visualizada</span>
            <span className="font-medium text-text-strong">
              v{viewedVersionNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-text-neutral">Versión actual</span>
            <span className="font-medium text-text-strong">
              v{currentVersionNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-text-neutral">Partidas guardadas</span>
            <span className="font-medium text-text-strong">{lineCount}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-text-neutral">Versiones totales</span>
            <span className="font-medium text-text-strong">{totalVersions}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-text-neutral">Modo</span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                isHistoricalView
                  ? "border-primary-soft bg-primary-soft/20 text-primary-strong"
                  : "border-border bg-surface text-text-neutral"
              }`}
            >
              {isHistoricalView ? "Solo lectura" : "Actual"}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-text-neutral">Origen de datos</span>
            <span className="font-medium text-text-strong">Snapshot JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
}