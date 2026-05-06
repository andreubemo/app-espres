import { cache } from "react";

import { Role } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type InternalUserContext = {
  id: string;
  email: string;
  role: Role;
  companyId: string;
};

const INTERNAL_ROLES = [Role.OWNER, Role.ADMIN, Role.WORKER] as const;

export class AccessDeniedError extends Error {
  constructor(message = "No tienes permisos para realizar esta accion.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export function isInternalRole(role: unknown): role is Role {
  return INTERNAL_ROLES.includes(role as Role);
}

export function canManageUsers(role: Role) {
  return role === Role.OWNER || role === Role.ADMIN;
}

export function canCreateUserRole(actorRole: Role, targetRole: Role) {
  if (actorRole === Role.OWNER) return true;
  return actorRole === Role.ADMIN && targetRole === Role.WORKER;
}

export function canManageTargetUser(
  actorRole: Role,
  targetRole: Role,
  isSelf: boolean
) {
  if (isSelf) return false;
  if (actorRole === Role.OWNER) return true;
  return actorRole === Role.ADMIN && targetRole === Role.WORKER;
}

export const getInternalUserContext = cache(async () => {
  const session = await auth();

  if (
    !session?.user?.id ||
    !session.user.companyId ||
    session.user.type !== "USER" ||
    !isInternalRole(session.user.role)
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      companyId: session.user.companyId,
      active: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      companyId: true,
    },
  });

  return user;
});

export async function requireInternalUser() {
  const user = await getInternalUserContext();

  if (!user) {
    throw new AccessDeniedError("Debes iniciar sesion con un usuario activo.");
  }

  return user;
}

export async function requireAnyRole(roles: Role[]) {
  const user = await requireInternalUser();

  if (!roles.includes(user.role)) {
    throw new AccessDeniedError();
  }

  return user;
}
