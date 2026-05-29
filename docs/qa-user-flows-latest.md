# QA de flujos de usuario - Espres App

Fecha: 2026-05-29  
Rama: `feature/price-update-workflow`  
Alcance: QA documental y smoke test local de rutas principales. No sustituye una prueba E2E completa en navegador ni una validacion de preview Vercel.

## Criterio de ejecucion

Se hicieron pruebas locales con sesion owner existente y llamadas HTTP autenticadas. No se crearon usuarios ficticios nuevos ni empresas de prueba en la base compartida para evitar contaminar datos. Los escenarios B, C y D quedan documentados como matriz de QA pendiente de ejecutar en un entorno controlado.

## Resultado smoke real

### Usuario autenticado owner

- Login: correcto.
- `/budgets`: responde 200.
- `/budgets/new`: responde 200.
- `/settings/prices`: responde 200.
- `/api/catalog`: responde 200.
- `/api/settings/prices/template`: responde 200.

### Usuario sin sesion

- `/settings/prices`: redirige a `/login?callbackUrl=%2Fsettings%2Fprices`.
- `/api/settings/prices/template`: responde 401.
- `/api/catalog`: responde 401.

## Usuario A - Administrador/owner

Perfil: usuario interno con permisos completos. Quiere importar/revisar precios y crear presupuestos.

### Pruebas

- Login: ejecutado en smoke test, correcto.
- Acceso al menu principal: ruta autenticada verificada indirectamente.
- Entrar en Gestionar precios: ejecutado, `/settings/prices` responde 200.
- Ver si los contadores tienen sentido: diagnosticado contra BD. La empresa revisada tiene 108 `CatalogItem` activos y 0 `CatalogPriceItem`; los contadores anteriores a 0 eran confusos porque miraban la tabla nueva vacia.
- Crear un nuevo presupuesto: ruta `/budgets/new` responde 200.
- Rellenar campos: pendiente de QA browser.
- Cambiar de pagina con datos sin guardar: pendiente de QA browser.
- Ver popup de aviso: pendiente de QA browser.
- Seguir editando: pendiente de QA browser.
- Anadir partidas: pendiente de QA browser con datos reales de catalogo.
- Guardar borrador: pendiente de QA browser.
- Ver presupuesto en listado: pendiente de QA browser.
- Abrir detalle: pendiente de QA browser.

### Riesgo observado

El rol owner esta protegido en servidor para gestion de precios, pero falta probar un usuario autenticado no-owner real. No basta con que la UI oculte el enlace.

## Usuario B - Usuario operativo

Perfil: usuario interno que solo quiere crear presupuestos. No deberia tocar configuracion sensible si no aplica.

### Pruebas pendientes en entorno controlado

- Login con usuario no-owner.
- Crear presupuesto.
- Probar boton `Descartar`.
- Probar aviso de cambios sin guardar.
- Anadir partida.
- Revisar total.
- Guardar borrador.
- Intentar acceder a `/settings/prices` y confirmar bloqueo en servidor.

### Resultado esperado

- Puede crear y guardar presupuestos si tiene permisos funcionales.
- No puede actualizar precios ni acceder a acciones sensibles owner.
- Si abandona `/budgets/new` con cambios, recibe aviso antes de perder informacion.

## Usuario C - Usuario sin datos o empresa vacia

Perfil: usuario de una empresa sin catalogo importado o sin partidas activas.

### Pruebas pendientes en entorno controlado

- Login con empresa sin `CatalogItem` activo.
- Entrar en Gestionar precios.
- Confirmar que los contadores a 0 se explican con un estado vacio profesional.
- Confirmar que la UI propone importar una tarifa Excel.
- Entrar en Nuevo presupuesto.
- Confirmar que la ausencia de catalogo no rompe la pantalla.

### Resultado esperado

- Los contadores muestran `0`, pero no parecen un error.
- Se ve un mensaje claro del tipo: todavia no hay partidas activas importadas para esta empresa.
- El wizard no debe lanzar excepciones si no hay familias/partidas.

## Usuario D - Caso limite

Perfil: usuario que abandona paginas, recarga navegador o navega rapido.

### Pruebas pendientes en navegador real

- Escribir datos minimos en Nuevo presupuesto.
- Intentar salir por link interno.
- Intentar usar boton atras.
- Intentar recargar pestana.
- Confirmar que `beforeunload` funciona cuando hay cambios.
- Confirmar que `Seguir editando` mantiene el estado.
- Confirmar que `Descartar cambios` limpia estado y permite navegar.
- Confirmar que `Guardar borrador` muestra error claro si faltan partidas.

### Resultado esperado

- No debe haber perdida silenciosa de datos.
- El modal no debe quedarse bloqueando rutas despues de descartar o guardar.
- El boton atras puede requerir una solucion especifica adicional si la arquitectura de Next Router no cubre todos los casos.

## Mini prueba A/B de UX

### Variante A - Preventiva

Avisos mas visibles, textos explicativos y mas seguridad para evitar perdida de datos.

Evaluacion:

- Claridad: alta.
- Rapidez: media.
- Riesgo de perdida de informacion: bajo.
- Carga cognitiva: media.
- Profesionalidad: alta si los textos son breves.
- Encaje para carpinteria/gestion interna: bueno, especialmente con usuarios no tecnicos y presupuestos con varias partidas.

### Variante B - Rapida

Flujo menos intrusivo, avisos solo cuando hay cambios claros y menos friccion.

Evaluacion:

- Claridad: media.
- Rapidez: alta.
- Riesgo de perdida de informacion: medio.
- Carga cognitiva: baja.
- Profesionalidad: buena si el usuario entiende el sistema.
- Encaje para carpinteria/gestion interna: aceptable cuando el equipo ya conoce la app, pero mas arriesgada durante implantacion.

## Recomendacion

Recomiendo Variante A en esta fase. La app gestiona presupuestos con informacion economica y partidas que pueden requerir varios minutos de trabajo; perder ese estado seria mas costoso que confirmar una salida. Cuando haya uso real y feedback, puede evolucionarse hacia una Variante B ajustada: avisar solo cuando el estado sucio sea inequivoco y permitir atajos para usuarios avanzados.

## Criterios antes de merge a main

No hacer merge ni produccion hasta completar:

- QA browser real del modal de cambios sin guardar.
- Prueba con usuario no-owner autenticado.
- Prueba con empresa sin catalogo.
- Validacion de preview Vercel y logs runtime.
- Confirmacion de variables de entorno en Vercel.
- Importacion controlada del Excel definitivo o decision explicita de no importarlo todavia.

## Veredicto QA

El codigo pasa unit tests, lint y build, y las rutas principales responden correctamente en smoke test. Aun asi, el QA funcional no esta completo para produccion porque faltan pruebas reales de navegador y validacion de Vercel. El estado correcto es: rama lista para PR/review, no lista para merge automatico a `main`.
