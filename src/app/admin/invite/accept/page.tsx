"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function AcceptForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(token) && password.length >= 10 && password === confirm && state === "idle";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setState("busy");
    setError(null);
    try {
      const { acceptAccountToken } = await import("@/lib/actions/users");
      const res = await acceptAccountToken({ token, name, password });
      if (res.success) {
        setState("done");
      } else {
        setError(res.error || "This link could not be used.");
        setState("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link could not be used.");
      setState("idle");
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-4">No invitation token provided.</p>
        <Link href="/admin/login" className="text-teal-600 hover:text-teal-500 text-sm font-medium">Back to login</Link>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-slate-900 font-bold text-lg mb-1">Password saved</h2>
        <p className="text-slate-400 text-sm mb-6">You can now sign in with your new password.</p>
        <Link
          href="/admin/login"
          className="inline-flex px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-slate-400 text-sm">
        Set the password for your LENS admin account. This link is single-use.
      </p>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          placeholder="Your full name (optional)"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">New Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={10}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          placeholder="At least 10 characters"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Confirm Password</label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {state === "busy" ? "Saving…" : "Save Password"}
      </button>
    </form>
  );
}

export default function InviteAcceptPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center">
            <Image
              src="/images/logo/lens-logo-dark.png"
              alt="LENS — Lighthouse for Evolving Narrative Systems"
              width={140}
              height={36}
              className="h-9 w-auto mb-2 object-contain"
              priority
            />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">Admin Account Setup</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <Suspense fallback={<p className="text-sm text-slate-400 text-center">Loading…</p>}>
            <AcceptForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
