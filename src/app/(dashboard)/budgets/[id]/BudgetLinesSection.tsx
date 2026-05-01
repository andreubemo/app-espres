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
    <div className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <h2 className="text-lg font-semibold text-text-strong">Partidas</h2>
          <p className="text-sm text-text-neutral">
            {lines.length} {lines.length === 1 ? "línea" : "líneas"} en la
            versión visualizada
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-neutral">
          Total:{" "}
          <span className="font-semibold tracking-tight text-text-strong">
            {totalLabel}
          </span>
        </div>
      </div>

      {!lines.length ? (
        <div className="p-4">
          <div className="rounded-md border border-dashed border-primary-soft bg-surface p-4 text-sm text-text-neutral">
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
                        <p className="text-xs uppercase tracking-wide text-text-neutral">
                          Línea {index + 1}
                        </p>
                        <h3 className="text-base font-semibold leading-snug text-text-strong">
                          {item}
                        </h3>
                        <p className="text-sm text-text-neutral">{family}</p>
                      </div>

                      <div className="shrink-0 rounded-md border border-border bg-surface px-3 py-2 text-right">
                        <p className="text-xs uppercase tracking-wide text-text-neutral">
                          Total
                        </p>
                        <p className="mt-1 text-base font-semibold text-text-strong">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>

                    {(line.familyKey || line.catalogItemId || line.itemKey) && (
                      <div className="rounded-lg bg-surface px-3 py-2 text-xs text-text-neutral">
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
                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs uppercase tracking-wide text-text-neutral">
                          Cantidad
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-strong">
                          {formatNumber(quantity, 2)}
                        </p>
                      </div>

                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs uppercase tracking-wide text-text-neutral">
                          Unidad
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-strong">
                          {unit}
                        </p>
                      </div>

                      <div className="rounded-md border border-border bg-surface p-3">
                        <p className="text-xs uppercase tracking-wide text-text-neutral">
                          Precio
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-strong">
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
              <thead className="bg-surface">
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-text-neutral">#</th>
                  <th className="px-4 py-3 font-medium text-text-neutral">
                    Familia
                  </th>
                  <th className="px-4 py-3 font-medium text-text-neutral">
                    Partida
                  </th>
                  <th className="px-4 py-3 font-medium text-text-neutral">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-text-neutral">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-text-neutral">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-text-neutral">
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
                      className="border-b border-border align-top last:border-b-0"
                    >
                      <td className="px-4 py-3 text-text-neutral">{index + 1}</td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-text-strong">
                          {family}
                        </div>
                        {(line.familyKey || line.catalogItemId) && (
                          <div className="mt-1 text-xs text-text-neutral">
                            {line.familyKey ? `key: ${line.familyKey}` : null}
                            {line.familyKey && line.catalogItemId ? " · " : null}
                            {line.catalogItemId
                              ? `catalog: ${line.catalogItemId}`
                              : null}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-text-strong">{item}</div>
                        {line.itemKey && line.itemKey !== item && (
                          <div className="mt-1 text-xs text-text-neutral">
                            key: {line.itemKey}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-text-neutral">{unit}</td>

                      <td className="px-4 py-3 text-right font-medium text-text-strong">
                        {formatNumber(quantity, 2)}
                      </td>

                      <td className="px-4 py-3 text-right text-text-neutral">
                        {formatCurrency(unitPrice)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-text-strong">
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