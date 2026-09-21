"use client";

import { useEffect, useState, useCallback } from "react";

interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  status: string;
  type: string;
  error: string | null;
  createdAt: string;
}

interface BackupStats {
  total: number;
  completed: number;
  failed: number;
  latest: BackupRecord | null;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setStats(data.stats || null);
      }
    } catch {
      console.error("Failed to load backups");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createBackup = async () => {
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const result = await res.json();
      if (result.status === "completed") {
        setMessage(`Backup created: ${result.filename} (${formatSize(result.size)})`);
      } else {
        setMessage(`Backup failed: ${result.error || "Unknown error"}`);
      }
      await load();
    } catch {
      setMessage("Failed to create backup");
    }
    setCreating(false);
  };

  const handleAction = async (backupId: string, action: "restore" | "download") => {
    if (action === "restore" && !confirm("Are you sure you want to restore this backup? This will overwrite the current database.")) {
      return;
    }

    try {
      if (action === "download") {
        const res = await fetch("/api/admin/backup/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backupId, action: "download" }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = backups.find((b) => b.id === backupId)?.filename || "backup.sql";
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const res = await fetch("/api/admin/backup/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backupId, action: "restore" }),
        });
        const result = await res.json();
        if (result.success) {
          setMessage("Database restored successfully");
        } else {
          setMessage(`Restore failed: ${result.error}`);
        }
      }
    } catch {
      setMessage("Operation failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Database Backups</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and restore database backups.</p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating..." : "Create Backup Now"}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${
          message.includes("failed") || message.includes("Failed")
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Total Backups</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Failed</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Last Backup</div>
            <div className="text-sm font-medium text-slate-900 mt-1">
              {stats.latest ? formatDate(stats.latest.createdAt) : "Never"}
            </div>
          </div>
        </div>
      )}

      {/* Backup List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No backups yet. Create your first backup above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">File</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[250px]">{backup.filename}</div>
                      {backup.error && <div className="text-xs text-red-500 mt-1">{backup.error}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-500">{formatSize(backup.size)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        backup.type === "scheduled"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        backup.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : backup.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{formatDate(backup.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {backup.status === "completed" && (
                          <>
                            <button
                              onClick={() => handleAction(backup.id, "download")}
                              className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleAction(backup.id, "restore")}
                              className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            >
                              Restore
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
