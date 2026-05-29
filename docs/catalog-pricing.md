# Catalogo y Gestion de Precios

## Modelos

### CatalogItem

Representa partidas vendibles para el wizard de presupuestos. Se usa en `/api/catalog`.

Campos relevantes:

- `companyId`
- `sourceSheet`
- `sourceRow`
- `familyKey`
- `itemKey`
- `family`
- `subfamily`
- `material`
- `itemName`
- `measureUnit`
- `unitPriceBase`
- `inputConfig`
- `formulaConfig`
- `componentConfig`
- `defaultValues`
- `isActive`

`itemKey` es el identificador estable por empresa: `@@unique([companyId, itemKey])`.

### CatalogPriceItem

Representa costes/precios editables importados desde la hoja `COSTE` o creados manualmente en Gestionar precios.

Campos relevantes:

- `companyId`
- `sourceSheet`
- `sourceRow`
- `itemKey`
- `family`
- `subfamily`
- `description`
- `xMm`, `yMm`, `thicknessMm`
- `unit`
- `price`
- `provider`
- `boardPrice`
- `isActive`

## Pantalla Gestionar precios

Ruta: `/settings/prices`.

Acceso:

- Solo `OWNER`.
- La UI oculta el enlace a otros roles.
- La pagina y server actions validan permisos en servidor.

## Contadores

Los contadores superiores distinguen entre catalogo de presupuesto y costes editables:

- `Partidas activas`: `CatalogItem` activo por `companyId`.
- `Familias`: familias activas unicas en `CatalogItem`.
- `Con material`: partidas activas con `material`.
- `Precios validos`: partidas activas con `unitPriceBase > 0`.
- `Costes editables`: `CatalogPriceItem` activo.
- `A revisar`: partidas/costes activos con familia, descripcion/nombre o precio incompleto.

Si `Costes editables` vale `0` pero hay `Partidas activas`, no significa que el catalogo este roto: significa que hay catalogo de presupuesto pero todavia no hay costes de `COSTE` aplicados.

## Edicion directa

El owner puede:

- crear precio manual;
- editar familia, subfamilia, descripcion, proveedor, precio, unidad y dimensiones;
- activar/desactivar un coste;
- descargar plantilla;
- importar Excel con preview.

## Estado actual

Implementado:

- pantalla owner;
- contadores claros;
- importacion con preview;
- edicion directa;
- filtrado por `companyId`;
- tests de stats.

Pendiente:

- validacion en preview Vercel;
- importacion definitiva en entorno controlado;
- conectar formulas del Excel maestro al calculo final de presupuesto.
