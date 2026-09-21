import { NextResponse } from "next/server";
import { restoreBackup, downloadBackup } from "@/lib/backup";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    requireAdmin(user);

    const { backupId, action } = await request.json();

    if (!backupId) {
      return NextResponse.json({ error: "backupId required" }, { status: 400 });
    }

    if (action === "restore") {
      const result = await restoreBackup(backupId);
      return NextResponse.json(result);
    }

    if (action === "download") {
      const result = await downloadBackup(backupId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return new NextResponse(new Uint8Array(result.data!), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
