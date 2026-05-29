# Presupuestos

## Flujo principal

1. El usuario interno entra en `/budgets/new`.
2. Completa datos base: codigo, proyecto, cliente, fecha, dimensiones, complejidad, descuento permitido y notas.
3. Abre el selector guiado de partidas.
4. Selecciona partidas por familia y ajusta cantidades.
5. Revisa total y guarda borrador.
6. La app crea `Budget` y `BudgetVersion` version `1`.

## Snapshot JSON

Cada `BudgetVersion.data` guarda una fotografia del presupuesto:

- codigo;
- proyecto;
- cliente;
- fecha;
- complejidad;
- notas;
- descuento;
- dimensiones;
- lineas;
- cantidades;
- precios;
- subtotales y total.

Esto evita que los cambios futuros del catalogo alteren presupuestos historicos.

## Acciones existentes

Implementadas en `src/app/actions/budgets.ts`:

- `getBudgetFormContext`
- `createBudgetClient`
- `saveBudgetDraft`
- `updateBudgetDraft`
- `markBudgetAsSent`
- `createBudgetVersionFromLatest`
- `duplicateBudgetDraft`
- `deleteBudget`
- `restoreBudgetVersionAsLatest`

Todas usan contexto interno y filtran por `companyId` cuando acceden a presupuestos o clientes.

## Versionado

Editar un presupuesto crea una nueva version si el snapshot cambia. Si no hay cambios reales, la accion devuelve `unchanged` y evita inflar el historial.

Restaurar una version antigua no borra ni pisa nada: crea una nueva version desde el snapshot historico.

## Descuentos por rol

La politica esta en `src/lib/budget-discounts.ts`:

- `OWNER`: rango 0% a 50%.
- `ADMIN`: opciones 3%, 5% o 7%.
- `WORKER`: bloqueado a 0%.

## Cambios sin guardar

`/budgets/new` registra un guard de cambios sin guardar:

- links internos protegidos;
- boton `Descartar`;
- modal con guardar borrador, descartar cambios o seguir editando;
- `beforeunload` para recarga/cierre de pestana.

Limitacion: falta QA browser completa de boton atras y recarga rapida.
