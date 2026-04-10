import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const password = await bcrypt.hash("123456", 10);

  const company = await prisma.company.findFirst();

  if (!company) {
    throw new Error("No hay empresa creada");
  }

  const user = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password,
      role: "OWNER",
      companyId: company.id,
    },
  });

  console.log("Usuario creado:", user.email);
}

main().finally(() => prisma.$disconnect());