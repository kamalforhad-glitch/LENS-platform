// ============================================================
// Shared error sanitization utility.
//
// Strips sensitive values from Error messages before they are
// logged or returned to clients. Redacts:
//   - PostgreSQL connection strings (postgresql://, postgres://)
//   - Supabase pooler hostnames (aws-0-*.pooler.supabase.com)
//   - Cloudflare R2 hostnames (*.r2.cloudflarestorage.com)
//   - AWS access keys and secret keys (heuristic: 20-40 char hex)
//   - Authorization headers and bearer tokens
//
// Never returns the original error message unchanged if it
// contains a redactable pattern. Returns a safe generic
// message for non-Error values.
// ============================================================

const CONNECTION_STRING_REGEX = /(postgresql|postgres):\/\/[^\s]*/g;
const SUPABASE_POOLER_REGEX = /aws-0-[a-z0-9-]+\.pooler\.supabase\.com/g;
const R2_HOST_REGEX = /[a-z0-9-]+\.r2\.cloudflarestorage\.com/g;
// AWS access keys are typically 20 uppercase alphanumeric chars;
// secret keys are 40 hex chars. Match standalone tokens that look
// like credentials, but avoid false positives on ordinary words.
const AWS_ACCESS_KEY_REGEX = /\b[A-Z0-9]{20}\b/g;
const AWS_SECRET_KEY_REGEX = /\b[0-9a-fA-F]{40}\b/g;
const AUTH_HEADER_REGEX = /(Authorization|Bearer)\s+[^\s,}]+/gi;

/**
 * Sanitizes an unknown value into a safe string for logging or
 * client responses. Error messages are scrubbed of secrets and
 * connection details; non-Error values produce a generic message.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    let msg = error.message;

    msg = msg.replace(CONNECTION_STRING_REGEX, "[REDACTED_CONNECTION_STRING]");
    msg = msg.replace(SUPABASE_POOLER_REGEX, "[REDACTED_HOST]");
    msg = msg.replace(R2_HOST_REGEX, "[REDACTED_HOST]");
    msg = msg.replace(AWS_ACCESS_KEY_REGEX, "[REDACTED_ACCESS_KEY]");
    msg = msg.replace(AWS_SECRET_KEY_REGEX, "[REDACTED_SECRET_KEY]");
    msg = msg.replace(AUTH_HEADER_REGEX, "$1 [REDACTED_TOKEN]");

    // Also scrub the error cause chain if present.
    const cause = (error as { cause?: unknown }).cause;
    if (cause && cause instanceof Error) {
      const causeMsg = sanitizeError(cause);
      if (causeMsg !== error.message) {
        msg += ` | caused by: ${causeMsg}`;
      }
    }

    return msg || "Operation failed";
  }

  return "Operation failed";
}
