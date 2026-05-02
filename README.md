# Espres

## Espanol

Espres es una aplicacion web interna para crear, editar, versionar y descargar presupuestos de stands, carpinteria y montaje. Esta pensada para trabajar rapido en oficina y en movil: el usuario define la base del presupuesto, selecciona partidas desde un catalogo, ajusta cantidades, guarda versiones y genera un PDF con una maquetacion cercana a la vista web.

La aplicacion esta orientada a empresas: cada presupuesto pertenece a una empresa, esta vinculado siempre a un cliente y queda asociado automaticamente al usuario interno que lo crea. Esto permite a perfiles `OWNER` o `ADMIN` saber quien es responsable de cada presupuesto.

### Estado actual

- Rama de trabajo principal para estos cambios: `feature/design-system`.
- Rama de produccion prevista: `main`.
- Deploy previsto: Vercel, con despliegue automatico cuando se actualice `main`.
- Base de datos: PostgreSQL, compatible con Supabase si se proporciona `DATABASE_URL` y `DIRECT_URL`.
- Autenticacion: NextAuth con credenciales y sesiones JWT.

### Stack

- Next.js 16 App Router.
- React 19.
- Tailwind CSS 4.
- Prisma 6.7.
- PostgreSQL.
- NextAuth 4.
- pnpm.
- `pdfkit` para exportacion PDF.
- `lucide-react` para iconos de interfaz.
- `xlsx` para importaciones desde Excel.

### Funcionalidades principales

- Login con credenciales para usuarios internos y clientes.
- Roles internos: `OWNER`, `ADMIN`, `WORKER`.
- Gestion de usuarios internos desde ajustes.
- Gestion de clientes.
- Gestion de materiales.
- Catalogo de partidas importable desde Excel.
- Listado de presupuestos con busqueda, filtros y acciones rapidas.
- Creacion guiada de presupuestos.
- Seleccion de partidas por familias mediante modal tipo app mobile.
- Edicion de presupuestos existentes.
- Versionado automatico al guardar cambios reales.
- Historial de versiones con vista historica en modo solo lectura.
- Restauracion de versiones historicas como nueva version.
- Duplicado de presupuestos.
- Marcado de presupuesto como enviado.
- Eliminacion real de presupuestos y sus versiones.
- Compartir enlace del presupuesto.
- Descarga de presupuesto en PDF.
- Indicacion visual del presupuesto recien creado.

### Flujo de presupuestos

1. El usuario crea un nuevo presupuesto desde `/budgets/new`.
2. Selecciona o crea un cliente.
3. Define datos base:
   - codigo,
   - proyecto,
   - fecha,
   - dimensiones,
   - complejidad.
4. El sistema calcula superficie y perimetro.
5. El usuario abre el selector de partidas.
6. Selecciona partidas por familia, con cantidades editables.
7. Revisa las lineas y el resumen economico.
8. Guarda el borrador.
9. El presupuesto aparece en `/budgets` con destello sutil en color corporativo.

### Edicion y versionado

Desde el menu de acciones de cada presupuesto, tambien llamado menu de acciones, overflow menu o kebab menu, la accion `Editar` abre `/budgets/[id]/edit`.

En la pagina de edicion se puede:

- cambiar datos base,
- cambiar cliente,
- cambiar dimensiones,
- cambiar complejidad,
- editar cantidades,
- eliminar partidas,
- abrir el selector para anadir mas partidas.

La version solo sube cuando se guardan cambios reales. Si no hay cambios en datos o partidas, no se crea una version nueva. Esto evita historiales inflados y mantiene trazabilidad limpia.

### Selector de partidas

El selector de partidas esta optimizado para movil:

- header compacto con familia, progreso y subtotal,
- lista de familias horizontal en mobile,
- tarjetas densas y tactiles,
- input de cantidad listo para escribir,
- barra inferior con iconos para anterior, siguiente, anadir y aceptar,
- soporte para ver partidas ya incluidas al reabrir la modal,
- evita duplicar partidas ya existentes.

En edicion, las partidas ya incluidas aparecen marcadas como `Ya incluida` y se pueden ajustar sus cantidades desde la propia modal.

### PDF

La descarga usa la ruta:

```txt
/api/budgets/[id]/download
```

Genera un PDF en servidor con:

- cabecera de marca,
- estado,
- cliente,
- responsable,
- fecha,
- version,
- datos del presupuesto,
- resumen economico,
- tabla de partidas.

### Datos y modelo mental

El presupuesto se guarda mediante snapshots JSON en `BudgetVersion`. Cada version conserva una fotografia completa de:

- datos base,
- cliente,
- dimensiones,
- complejidad,
- partidas,
- cantidades,
- precios,
- totales.

Esto permite que los cambios futuros del catalogo no rompan presupuestos antiguos.

### Rutas principales

```txt
/login
/budgets
/budgets/new
/budgets/[id]
/budgets/[id]/edit
/clients
/materials
/settings/users
/api/catalog
/api/budgets/[id]/download
```

