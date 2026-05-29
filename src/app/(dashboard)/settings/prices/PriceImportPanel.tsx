"use client";

import { useActionState } from "react";

import {
  applyPriceImportAction,
  previewPriceImportAction,
  type PriceImportState,
  type PricePreviewRow,
} from "./actions";

const initialState: PriceImportState = {
  rows: [],
  warnings: [],
};

function formatCurrency(value?: number | null) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function StatusBadge({ row }: { row: PricePreviewRow }) {
  const classes = {
    new: "border-green-200 bg-green-50 text-green-800",
    changed: "border-amber-200 bg-amber-50 text-amber-800",
    unchanged: "border-border bg-surface text-text-neutral",
    absent: "border-slate-200 bg-slate-50 text-slate-700",
    error: "border-red-200 bg-red-50 text-red-700",
  }[row.status];

  const label = {
    new: "Nueva",
    changed: "Modificada",
    unchanged: "Sin cambios",
    absent: "Ausente",
    error: "Error",
  }[row.status];

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function SummaryGrid({ state }: { state: PriceImportState }) {
  if (!state.summary && !state.catalogSummary) return null;

  const items = [
    ["Costes", state.summary?.total ?? 0],
    ["Validas", state.summary?.valid ?? 0],
    ["Nuevas", state.summary?.new ?? 0],
    ["Modificadas", state.summary?.changed ?? 0],
    ["Sin cambios", state.summary?.unchanged ?? 0],
    ["Ausentes", state.summary?.absent ?? 0],
    ["Errores", state.summary?.errors ?? 0],
    ["Partidas", state.catalogSummary?.budgetItems ?? 0],
    ["Celdas", state.catalogSummary?.workbookCells ?? 0],
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-9">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-md border border-border bg-surface px-3 py-2"
        >
          <p className="text-xs font-semibold uppercase text-text-neutral">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-text-strong">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewTable({ rows }: { rows: PricePreviewRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="bg-surface text-xs uppercase text-text-neutral">
          <tr>
            <th className="px-3 py-2 text-left">Estado</th>
            <th className="px-3 py-2 text-left">item_key</th>
            <th className="px-3 py-2 text-left">Familia</th>
            <th className="px-3 py-2 text-left">Descripcion</th>
            <th className="px-3 py-2 text-right">Precio actual</th>
            <th className="px-3 py-2 text-right">Precio nuevo</th>
            <th className="px-3 py-2 text-left">Unidad</th>
            <th className="px-3 py-2 text-left">Cambios</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card-background">
          {rows.slice(0, 80).map((row, index) => (
            <tr key={`${row.itemKey}-${row.sourceRow ?? ""}-${index}`}>
              <td className="px-3 py-2 align-top">
                <StatusBadge row={row} />
              </td>
              <td className="max-w-[240px] px-3 py-2 align-top font-mono text-xs text-text-neutral">
                <span className="line-clamp-2">{row.itemKey}</span>
              </td>
              <td className="px-3 py-2 align-top">
                <p className="font-medium text-text-strong">{row.family}</p>
                {row.subfamily ? (
                  <p className="text-xs text-text-neutral">{row.subfamily}</p>
                ) : null}
              </td>
              <td className="max-w-[260px] px-3 py-2 align-top">
                <p className="line-clamp-2 text-text-strong">
                  {row.description}
                </p>
                {row.provider ? (
                  <p className="text-xs text-text-neutral">{row.provider}</p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right align-top text-text-neutral">
                {row.existingPrice === null
                  ? "-"
                  : formatCurrency(row.existingPrice)}
              </td>
              <td className="px-3 py-2 text-right align-top font-semibold text-text-strong">
                {formatCurrency(row.price)}
              </td>
              <td className="px-3 py-2 align-top text-text-neutral">
                {row.unit}
              </td>
              <td className="px-3 py-2 align-top text-xs text-text-neutral">
                {row.errors.length
                  ? row.errors.join(" ")
                  : row.changes.length
                    ? row.changes.join(", ")
                    : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > 80 ? (
        <p className="border-t border-border bg-surface px-3 py-2 text-xs text-text-neutral">
          Mostrando 80 de {rows.length} filas.
        </p>
      ) : null}
    </div>
  );
}

export default function PriceImportPanel() {
  const [previewState, previewAction, isPreviewPending] = useActionState(
    previewPriceImportAction,
    initialState
  );
  const [applyState, applyAction, isApplyPending] = useActionState(
    applyPriceImportAction,
    initialState
  );
  const visibleState = applyState.notice || applyState.error ? applyState : previewState;
  const rows = visibleState.rows ?? [];
  const canApply = rows.some(
    (row) => row.status === "new" || row.status === "changed"
  ) || Boolean(visibleState.catalogSummary?.budgetItems);
  const hasBlockingErrors = rows.some((row) => row.status === "error");
  const canApplyWithCostErrors =
    hasBlockingErrors && Boolean(visibleState.catalogSummary?.budgetItems);

  return (
    <div className="space-y-4">
      <form action={previewAction} className="flex flex-col gap-3 lg:flex-row">
        <input
          accept=".xlsx,.xls"
          className="min-h-10 flex-1 rounded-control border border-border bg-card-background px-3 py-2 text-sm text-text-strong"
          name="excelFile"
          required
          type="file"
        />
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
          disabled={isPreviewPending}
          type="submit"
        >
          {isPreviewPending ? "Analizando..." : "Previsualizar"}
        </button>
      </form>

      {visibleState.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {visibleState.error}
        </div>
      ) : null}

      {visibleState.notice ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {visibleState.notice}
        </div>
      ) : null}

      {visibleState.warnings?.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Avisos detectados</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {visibleState.warnings.slice(0, 6).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SummaryGrid state={visibleState} />

      {rows.length ? (
        <form action={applyAction} className="space-y-3">
          <input
            name="rowsJson"
            type="hidden"
            value={JSON.stringify(rows)}
          />
          <input
            name="budgetItemsJson"
            type="hidden"
            value={JSON.stringify(visibleState.budgetItems ?? [])}
          />
          <input
            name="cellsJson"
            type="hidden"
            value={JSON.stringify(visibleState.cells ?? [])}
          />
          <input
            name="fileName"
            type="hidden"
            value={visibleState.fileName ?? ""}
          />
          <input
            name="sourceType"
            type="hidden"
            value={visibleState.sourceType ?? ""}
          />
          <div className="flex justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
              disabled={
                !canApply ||
                (hasBlockingErrors && !canApplyWithCostErrors) ||
                isApplyPending
              }
              type="submit"
            >
              {isApplyPending ? "Aplicando..." : "Aplicar cambios"}
            </button>
          </div>

          {hasBlockingErrors ? (
            <p className="text-xs font-medium text-red-700">
              Hay costes con errores. En el Excel completo se omitiran esas
              filas de coste, pero se importaran las partidas y celdas validas.
            </p>
          ) : !canApply ? (
            <p className="text-xs font-medium text-text-neutral">
              Las partidas ausentes se muestran para revision, pero no se
              borran ni se desactivan automaticamente.
            </p>
          ) : null}

          <PreviewTable rows={rows} />
        </form>
      ) : null}
    </div>
  );
}
