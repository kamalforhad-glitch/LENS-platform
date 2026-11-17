"use client";

import { useContactForm } from "@/lib/api/useContactForm";

import { asString } from "./PageSectionsView";

export default function ContactFormBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title);
  const description = asString(content.description);
  const submitLabel = asString(content.submitLabel) || "Send Message";
  const fields = Array.isArray(content.fields) ? content.fields : [];
  const { submitState, statusMessage, handleSubmit, isPending } = useContactForm();

  return (
    <form className="space-y-6 max-w-xl" onSubmit={handleSubmit} noValidate>
      {title && <h3 className="text-xl font-bold text-slate-900">{title}</h3>}
      {description && <p className="text-slate-600">{description}</p>}
      {fields.map((field: Record<string, unknown>, idx: number) => {
        const f = field as Record<string, unknown>;
        const type = asString(f.type) || "text";
        const required = asString(f.required) === "true";
        if (type === "textarea") {
          return (
            <div key={idx} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">{asString(f.label)}{required && <span className="text-red-500 ml-1">*</span>}</label>
              <textarea name={asString(f.name)} placeholder={asString(f.placeholder)} required={required} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" rows={4} />
            </div>
          );
        }
        if (type === "select") {
          return (
            <div key={idx} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">{asString(f.label)}{required && <span className="text-red-500 ml-1">*</span>}</label>
              <select name={asString(f.name)} required={required} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">{asString(f.placeholder) || "Select..."}</option>
              </select>
            </div>
          );
        }
        return (
          <div key={idx} className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">{asString(f.label)}{required && <span className="text-red-500 ml-1">*</span>}</label>
            <input type={type} name={asString(f.name)} placeholder={asString(f.placeholder)} required={required} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        );
      })}
      {submitState === "error" && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {statusMessage}
        </p>
      )}
      {submitState === "success" && (
        <p role="status" className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
          {statusMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}