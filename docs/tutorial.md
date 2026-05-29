# Tutorial de Uso

## Antes de empezar

Espres App esta pensada para usuarios internos que crean y revisan presupuestos. Cada dato queda asociado a una empresa (`companyId`) y los presupuestos guardan snapshots por version.

## Owner / administrador principal

### Entrar

1. Abre la app.
2. Inicia sesion con tu email y contrasena.
3. Usa el menu superior para ir a presupuestos o crear uno nuevo.

### Gestionar precios/catalogo

1. Abre el menu del usuario.
2. Entra en `Gestionar precios`.
3. Revisa los contadores:
   - `Partidas activas`: partidas disponibles para presupuestar.
   - `Familias`: grupos detectados en la tarifa.
   - `Con material`: partidas con material informado.
   - `Precios validos`: partidas con precio base mayor que cero.
   - `Costes editables`: filas de coste activas.
   - `A revisar`: datos incompletos o precios invalidos.
4. Si los costes editables estan a `0`, importa un Excel maestro o crea precios manuales.
5. Antes de aplicar un Excel, revisa preview y errores.

### Crear presupuesto

1. Entra en `Nuevo presupuesto`.
2. Completa codigo, proyecto, cliente, fecha, dimensiones y complejidad.
3. Anade partidas desde el selector.
4. Revisa total y descuento.
5. Guarda borrador.

### Gestionar presupuesto guardado

Desde listado/detalle puedes:

- abrir detalle;
- editar;
- duplicar;
- marcar como enviado;
- crear nueva version;
- restaurar una version antigua;
- descargar PDF.

Restaurar una version no borra el historial: crea una nueva version desde la anterior.

## Usuario interno / operativo

### Crear presupuesto

1. Entra en `Nuevo presupuesto`.
2. Rellena los datos base.
3. Selecciona partidas.
4. Ajusta cantidades.
5. Revisa el total.
6. Guarda borrador.

### Descartar

El boton `Descartar` esta en la barra inferior. Si hay cambios sin guardar en `Nuevo presupuesto`, la app muestra confirmacion.

Opciones:

- `Guardar borrador`: guarda si hay datos y partidas suficientes.
- `Descartar cambios`: limpia el presupuesto en curso y permite salir.
- `Seguir editando`: cierra el aviso y mantiene todo como estaba.

Si intentas guardar sin partidas, veras un mensaje claro pidiendo anadir al menos una partida.

### Consultar presupuestos

1. Entra en `Presupuestos`.
2. Usa busqueda/filtros.
3. Abre un presupuesto para ver datos, partidas, total e historial.

## Cliente externo

Pendiente: portal de cliente externo. El modelo de sesion reconoce `CLIENT`, pero la app actual no ofrece un flujo completo para cliente final.

## Avisos importantes

- Salir de `Nuevo presupuesto` con datos sin guardar puede perder informacion; la app avisa.
- `Guardar borrador` crea un presupuesto interno, todavia no enviado.
- `Marcar como enviado` cambia el estado operativo y marca la version actual.
- Los presupuestos historicos conservan precios en `BudgetVersion.data`.
- La gestion de precios solo corresponde a `OWNER`.
- La importacion Excel avanzada esta en revision hasta validar formulas completas.
