import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FOCUS_SEED_AREAS } from "../src/lib/focus-seed-data";

const prisma = new PrismaClient();

async function seedAdmin() {
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
    return;
  }

  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  // In development or when explicitly requested, sync the admin password to
  // ADMIN_SEED_PASSWORD if provided. Existing editorial edits are never touched.
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

async function seedFocusAreas() {
  for (const area of FOCUS_SEED_AREAS) {
    await prisma.focusArea.upsert({
      where: { id: area.id },
      // Preserve editorial changes on subsequent runs; only fill missing rows.
      update: {},
      create: {
        id: area.id,
        slug: area.slug,
        title: area.title,
        description: area.description,
        icon: area.icon,
        content: area.content,
        imageUrl: area.imageUrl,
        order: area.order,
      },
    });
  }
  console.log(`Seeded ${FOCUS_SEED_AREAS.length} focus areas.`);
}

async function main() {
  console.log("Seeding database...");
  await seedAdmin();
  await seedFocusAreas();
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
