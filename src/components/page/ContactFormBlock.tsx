"use client";

import { useState, FormEvent } from "react";
import { isValidEmail } from "@/lib/validation";

import { asString } from "./PageSectionsView";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactFormBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title);
  const description = asString(content.description);
  const submitLabel = asString(content.submitLabel) || "Send Message";
  const fields = Array.isArray(content.fields) ? content.fields : [];
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    const clientError =
      payload.name.length < 2
        ? "Name must be at least 2 characters."
        : !isValidEmail(payload.email)
          ? "Please enter a valid email address."
          : payload.subject.length < 3
            ? "Subject must be at least 3 characters."
            : payload.message.length < 10
              ? "Message must be at least 10 characters."
              : null;

    if (clientError) {
      setSubmitState("error");
      setStatusMessage(clientError);
      return;
    }

    setSubmitState("submitting");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: { success?: boolean; message?: string; error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitState("error");
        setStatusMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitState("success");
      setStatusMessage(data.message || "Thank you for your message. We will get back to you soon.");
      form.reset();
    } catch {
      setSubmitState("error");
      setStatusMessage("Network error. Please check your connection and try again.");
    }
  }

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
        disabled={submitState === "submitting"}
        className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitState === "submitting" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}