### Estructura relevante

```txt
src/
  app/
    (dashboard)/
      budgets/
        page.tsx
        new/page.tsx
        [id]/page.tsx
        [id]/edit/page.tsx
    actions/
      budgets.ts
    api/
      catalog/route.ts
      budgets/[id]/download/route.ts
  domain/
    budgets/
      budget.model.ts
      budget.service.ts
    rules/
      pricing.rules.ts
  lib/
    auth.ts
    access-control.ts
    prisma.ts
  server/
    services/
      client.service.ts
      material.service.ts
  ui/
    budgets/
    common/
    layout/
    primitives/
prisma/
  schema.prisma
scripts/
  seed-owner.ts
  create-user.ts
  import-catalog-from-excel.ts
resources/
  imports/
```

### Scripts

```bash
pnpm dev
pnpm install
pnpm build
pnpm lint
pnpm prisma:generate
pnpm import:excel
```

Notas:

- `pnpm build` ejecuta `prisma generate` antes del build.
- En Windows puede ser necesario cerrar el dev server antes del build si Prisma no puede reemplazar `query_engine-windows.dll.node`.
- `pnpm lint` ignora `src/generated/prisma/**` porque es codigo generado.

### Variables de entorno

No se deben commitear secretos. En local se usan variables en `.env.local` o `.env`. En Vercel deben configurarse en el proyecto.

Variables esperadas:

```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
```

En desarrollo local, `NEXTAUTH_URL` debe apuntar normalmente a:

```txt
http://localhost:3000
```

### Supabase

Si PostgreSQL esta en Supabase:

- Copiar `DATABASE_URL` desde Supabase.
- Copiar `DIRECT_URL` si Prisma lo requiere para conexion directa.
- Verificar que las variables estan tambien en Vercel para produccion.
- No pegar secretos en commits, issues o documentacion publica.

### Rendimiento

Optimizaciones actuales:

- Server Components para paginas de datos principales.
- Client Components solo donde hay interaccion real.
- Selector de partidas cargado con `dynamic import` en nuevo presupuesto y edicion.
- Queries Prisma con `select` para traer solo campos usados.
- `/api/catalog` devuelve solo columnas necesarias para la modal.
- Servicios de clientes y materiales evitan devolver campos innecesarios.
- PDF generado bajo demanda en ruta API, separado del bundle de cliente.
- Iconos de `lucide-react` importados por componente.

### Validacion antes de deploy

Antes de mergear a `main`:

```bash
pnpm install
pnpm lint
pnpm build
```

Checklist manual recomendado:

- login,
- listado de presupuestos,
- crear presupuesto,
- seleccionar cliente,
- anadir partidas,
- editar presupuesto,
- anadir mas partidas desde edicion,
- guardar cambios y verificar version nueva,
- comprobar que no se crea version sin cambios,
- descargar PDF,
- borrar presupuesto de prueba si procede.

### Git y despliegue

Flujo recomendado:

```bash
git checkout feature/design-system
pnpm lint
pnpm build
git push origin feature/design-system
git checkout main
git pull origin main
git merge feature/design-system
git push origin main
```

Al hacer push a `main`, Vercel deberia desplegar produccion automaticamente.

---

## English

Espres is an internal web application for creating, editing, versioning and downloading stand, carpentry and installation budgets. It is designed for fast office and mobile use: users define the budget base, select line items from a catalog, adjust quantities, save versions and generate a PDF with a layout close to the web view.

The app is company-oriented: each budget belongs to a company, is always linked to a client and is automatically associated with the internal user who created it. This helps `OWNER` and `ADMIN` users know who is responsible for every budget.

### Current Status

- Main working branch for these changes: `feature/design-system`.
- Production branch: `main`.
- Expected deploy target: Vercel, with automatic deployment when `main` is updated.
- Database: PostgreSQL, Supabase-compatible when `DATABASE_URL` and `DIRECT_URL` are provided.
- Authentication: NextAuth credentials provider with JWT sessions.

### Stack

- Next.js 16 App Router.
- React 19.
- Tailwind CSS 4.
- Prisma 6.7.
- PostgreSQL.
- NextAuth 4.
- pnpm.
- `pdfkit` for PDF export.
- `lucide-react` for UI icons.
- `xlsx` for Excel imports.

### Main Features

- Credentials login for internal users and clients.
- Internal roles: `OWNER`, `ADMIN`, `WORKER`.
- Internal user management.
- Client management.
- Material management.
- Catalog import from Excel.
- Budget list with search, filters and quick actions.
- Guided budget creation.
- Family-based item selection through a mobile-style modal.
- Existing budget editing.
- Automatic versioning only when real changes are saved.
- Version history with historical read-only view.
- Restore historical versions as a new version.
- Duplicate budgets.
- Mark budgets as sent.
- Real budget deletion with associated versions.
- Share budget links.
- Download budgets as PDF.
- Visual highlight for newly created budgets.

