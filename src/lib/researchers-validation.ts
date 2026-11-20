export function isSchemaColumnMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "P2022" || err.code === "42703") return true;
  const message = String(err.message || "");
  return (
    (message.includes("column") && message.includes("does not exist")) ||
    message.includes("UndefinedColumn") ||
    message.includes("P2022")
  );
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  const name = String(err.name || "");
  const code = String(err.code || "");
  const message = String(err.message || "");

  if (name === "PrismaClientInitializationError") return true;
  if (["P1000", "P1001", "P1002", "P1008", "P1017"].includes(code)) return true;
  return (
    message.includes("Can't reach database server") ||
    message.includes("connection closed") ||
    message.includes("Connection terminated")
  );
}
