export default function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
              <div className="h-7 bg-slate-100 rounded w-14 mb-2" />
              <div className="h-2.5 bg-slate-100 rounded w-32" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
