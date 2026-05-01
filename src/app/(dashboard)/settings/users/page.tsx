import { Role } from "@/generated/prisma";
import {
  canCreateUserRole,
  canManageTargetUser,
  requireAnyRole,
} from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { Card } from "@/ui/primitives/Card";
import { Input } from "@/ui/primitives/Input";
import { SectionHeader } from "@/ui/primitives/SectionHeader";

import {
  createUserAction,
  deactivateUserAction,
  reactivateUserAction,
  updateUserAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

const MANAGER_ROLES = [Role.OWNER, Role.ADMIN];
const ALL_ROLES = [Role.OWNER, Role.ADMIN, Role.WORKER];

const roleLabels: Record<Role, string> = {
  [Role.OWNER]: "Owner",
  [Role.ADMIN]: "Admin",
  [Role.WORKER]: "Worker",
};

function getRoleOptions(actorRole: Role) {
  return ALL_ROLES.filter((role) => canCreateUserRole(actorRole, role));
}

function getRoleBadgeVariant(role: Role) {
  if (role === Role.OWNER) return "primary" as const;
  if (role === Role.ADMIN) return "warning" as const;
  return "neutral" as const;
}

function RoleSelect({
  defaultValue,
  disabled = false,
  id,
  options,
}: {
  defaultValue: Role;
  disabled?: boolean;
  id?: string;
  options: Role[];
}) {
  const safeOptions = options.includes(defaultValue)
    ? options
    : [defaultValue, ...options];

  return (
    <select
      className="h-10 w-full rounded-control border border-border bg-card-background px-3 text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70"
      defaultValue={defaultValue}
      disabled={disabled}
      id={id}
      name="role"
    >
      {safeOptions.map((role) => (
        <option key={role} value={role}>
          {roleLabels[role]}
        </option>
      ))}
    </select>
  );
}

export default async function UsersPage({ searchParams }: PageProps) {
  const actor = await requireAnyRole(MANAGER_ROLES);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const roleOptions = getRoleOptions(actor.role);
  const defaultCreateRole = roleOptions[0] ?? Role.WORKER;

  const users = await prisma.user.findMany({
    where: {
      companyId: actor.companyId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { email: "asc" }],
  });

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8">
        <SectionHeader
          eyebrow="Administracion"
          title="Usuarios"
          description="Gestiona el equipo interno de tu empresa sin borrar historico ni romper auditoria de presupuestos."
        />

        {resolvedSearchParams?.notice ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {resolvedSearchParams.notice}
          </div>
        ) : null}

        {resolvedSearchParams?.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {resolvedSearchParams.error}
          </div>
        ) : null}

        <Card>
          <form
            action={createUserAction}
            className="grid gap-3 lg:grid-cols-[1fr_1fr_180px_auto] lg:items-end"
          >
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase text-text-neutral"
                htmlFor="new-email"
              >
                Email
              </label>
              <Input
                autoComplete="email"
                id="new-email"
                name="email"
                placeholder="usuario@empresa.com"
                required
                type="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase text-text-neutral"
                htmlFor="new-password"
              >
                Contrasena inicial
              </label>
              <Input
                autoComplete="new-password"
                id="new-password"
                minLength={8}
                name="password"
                placeholder="Minimo 8 caracteres"
                required
                type="password"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase text-text-neutral"
                htmlFor="new-role"
              >
                Rol
              </label>
              <RoleSelect
                defaultValue={defaultCreateRole}
                id="new-role"
                options={roleOptions}
              />
            </div>

            <Button className="lg:w-auto" type="submit">
              Crear usuario
            </Button>
          </form>
        </Card>

        <section className="space-y-3" aria-label="Listado de usuarios">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-text-neutral">
              Equipo interno
            </h2>
            <Badge variant="neutral">{users.length} usuarios</Badge>
          </div>

          {users.length === 0 ? (
            <Card>
              <p className="text-sm text-text-neutral">
                Todavia no hay usuarios internos en esta empresa.
              </p>
            </Card>
          ) : (
            users.map((user) => {
              const isSelf = user.id === actor.id;
              const canEdit = canManageTargetUser(
                actor.role,
                user.role,
                isSelf
              );

              return (
                <Card
                  key={user.id}
                  className={!user.active ? "opacity-75" : ""}
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text-strong">
                          {user.email}
                        </p>
                        {isSelf ? (
                          <Badge variant="soft">Tu usuario</Badge>
                        ) : null}
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {roleLabels[user.role]}
                        </Badge>
                        <Badge variant={user.active ? "success" : "neutral"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <p className="text-xs text-text-neutral">
                        Creado el {user.createdAt.toLocaleDateString("es-ES")}
                      </p>
                    </div>

                    {canEdit ? (
                      <div className="grid gap-2 xl:min-w-[620px]">
                        <form
                          action={updateUserAction}
                          className="grid gap-2 md:grid-cols-[1fr_160px_auto] md:items-end"
                        >
                          <input name="userId" type="hidden" value={user.id} />
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-text-neutral">
                              Email
                            </label>
                            <Input
                              defaultValue={user.email}
                              name="email"
                              required
                              type="email"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-text-neutral">
                              Rol
                            </label>
                            <RoleSelect
                              defaultValue={user.role}
                              options={roleOptions}
                            />
                          </div>

                          <Button type="submit" variant="neutral">
                            Guardar
                          </Button>
                        </form>

                        <form
                          action={
                            user.active
                              ? deactivateUserAction
                              : reactivateUserAction
                          }
                          className="flex justify-end"
                        >
                          <input name="userId" type="hidden" value={user.id} />
                          <Button
                            size="sm"
                            type="submit"
                            variant={user.active ? "danger" : "outline"}
                          >
                            {user.active ? "Desactivar" : "Reactivar"}
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-neutral">
                        {isSelf
                          ? "Tu propio usuario se gestionara desde perfil."
                          : "Sin permisos de gestion para este rol."}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
