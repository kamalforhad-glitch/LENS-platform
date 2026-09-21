"use client";

import { useEffect, useState } from "react";

interface IndexStatus {
  totalEmbeddings: number;
  indexedCount: number;
  documentTypes: { type: string; count: number }[];
}

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
}

export default function AdminAIPage() {
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const [idxRes, chatRes] = await Promise.all([
        fetch("/api/ai/index"),
        fetch("/api/admin/ai/stats"),
      ]);
      const idx = await idxRes.json();
      const chat = chatRes.ok ? await chatRes.json() : null;
      setIndexStatus(idx);
      setChatStats(chat);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleIndexAll = async () => {
    setIndexing(true);
    setIndexResult(null);
    try {
      const res = await fetch("/api/ai/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "index_all" }),
      });
      const data = await res.json();
      setIndexResult(`Indexed ${data.indexed} chunks from ${data.total} documents. ${data.errors?.length || 0} errors.`);
      fetchStatus();
    } catch {
      setIndexResult("Indexing failed");
    } finally {
      setIndexing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading AI status...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Research Assistant</h1>
        <p className="text-sm text-slate-500 mt-1">Manage document indexing, embeddings, and AI usage</p>
      </div>

      {/* Index Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Embeddings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{indexStatus?.totalEmbeddings || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Indexed Chunks</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{indexStatus?.indexedCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Conversations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{chatStats?.totalConversations || 0}</p>
        </div>
      </div>

      {/* Document Types */}
      {indexStatus?.documentTypes && indexStatus.documentTypes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Indexed Documents by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {indexStatus.documentTypes.map((dt) => (
              <div key={dt.type} className="p-4 rounded-lg bg-slate-50 text-center">
                <p className="text-lg font-bold text-slate-900">{dt.count}</p>
                <p className="text-xs text-slate-500 mt-1">{dt.type.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indexing Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Document Indexing</h2>
        <p className="text-sm text-slate-500 mb-4">
          Index all published research articles and publications for AI-powered semantic search.
          This generates embeddings for each document chunk.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleIndexAll}
            disabled={indexing}
            className="px-5 py-2.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
          >
            {indexing ? "Indexing..." : "Re-index All Documents"}
          </button>
          {indexResult && (
            <p className="text-sm text-slate-600">{indexResult}</p>
          )}
        </div>
      </div>

      {/* AI Usage Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">AI Usage Statistics</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Total Messages</p>
            <p className="text-lg font-bold text-slate-900">{chatStats?.totalMessages || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Total Tokens Used</p>
            <p className="text-lg font-bold text-slate-900">{chatStats?.totalTokens?.toLocaleString() || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Avg Tokens/Message</p>
            <p className="text-lg font-bold text-slate-900">
              {chatStats?.totalMessages ? Math.round((chatStats.totalTokens || 0) / chatStats.totalMessages) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Configuration</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">Embedding Model</p>
            <p className="font-mono text-slate-700">text-embedding-3-small</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">Chat Model</p>
            <p className="font-mono text-slate-700">gpt-4o-mini</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">Chunk Size</p>
            <p className="font-mono text-slate-700">1000 characters</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">Max Tokens per Response</p>
            <p className="font-mono text-slate-700">2000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