### Budget Flow

1. The user creates a new budget from `/budgets/new`.
2. The user selects or creates a client.
3. The user defines base data:
   - code,
   - project,
   - date,
   - dimensions,
   - complexity.
4. The system calculates surface and perimeter.
5. The user opens the item selector.
6. The user selects catalog items by family, with editable quantities.
7. The user reviews lines and totals.
8. The draft is saved.
9. The new budget appears in `/budgets` with a subtle corporate orange flash.

### Editing and Versioning

From each budget action menu, also known as an overflow menu or kebab menu, `Edit` opens `/budgets/[id]/edit`.

The edit page allows users to:

- change base data,
- change client,
- change dimensions,
- change complexity,
- edit quantities,
- remove lines,
- reopen the selector to add more items.

The version number only increases when real changes are saved. If there are no changes in budget info or lines, no new version is created. This keeps the version history clean and useful.

### Item Selector

The item selector is optimized for mobile:

- compact header with family, progress and subtotal,
- horizontal family list on mobile,
- dense touch-friendly cards,
- quantity input ready for typing,
- bottom icon bar for previous, next, add and accept,
- existing lines are visible when reopening the modal,
- existing lines are not duplicated.

In edit mode, already included lines are marked as `Ya incluida` and their quantities can be adjusted inside the modal.

### PDF

The download endpoint is:

```txt
/api/budgets/[id]/download
```

It generates a server-side PDF with:

- brand header,
- status,
- client,
- responsible user,
- date,
- version,
- budget data,
- economic summary,
- item table.

### Data Model

Budgets are stored as full JSON snapshots in `BudgetVersion`. Each version stores:

- base data,
- client,
- dimensions,
- complexity,
- lines,
- quantities,
- prices,
- totals.

This keeps old budgets stable even if the catalog changes later.

### Main Routes

```txt
/login
/budgets
/budgets/new
/budgets/[id]
/budgets/[id]/edit
/clients
/materials
/settings/users
/api/catalog
/api/budgets/[id]/download
```

### Relevant Structure

```txt
src/
  app/
    (dashboard)/
      budgets/
        page.tsx
        new/page.tsx
        [id]/page.tsx
        [id]/edit/page.tsx
    actions/
      budgets.ts
    api/
      catalog/route.ts
      budgets/[id]/download/route.ts
  domain/
    budgets/
      budget.model.ts
      budget.service.ts
    rules/
      pricing.rules.ts
  lib/
    auth.ts
    access-control.ts
    prisma.ts
  server/
    services/
      client.service.ts
      material.service.ts
  ui/
    budgets/
    common/
    layout/
    primitives/
prisma/
  schema.prisma
scripts/
  seed-owner.ts
  create-user.ts
  import-catalog-from-excel.ts
resources/
  imports/
```

### Scripts

```bash
pnpm dev
pnpm install
pnpm build
pnpm lint
pnpm prisma:generate
pnpm import:excel
```

Notes:

- `pnpm build` runs `prisma generate` before the Next.js build.
- On Windows, the dev server may need to be stopped before building if Prisma cannot replace `query_engine-windows.dll.node`.
- `pnpm lint` ignores `src/generated/prisma/**` because it is generated code.

### Environment Variables

Secrets must never be committed. Local development uses `.env.local` or `.env`. Vercel variables must be configured in the project settings.

Expected variables:

```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
```

For local development, `NEXTAUTH_URL` usually should be:

```txt
http://localhost:3000
```

### Supabase

If PostgreSQL is hosted on Supabase:

- Copy `DATABASE_URL` from Supabase.
- Copy `DIRECT_URL` if Prisma needs a direct connection.
- Make sure the same variables exist in Vercel for production.
- Never paste secrets in commits, issues or public documentation.

### Performance

Current optimizations:

- Server Components for main data pages.
- Client Components only where interaction is required.
- The item selector is loaded with `dynamic import` in new budget and edit flows.
- Prisma queries use `select` to fetch only the fields being rendered.
- `/api/catalog` returns only the columns required by the selector modal.
- Client and material services avoid returning unused fields.
- PDF generation runs on demand in an API route, outside the client bundle.
- `lucide-react` icons are imported per component.

### Pre-Deploy Validation

Before merging to `main`:

```bash
pnpm install
pnpm lint
pnpm build
```

Recommended manual checklist:

- login,
- budget list,
- create budget,
- select client,
- add items,
- edit budget,
- add more items from edit mode,
- save changes and verify the new version,
- confirm no version is created without changes,
- download PDF,
- delete test budget if needed.

### Git and Deployment

Recommended flow:

```bash
git checkout feature/design-system
pnpm lint
pnpm build
git push origin feature/design-system
git checkout main
git pull origin main
git merge feature/design-system
git push origin main
```

Pushing to `main` should trigger the production deployment on Vercel automatically.
