// Keep the backend's generated Prisma client aligned with the repository-root
// schema at prisma/schema.prisma. Prisma may generate either next to the root
// schema or inside backend/node_modules, depending on which dependency tree is
// present during install. Support both layouts; no schema or migration runs here.
const fs = require("fs");
const path = require("path");

const rootClient = path.resolve(__dirname, "../../node_modules/.prisma/client");
const backendClient = path.resolve(__dirname, "../node_modules/.prisma/client");

function generated(indexPath) {
  return fs.existsSync(path.join(indexPath, "index.d.ts"));
}

function modifiedAt(indexPath) {
  return fs.statSync(path.join(indexPath, "index.d.ts")).mtimeMs;
}

const rootReady = generated(rootClient);
const backendReady = generated(backendClient);

if (!rootReady && !backendReady) {
  throw new Error(
    "Generated Prisma client not found in root or backend node_modules. Run prisma generate against the root schema first."
  );
}

if (rootReady && (!backendReady || modifiedAt(rootClient) > modifiedAt(backendClient))) {
  fs.rmSync(backendClient, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(backendClient), { recursive: true });
  fs.cpSync(rootClient, backendClient, { recursive: true });
  console.log("[lens-backend] Synced generated Prisma client from repository root.");
} else {
  console.log("[lens-backend] Generated Prisma client already present in backend; sync skipped.");
}
