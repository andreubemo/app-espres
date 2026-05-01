import Link from "next/link";

type BudgetsFiltersBarProps = {
  defaultQuery?: string;
  defaultStatus?: string;
  resultsCount: number;
};

export default function BudgetsFiltersBar({
  defaultQuery = "",
  defaultStatus = "",
  resultsCount,
}: BudgetsFiltersBarProps) {
  const hasActiveFilters = Boolean(defaultQuery || defaultStatus);

  return (
    <section className="rounded-lg border border-border bg-card-background px-3 py-3 shadow-sm">
      <form method="GET" className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Buscar por código, proyecto, cliente o referencia"
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-strong outline-none transition focus:border-primary focus:bg-card-background focus:ring-4 focus:ring-primary/20"
            />
          </div>

          <div className="w-full xl:w-[220px]">
            <select
              name="status"
              defaultValue={defaultStatus}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-strong outline-none transition focus:border-primary focus:bg-card-background focus:ring-4 focus:ring-primary/20"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong"
            >
              Aplicar
            </button>

            {hasActiveFilters && (
              <Link
                href="/budgets"
                className="inline-flex h-9 items-center justify-center rounded-md border border-transparent px-2 text-sm font-medium text-text-neutral transition hover:text-text-strong"
              >
                Limpiar
              </Link>
            )}

            <div className="text-sm text-text-neutral">
              {resultsCount} {resultsCount === 1 ? "resultado" : "resultados"}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
