# Roles y Permisos

## Roles existentes

Prisma define:

```prisma
enum Role {
  OWNER
  ADMIN
  WORKER
}
```

La sesion tambien puede tener `type: "CLIENT"` y `role: "CLIENT"` cuando inicia sesion un registro de `Client`, pero no existe un portal de cliente externo completo.

## Auth real

Archivo: `src/lib/auth.ts`.

- Provider: Credentials.
- Sesion: JWT.
- Paquete: `next-auth@4.24.13`.
- NextAuth v5: pendiente, no implementado.

## Contexto interno

Archivo: `src/lib/access-control.ts`.

`getInternalUserContext()` exige:

- sesion valida;
- `session.user.type === "USER"`;
- rol interno valido;
- `companyId`;
- usuario activo en BD.

## Permisos actuales

| Accion | OWNER | ADMIN | WORKER | CLIENT |
| --- | --- | --- | --- | --- |
| Entrar a presupuestos | Si | Si | Si | No |
| Crear presupuesto | Si | Si | Si | No |
| Editar presupuesto | Si | Si | Si | No |
| Duplicar presupuesto | Si | Si | Si | No |
| Marcar enviado | Si | Si | Si | No |
| Restaurar version | Si | Si | Si | No |
| Gestionar usuarios | Si | Si | No | No |
| Crear OWNER | Si | No | No | No |
| Crear ADMIN | Si | No | No | No |
| Crear WORKER | Si | Si | No | No |
| Gestionar precios | Si | No | No | No |
| Gestionar clientes | Si | Si | No | No |
| Gestionar materiales | Si | Si | No | No |

## Rutas protegidas

Proxy:

- `/budgets/:path*`
- `/clients/:path*`
- `/materials/:path*`
- `/catalog/:path*`
- `/settings/:path*`

Ademas, las paginas server vuelven a comprobar contexto interno.

## Server actions

Presupuestos:

- usan `requireInternalUser`;
- filtran `Budget` por `companyId`;
- validan cliente por `companyId`;
- revalidan rutas afectadas.

Usuarios:

- usan `requireAnyRole([OWNER, ADMIN])`;
- `ADMIN` solo puede gestionar `WORKER`;
- se evita dejar una empresa sin `OWNER` activo.

Precios:

- usan `requireAnyRole([OWNER])`;
- filtran lectura/escritura por `companyId`;
- actualizan `CatalogItem`, `CatalogPriceItem`, `ExcelWorkbookCell` y batches por empresa.

Clientes/materiales:

- paginas requieren usuario interno;
- acciones exigen `OWNER` o `ADMIN`.

## Riesgos pendientes

- `CLIENT` existe en auth, pero no tiene portal funcional; no debe prometerse como flujo final.
- `/tutorial` es publico porque no esta incluido en el matcher del proxy. No contiene datos sensibles.
- Falta QA con usuario autenticado no-owner real para Gestionar precios.
- Falta auditoria E2E de todas las rutas con usuarios de varias empresas.
- Si se migra a NextAuth v5, hay que revisar callbacks, tipos y proxy.
