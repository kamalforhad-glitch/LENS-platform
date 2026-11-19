export default function AdminListLoadingSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-10 w-64 bg-slate-100 rounded-lg" />
        <div className="h-10 w-40 bg-slate-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="h-4 flex-1 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded hidden sm:block" />
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
            <div className="h-7 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
