# Price update workflow

## Decision actualizada

El Excel definitivo `PLANTILLA - Presupuesto ESWood-Alex - V1.3.xlsx` no es
equivalente al Excel seguro anterior usado por el importador legacy.

La diferencia critica es que el archivo anterior traia una hoja preparada para
la app (`CATALOGO_IMPORT`) con `item_key`, `family_key`, `item_name` y
`unit_price_base`. El archivo nuevo trae una hoja operativa `COSTE` con costes,
proveedores, dimensiones y extras, pero no trae `item_key` estable ni la forma
final de partidas vendibles de presupuesto.

La decision actual es que el Excel nuevo prevalece sobre la logica antigua de
la app. `PRESUPUESTO` define las partidas vendibles, sus inputs y sus formulas.
`COSTE` define los costes base referenciados por esas formulas.

Por tanto, `CatalogItem` se refresca desde `PRESUPUESTO` y guarda configuracion
de inputs/formulas. `CatalogPriceItem` se usa para editar costes base de
`COSTE`. `ExcelWorkbookCell` guarda celdas y formulas para poder reconstruir el
modelo de calculo del libro.

## Formatos aceptados

La importacion acepta tres formatos:

- `PRICE_UPDATE_IMPORT`: plantilla normalizada de la app. Es el formato
  recomendado porque contiene `item_key` explicito.
- `COSTE`: hoja del Excel definitivo. Se puede previsualizar e importar, pero
  la app tiene que derivar `item_key` desde familia, subfamilia, descripcion,
  dimensiones y unidad. Esto es util para arrancar, pero es menos robusto ante
  cambios de texto.
- Libro completo ESWood: hojas `PRESUPUESTO` y `COSTE`. Es el formato maestro
  desde ahora.

## Reglas de aplicacion

- `item_key` es el identificador estable principal.
- Las partidas de `PRESUPUESTO` refrescan el catalogo completo de partidas.
- Las filas nuevas de `COSTE` se crean.
- Las filas modificadas de `COSTE` se actualizan.
- Las filas sin cambios no se tocan.
- Las filas ausentes se muestran en preview.
- En el libro maestro, las filas de coste con precio vacio se muestran como
  errores y se omiten; no bloquean la importacion de `PRESUPUESTO`.
- Todas las acciones de escritura validan rol `OWNER` en servidor.
- Todas las consultas y escrituras filtran por `companyId`.

## Alcance actual

Esta rama crea una gestion administrativa de precios/costes accesible desde el
menu del usuario OWNER:

- descarga de plantilla Excel compatible;
- subida de Excel con preview;
- resumen de nuevas, modificadas, sin cambios, ausentes y errores;
- aplicacion confirmada;
- edicion directa de precio, unidad, proveedor, descripcion y dimensiones;
- activacion/desactivacion manual.
- persistencia de partidas, formulas y celdas del Excel maestro.

El usuario ha confirmado que el historico actual es de pruebas y se puede
borrar si hace falta. Aun asi, el nuevo modelo mantiene snapshots porque sera
necesario cuando haya presupuestos reales.

## Punto pendiente

La siguiente pieza no debe resolverse con precio unitario simple. Hay que
conectar el wizard de presupuestos a un motor de formulas compatible con el
subconjunto usado en `PRESUPUESTO`:

- referencias de celda (`E6`, `COSTE!$G$24`);
- rangos (`SUM(P6:AQ6)`);
- operadores aritmeticos y porcentajes;
- funciones `SUM`, `MAX`, `MIN`, `ROUNDUP`, `IF`.

Hasta que esa pieza este conectada, mostrar importacion como completa seria
enganoso: la app ya puede guardar el modelo del Excel, pero el flujo de
presupuesto aun debe dejar de depender de `unitPriceBase`.
