"use server";

import { prisma } from "@/lib/prisma";

export async function deleteItem(id: number) {
  if (!id) throw new Error("ID inválido");

  await prisma.item.delete({
    where: { id },
  });
}
