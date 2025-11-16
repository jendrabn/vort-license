import path from "path";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

config({
  path: path.resolve(__dirname, "..", ".env"),
});

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@mail.com";
const ADMIN_PASSWORD = "password";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.admin,
    },
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.admin,
    },
  });

  console.log("Seeded admin user:", {
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
