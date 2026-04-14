# Espres — Sistema de Presupuestos para Carpintería

## Descripción

**Espres** es una aplicación interna diseñada para la gestión de presupuestos en carpintería, enfocada en la creación rápida, controlada y versionada de presupuestos a partir de un catálogo de partidas.

El sistema permite:

* Crear presupuestos de forma guiada
* Construir partidas por familias desde catálogo
* Guardar versiones completas (snapshot JSON)
* Consultar historial de versiones
* Restaurar versiones anteriores
* Gestionar múltiples presupuestos por empresa

---

## Stack tecnológico

* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** Next.js Server Actions
* **ORM:** Prisma
* **Base de datos:** PostgreSQL
* **Autenticación:** NextAuth (Auth.js)
* **Gestión de paquetes:** pnpm

---

## Requisitos

* Node.js 18+
* pnpm instalado
* PostgreSQL en local o remoto

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/andreubemo/app-espres.git
cd app-espres
```

Instalar dependencias:

```bash
pnpm install
```

---

## Variables de entorno

Crear archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/espres"
AUTH_SECRET="tu_secret_seguro"
```

---

## Base de datos (Prisma)

Aplicar migraciones:

```bash
pnpm prisma migrate dev
```

Generar cliente Prisma:

```bash
pnpm prisma generate
```

---

## Seed inicial (opcional)

Crear usuario inicial y empresa:

```bash
pnpm tsx scripts/seed-owner.ts
```

---

## Arranque del proyecto

```bash
pnpm dev
```

Abrir en navegador:

```txt
http://localhost:3000
```

---

## Flujo principal de la aplicación

### 1. Creación de presupuesto

* Introducción de datos base:

  * Código
  * Proyecto
  * Fecha
  * Dimensiones
  * Complejidad

### 2. Selección guiada (wizard)

* Navegación por familias de catálogo
* Selección múltiple de partidas
* Introducción de cantidades
* Construcción incremental del presupuesto

### 3. Revisión final

* Visualización de partidas
* Resumen económico
* Guardado como borrador

---

## Sistema de versionado

Cada presupuesto funciona mediante **snapshots completos (JSON)**:

* Cada guardado crea una nueva versión
* Las versiones contienen:

  * Datos base
  * Dimensiones
  * Partidas
  * Totales
* Permite:

  * Ver versiones históricas (modo solo lectura)
  * Restaurar versiones como nuevas versiones

---

## Estructura del proyecto

```txt
src/
  app/
    (dashboard)/
      budgets/
        [id]/        → detalle de presupuesto
        new/         → creación de presupuesto
        page.tsx     → listado

  ui/
    budgets/        → componentes específicos de presupuestos
    common/         → componentes reutilizables (Modal, etc.)
    layout/         → header, navegación, shell

  domain/
    budgets/        → lógica de negocio (modelos y servicios)

  lib/
    prisma.ts       → cliente Prisma
    auth.ts         → configuración NextAuth

prisma/
  schema.prisma     → modelo de datos

scripts/
  seed-owner.ts     → seed inicial

resources/
  imports/          → archivos Excel de catálogo/precios
```

---

## Scripts útiles

```bash
pnpm dev              # entorno de desarrollo
pnpm build            # build de producción
pnpm start            # ejecutar build
pnpm prisma studio    # GUI base de datos
```

---

## Importación de catálogo

Los datos de catálogo pueden provenir de archivos Excel ubicados en:

```txt
resources/imports/
```

Estos archivos se procesan para alimentar el modelo `CatalogItem`.

---

## Flujo de trabajo con ramas

Convención recomendada:

```txt
main                → producción
feature/*           → nuevas funcionalidades
fix/*               → correcciones
```

Ejemplo:

```bash
git checkout -b feature/budget-ui
```

Merge:

```bash
git checkout main
git pull origin main
git merge feature/budget-ui
git push origin main
```

---

## Roadmap (próximas mejoras)

* Sistema de papelera (soft delete)
* Filtros avanzados de búsqueda
* Sistema de permisos (roles)
* Header global con usuario y sesión
* Design system consolidado
* Multiempresa (SaaS)

---

## Autor

Proyecto desarrollado por **Andreu Benítez Moreno**
Carpintería + desarrollo de software aplicado al negocio real

---
