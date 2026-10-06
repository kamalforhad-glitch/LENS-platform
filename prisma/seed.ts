import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@lens.org.bd" },
  });

  if (!existingAdmin) {
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("ADMIN_SEED_PASSWORD environment variable is required to seed production");
      }
      console.log("ADMIN_SEED_PASSWORD not set — skipping default admin creation (no default credentials).");
      return;
    }
    const hash = bcrypt.hashSync(seedPassword, 12);
    await prisma.user.create({
      data: {
        email: "admin@lens.org.bd",
        name: "LENS Admin",
        passwordHash: hash,
        role: "admin",
      },
    });
    console.log("Default admin user created: admin@lens.org.bd");
  } else {
    console.log("Admin user already exists, skipping seed.");
  }

  console.log("Database seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
