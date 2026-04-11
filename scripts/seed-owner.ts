import { PrismaClient } from "../src/generated/prisma/index.js";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@espres.com";
  const password = "Espres2026!";

  const existingCompany = await prisma.company.findFirst({
    where: {
      name: "Espres Carpintería",
    },
  });

  if (existingCompany) {
    console.log("La empresa ya existe:", existingCompany.name);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: "Espres Carpintería",
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "OWNER",
      companyId: company.id,
    },
  });

  console.log("Empresa creada:", company);
  console.log("Usuario creado:", user);
  console.log("Login:");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed-owner.ts:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
