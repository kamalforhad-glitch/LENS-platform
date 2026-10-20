"use client";

import { useCallback, useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt: string | Date | null;
  createdAt: string | Date;
}

interface Notice {
  kind: "ok" | "err";
  text: string;
}

const ROLES = ["super_admin", "admin", "editor", "viewer"];

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-teal-100 text-teal-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

function fmtDate(d: string | Date | null): string {
  if (!d) return "Never";
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return String(d);
  }
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState<"accounts" | "audit">("accounts");
  const [notice, setNotice] = useState<Notice | null>(null);

  const banner = notice && (
    <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {notice.text}
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage administrator accounts, roles, sessions, and the audit trail.</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(["accounts", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setNotice(null); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "accounts" ? "Accounts" : "Audit Log"}
            </button>
          ))}
        </div>
      </div>

      {banner}

      {tab === "accounts" ? <AccountsTab setNotice={setNotice} /> : <AuditTab />}
    </div>
  );
}

function AccountsTab({ setNotice }: { setNotice: (n: Notice | null) => void }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [cEmail, setCEmail] = useState("");
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState("editor");
  const [cPassword, setCPassword] = useState("");
  const [cInvite, setCInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const { listAdminUsers } = await import("@/lib/actions/users");
      const res = await listAdminUsers();
      setUsers(res.users as unknown as AdminUser[]);
      setIsSuperAdmin(res.isSuperAdmin);
    } catch (e) {
      setUsers([]);
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await reload();
      try {
        const { checkAuth } = await import("@/lib/actions/auth");
        const me = await checkAuth();
        setCurrentId(me.user?.id ?? null);
      } catch { /* ignore */ }
    })();
  }, [reload]);

  return (
    <div className="space-y-6">
      {isSuperAdmin ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Invite or Create Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Email</label>
              <input
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                placeholder="name@lens.org.bd"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Name</label>
              <input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Role</label>
              <select value={cRole} onChange={(e) => setCRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <button
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setNotice(null);
                setInviteLink(null);
                try {
                  const { createAdminUser } = await import("@/lib/actions/users");
                  const res = await createAdminUser({
                    email: cEmail.trim(),
                    name: cName.trim(),
                    role: cRole,
                    invite: cInvite,
                    password: cInvite ? undefined : cPassword,
                  });
                  if (res.success) {
                    setNotice({ kind: "ok", text: res.invited ? "Invitation created (link below if email is not configured)" : "Account created" });
                    if (res.inviteLink) setInviteLink(res.inviteLink);
                    setCEmail(""); setCName(""); setCPassword("");
                    await reload();
                  } else {
                    setNotice({ kind: "err", text: res.error || "Failed" });
                  }
                } catch (e) {
                  setNotice({ kind: "err", text: e instanceof Error ? e.message : "Failed" });
                } finally {
                  setBusy(false);
                }
              }}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {cInvite ? "Send Invite" : "Create Account"}
            </button>
          </div>
          {!cInvite && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Password (min 10 chars)</label>
              <input
                value={cPassword}
                onChange={(e) => setCPassword(e.target.value)}
                type="password"
                className="w-full md:w-72 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Initial password"
              />
            </div>
          )}
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={cInvite} onChange={(e) => setCInvite(e.target.checked)} className="rounded" />
            Send an invite link instead of setting a password
          </label>
          {inviteLink && (
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs text-slate-500 mb-1">One-time invite link (share privately, expires in 72h):</p>
              <code className="text-xs text-slate-700 break-all">{window.location.origin}{inviteLink}</code>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Read-only view. Account administration (creating accounts, changing roles, deactivating) requires a Super Admin.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Account</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Last Login</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users === null && (
              <tr><td colSpan={5} className="px-5 py-8 text-slate-400 text-center">Loading…</td></tr>
            )}
            {users?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-slate-400 text-center">No accounts yet</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-900">
                    {u.name}
                    {u.id === currentId && <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">YOU</span>}
                  </div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-5 py-3">
                  {isSuperAdmin && u.id !== currentId ? (
                    <select
                      value={u.role}
                      disabled={busy}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        setBusy(true);
                        try {
                          const { updateAdminRole } = await import("@/lib/actions/users");
                          const res = await updateAdminRole(u.id, newRole);
                          setNotice(res.success
                            ? { kind: "ok", text: `Role updated to ${newRole.replace("_", " ")}` }
                            : { kind: "err", text: res.error || "Failed" });
                          await reload();
                        } catch (err) {
                          setNotice({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
                        } finally { setBusy(false); }
                      }}
                      className="text-xs rounded-md border border-slate-300 bg-white px-2 py-1"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_STYLES[u.role] || ROLE_STYLES.viewer}`}>{u.role.replace("_", " ")}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(u.lastLoginAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <button
                      disabled={busy || !isSuperAdmin}
                      onClick={async () => {
                        if (!window.confirm(`Revoke all active sessions for ${u.email}?`)) return;
                        setBusy(true);
                        try {
                          const { revokeAdminSessions } = await import("@/lib/actions/users");
                          const res = await revokeAdminSessions(u.id);
                          setNotice({ kind: "ok", text: `Revoked ${res.count ?? 0} session(s)` });
                        } catch (err) {
                          setNotice({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
                        } finally { setBusy(false); }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Revoke Sessions
                    </button>
                    {isSuperAdmin && (
                      <button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const { initiatePasswordReset } = await import("@/lib/actions/users");
                            const res = await initiatePasswordReset(u.id);
                            setNotice(res.success
                              ? { kind: "ok", text: `Password reset link generated and emailed (or logged in dev mode)` }
                              : { kind: "err", text: res.error || "Failed" });
                          } catch (err) {
                            setNotice({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
                          } finally { setBusy(false); }
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Reset Password
                      </button>
                    )}
                    {isSuperAdmin && u.id !== currentId && (
                      <button
                        disabled={busy}
                        onClick={async () => {
                          const targetState = !u.active;
                          const verb = targetState ? "reactivate" : "deactivate";
                          if (!window.confirm(`Really ${verb} ${u.email}?${targetState ? "" : " All active sessions are revoked."}`)) return;
                          setBusy(true);
                          try {
                            const { setAdminActive } = await import("@/lib/actions/users");
                            const res = await setAdminActive(u.id, targetState);
                            setNotice(res.success
                              ? { kind: "ok", text: `Account ${verb}d` }
                              : { kind: "err", text: res.error || "Failed" });
                            await reload();
                          } catch (err) {
                            setNotice({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
                          } finally { setBusy(false); }
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-md border ${
                          u.active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        } disabled:opacity-40`}
                      >
                        {u.active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AuditEntry {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: string;
  ip: string | null;
  createdAt: string | Date;
}

const PAGE_SIZE = 50;

function AuditTab() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { listAuditLogs } = await import("@/lib/actions/users");
      try {
        const res = await listAuditLogs({ action: actionFilter || undefined, page, pageSize: PAGE_SIZE });
        setRows(res.rows as unknown as AuditEntry[]);
        setTotal(res.total);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load audit log");
        setRows([]);
      }
    })();
  }, [actionFilter, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          placeholder="Filter by action (e.g. page_publish)"
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-72"
        />
        <span className="text-xs text-slate-500">{total} entries</span>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error === "Forbidden" ? "Your role does not permit viewing the audit log." : error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Time</th>
              <th className="px-5 py-3 font-semibold">Actor</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Target</th>
              <th className="px-5 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows === null && <tr><td colSpan={5} className="px-5 py-8 text-slate-400 text-center">Loading…</td></tr>}
            {rows?.length === 0 && !error && <tr><td colSpan={5} className="px-5 py-8 text-slate-400 text-center">No audit entries</td></tr>}
            {rows?.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 align-top">
                <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-5 py-2.5 text-xs">
                  <div className="text-slate-700">{r.actorEmail || "—"}</div>
                  <div className="text-slate-400">{r.actorRole || ""}</div>
                </td>
                <td className="px-5 py-2.5"><code className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{r.action}</code></td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{r.targetType ? `${r.targetType}:${(r.targetId || "").slice(0, 8)}` : "—"}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500 max-w-xs truncate" title={r.meta}>{r.meta !== "{}" ? r.meta : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm rounded-md border border-slate-200 disabled:opacity-40">Previous</button>
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm rounded-md border border-slate-200 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
