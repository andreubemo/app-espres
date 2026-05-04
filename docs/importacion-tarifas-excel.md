# Importacion de tarifas desde Excel

## Contexto

La app Espres usa un catalogo de partidas para construir presupuestos. La idea es poder actualizar tarifas desde un archivo Excel mantenido fuera de la app, sin romper presupuestos existentes ni degradar la experiencia mobile del selector de partidas.

Este documento guarda la decision tecnica y de producto para retomarla cuando exista un Excel actualizado.

## Archivo de referencia creado

Se genero una copia del Excel original en:

`C:\Users\Usuario\Desktop\plantilla-importacion-tarifas-espres.xlsx`

Esa copia conserva las hojas originales y anade una pestana nueva:

`GUIA_IMPORT_APP`

La hoja documenta:

- columnas obligatorias
- columnas opcionales
- mapeo con la app y la base de datos
- reglas de importacion
- checklist previo
- flujo UX recomendado

## Hoja que debe usar la app

La hoja recomendada para importar es:

`CATALOGO_IMPORT`

El importador actual espera las cabeceras en la fila 2 y empieza a leer datos desde la fila 3.

## Columnas obligatorias

Estas columnas son necesarias para que la app pueda importar bien:

- `source_sheet`
- `source_row`
- `family_key`
- `item_key`
- `family`
- `item_name`
- `unit_price_base`

## Campo clave

El campo mas importante es:

`item_key`

Debe funcionar como identificador estable de cada partida. No deberia cambiar si solo cambia el precio, el material visible o una descripcion.

La actualizacion de tarifas debe comparar por `item_key`, no por nombre ni por fila del Excel.

## Modelo recomendado de importacion

La solucion recomendada no es reemplazar todo el catalogo de golpe.

El flujo correcto seria:

1. Subir Excel.
2. Validar columnas y datos.
3. Comparar contra el catalogo actual.
4. Mostrar una vista previa de cambios.
5. Aplicar la tarifa solo tras confirmacion.

La vista previa deberia mostrar:

- partidas nuevas
- partidas modificadas
- cambios de precio
- cambios de unidad
- partidas ausentes respecto al catalogo actual
- errores de datos

## Comportamiento al aplicar

Para un MVP se puede hacer sin cambiar Prisma:

- usar `upsert` sobre `CatalogItem`
- actualizar `unitPriceBase` en partidas existentes
- crear partidas nuevas si aparece un `item_key` nuevo
- no borrar partidas ausentes automaticamente
- desactivar partidas ausentes con `isActive=false` solo si el usuario lo confirma

## Presupuestos historicos

Los presupuestos antiguos no deben cambiar automaticamente cuando se actualiza una tarifa.

La app ya guarda versiones de presupuesto en JSON, asi que los precios usados en una version deben permanecer estables.

Cuando se edite un presupuesto antiguo tras una actualizacion de tarifa, la app deberia ofrecer:

- mantener precios anteriores
- actualizar a tarifa actual con vista previa de diferencias

La opcion por defecto deberia ser mantener precios anteriores.

## Version robusta futura

Para una version comercial mas solida, conviene anadir historial de importaciones y precios.

Tablas candidatas:

- `CatalogImportBatch`
- `CatalogPriceHistory`

`CatalogImportBatch` guardaria:

- archivo
- empresa
- usuario que importa
- fecha
- estado
- resumen de altas, bajas, cambios y errores

`CatalogPriceHistory` guardaria:

- partida
- precio anterior
- precio nuevo
- fecha efectiva
- lote de importacion

Esto permitiria auditoria y rollback.

## Alerta detectada en el Excel actual

En el Excel revisado habia una partida sin precio valido:

- `item_key`: `container_reciclado_feria`
- `item_name`: `Container reciclado Feria`
- `source_row`: `145`
- fila en `CATALOGO_IMPORT`: `103`

Antes de importar en produccion, esa partida debe tener `unit_price_base` numerico o una decision explicita de precio `0`.

## Prioridad UX

La importacion deberia ser una herramienta de administracion, pensada sobre todo para desktop/tablet.

En mobile bastaria con poder ver:

- ultima tarifa aplicada
- estado de importacion
- errores pendientes
- resumen de cambios

No conviene obligar a revisar cientos de filas desde movil.

## Mejoras relacionadas recomendadas

Cuando se retome este tema, las mejoras con mas retorno serian:

1. Buscador en la modal de partidas.
2. Familia virtual de partidas frecuentes.
3. Vista previa de importacion Excel.
4. Historial de tarifas.
5. Repricing controlado de presupuestos antiguos.

## Decision actual

Esperar al Excel actualizado de la semana que viene antes de implementar la importacion definitiva.

Mientras tanto, queda acordado que la solucion deseada es:

- plantilla Excel estable
- importacion con preview
- aplicacion segura por `item_key`
- presupuestos historicos intactos
- posible historial de tarifas en una fase posterior
