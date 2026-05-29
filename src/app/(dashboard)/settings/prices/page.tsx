import Link from "next/link";
import { redirect } from "next/navigation";

import { Prisma, Role } from "@/generated/prisma";
import {
  getCatalogPriceStats,
  getCatalogStats,
  type CatalogPriceStats,
  type CatalogStats,
} from "@/domain/catalog/catalog-stats";
import { getInternalUserContext } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { Card } from "@/ui/primitives/Card";
import { Input } from "@/ui/primitives/Input";
import { SectionHeader } from "@/ui/primitives/SectionHeader";

import {
  createPriceItemAction,
  setPriceItemActiveAction,
  updatePriceItemAction,
} from "./actions";
import PriceImportPanel from "./PriceImportPanel";

type PageProps = {
  searchParams?: Promise<{
    active?: string;
    error?: string;
    notice?: string;
    q?: string;
  }>;
};

type PriceItemListItem = {
  id: string;
  itemKey: string;
  family: string;
  subfamily: string | null;
  description: string;
  xMm: number | null;
  yMm: number | null;
  thicknessMm: number | null;
  unit: string;
  price: number;
  provider: string | null;
  isActive: boolean;
  updatedAt: Date;
};

const OWNER_ROLE = Role.OWNER;
const LIST_LIMIT = 180;

function formatCurrency(value?: number | null) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function inputValue(value?: string | number | null) {
  return value ?? "";
}

