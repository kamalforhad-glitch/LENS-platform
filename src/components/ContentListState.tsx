import React from "react";
import { AlertCircle, Clock } from "lucide-react";

type Props = {
  variant: "empty" | "error";
  emptyMessage?: string;
  errorMessage?: string;
  accent?: "indigo" | "teal" | "violet" | "emerald" | "slate";
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

export default function ContentListState({
  variant,
  emptyMessage,
  errorMessage,
  accent = "slate",
  action,
  icon,
}: Props) {
  const isError = variant === "error";

  const accentStyles: Record<
    "indigo" | "teal" | "violet" | "emerald" | "slate",
    {
      container: string;
      iconBg: string;
      iconText: string;
      titleText: string;
    }
  > = {
    indigo: {
      container: "border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-slate-50",
      iconBg: "bg-indigo-100 text-indigo-600",
      iconText: "text-indigo-600",
      titleText: "text-slate-800",
    },
    teal: {
      container: "border-teal-100 bg-gradient-to-b from-teal-50/40 to-slate-50",
      iconBg: "bg-teal-100 text-teal-600",
      iconText: "text-teal-600",
      titleText: "text-slate-800",
    },
    violet: {
      container: "border-violet-100 bg-gradient-to-b from-violet-50/40 to-slate-50",
      iconBg: "bg-violet-100 text-violet-600",
      iconText: "text-violet-600",
      titleText: "text-slate-800",
    },
    emerald: {
      container: "border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-slate-50",
      iconBg: "bg-emerald-100 text-emerald-600",
      iconText: "text-emerald-600",
      titleText: "text-slate-800",
    },
    slate: {
      container: "border-slate-200/80 bg-slate-50/80",
      iconBg: "bg-slate-100 text-slate-500",
      iconText: "text-slate-500",
      titleText: "text-slate-800",
    },
  };

  const style = isError
    ? {
        container: "border-rose-100 bg-rose-50/30",
        iconBg: "bg-rose-100 text-rose-600",
        iconText: "text-rose-600",
        titleText: "text-slate-900",
      }
    : accentStyles[accent] || accentStyles.slate;

  return (
    <div
      className={`rounded-3xl border border-dashed ${style.container} px-6 py-14 text-center max-w-2xl mx-auto shadow-xs`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center mx-auto mb-4 shadow-xs`}
        aria-hidden="true"
      >
        {icon ? (
          icon
        ) : isError ? (
          <AlertCircle className="w-6 h-6" />
        ) : (
          <Clock className="w-6 h-6" />
        )}
      </div>
      <p className={`text-base font-bold ${style.titleText}`}>
        {isError ? "Content is temporarily unavailable." : "Content In Preparation"}
      </p>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {isError
          ? errorMessage || "Please check back in a little while or contact our editorial desk."
          : emptyMessage || "New entries and publications will appear here as soon as they are approved."}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
