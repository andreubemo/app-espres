# Espres App

Espres App es una aplicacion interna para crear y gestionar presupuestos de carpinteria, stands y montaje. Trabaja con catalogo importado desde Excel, presupuestos versionados y control multiempresa por `companyId`.

El modelo principal guarda cada presupuesto como `Budget` y cada version como snapshot JSON en `BudgetVersion.data`. Esto permite conservar precios, partidas, cantidades y totales historicos aunque el catalogo cambie despues.

## Estado Actual

- Rama de trabajo actual: `feature/price-update-workflow`.
- Rama de produccion: `main`.
- Deploy previsto: Vercel, sin deploy automatico desde esta tarea.
- Estado de la rama: funcional en local con tests, lint y build verdes.
- Gestion de precios/Excel: implementada parcialmente. Ya existe pantalla owner, preview/importacion y modelos nuevos, pero falta validar preview Vercel y conectar toda la logica de formulas del Excel maestro al wizard de presupuestos.
- Auth real del repo: `next-auth@4.24.13`. La migracion a NextAuth v5 esta pendiente; no esta implementada en esta rama.

## Stack

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Prisma 6.7.
- PostgreSQL compatible con Supabase.
- NextAuth/Auth.js: implementado con NextAuth v4; NextAuth v5 pendiente.
- Vercel como objetivo de despliegue.
- pnpm.
- Vitest para tests unitarios.
- `xlsx` para lectura/importacion de Excel.
- `pdfkit` para descarga PDF de presupuestos.
- `lucide-react` para iconos.

## Funcionalidades

Implementado:

- Login con credenciales.
- Sesiones JWT con usuario interno o cliente.
- Multiempresa mediante `companyId`.
- Roles internos `OWNER`, `ADMIN`, `WORKER`.
- Gestion de usuarios internos para `OWNER` y `ADMIN`.
- Gestion de clientes.
- Gestion de materiales.
- Gestion de presupuestos.
- Nuevo presupuesto en flujo guiado.
- Selector de partidas desde catalogo.
- Guardado como borrador.
- `Budget` + `BudgetVersion.data` como snapshot JSON.
- Listado de presupuestos.
- Detalle de presupuesto.
- Edicion de presupuesto y versionado.
- Historial de versiones.
- Restaurar versiones antiguas creando una version nueva.
- Duplicar presupuesto.
- Marcar presupuesto como enviado.
- Descargar PDF.
- Boton `Descartar`.
- Aviso de cambios sin guardar en `/budgets/new`.
- Gestion de precios/catalogo accesible para `OWNER`.
- Contadores superiores en Gestionar precios.
- Importacion/validacion Excel con preview.
- Tests unitarios para reglas de precio, importador Excel, catalog API y contadores.

Parcial / en revision:

- Importacion definitiva del Excel maestro en produccion.
- Uso completo de formulas Excel dentro del wizard de presupuestos.
- QA browser completa de boton atras, recarga y navegacion rapida con cambios sin guardar.
- Portal de cliente externo. El modelo auth reconoce `CLIENT`, pero no hay flujo completo.
- Migracion a NextAuth v5.

## Instalacion Local

Requisitos:

- Node.js compatible con Next.js 16.
- pnpm mediante Corepack.
- PostgreSQL/Supabase accesible.

Pasos:

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma migrate dev
pnpm dev
```

En Windows, si Prisma no puede reemplazar `query_engine-windows.dll.node`, cierra el servidor `pnpm dev` y repite el comando.

## Variables de Entorno

No se deben commitear secretos. Usa `.env` o `.env.local` en desarrollo y configura las mismas variables en Vercel.

```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
```

`NEXTAUTH_URL` suele ser `http://localhost:3000` en local.

## Scripts Disponibles

Scripts reales de `package.json`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:watch
pnpm prisma:generate
pnpm import:excel
pnpm import:price-workbook
```

Notas:

- `pnpm build` ejecuta `prisma generate` antes del build.
- `pnpm import:excel` es el importador legacy.
- `pnpm import:price-workbook` importa el Excel maestro nuevo.
- Si `pnpm prisma generate` no resuelve el binario local en Windows, usa `pnpm prisma:generate`.

## Flujo de Desarrollo

1. Trabajar en rama feature.
2. No desarrollar directamente sobre `main`.
3. Ejecutar tests:

```bash
pnpm test
```

4. Ejecutar lint:

```bash
pnpm lint
```

5. Ejecutar build:

```bash
pnpm build
```

6. Subir la rama.
7. Abrir PR.
8. Hacer merge solo si pasan tests, lint, build, QA funcional y validacion de entorno.

## Estructura del Proyecto

```txt
src/app
  App Router, paginas, route handlers y server actions.

src/app/actions
  Acciones server-side de presupuestos.

src/domain
  Logica pura de negocio: reglas de precio, catalogo, importacion Excel.

src/lib
  Auth, Prisma, permisos, politicas de descuento y utilidades.

src/server
  Servicios server-side sencillos para clientes/materiales.

src/ui
  Componentes de interfaz reutilizables.

prisma
  Schema, migraciones y seed.

scripts
  Scripts de importacion y creacion de usuarios.

docs
  Documentacion tecnica, tutoriales y handoff.
```

## Documentacion

- `docs/architecture.md`
- `docs/budgets.md`
- `docs/catalog-pricing.md`
- `docs/excel-import.md`
- `docs/roles-and-permissions.md`
- `docs/tutorial.md`
- `docs/performance.md`
- `docs/chatgpt-handoff-latest.md`

## Estado Actual y Pendientes

Estado actual:

- La app compila y pasa tests locales.
- La gestion de presupuestos funciona con snapshots JSON.
- La gestion de precios existe para `OWNER`.
- Los contadores de precios ya distinguen entre `CatalogItem` y `CatalogPriceItem`.
- Hay proteccion contra cambios sin guardar en nuevo presupuesto.
- Hay skeletons de carga para mejorar la percepcion en rutas de datos.

Pendientes proximos:

- Validar preview Vercel y variables de entorno antes de produccion.
- Ejecutar QA browser real de navegacion, modal de descarte y recarga.
- Importar el Excel definitivo en un entorno controlado.
- Conectar formulas del Excel maestro al calculo final del wizard.
- Decidir si se mantiene compatibilidad larga entre `CatalogItem` y `CatalogPriceItem`.
- Migrar a NextAuth v5 si sigue siendo requisito.

## Validacion Recomendada Antes de PR/Merge

```bash
pnpm install
pnpm prisma:generate
pnpm test
pnpm lint
pnpm build
```

No hacer merge a `main` ni desplegar produccion si hay dudas sobre DB, variables de entorno, permisos multiempresa o perdida de datos.
