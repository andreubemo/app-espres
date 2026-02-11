import { prisma } from "@/lib/prisma"

export async function getClientsByCompany(companyId: string) {
  return prisma.client.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createClient(data: {
  name: string
  email: string
  password: string
  companyId: string
}) {
  return prisma.client.create({
    data,
  })
}
