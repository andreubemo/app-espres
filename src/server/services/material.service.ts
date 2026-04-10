import { prisma } from "@/lib/prisma"

export async function getMaterialsByCompany(companyId: string) {
  return prisma.material.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createMaterial(data: {
  name: string
  description?: string
  unit: string
  price: number
  companyId: string
}) {
  return prisma.material.create({
    data,
  })
}
