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
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Dimensiones
        </h2>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Ancho
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatNumber(width)} m
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Largo
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatNumber(length)} m
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Superficie
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatNumber(surfaceM2)} m²
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Perímetro
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatNumber(perimeterML)} ml
          </p>
        </div>
      </div>
    </div>
  );
}