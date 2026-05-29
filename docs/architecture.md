# Arquitectura

## Vision general

Espres App usa Next.js App Router con Server Components por defecto. Las paginas de datos consultan Prisma en servidor y los Client Components quedan reservados para formularios, menus, wizard de presupuesto, selector de partidas y dialogos.

## Capas

```txt
src/app
  Rutas, layouts, route handlers y server actions.

src/domain
  Logica pura y testeable: reglas de precios, catalogo, importacion Excel y stats.

src/lib
  Integracion transversal: auth, Prisma, access-control, descuentos.

src/server
  Servicios server-side de entidades simples.

src/ui
  Componentes visuales reutilizables.

prisma
  Modelo de datos y migraciones.

scripts
  Importadores y utilidades de mantenimiento.
```

## Datos principales

- `Company`: raiz multiempresa.
- `User`: usuario interno con rol `OWNER`, `ADMIN` o `WORKER`.
- `Client`: cliente asociado a empresa. Existe auth de cliente, pero no portal completo.
- `CatalogItem`: partida vendible para presupuestos.
- `CatalogPriceItem`: coste/precio editable importado desde `COSTE`.
- `CatalogPriceImportBatch`: historial de importaciones de precios.
- `ExcelWorkbookCell`: celdas/formulas del Excel maestro.
- `Budget`: cabecera del presupuesto.
- `BudgetVersion`: snapshot JSON versionado.

## Auth y permisos

La app usa `next-auth@4.24.13` con Credentials Provider y sesiones JWT. La funcion central de contexto es `getInternalUserContext()` en `src/lib/access-control.ts`.

El control multiempresa se basa en `session.user.companyId` y en filtros Prisma con `companyId`.

## Rutas principales

- `/login`
- `/budgets`
- `/budgets/new`
- `/budgets/[id]`
- `/budgets/[id]/edit`
- `/clients`
- `/materials`
- `/settings/users`
- `/settings/prices`
- `/api/catalog`
- `/api/settings/prices/template`
- `/api/budgets/[id]/download`

## Rendimiento

La arquitectura intenta mantener consultas en servidor y componentes interactivos aislados. Se han anadido `loading.tsx` para mejorar la percepcion de carga en rutas con datos.

Riesgos pendientes:

- `/budgets` no tiene paginacion.
- `/settings/prices` calcula stats leyendo listas completas de catalogo/precios de la empresa.
- `/budgets/[id]` carga todas las versiones con `data` para construir historial y vista seleccionada.
