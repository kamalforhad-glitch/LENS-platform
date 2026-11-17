// URL allow-list used both when authoring (Zod) and rendering (markdown).
// Raw HTML is never executed by the focus renderer; blocking unsafe schemes
// here also prevents dangerous links/images from being emitted at all.

export function isSafeFocusUrl(raw: string | null | undefined): boolean {
  if (raw == null) return true;
  const value = raw.trim();
  if (!value) return true;

  // Control characters (including encoded-newline smuggling after trim) and
  // protocol-relative URLs are never accepted.
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  if (value.startsWith("//")) return false;
  if (/^(javascript|data|vbscript|file):/i.test(value)) return false;

  if (
    value.startsWith("/") ||
    value.startsWith("#") ||
    /^mailto:[^\s]+@[^\s]+$/i.test(value) ||
    /^tel:[+\d][\d\s()-]*$/i.test(value)
  ) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Returns a normalized, safe URL or `null` when the input must not be linked. */
export function safeFocusUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value) return null;
  return isSafeFocusUrl(value) ? value : null;
}
