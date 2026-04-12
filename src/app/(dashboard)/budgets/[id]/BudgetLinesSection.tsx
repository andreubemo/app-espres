import type { StoredBudgetLine } from "./budget-detail.types";

type BudgetLinesSectionProps = {
  lines: StoredBudgetLine[];
  totalLabel: string;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function getLineFamily(line: StoredBudgetLine) {
  return line.snapshot?.family || line.family || line.familyKey || "-";
}

function getLineItem(line: StoredBudgetLine) {
  return line.snapshot?.item || line.item || line.itemKey || "-";
}

function getLineUnit(line: StoredBudgetLine) {
  return line.snapshot?.unit || line.unit || "-";
}

function getLineQuantity(line: StoredBudgetLine) {
  return line.snapshot?.quantity ?? line.quantity ?? 0;
}

function getLineUnitPrice(line: StoredBudgetLine) {
  return line.snapshot?.unitPrice ?? line.unitPrice ?? 0;
}

function getLineTotal(line: StoredBudgetLine) {
  const explicitTotal = line.snapshot?.total ?? line.total;
  if (typeof explicitTotal === "number") return explicitTotal;

  return getLineQuantity(line) * getLineUnitPrice(line);
}

export default function BudgetLinesSection({
  lines,
  totalLabel,
}: BudgetLinesSectionProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Partidas</h2>
          <p className="text-sm text-neutral-500">
            {lines.length} {lines.length === 1 ? "línea" : "líneas"} en la
            versión visualizada
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
          Total:{" "}
          <span className="font-semibold tracking-tight text-neutral-900">
            {totalLabel}
          </span>
        </div>
      </div>

      {!lines.length ? (
        <div className="p-6">
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            Esta versión no tiene partidas guardadas.
          </div>
        </div>
      ) : (
        <>
          <div className="block md:hidden">
            <div className="divide-y divide-neutral-200">
              {lines.map((line, index) => {
                const family = getLineFamily(line);
                const item = getLineItem(line);
                const unit = getLineUnit(line);
                const quantity = getLineQuantity(line);
                const unitPrice = getLineUnitPrice(line);
                const lineTotal = getLineTotal(line);

                return (
                  <article
                    key={line.id ?? `${item}-${index}`}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Línea {index + 1}
                        </p>
                        <h3 className="text-base font-semibold leading-snug text-neutral-900">
                          {item}
                        </h3>
                        <p className="text-sm text-neutral-600">{family}</p>
                      </div>

                      <div className="shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-right">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Total
                        </p>
                        <p className="mt-1 text-base font-semibold text-neutral-900">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>

                    {(line.familyKey || line.catalogItemId || line.itemKey) && (
                      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                        {line.familyKey ? `familyKey: ${line.familyKey}` : null}
                        {line.familyKey && (line.catalogItemId || line.itemKey)
                          ? " · "
                          : null}
                        {line.itemKey ? `itemKey: ${line.itemKey}` : null}
                        {line.itemKey && line.catalogItemId ? " · " : null}
                        {line.catalogItemId
                          ? `catalog: ${line.catalogItemId}`
                          : null}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Cantidad
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatNumber(quantity, 2)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Unidad
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {unit}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Precio
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {formatCurrency(unitPrice)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-6 py-3 font-medium text-neutral-600">#</th>
                  <th className="px-6 py-3 font-medium text-neutral-600">
                    Familia
                  </th>
                  <th className="px-6 py-3 font-medium text-neutral-600">
                    Partida
                  </th>
                  <th className="px-6 py-3 font-medium text-neutral-600">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-neutral-600">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-neutral-600">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-neutral-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {lines.map((line, index) => {
                  const family = getLineFamily(line);
                  const item = getLineItem(line);
                  const unit = getLineUnit(line);
                  const quantity = getLineQuantity(line);
                  const unitPrice = getLineUnitPrice(line);
                  const lineTotal = getLineTotal(line);

                  return (
                    <tr
                      key={line.id ?? `${item}-${index}`}
                      className="border-b border-neutral-100 align-top last:border-b-0"
                    >
                      <td className="px-6 py-4 text-neutral-500">{index + 1}</td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">
                          {family}
                        </div>
                        {(line.familyKey || line.catalogItemId) && (
                          <div className="mt-1 text-xs text-neutral-500">
                            {line.familyKey ? `key: ${line.familyKey}` : null}
                            {line.familyKey && line.catalogItemId ? " · " : null}
                            {line.catalogItemId
                              ? `catalog: ${line.catalogItemId}`
                              : null}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{item}</div>
                        {line.itemKey && line.itemKey !== item && (
                          <div className="mt-1 text-xs text-neutral-500">
                            key: {line.itemKey}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-neutral-700">{unit}</td>

                      <td className="px-6 py-4 text-right font-medium text-neutral-900">
                        {formatNumber(quantity, 2)}
                      </td>

                      <td className="px-6 py-4 text-right text-neutral-700">
                        {formatCurrency(unitPrice)}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}