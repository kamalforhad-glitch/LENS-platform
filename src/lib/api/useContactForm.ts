// ============================================================
// useContactForm — shared submit pipeline for every contact form
// on the site (/contact page and the CMS ContactFormBlock).
//
// Validation mirrors the server rules so feedback is announced in
// the live region instead of relying on native tooltips. The POST
// runs through `useApiMutation` (own pending state, abort of a
// superseded submit) and resolves optimistically: the success
// message paints before the round trip and is rolled back only if
// the API rejects the submission.
// ============================================================
"use client";

import { useCallback, useState, type FormEvent } from "react";
import { isValidEmail } from "@/lib/validation";
import { useApiMutation } from "@/lib/api/client";

export type ContactSubmitState = "idle" | "submitting" | "success" | "error";

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const FALLBACK_SUCCESS = "Thank you for your message. We will get back to you soon.";
const FALLBACK_ERROR = "Something went wrong. Please try again.";

/** Mirrors the server-side contact schema. */
function validate(payload: ContactPayload): string | null {
  if (payload.name.length < 2) return "Name must be at least 2 characters.";
  if (!isValidEmail(payload.email)) return "Please enter a valid email address.";
  if (payload.subject.length < 3) return "Subject must be at least 3 characters.";
  if (payload.message.length < 10) return "Message must be at least 10 characters.";
  return null;
}

export function useContactForm() {
  const [submitState, setSubmitState] = useState<ContactSubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const send = useApiMutation<ContactPayload, { message?: string; error?: string }>(
    (input, signal) =>
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal,
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || FALLBACK_ERROR);
        return data;
      }),
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Guard against duplicate submissions (double-click / Enter spam).
      if (send.isPending) return;

      const form = event.currentTarget;
      const formData = new FormData(form);
      const payload: ContactPayload = {
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        subject: String(formData.get("subject") ?? "").trim(),
        message: String(formData.get("message") ?? "").trim(),
      };

      const clientError = validate(payload);
      if (clientError) {
        setSubmitState("error");
        setStatusMessage(clientError);
        return;
      }

      // Optimistic: confirm immediately, roll back if the API disagrees.
      setSubmitState("success");
      setStatusMessage(FALLBACK_SUCCESS);
      form.reset();

      const result = await send.mutate(payload);
      if (!result.ok) {
        setSubmitState("error");
        setStatusMessage(result.error?.message || FALLBACK_ERROR);
      }
    },
    [send],
  );

  return { submitState, statusMessage, handleSubmit, isPending: send.isPending };
}
