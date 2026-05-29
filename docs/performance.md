# Performance

Fecha de revision: 2026-05-29
Rama: `feature/price-update-workflow`

## Alcance revisado

Rutas:

- `/budgets`
- `/budgets/new`
- `/budgets/[id]`
- `/budgets/[id]/edit`
- `/clients`
- `/materials`
- `/settings/prices`
- `/api/catalog`

## Tipo de revision

Revision estatica de codigo + build local. No se hizo medicion completa con navegador/Playwright ni preview Vercel en esta tarea.

## Verificacion ejecutada

```bash
corepack pnpm install --frozen-lockfile --config.confirmModulesPurge=false
corepack pnpm run prisma:generate
corepack pnpm test
corepack pnpm lint
corepack pnpm build
```

Resultado:

- instalacion correcta tras parar el dev server local que bloqueaba el engine de Prisma en Windows;
- Prisma Client generado;
- tests: 4 archivos, 12 tests pasados;
- lint correcto;
- build correcto con Next.js 16.1.6.

Aviso no bloqueante: pnpm sigue mostrando `EPERM` al leer la config global de pnpm en `AppData`, pero no afecta al lint/build.

## Observaciones

### Puntos correctos

- Las paginas principales son Server Components.
- Las queries filtran por `companyId`.
- Varias queries usan `select` en lugar de traer modelos completos.
- El selector de partidas se carga con `dynamic import`.
- `/api/catalog` devuelve solo datos necesarios para el wizard.
- Los calculos de stats/catalogo estan extraidos a funciones puras testeables.

### Riesgos detectados

- `/budgets` no pagina resultados; si la empresa acumula muchos presupuestos, la navegacion puede degradarse.
- `/settings/prices` carga listas completas de `CatalogItem` y `CatalogPriceItem` para calcular contadores. Es correcto para volumen actual, pero deberia evolucionar a agregaciones SQL si crece.
- `/budgets/[id]` carga todas las versiones con `data`; necesario para historial actual, pero pesado si un presupuesto acumula muchas versiones grandes.
- `/clients` y `/materials` no tienen paginacion.
- No hay medicion de Web Vitals o tracing en Vercel validada.

## Mejoras aplicadas

- Se anadio `src/ui/common/RouteLoading.tsx`.
- Se anadio `src/app/(dashboard)/loading.tsx`.
- Se anadio `src/app/clients/loading.tsx`.
- Se anadio `src/app/materials/loading.tsx`.
- Se actualizo `/tutorial` para explicar flujos por rol sin meter logica client innecesaria.

Esto no reduce el tiempo real de consulta, pero mejora la percepcion de navegacion interna cuando una ruta server tarda en resolver datos.

## Mejoras pendientes recomendadas

1. Paginacion en `/budgets`.
2. Paginacion o virtualizacion en Gestionar precios.
3. Contadores de precios mediante `count`, `groupBy` o SQL agregado en vez de leer todo el catalogo.
4. Separar en `/budgets/[id]` la version actual de la lista historica para no cargar todos los snapshots completos si no hace falta.
5. Medir navegacion real con Playwright o navegador y usuarios de prueba.
6. Validar preview Vercel y logs runtime antes de produccion.

## Como comprobar localmente

```bash
pnpm dev
```

Luego revisar manualmente:

- login;
- `/budgets`;
- `/budgets/new`;
- abrir selector de partidas;
- `/settings/prices`;
- busqueda/filtro en precios;
- `/clients`;
- `/materials`.

Validacion tecnica:

```bash
pnpm test
pnpm lint
pnpm build
```
