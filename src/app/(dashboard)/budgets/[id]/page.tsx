import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BudgetActionBanner from "./BudgetActionBanner";
import BudgetDetailActions from "./BudgetDetailActions";
import BudgetVersionHistory from "./BudgetVersionHistory";

type StoredBudgetLine = {
  id?: string;
  catalogItemId?: string;
  family?: string;
  item?: string;
  familyKey?: string;
  itemKey?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  snapshot?: {
    family?: string;
    item?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  };
};

type StoredBudgetData = {
  code?: string;
  project?: string;
  date?: string;
  complexity?: string;
  dimensions?: {
    width?: number;
    length?: number;
    surfaceM2?: number;
    perimeterML?: number;
  };
  lines?: StoredBudgetLine[];
  subtotal?: number;
  total?: number;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SENT":
      return "Enviado";
    case "ACCEPTED":
      return "Aceptado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status || "-";
  }
}

function getStatusBadgeClasses(status?: string) {
  switch (status) {
    case "DRAFT":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    case "SENT":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ACCEPTED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function getComplexityLabel(complexity?: string) {
  switch (complexity?.toLowerCase()) {
    case "low":
    case "baja":
      return "Baja";
    case "medium":
    case "media":
      return "Media";
    case "high":
    case "alta":
      return "Alta";
    default:
      return complexity || "-";
  }
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

function getSnapshotFromVersionData(data: unknown): StoredBudgetData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as StoredBudgetData;
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    restoredFrom?: string;
    restoredTo?: string;
    createdVersion?: string;
    markedSent?: string;
    duplicated?: string;
    viewVersion?: string;
  }>;
};

export default async function BudgetDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !session.user.companyId ||
    session.user.type !== "USER"
  ) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const restoredFrom = resolvedSearchParams?.restoredFrom;
  const restoredTo = resolvedSearchParams?.restoredTo;
  const createdVersion = resolvedSearchParams?.createdVersion;
  const markedSent = resolvedSearchParams?.markedSent;
  const duplicated = resolvedSearchParams?.duplicated;
  const viewVersion = resolvedSearchParams?.viewVersion;

  const showRestoreBanner =
    !!restoredFrom &&
    !!restoredTo &&
    !Number.isNaN(Number(restoredFrom)) &&
    !Number.isNaN(Number(restoredTo));

  const showCreatedVersionBanner =
    !!createdVersion && !Number.isNaN(Number(createdVersion));

  const showMarkedSentBanner = markedSent === "1";
  const showDuplicatedBanner = duplicated === "1";

  const budget = await prisma.budget.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
    },
    include: {
      client: true,
      versions: {
        orderBy: { version: "desc" },
      },
    },
  });

  if (!budget) {
    notFound();
  }

  const latestVersion = budget.versions[0];
  const requestedVersionNumber =
    viewVersion && !Number.isNaN(Number(viewVersion))
      ? Number(viewVersion)
      : null;

  const selectedVersion =
    requestedVersionNumber !== null
      ? budget.versions.find((version) => version.version === requestedVersionNumber)
      : latestVersion;

  const effectiveVersion = selectedVersion ?? latestVersion;

  if (!effectiveVersion) {
    notFound();
  }

  const isHistoricalView = effectiveVersion.version !== (latestVersion?.version ?? 1);

  const data = getSnapshotFromVersionData(effectiveVersion.data ?? {});
  const lines = Array.isArray(data.lines) ? data.lines : [];

  const subtotal =
    typeof data.subtotal === "number"
      ? data.subtotal
      : lines.reduce((acc, line) => acc + getLineTotal(line), 0);

  const total = typeof data.total === "number" ? data.total : subtotal;

  const headerCode = data.code || budget.reference || "Sin código";
  const projectName = data.project || "Sin nombre";
  const clientName = budget.client?.name || "Sin cliente";
  const currentVersionNumber = latestVersion?.version ?? 1;
  const viewedVersionNumber = effectiveVersion.version;

  const versionHistory = budget.versions.map((version) => {
    const versionData = getSnapshotFromVersionData(version.data);
    const versionLines = Array.isArray(versionData.lines)
      ? versionData.lines
      : [];

    const versionSubtotal =
      typeof versionData.subtotal === "number"
        ? versionData.subtotal
        : versionLines.reduce((acc, line) => acc + getLineTotal(line), 0);

    const versionTotal =
      typeof versionData.total === "number"
        ? versionData.total
        : versionSubtotal;

    return {
      id: version.id,
      version: version.version,
      sent: version.sent,
      createdAt: version.createdAt.toISOString(),
      project: versionData.project?.trim() || "",
      lineCount: versionLines.length,
      total: versionTotal,
      isCurrent: version.version === currentVersionNumber,
      isViewed: version.version === viewedVersionNumber,
    };
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
        {showRestoreBanner && restoredFrom && restoredTo && (
          <BudgetActionBanner
            tone="success"
            title="Versión restaurada correctamente"
            message={`Restaurada la v${restoredFrom} como nueva v${restoredTo}.`}
            queryKeysToClear={["restoredFrom", "restoredTo"]}
          />
        )}

        {showCreatedVersionBanner && createdVersion && (
          <BudgetActionBanner
            tone="success"
            title="Nueva versión creada"
            message={`Se ha creado la nueva v${createdVersion} a partir del último snapshot guardado.`}
            queryKeysToClear={["createdVersion"]}
          />
        )}

        {showMarkedSentBanner && (
          <BudgetActionBanner
            tone="info"
            title="Presupuesto marcado como enviado"
            message="La versión actual ha quedado marcada como enviada y el estado del presupuesto se ha actualizado."
            queryKeysToClear={["markedSent"]}
          />
        )}

        {showDuplicatedBanner && (
          <BudgetActionBanner
            tone="success"
            title="Presupuesto duplicado"
            message="Se ha creado correctamente una copia del presupuesto como nuevo borrador."
            queryKeysToClear={["duplicated"]}
          />
        )}

        {isHistoricalView && (
          <BudgetActionBanner
            tone="info"
            title="Visualizando una versión histórica"
            message={`Estás viendo la v${viewedVersionNumber} en modo solo lectura. La versión actual del presupuesto es la v${currentVersionNumber}.`}
            queryKeysToClear={["viewVersion"]}
          />
        )}

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Detalle de presupuesto
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  {headerCode}
                </h1>
                <p className="text-sm text-neutral-600">{projectName}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                    budget.status
                  )}`}
                >
                  Estado: {getStatusLabel(budget.status)}
                </span>

                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  Cliente: {clientName}
                </span>

                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  Viendo versión: {viewedVersionNumber}
                </span>

                {!isHistoricalView ? (
                  <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                    Versión actual
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Solo lectura
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[360px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {formatDate(data.date)}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Complejidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {getComplexityLabel(data.complexity)}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Total presupuesto
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              <BudgetDetailActions
                budgetId={budget.id}
                status={budget.status}
                isHistoricalView={isHistoricalView}
                viewedVersionNumber={viewedVersionNumber}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Datos del presupuesto
                </h2>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Código
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {headerCode}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Proyecto
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {projectName}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Cliente
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {clientName}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Estado presupuesto
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {getStatusLabel(budget.status)}
                  </p>
                </div>
              </div>
            </div>

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
                    {formatNumber(data.dimensions?.width)} m
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Largo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {formatNumber(data.dimensions?.length)} m
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Superficie
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {formatNumber(data.dimensions?.surfaceM2)} m²
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Perímetro
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {formatNumber(data.dimensions?.perimeterML)} ml
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Partidas
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {lines.length} {lines.length === 1 ? "línea" : "líneas"} en
                    la versión visualizada
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
                  Total:{" "}
                  <span className="font-semibold text-neutral-900">
                    {formatCurrency(total)}
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
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr className="border-b border-neutral-200 text-left">
                        <th className="px-6 py-3 font-medium text-neutral-600">
                          #
                        </th>
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
                            className="border-b border-neutral-100 last:border-b-0"
                          >
                            <td className="px-6 py-4 align-top text-neutral-500">
                              {index + 1}
                            </td>

                            <td className="px-6 py-4 align-top">
                              <div className="font-medium text-neutral-900">
                                {family}
                              </div>
                              {(line.familyKey || line.catalogItemId) && (
                                <div className="mt-1 text-xs text-neutral-500">
                                  {line.familyKey
                                    ? `key: ${line.familyKey}`
                                    : null}
                                  {line.familyKey && line.catalogItemId
                                    ? " · "
                                    : null}
                                  {line.catalogItemId
                                    ? `catalog: ${line.catalogItemId}`
                                    : null}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 align-top">
                              <div className="font-medium text-neutral-900">
                                {item}
                              </div>
                              {line.itemKey && line.itemKey !== item && (
                                <div className="mt-1 text-xs text-neutral-500">
                                  key: {line.itemKey}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 align-top text-neutral-700">
                              {unit}
                            </td>

                            <td className="px-6 py-4 text-right align-top font-medium text-neutral-900">
                              {formatNumber(quantity, 2)}
                            </td>

                            <td className="px-6 py-4 text-right align-top text-neutral-700">
                              {formatCurrency(unitPrice)}
                            </td>

                            <td className="px-6 py-4 text-right align-top font-semibold text-neutral-900">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <BudgetVersionHistory
              budgetId={budget.id}
              versions={versionHistory}
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Resumen económico
                </h2>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                  <span className="text-sm font-medium text-neutral-700">
                    Total
                  </span>
                  <span className="text-xl font-semibold tracking-tight text-neutral-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

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
                  <span className="font-medium text-neutral-900">
                    {lines.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Versiones totales</span>
                  <span className="font-medium text-neutral-900">
                    {budget.versions.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Modo</span>
                  <span className="font-medium text-neutral-900">
                    {isHistoricalView ? "Solo lectura" : "Actual"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Origen de datos</span>
                  <span className="font-medium text-neutral-900">
                    Snapshot JSON
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}