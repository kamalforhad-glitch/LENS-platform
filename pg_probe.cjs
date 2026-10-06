const { PrismaClient } = require("@prisma/client");

process.env.DATABASE_URL = "postgresql://postgres@127.0.0.1:5432/postgres";

async function inspect(name) {
  process.env.DATABASE_URL = `postgresql://postgres@127.0.0.1:5432/${name}`;
  const db = new PrismaClient({ log: [] });
  try {
    const tables = await db.$queryRawUnsafe(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tnames = tables.map((t) => t.tablename);
    const counts = {};
    for (const t of tnames) {
      try {
        const r = await db.$queryRawUnsafe(`SELECT count(*)::int AS c FROM "${t}"`);
        if (r[0].c > 0) counts[t] = r[0].c;
      } catch {
        /* ignore */
      }
    }
    return { tables: tnames.length, nonEmpty: counts };
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  const bootstrap = new PrismaClient({ log: [] });
  const dbs = await bootstrap.$queryRawUnsafe(
    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
  );
  await bootstrap.$disconnect();
  for (const { datname } of dbs) {
    try {
      const info = await inspect(datname);
      console.log(`DB ${datname}: ${info.tables} tables, non-empty: ${JSON.stringify(info.nonEmpty)}`);
    } catch (e) {
      console.log(`DB ${datname}: ERROR ${e.message.slice(0, 120)}`);
    }
  }
}
main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
