"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Briefcase } from "lucide-react";

interface CareerFormData {
  title: string;
  titleBn: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  status: string;
  salary: string;
  applicationUrl: string;
  description: string;
  descriptionBn: string;
  requirements: string;
  requirementsBn: string;
  metaTitle: string;
  metaDescription: string;
}

export default function CareerEditor() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const isNew = rawId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CareerFormData>({
    title: "",
    titleBn: "",
    slug: "",
    department: "Research",
    location: "Dhaka, Bangladesh",
    type: "full_time",
    status: "draft",
    salary: "",
    applicationUrl: "",
    description: "",
    descriptionBn: "",
    requirements: "",
    requirementsBn: "",
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (!isNew && rawId) {
      fetch(`/api/admin/careers?id=${rawId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.career) {
            const c = d.career;
            setForm({
              title: c.title || "",
              titleBn: c.titleBn || "",
              slug: c.slug || "",
              department: c.department || "Research",
              location: c.location || "Dhaka, Bangladesh",
              type: c.type || "full_time",
              status: c.status || "draft",
              salary: c.salary || "",
              applicationUrl: c.applicationUrl || "",
              description: c.description || "",
              descriptionBn: c.descriptionBn || "",
              requirements: c.requirements || "",
              requirementsBn: c.requirementsBn || "",
              metaTitle: c.metaTitle || "",
              metaDescription: c.metaDescription || "",
            });
          } else {
            setError("Career opportunity not found");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load career opportunity");
          setLoading(false);
        });
    }
  }, [isNew, rawId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = "/api/admin/careers";
      const method = isNew ? "POST" : "PUT";
      const payload: Record<string, unknown> = { ...form };
      if (!isNew) {
        payload.id = rawId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save career opportunity");
      }

      setSuccess("Job listing saved successfully!");
      if (isNew && data.career?.id) {
        router.push(`/admin/careers/${data.career.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job listing?")) return;
    try {
      const res = await fetch("/api/admin/careers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rawId }),
      });
      if (res.ok) {
        router.push("/admin/careers");
      } else {
        const d = await res.json();
        alert(d.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading career opportunity...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/careers"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "Create Job Listing" : `Edit Role: ${form.title}`}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage openings, internships, and research fellow vacancies.
            </p>
          </div>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors self-start sm:self-auto"
            title="Delete listing"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mb-6 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-400" />
            Job Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Job Title (EN) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="Senior Policy Researcher"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Job Title (বাংলা)</label>
              <input
                type="text"
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bangla"
                placeholder="সিনিয়র পলিসি গবেষক"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-") })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="senior-policy-researcher"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="Research, Policy, Tech"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="Dhaka, Bangladesh / Hybrid"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employment Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="full_time" className="bg-[#0b121e]">Full Time</option>
                <option value="part_time" className="bg-[#0b121e]">Part Time</option>
                <option value="contract" className="bg-[#0b121e]">Contract</option>
                <option value="internship" className="bg-[#0b121e]">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="draft" className="bg-[#0b121e]">Draft</option>
                <option value="open" className="bg-[#0b121e]">Open / Accepting</option>
                <option value="closed" className="bg-[#0b121e]">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Salary Range / Compensation</label>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="Competitive / Negotiable"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Application URL or Form Link</label>
            <input
              type="url"
              value={form.applicationUrl}
              onChange={(e) => setForm({ ...form, applicationUrl: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              placeholder="https://forms.gle/... or mailto:careers@lensbd.org"
            />
          </div>
        </div>

        {/* Job Description */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white">Job Description & Responsibilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description (EN) *</label>
              <textarea
                rows={5}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                placeholder="Role summary and duties..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description (বাংলা)</label>
              <textarea
                rows={5}
                value={form.descriptionBn}
                onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-bangla"
                placeholder="দায়িত্ব ও কাজের বিবরণ বাংলায়..."
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white">Candidate Requirements & Qualifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Requirements (EN)</label>
              <textarea
                rows={5}
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                placeholder="Qualifications, skills, educational background..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Requirements (বাংলা)</label>
              <textarea
                rows={5}
                value={form.requirementsBn}
                onChange={(e) => setForm({ ...form, requirementsBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-bangla"
                placeholder="যোগ্যতা ও আবশ্যকীয় গুণাবলী বাংলায়..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/careers"
            className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isNew ? "Create Listing" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
