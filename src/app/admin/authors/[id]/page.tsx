"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAuthorProfile, createAuthorProfile, updateAuthorProfile } from "@/lib/actions/authors";

export default function AuthorEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [orcid, setOrcid] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [image, setImage] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!isNew && params.id) {
      getAuthorProfile(params.id as string).then((item) => {
        if (item) {
          setId(item.id);
          setName(item.name);
          setEmail(item.email || "");
          setAffiliation(item.affiliation);
          setOrcid(item.orcid || "");
          setBio(item.bio);
          try { setExpertise(JSON.parse(item.expertise).join(", ")); } catch { setExpertise(""); }
          setImage(item.image || "");
          setWebsite(item.website || "");
        }
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name, email: email || undefined, affiliation, orcid: orcid || undefined,
        bio, expertise: expertise.split(",").map((t) => t.trim()).filter(Boolean),
        image: image || undefined, website: website || undefined,
      };
      if (isNew) {
        const result = await createAuthorProfile(data);
        router.push(`/admin/authors/${result.id}`);
      } else {
        await updateAuthorProfile(id, data);
        alert("Saved successfully");
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? "New Author Profile" : "Edit Author"}</h1>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 text-white rounded-lg disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ORCID</label>
            <input value={orcid} onChange={(e) => setOrcid(e.target.value)} placeholder="0000-0000-0000-0000" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Affiliation</label>
          <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expertise (comma separated)</label>
          <input value={expertise} onChange={(e) => setExpertise(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" placeholder="media literacy, press freedom, fact-checking" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image URL</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
