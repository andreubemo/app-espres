type BudgetDimensionsSectionProps = {
  width?: number;
  length?: number;
  surfaceM2?: number;
  perimeterML?: number;
};

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

export default function BudgetDimensionsSection({
  width,
  length,
  surfaceM2,
  perimeterML,
}: BudgetDimensionsSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-text-strong">
          Dimensiones
        </h2>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Ancho
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {formatNumber(width)} m
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Largo
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {formatNumber(length)} m
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Superficie
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-text-strong">
            {formatNumber(surfaceM2)} m²
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-neutral">
            Perímetro
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {formatNumber(perimeterML)} ml
          </p>
        </div>
      </div>
    </div>
  );
}