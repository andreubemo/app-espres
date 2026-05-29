# Importacion Excel

## Formatos soportados

El importador actual reconoce tres entradas:

- `PRICE_UPDATE_IMPORT`: plantilla normalizada de la app.
- `COSTE`: hoja del Excel maestro con costes y datos tecnicos.
- Libro maestro ESWood con `PRESUPUESTO` y `COSTE`.

## Comando

```bash
pnpm import:price-workbook -- "C:\Users\Usuario\Desktop\PLANTILLA - Presupuesto ESWood-Alex - V1.3.xlsx"
```

Tambien existe el importador legacy:

```bash
pnpm import:excel
```

## Flujo de la app

1. Owner abre `/settings/prices`.
2. Sube Excel.
3. La app parsea y muestra preview.
4. Preview clasifica filas:
   - nuevas;
   - modificadas;
   - sin cambios;
   - ausentes;
   - con error.
5. El owner confirma.
6. La app aplica cambios por `companyId` e `itemKey`.

## Filas validas

Una fila de coste necesita como minimo:

- `itemKey`;
- `family`;
- `description`;
- `unit`;
- `price` numerico y no negativo.

Una partida de presupuesto necesita identificador estable, familia, nombre y datos suficientes para reconstruir su logica.

## Filas omitidas

Se reportan como error, no deben romper toda la importacion:

- falta `itemKey`;
- falta familia;
- falta descripcion/nombre;
- falta unidad;
- precio invalido;
- duplicado de `itemKey` dentro del archivo.

## Datos guardados

- `CatalogItem`: partidas de `PRESUPUESTO`.
- `CatalogPriceItem`: costes de `COSTE`.
- `ExcelWorkbookCell`: celdas, valores y formulas.
- `CatalogPriceImportBatch`: resumen de importacion.

## Tests

Ejecutar:

```bash
pnpm test
```

Tests relacionados:

- `src/domain/prices/price-import.test.ts`
- `src/domain/rules/pricing.rules.test.ts`
- `src/domain/catalog/catalog-api-presenter.test.ts`
- `src/domain/catalog/catalog-stats.test.ts`

## Limitacion critica

La app ya guarda el modelo del Excel maestro, pero el wizard de presupuesto todavia no usa completamente el motor de formulas para sustituir toda la logica antigua de `unitPriceBase`. No documentar esta parte como cerrada hasta validarla con presupuestos reales.
