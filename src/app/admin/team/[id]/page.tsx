"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTeamMember, createTeamMember, updateTeamMember } from "@/lib/actions/team";

const DEPARTMENTS = ["Research", "Policy", "Communications", "Operations", "General"];

export default function TeamEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("General");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    if (!isNew && params.id) {
      getTeamMember(params.id as string).then((item) => {
        if (item) {
          setId(item.id);
          setName(item.name);
          setRole(item.role);
          setDepartment(item.department);
          setBio(item.bio);
          setImage(item.image || "");
          setEmail(item.email || "");
          try {
            const social = JSON.parse(item.social);
            setLinkedin(social.linkedin || "");
            setTwitter(social.twitter || "");
          } catch {}
          setSortOrder(item.sortOrder.toString());
        }
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name, role, department, bio,
        image: image || undefined,
        email: email || undefined,
        social: { linkedin, twitter },
        sort_order: parseInt(sortOrder) || 0,
      };
      if (isNew) {
        const result = await createTeamMember(data);
        router.push(`/admin/team/${result.id}`);
      } else {
        await updateTeamMember(id, data);
        alert("Saved");
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Add Team Member" : "Edit Member"}</h1>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Role *</label><input value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="Senior Researcher" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label><select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label><input value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://..." /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label><input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://linkedin.com/in/..." /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Twitter URL</label><input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://twitter.com/..." /></div>
        </div>
      </div>
    </div>
  );
}
