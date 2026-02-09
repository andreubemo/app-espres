"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteItem(id: number) {
  if (!id || typeof id !== "number") {
    throw new Error("ID inválido");
  }

  await prisma.item.delete({
    where: { id },
  });

  revalidatePath("/");
}
