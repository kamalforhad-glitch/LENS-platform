process.env.DATABASE_URL = "postgresql://postgres@127.0.0.1:5432/lens";
const { PrismaClient } = require("@prisma/client");

(async () => {
  const db = new PrismaClient({ log: [] });
  await db.$executeRawUnsafe("DROP SCHEMA public CASCADE");
  await db.$executeRawUnsafe("CREATE SCHEMA public");
  await db.$executeRawUnsafe("GRANT ALL ON SCHEMA public TO postgres");
  await db.$executeRawUnsafe("GRANT ALL ON SCHEMA public TO public");
  const rows = await db.$queryRawUnsafe(
    "SELECT count(*)::int AS c FROM pg_tables WHERE schemaname='public'"
  );
  console.log("TABLES_AFTER_RESET:", rows[0].c);
  await db.$disconnect();
})();
