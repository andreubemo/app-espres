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
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Contexto de versión
        </h2>
      </div>

      <div className="space-y-4 p-6">
        <div
          className={`rounded-xl border px-4 py-4 ${
            isHistoricalView
              ? "border-amber-200 bg-amber-50"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Estado de visualización
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {isHistoricalView
              ? `Visualizando la versión v${viewedVersionNumber} en modo solo lectura`
              : `Visualizando la versión actual v${viewedVersionNumber}`}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Versión visualizada</span>
            <span className="font-medium text-neutral-900">
              v{viewedVersionNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Versión actual</span>
            <span className="font-medium text-neutral-900">
              v{currentVersionNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Partidas guardadas</span>
            <span className="font-medium text-neutral-900">{lineCount}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Versiones totales</span>
            <span className="font-medium text-neutral-900">{totalVersions}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Modo</span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                isHistoricalView
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700"
              }`}
            >
              {isHistoricalView ? "Solo lectura" : "Actual"}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-neutral-500">Origen de datos</span>
            <span className="font-medium text-neutral-900">Snapshot JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
}