function numberInputValue(value?: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function readSummaryNumber(summary: unknown, key: string) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return 0;
  }

  const value = (summary as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildWhere(companyId: string, q: string, activeFilter: string) {
  const where: Prisma.CatalogPriceItemWhereInput = {
    companyId,
  };

  if (activeFilter === "active") {
    where.isActive = true;
  }

  if (activeFilter === "inactive") {
    where.isActive = false;
  }

  if (q) {
    const search = {
      contains: q,
      mode: "insensitive" as const,
    };

    where.OR = [
      { itemKey: search },
      { family: search },
      { subfamily: search },
      { description: search },
      { provider: search },
    ];
  }

  return where;
}

function OwnerOnlyBlock() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8">
        <SectionHeader
          eyebrow="Permisos"
          title="Gestion de precios bloqueada"
          description="Solo el rol OWNER puede consultar o actualizar precios desde este apartado."
        />

        <Card>
          <p className="text-sm leading-6 text-text-neutral">
            Tu usuario esta autenticado, pero no tiene permisos suficientes.
            Esta comprobacion se aplica tambien en servidor para las acciones y
            descargas.
          </p>
        </Card>
      </div>
    </main>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor?: string;
}) {
  return (
    <label
      className="text-[11px] font-semibold uppercase text-text-neutral"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function StatsCard({
  helper,
  label,
  tone = "neutral",
  value,
}: {
  helper: string;
  label: string;
  tone?: "neutral" | "warning" | "success";
  value: number | string;
}) {
  const toneClass = {
    neutral: "border-border bg-card-background",
    success: "border-green-200 bg-green-50",
    warning: "border-amber-200 bg-amber-50",
  }[tone];

  return (
    <Card className={toneClass} padding="sm">
      <p className="text-xs font-semibold uppercase text-text-neutral">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-text-strong">{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-neutral">{helper}</p>
    </Card>
  );
}

function CatalogHealthMessage({
  catalogStats,
  priceStats,
}: {
  catalogStats: CatalogStats;
  priceStats: CatalogPriceStats;
}) {
  if (catalogStats.activeItems === 0 && priceStats.activePriceItems === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50" padding="sm">
        <p className="text-sm font-semibold text-amber-950">
          Todavia no hay partidas activas importadas para esta empresa.
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Importa una tarifa Excel para empezar a gestionar precios. En este
          estado los contadores a 0 son esperados, no un fallo de la pantalla.
        </p>
      </Card>
    );
  }

  if (catalogStats.activeItems > 0 && priceStats.activePriceItems === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50" padding="sm">
        <p className="text-sm font-semibold text-amber-950">
          Hay partidas de presupuesto, pero no hay costes editables cargados.
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          El wizard puede ver partidas desde PRESUPUESTO, pero esta pantalla
          necesita filas validas de COSTE para editar precios unitarios.
        </p>
      </Card>
    );
  }

  if (catalogStats.reviewItems === 0 && priceStats.reviewPriceItems === 0) {
    return (
      <Card className="border-green-200 bg-green-50" padding="sm">
        <p className="text-sm font-semibold text-green-900">
          No hay precios pendientes de revision.
        </p>
        <p className="mt-1 text-sm leading-6 text-green-800">
          Las partidas activas tienen datos minimos y los costes editables
          cargados tienen precio mayor que cero.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50" padding="sm">
      <p className="text-sm font-semibold text-amber-950">
        Hay datos que conviene revisar antes de presupuestar.
      </p>
      <p className="mt-1 text-sm leading-6 text-amber-900">
        Revisa partidas sin precio base valido, nombres/familias incompletos o
        costes editables con precio cero.
      </p>
    </Card>
  );
}

function ImportSummary({
  catalogStats,
  lastImports,
}: {
  catalogStats: CatalogStats;
  lastImports: Array<{
    id: string;
    fileName: string | null;
    sourceType: string;
    summary: Prisma.JsonValue;
    createdAt: Date;
  }>;
}) {
  const latest = lastImports[0];

  if (!latest) {
    return (
      <Card padding="sm">
        <p className="text-xs font-semibold uppercase text-text-neutral">
          Ultima importacion
        </p>
        <p className="mt-1 text-sm font-medium text-text-strong">
          Sin importaciones registradas
        </p>
        <p className="mt-1 text-xs leading-5 text-text-neutral">
          Al importar un Excel maestro se guardara aqui el resumen de filas
          leidas y omitidas.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-text-neutral">
            Ultima importacion
          </p>
          <p className="mt-1 text-sm font-medium text-text-strong">
            {latest.fileName || latest.sourceType}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-neutral">
            {formatDateTime(latest.createdAt)}
          </p>
        </div>
        <Badge variant="neutral">{latest.sourceType}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-neutral">
        <span className="rounded-md border border-border bg-surface px-2 py-1">
          Partidas: {readSummaryNumber(latest.summary, "budgetItems")}
        </span>
        <span className="rounded-md border border-border bg-surface px-2 py-1">
          Costes validos: {readSummaryNumber(latest.summary, "valid")}
        </span>
        <span className="rounded-md border border-border bg-surface px-2 py-1">
          Omitidas: {readSummaryNumber(latest.summary, "errors")}
        </span>
        {catalogStats.latestSource ? (
          <span className="rounded-md border border-border bg-surface px-2 py-1">
            Ultima fila: {catalogStats.latestSource.sheet}{" "}
            {catalogStats.latestSource.row}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

function PriceItemEditor({ item }: { item: PriceItemListItem }) {
  return (
    <Card className={!item.isActive ? "opacity-75" : ""} padding="sm">
      <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_110px] xl:items-start">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.isActive ? "success" : "neutral"}>
              {item.isActive ? "Activo" : "Inactivo"}
            </Badge>
            <span className="text-xs text-text-neutral">
              {formatCurrency(item.price)} / {item.unit}
            </span>
          </div>

          <p className="break-all font-mono text-xs leading-5 text-text-neutral">
            {item.itemKey}
          </p>
          <p className="text-xs text-text-neutral">
            Actualizado: {formatDateTime(item.updatedAt)}
          </p>
        </div>

        <form
          action={updatePriceItemAction}
          className="grid gap-2 md:grid-cols-[140px_140px_minmax(220px,1fr)_140px_100px_80px] xl:items-end"
        >
          <input name="priceItemId" type="hidden" value={item.id} />

          <div className="space-y-1">
            <FieldLabel>Familia</FieldLabel>
            <Input
              defaultValue={item.family}
              inputSize="sm"
              name="family"
              required
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Subfamilia</FieldLabel>
            <Input
              defaultValue={inputValue(item.subfamily)}
              inputSize="sm"
              name="subfamily"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Descripcion</FieldLabel>
            <Input
              defaultValue={item.description}
              inputSize="sm"
              name="description"
              required
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Proveedor</FieldLabel>
            <Input
              defaultValue={inputValue(item.provider)}
              inputSize="sm"
              name="provider"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Precio</FieldLabel>
            <Input
              defaultValue={numberInputValue(item.price)}
              inputMode="decimal"
              inputSize="sm"
              min="0"
              name="price"
              required
              step="0.01"
              type="number"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel>Unidad</FieldLabel>
            <Input
              defaultValue={item.unit}
              inputSize="sm"
              name="unit"
              required
            />
          </div>

          <div className="grid gap-2 md:col-span-6 md:grid-cols-[100px_100px_100px_auto] md:items-end">
            <div className="space-y-1">
              <FieldLabel>X mm</FieldLabel>
              <Input
                defaultValue={numberInputValue(item.xMm)}
                inputMode="decimal"
                inputSize="sm"
                name="xMm"
                step="0.01"
                type="number"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel>Y mm</FieldLabel>
              <Input
                defaultValue={numberInputValue(item.yMm)}
                inputMode="decimal"
                inputSize="sm"
                name="yMm"
                step="0.01"
                type="number"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel>Grosor</FieldLabel>
              <Input
                defaultValue={numberInputValue(item.thicknessMm)}
                inputMode="decimal"
                inputSize="sm"
                name="thicknessMm"
                step="0.01"
                type="number"
              />
            </div>

            <Button size="sm" type="submit" variant="neutral">
              Guardar
            </Button>
          </div>
        </form>

        <form action={setPriceItemActiveAction} className="xl:pt-6">
          <input name="priceItemId" type="hidden" value={item.id} />
          <input name="active" type="hidden" value={item.isActive ? "0" : "1"} />
          <Button
            fullWidth
            size="sm"
            type="submit"
            variant={item.isActive ? "outline" : "secondary"}
          >
            {item.isActive ? "Desactivar" : "Reactivar"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default async function PricesPage({ searchParams }: PageProps) {
  const actor = await getInternalUserContext();

  if (!actor) {
    redirect("/login");
  }

  if (actor.role !== OWNER_ROLE) {
    return <OwnerOnlyBlock />;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = resolvedSearchParams?.q?.trim() || "";
  const activeFilter = resolvedSearchParams?.active?.trim() || "active";
  const where = buildWhere(actor.companyId, q, activeFilter);

  const [priceItems, catalogItems, allPriceItems, lastImports] =
    await prisma.$transaction([
      prisma.catalogPriceItem.findMany({
        where,
        select: {
          id: true,
          itemKey: true,
          family: true,
          subfamily: true,
          description: true,
          xMm: true,
          yMm: true,
          thicknessMm: true,
          unit: true,
          price: true,
          provider: true,
          isActive: true,
          updatedAt: true,
        },
        orderBy: [
          { isActive: "desc" },
          { family: "asc" },
          { subfamily: "asc" },
          { description: "asc" },
        ],
        take: LIST_LIMIT,
      }),
      prisma.catalogItem.findMany({
        where: {
          companyId: actor.companyId,
        },
        select: {
          companyId: true,
          family: true,
          isActive: true,
          itemName: true,
          material: true,
          sourceRow: true,
          sourceSheet: true,
          unitPriceBase: true,
        },
      }),
      prisma.catalogPriceItem.findMany({
        where: {
          companyId: actor.companyId,
        },
        select: {
          companyId: true,
          description: true,
          family: true,
          isActive: true,
          price: true,
          sourceRow: true,
          sourceSheet: true,
        },
      }),
      prisma.catalogPriceImportBatch.findMany({
        where: {
          companyId: actor.companyId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
        select: {
          id: true,
          fileName: true,
          sourceType: true,
          summary: true,
          createdAt: true,
        },
      }),
    ]);
  const catalogStats = getCatalogStats(catalogItems, actor.companyId);
  const priceStats = getCatalogPriceStats(allPriceItems, actor.companyId);
  const reviewCount = catalogStats.reviewItems + priceStats.reviewPriceItems;

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8">
        <SectionHeader
          eyebrow="Owner"
          title="Excel, precios y catalogo"
          description="El Excel nuevo es la fuente de verdad: importa costes, partidas de presupuesto, formulas y celdas referenciadas."
          actions={
            <Link
              className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-card-background px-4 text-sm font-semibold text-text-strong transition hover:border-primary hover:text-primary"
              href="/api/settings/prices/template"
            >
              Descargar plantilla
            </Link>
          }
        />

        {resolvedSearchParams?.notice ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {resolvedSearchParams.notice}
          </div>
        ) : null}

        {resolvedSearchParams?.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {resolvedSearchParams.error}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <StatsCard
            helper="Partidas disponibles para presupuestar."
            label="Partidas activas"
            value={catalogStats.activeItems}
          />
          <StatsCard
            helper="Grupos detectados en PRESUPUESTO."
            label="Familias"
            value={catalogStats.activeFamilies}
          />
          <StatsCard
            helper="Partidas con material asociado."
            label="Con material"
            value={catalogStats.materialItems}
          />
          <StatsCard
            helper="Partidas con precio base mayor que cero."
            label="Precios validos"
            tone={
              catalogStats.activeItems > 0 &&
              catalogStats.validBasePriceItems === catalogStats.activeItems
                ? "success"
                : "neutral"
            }
            value={catalogStats.validBasePriceItems}
          />
          <StatsCard
            helper="Filas de COSTE activas para editar."
            label="Costes editables"
            value={priceStats.activePriceItems}
          />
          <StatsCard
            helper="Partidas o costes con datos incompletos."
            label="A revisar"
            tone={reviewCount > 0 ? "warning" : "success"}
            value={reviewCount}
          />
        </div>

        <CatalogHealthMessage
          catalogStats={catalogStats}
          priceStats={priceStats}
        />

        <ImportSummary catalogStats={catalogStats} lastImports={lastImports} />

        <Card>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-strong">
                Importar Excel maestro
              </h2>
              <p className="mt-1 text-sm leading-5 text-text-neutral">
                Primero previsualiza. El catalogo de partidas se refresca desde
                PRESUPUESTO y los costes desde COSTE.
              </p>
            </div>
            <Badge variant="warning">Excel maestro</Badge>
          </div>

          <PriceImportPanel />
        </Card>

        <Card>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-text-strong">
              Crear precio manual
            </h2>
            <p className="mt-1 text-sm leading-5 text-text-neutral">
              Usa item_key estable. Cambiarlo despues equivale a crear otra
              partida.
            </p>
          </div>

          <form
            action={createPriceItemAction}
            className="grid gap-2 lg:grid-cols-[180px_150px_150px_minmax(220px,1fr)_100px_80px_150px_auto] lg:items-end"
          >
            <div className="space-y-1">
              <FieldLabel htmlFor="new-item-key">item_key</FieldLabel>
              <Input id="new-item-key" name="itemKey" required />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-family">Familia</FieldLabel>
              <Input id="new-family" name="family" required />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-subfamily">Subfamilia</FieldLabel>
              <Input id="new-subfamily" name="subfamily" />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-description">Descripcion</FieldLabel>
              <Input id="new-description" name="description" required />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-price">Precio</FieldLabel>
              <Input
                id="new-price"
                inputMode="decimal"
                min="0"
                name="price"
                required
                step="0.01"
                type="number"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-unit">Unidad</FieldLabel>
              <Input id="new-unit" name="unit" required />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="new-provider">Proveedor</FieldLabel>
              <Input id="new-provider" name="provider" />
            </div>
            <Button type="submit">Crear</Button>
          </form>
        </Card>

        <Card>
          <form
            className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_auto_auto] md:items-end"
            method="get"
          >
            <div className="space-y-1">
              <FieldLabel htmlFor="price-search">Buscar</FieldLabel>
              <Input
                defaultValue={q}
                id="price-search"
                name="q"
                placeholder="item_key, familia, descripcion o proveedor"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor="active-filter">Estado</FieldLabel>
              <select
                className="h-10 w-full rounded-control border border-border bg-card-background px-3 text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                defaultValue={activeFilter}
                id="active-filter"
                name="active"
              >
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="all">Todos</option>
              </select>
            </div>

            <Button type="submit" variant="neutral">
              Buscar
            </Button>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-card-background px-4 text-sm font-semibold text-text-strong transition hover:border-primary hover:text-primary"
              href="/settings/prices"
            >
              Limpiar
            </Link>
          </form>
        </Card>

        <section className="space-y-3" aria-label="Listado de precios">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase text-text-neutral">
              Precios editables
            </h2>
            <Badge variant="neutral">
              {priceItems.length}
              {priceItems.length === LIST_LIMIT ? "+" : ""} resultados
            </Badge>
          </div>

          {priceItems.length === 0 ? (
            <Card>
              {priceStats.totalPriceItems === 0 ? (
                <>
                  <p className="text-sm font-semibold text-text-strong">
                    No hay costes editables importados para esta empresa.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-neutral">
                    Importa el Excel maestro para cargar las filas validas de
                    COSTE. Si ya ves partidas activas arriba, esas vienen de
                    PRESUPUESTO y no sustituyen a los costes editables.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-strong">
                    No hay precios que coincidan con los filtros actuales.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-neutral">
                    Cambia la busqueda o el filtro de estado para revisar otros
                    costes importados.
                  </p>
                </>
              )}
            </Card>
          ) : (
            priceItems.map((item) => (
              <PriceItemEditor item={item} key={item.id} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
