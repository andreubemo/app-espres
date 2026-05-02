import { redirect, notFound } from "next/navigation";

import { getInternalUserContext } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import BudgetActionBanner from "./BudgetActionBanner";
import BudgetBreadcrumb from "./BudgetBreadcrumb";
import BudgetDataSection from "./BudgetDataSection";
import BudgetDimensionsSection from "./BudgetDimensionsSection";
import BudgetHeader from "./BudgetHeader";
import BudgetLinesSection from "./BudgetLinesSection";
import BudgetSectionNav from "./BudgetSectionNav";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetVersionContextCard from "./BudgetVersionContextCard";
import BudgetVersionHistory from "./BudgetVersionHistory";
import type {
  BudgetVersionHistoryItem,
  StoredBudgetData,
  StoredBudgetLine,
} from "./budget-detail.types";

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
    updatedVersion?: string;
    markedSent?: string;
    duplicated?: string;
    viewVersion?: string;
  }>;
};

export default async function BudgetDetailPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getInternalUserContext();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const restoredFrom = resolvedSearchParams?.restoredFrom;
  const restoredTo = resolvedSearchParams?.restoredTo;
  const createdVersion = resolvedSearchParams?.createdVersion;
  const updatedVersion = resolvedSearchParams?.updatedVersion;
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
  const showUpdatedVersionBanner =
    !!updatedVersion && !Number.isNaN(Number(updatedVersion));

  const showMarkedSentBanner = markedSent === "1";
  const showDuplicatedBanner = duplicated === "1";

  const budget = await prisma.budget.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    select: {
      id: true,
      reference: true,
      project: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      versions: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          sent: true,
          createdAt: true,
          data: true,
        },
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
      ? budget.versions.find(
          (version) => version.version === requestedVersionNumber
        )
      : latestVersion;

  const effectiveVersion = selectedVersion ?? latestVersion;

  if (!effectiveVersion) {
    notFound();
  }

  const isHistoricalView =
    effectiveVersion.version !== (latestVersion?.version ?? 1);

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
  const responsibleName = budget.createdBy?.email || "Sin responsable";
  const currentVersionNumber = latestVersion?.version ?? 1;
  const viewedVersionNumber = effectiveVersion.version;
  const dateLabel = formatDate(data.date);
  const complexityLabel = getComplexityLabel(data.complexity);
  const totalLabel = formatCurrency(total);

  const versionHistory: BudgetVersionHistoryItem[] = budget.versions.map(
    (version) => {
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
    }
  );

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:gap-4 sm:px-4 sm:py-6 lg:px-8">
        <BudgetBreadcrumb
          headerCode={headerCode}
          viewedVersionNumber={viewedVersionNumber}
        />

        {showRestoreBanner && (
          <BudgetActionBanner
            tone="success"
            title="Versión restaurada correctamente"
            message={`Restaurada la v${restoredFrom} como nueva v${restoredTo}.`}
            queryKeysToClear={["restoredFrom", "restoredTo"]}
          />
        )}

        {showCreatedVersionBanner && (
          <BudgetActionBanner
            tone="success"
            title="Nueva versión creada"
            message={`Se ha creado la nueva v${createdVersion}.`}
            queryKeysToClear={["createdVersion"]}
          />
        )}

        {showUpdatedVersionBanner && (
          <BudgetActionBanner
            tone="success"
            title="Cambios guardados"
            message={`El presupuesto se ha actualizado como v${updatedVersion}.`}
            queryKeysToClear={["updatedVersion"]}
          />
        )}

        {showMarkedSentBanner && (
          <BudgetActionBanner
            tone="info"
            title="Presupuesto marcado como enviado"
            message="La versión actual ha sido marcada como enviada."
            queryKeysToClear={["markedSent"]}
          />
        )}

        {showDuplicatedBanner && (
          <BudgetActionBanner
            tone="success"
            title="Presupuesto duplicado"
            message="Se ha creado una copia correctamente."
            queryKeysToClear={["duplicated"]}
          />
        )}

        {isHistoricalView && (
          <BudgetActionBanner
            tone="info"
            title="Modo histórico"
            message={`Estás viendo la v${viewedVersionNumber}.`}
            queryKeysToClear={["viewVersion"]}
          />
        )}

        <BudgetHeader
          budgetId={budget.id}
          status={budget.status}
          headerCode={headerCode}
          projectName={projectName}
          clientName={clientName}
          responsibleName={responsibleName}
          viewedVersionNumber={viewedVersionNumber}
          isHistoricalView={isHistoricalView}
          dateLabel={dateLabel}
          complexityLabel={complexityLabel}
          totalLabel={totalLabel}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <BudgetSectionNav />

            <section id="datos" className="scroll-mt-24">
              <BudgetDataSection
                headerCode={headerCode}
                projectName={projectName}
                clientName={clientName}
                responsibleName={responsibleName}
                statusLabel={budget.status}
              />
            </section>

            <section id="dimensiones" className="scroll-mt-24">
              <BudgetDimensionsSection
                width={data.dimensions?.width}
                length={data.dimensions?.length}
                surfaceM2={data.dimensions?.surfaceM2}
                perimeterML={data.dimensions?.perimeterML}
              />
            </section>

            <section id="partidas" className="scroll-mt-24">
              <BudgetLinesSection lines={lines} totalLabel={totalLabel} />
            </section>

            <section id="historial" className="scroll-mt-24">
              <BudgetVersionHistory
                budgetId={budget.id}
                versions={versionHistory}
              />
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[72px] xl:self-start">
            <BudgetSummaryCard subtotal={subtotal} total={total} />

            <BudgetVersionContextCard
              viewedVersionNumber={viewedVersionNumber}
              currentVersionNumber={currentVersionNumber}
              lineCount={lines.length}
              totalVersions={budget.versions.length}
              isHistoricalView={isHistoricalView}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}
