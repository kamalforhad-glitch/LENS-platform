const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@lens.org.bd";
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = "LENS Admin";

  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_SEED_PASSWORD environment variable is required to seed production");
    }
    console.log("ADMIN_SEED_PASSWORD not set — skipping default admin creation (no default credentials).");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists. Skipping.`);
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Admin user created: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
