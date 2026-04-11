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

      <div className="space-y-3 p-6 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-500">Versión visualizada</span>
          <span className="font-medium text-neutral-900">
            {viewedVersionNumber}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-500">Versión actual</span>
          <span className="font-medium text-neutral-900">
            {currentVersionNumber}
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
          <span className="font-medium text-neutral-900">
            {isHistoricalView ? "Solo lectura" : "Actual"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-500">Origen de datos</span>
          <span className="font-medium text-neutral-900">Snapshot JSON</span>
        </div>
      </div>
    </div>
  );
}