import { PrismaClient } from "../src/generated/prisma/index.js"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const email = "owner@espres.com"
  const password = "Espres2026!"

  const hashedPassword = await bcrypt.hash(password, 12)

  const company = await prisma.company.create({
    data: {
      name: "Espres Carpintería",
    },
  })

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "OWNER",
      companyId: company.id,
    },
  })

  console.log("Empresa creada:", company)
  console.log("Usuario OWNER creado:", user)
  console.log("Credenciales:")
  console.log("Email:", email)
  console.log("Password:", password)
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
