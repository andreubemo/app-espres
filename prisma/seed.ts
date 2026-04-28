import bcrypt from "bcrypt";
import { PrismaClient, Role } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("12345678", 10);

  const company = await prisma.company.upsert({
    where: {
      id: "seed-company-espres",
    },
    update: {
      name: "Espres Carpintería",
    },
    create: {
      id: "seed-company-espres",
      name: "Espres Carpintería",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "owner@espres.com",
    },
    update: {
      password: passwordHash,
      role: Role.OWNER,
      companyId: company.id,
    },
    create: {
      email: "owner@espres.com",
      password: passwordHash,
      role: Role.OWNER,
      companyId: company.id,
    },
  });

  await prisma.client.upsert({
    where: {
      email_companyId: {
        email: "cliente@pendiente.local",
        companyId: company.id,
      },
    },
    update: {
      name: "Cliente pendiente",
      password: passwordHash,
    },
    create: {
      name: "Cliente pendiente",
      email: "cliente@pendiente.local",
      password: passwordHash,
      companyId: company.id,
    },
  });

  console.log("Seed completado correctamente.");
  console.log("Usuario: owner@espres.com");
  console.log("Contraseña: 12345678");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });