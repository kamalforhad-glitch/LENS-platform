"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getReviewAssignment, updateReviewStatus, addReviewComment, resolveReviewComment } from "@/lib/actions/review";

interface ReviewData {
  id: string;
  status: string;
  deadline: string | null;
  notes: string;
  created_at: string;
  reviewer: { id: string; name: string; email: string } | null;
  article: {
    id: string; slug: string; title: string; description: string; content: string;
    category: string; author: string; version: number; reviewStatus: string;
    abstract: string; methodology: string; doi: string | null;
  };
  comments: {
    id: string; section: string; lineRef: string | null; comment: string;
    severity: string; resolved: boolean; created_at: string;
  }[];
}

const SEVERITIES = ["suggestion", "issue", "critical", "praise"];

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentSection, setCommentSection] = useState("general");
  const [commentSeverity, setCommentSeverity] = useState("suggestion");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const result = await getReviewAssignment(params.id as string);
    setData(result as unknown as ReviewData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (status: string) => {
    setSubmitting(true);
    await updateReviewStatus(params.id as string, status as "pending" | "in_progress" | "completed" | "declined");
    await load();
    setSubmitting(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    await addReviewComment(params.id as string, {
      section: commentSection,
      comment: newComment,
      severity: commentSeverity as "suggestion" | "issue" | "critical" | "praise",
    });
    setNewComment("");
    await load();
    setSubmitting(false);
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await resolveReviewComment(commentId, resolved);
    await load();
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-slate-400">Review not found.</div>;

  const unresolvedCount = data.comments.filter((c) => !c.resolved).length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/review" className="text-sm text-slate-400 hover:text-teal-600">Reviews</Link>
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{data.article.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.article.category} &middot; v{data.article.version} &middot; by {data.article.author}
          </p>
        </div>
        <div className="flex gap-2">
          {data.status === "pending" && (
            <button onClick={() => handleStatusChange("in_progress")} disabled={submitting} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
              Start Review
            </button>
          )}
          {data.status === "in_progress" && (
            <>
              <button onClick={() => handleStatusChange("completed")} disabled={submitting} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                Complete
              </button>
              <button onClick={() => handleStatusChange("declined")} disabled={submitting} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                Decline
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Article Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Article Content</h2>
            {data.article.abstract && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Abstract</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{data.article.abstract}</p>
              </div>
            )}
            {data.article.methodology && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Methodology</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{data.article.methodology}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{data.article.description}</p>
            </div>
            {data.article.content && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Full Content</h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">{data.article.content}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Review Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium">{data.status.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Reviewer</span><span className="font-medium">{data.reviewer?.name || "Unassigned"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deadline</span><span className="font-medium">{data.deadline ? new Date(data.deadline).toLocaleDateString() : "None"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Comments</span><span className="font-medium">{data.comments.length} ({unresolvedCount} unresolved)</span></div>
              {data.article.doi && (
                <div className="flex justify-between"><span className="text-slate-500">DOI</span><span className="font-medium text-xs">{data.article.doi}</span></div>
              )}
            </div>
          </div>

          {/* Add Comment */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Comment</h3>
            <div className="space-y-3">
              <select value={commentSection} onChange={(e) => setCommentSection(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="general">General</option>
                <option value="abstract">Abstract</option>
                <option value="methodology">Methodology</option>
                <option value="results">Results</option>
                <option value="discussion">Discussion</option>
                <option value="conclusion">Conclusion</option>
                <option value="references">References</option>
              </select>
              <select value={commentSeverity} onChange={(e) => setCommentSeverity(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" placeholder="Write your review comment..." />
              <button onClick={handleAddComment} disabled={!newComment.trim() || submitting} className="w-full px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50">
                {submitting ? "Adding..." : "Add Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {data.comments.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Review Comments ({data.comments.length})</h3>
          <div className="space-y-4">
            {data.comments.map((comment) => (
              <div key={comment.id} className={`p-4 rounded-lg border ${comment.resolved ? "bg-green-50/50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        comment.severity === "critical" ? "bg-red-100 text-red-700" :
                        comment.severity === "issue" ? "bg-amber-100 text-amber-700" :
                        comment.severity === "praise" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {comment.severity}
                      </span>
                      <span className="text-xs text-slate-400">{comment.section}</span>
                      {comment.lineRef && <span className="text-xs text-slate-400">@ {comment.lineRef}</span>}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                  <button
                    onClick={() => handleResolve(comment.id, !comment.resolved)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${comment.resolved ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"}`}
                  >
                    {comment.resolved ? "Resolved" : "Resolve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
