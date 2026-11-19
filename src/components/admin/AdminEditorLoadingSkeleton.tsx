export default function AdminEditorLoadingSkeleton() {
  return (
    <div className="p-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-56 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-80 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-100 rounded-lg" />
          <div className="h-10 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-100 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
