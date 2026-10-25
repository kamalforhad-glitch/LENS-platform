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
        role: "super_admin",
        createdBy: "seed",
      },
    });
    console.log("Default admin user created: admin@lens.org.bd (super_admin)");
  } else {
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    // In development or when explicitly requested, sync the admin password to ADMIN_SEED_PASSWORD if provided
    if (process.env.NODE_ENV !== "production" && seedPassword) {
      const matches = bcrypt.compareSync(seedPassword, existingAdmin.passwordHash);
      if (!matches) {
        const hash = bcrypt.hashSync(seedPassword, 12);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            passwordHash: hash,
            active: true,
            role: "super_admin",
          },
        });
        console.log("Updated existing admin user credentials to match ADMIN_SEED_PASSWORD (development mode).");
      } else {
        console.log("Admin user already exists with matching credentials.");
      }
    } else {
      console.log("Admin user already exists, skipping seed.");
    }
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
