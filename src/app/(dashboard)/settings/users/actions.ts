"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Role } from "@/generated/prisma";
import {
  canCreateUserRole,
  canManageTargetUser,
  requireAnyRole,
} from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const USERS_PATH = "/settings/users";
const MANAGER_ROLES = [Role.OWNER, Role.ADMIN];
const ROLE_VALUES = [Role.OWNER, Role.ADMIN, Role.WORKER];

function redirectWith(type: "notice" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${USERS_PATH}?${params.toString()}`);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readRole(formData: FormData) {
  const value = readString(formData, "role");
  return ROLE_VALUES.includes(value as Role) ? (value as Role) : null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function getTargetUser(actorCompanyId: string, targetUserId: string) {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      companyId: actorCompanyId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
    },
  });

  if (!targetUser) {
    redirectWith("error", "Usuario no encontrado.");
  }

  return targetUser;
}

async function ensureOwnerWouldRemain(
  companyId: string,
  targetUser: {
    id: string;
    role: Role;
    active: boolean;
  }
) {
  if (targetUser.role !== Role.OWNER || !targetUser.active) {
    return;
  }

  const activeOwners = await prisma.user.count({
    where: {
      companyId,
      role: Role.OWNER,
      active: true,
    },
  });

  if (activeOwners <= 1) {
    redirectWith("error", "Debe quedar al menos un OWNER activo.");
  }
}

export async function createUserAction(formData: FormData) {
  const actor = await requireAnyRole(MANAGER_ROLES);

  const email = normalizeEmail(readString(formData, "email"));
  const password = readString(formData, "password");
  const role = readRole(formData);

  if (!isEmail(email)) {
    redirectWith("error", "Introduce un email valido.");
  }

  if (!role || !canCreateUserRole(actor.role, role)) {
    redirectWith("error", "No puedes crear usuarios con ese rol.");
  }

  if (password.length < 8) {
    redirectWith("error", "La contrasena debe tener al menos 8 caracteres.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        companyId: actor.companyId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("error", "Ya existe un usuario con este email.");
    }

    throw error;
  }

  revalidatePath(USERS_PATH);
  redirectWith("notice", "Usuario creado correctamente.");
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireAnyRole(MANAGER_ROLES);

  const targetUserId = readString(formData, "userId");
  const email = normalizeEmail(readString(formData, "email"));
  const role = readRole(formData);

  if (!targetUserId) {
    redirectWith("error", "Falta el usuario a actualizar.");
  }

  if (!isEmail(email)) {
    redirectWith("error", "Introduce un email valido.");
  }

  if (!role || !canCreateUserRole(actor.role, role)) {
    redirectWith("error", "No puedes asignar ese rol.");
  }

  const targetUser = await getTargetUser(actor.companyId, targetUserId);
  const isSelf = targetUser.id === actor.id;

  if (!canManageTargetUser(actor.role, targetUser.role, isSelf)) {
    redirectWith("error", "No puedes modificar este usuario.");
  }

  if (targetUser.role === Role.OWNER && role !== Role.OWNER) {
    await ensureOwnerWouldRemain(actor.companyId, targetUser);
  }

  try {
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        email,
        role,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("error", "Ya existe un usuario con este email.");
    }

    throw error;
  }

  revalidatePath(USERS_PATH);
  redirectWith("notice", "Usuario actualizado correctamente.");
}

export async function deactivateUserAction(formData: FormData) {
  const actor = await requireAnyRole(MANAGER_ROLES);
  const targetUserId = readString(formData, "userId");

  if (!targetUserId) {
    redirectWith("error", "Falta el usuario a desactivar.");
  }

  const targetUser = await getTargetUser(actor.companyId, targetUserId);
  const isSelf = targetUser.id === actor.id;

  if (!canManageTargetUser(actor.role, targetUser.role, isSelf)) {
    redirectWith("error", "No puedes desactivar este usuario.");
  }

  await ensureOwnerWouldRemain(actor.companyId, targetUser);

  await prisma.user.update({
    where: { id: targetUser.id },
    data: { active: false },
  });

  revalidatePath(USERS_PATH);
  redirectWith("notice", "Usuario desactivado correctamente.");
}

export async function reactivateUserAction(formData: FormData) {
  const actor = await requireAnyRole(MANAGER_ROLES);
  const targetUserId = readString(formData, "userId");

  if (!targetUserId) {
    redirectWith("error", "Falta el usuario a reactivar.");
  }

  const targetUser = await getTargetUser(actor.companyId, targetUserId);
  const isSelf = targetUser.id === actor.id;

  if (!canManageTargetUser(actor.role, targetUser.role, isSelf)) {
    redirectWith("error", "No puedes reactivar este usuario.");
  }

  await prisma.user.update({
    where: { id: targetUser.id },
    data: { active: true },
  });

  revalidatePath(USERS_PATH);
  redirectWith("notice", "Usuario reactivado correctamente.");
}
