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
    <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <form method="GET" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Buscar por código, proyecto, cliente o referencia"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
            />
          </div>

          <div className="w-full xl:w-[220px]">
            <select
              name="status"
              defaultValue={defaultStatus}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
            >
              Aplicar
            </button>

            {hasActiveFilters && (
              <Link
                href="/budgets"
                className="inline-flex items-center justify-center rounded-xl border border-transparent px-2 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
              >
                Limpiar
              </Link>
            )}

            <div className="text-sm text-neutral-500">
              {resultsCount} {resultsCount === 1 ? "resultado" : "resultados"}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}