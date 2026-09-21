"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEvent, createEvent, updateEvent } from "@/lib/actions/events";

const CATEGORIES = ["Summit", "Workshop", "Conference", "Launch", "Webinar"];
const STATUSES = ["draft", "published", "cancelled"];

export default function EventEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [category, setCategory] = useState("Workshop");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (!isNew && params.id) {
      getEvent(params.id as string).then((item) => {
        if (item) {
          setId(item.id);
          setName(item.name);
          setDescription(item.description);
          setStartDate(item.startDate instanceof Date ? item.startDate.toISOString().split("T")[0] : String(item.startDate));
          setEndDate(item.endDate instanceof Date ? item.endDate.toISOString().split("T")[0] : String(item.endDate));
          setTime(item.time);
          setLocation(item.location);
          setLocationUrl(item.locationUrl || "");
          setRegistrationUrl(item.registrationUrl || "");
          setCategory(item.category);
          setCapacity(item.capacity?.toString() || "");
          setStatus(item.status);
        }
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  const handleSave = async (publishStatus?: string) => {
    setSaving(true);
    try {
      const data = {
        name, description, start_date: startDate, end_date: endDate,
        time, location, location_url: locationUrl || undefined,
        registration_url: registrationUrl || undefined, category,
        capacity: capacity ? parseInt(capacity) : undefined,
        status: (publishStatus || status) as "draft" | "published",
      };
      if (isNew) {
        const result = await createEvent(data);
        router.push(`/admin/events/${result.id}`);
      } else {
        await updateEvent(id, data);
        alert("Saved");
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? "New Event" : "Edit Event"}</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={() => handleSave("published")} disabled={saving} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-white rounded-lg disabled:opacity-50">Publish</button>
        </div>
      </div>
      <div className="space-y-5">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Time</label><input value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="8:00 AM - 6:00 PM" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Location *</label><input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="NAEM, Dhaka" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Location URL</label><input value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://..." /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Registration URL</label><input value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label><input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
      </div>
    </div>
  );
}
