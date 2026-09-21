interface BulkActionsProps {
  selected: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  total: number;
  actions: { label: string; onClick: (ids: string[]) => void; variant?: "danger" | "default" }[];
}

export default function BulkActions({ selected, onSelectAll, onDeselectAll, total, actions }: BulkActionsProps) {
  if (selected.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-lg mb-4">
      <span className="text-sm font-medium text-teal-800">{selected.length} selected</span>
      <div className="flex gap-2 ml-auto">
        <button onClick={onDeselectAll} className="px-3 py-1 text-xs text-teal-600 hover:text-teal-800 transition-colors">Clear</button>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => action.onClick(selected)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              action.variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
