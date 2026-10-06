type Props = {
  variant: "empty" | "error";
  emptyMessage?: string;
  errorMessage?: string;
};

export default function ContentListState({ variant, emptyMessage, errorMessage }: Props) {
  const isError = variant === "error";
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-slate-600">
        {isError ? "Content is unavailable right now." : "Nothing published yet."}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {isError
          ? errorMessage || "Please check back in a little while."
          : emptyMessage || "New content will appear here as soon as it is published."}
      </p>
    </div>
  );
}
