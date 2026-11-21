"use client";

import { useContactForm } from "@/lib/api/useContactForm";
import { asString } from "./PageSectionsView";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ContactFormBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title);
  const description = asString(content.description);
  const submitLabel = asString(content.submitLabel) || "Send Message";
  const fields = Array.isArray(content.fields) ? content.fields : [];
  const { submitState, statusMessage, handleSubmit, isPending } = useContactForm();

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 lg:p-10 max-w-2xl mx-auto">
      {title && (
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {fields.map((field: Record<string, unknown>, idx: number) => {
          const f = field as Record<string, unknown>;
          const type = asString(f.type) || "text";
          const required = asString(f.required) === "true";
          const fieldName = asString(f.name);
          const fieldLabel = asString(f.label);
          const placeholder = asString(f.placeholder);

          if (type === "textarea") {
            return (
              <div key={idx} className="space-y-1.5">
                <label
                  htmlFor={fieldName || `field-${idx}`}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  {fieldLabel}
                  {required && <span className="text-teal-600 ml-1 font-bold">*</span>}
                </label>
                <textarea
                  id={fieldName || `field-${idx}`}
                  name={fieldName}
                  placeholder={placeholder}
                  required={required}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                />
              </div>
            );
          }

          if (type === "select") {
            return (
              <div key={idx} className="space-y-1.5">
                <label
                  htmlFor={fieldName || `field-${idx}`}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  {fieldLabel}
                  {required && <span className="text-teal-600 ml-1 font-bold">*</span>}
                </label>
                <select
                  id={fieldName || `field-${idx}`}
                  name={fieldName}
                  required={required}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                >
                  <option value="">{placeholder || "Select..."}</option>
                </select>
              </div>
            );
          }

          return (
            <div key={idx} className="space-y-1.5">
              <label
                htmlFor={fieldName || `field-${idx}`}
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                {fieldLabel}
                {required && <span className="text-teal-600 ml-1 font-bold">*</span>}
              </label>
              <input
                id={fieldName || `field-${idx}`}
                type={type}
                name={fieldName}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              />
            </div>
          );
        })}

        {submitState === "error" && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in duration-200"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {submitState === "success" && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed font-medium">{statusMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md hover:shadow-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span>Sending…</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <Send className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
