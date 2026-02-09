"use server";

import { prisma } from "@/lib/prisma";

type UpdateItemInput = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
};

export async function updateItem(data: UpdateItemInput) {
  const { id, ...rest } = data;

  await prisma.item.update({
    where: { id },
    data: rest,
  });
}
