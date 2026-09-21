// ============================================================
// Input Sanitization & Validation Utilities
// ============================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strip HTML tags from input
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate name (no special characters, reasonable length)
 */
export function isValidName(name: string): boolean {
  return /^[a-zA-Z\s\-'.]{1,100}$/.test(name);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  return /^[\d\s+\-()]{7,20}$/.test(phone);
}

/**
 * Trim and limit string length
 */
export function clampString(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Generate CSRF token (for client-side forms)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Rate limit check (client-side tracking)
 */
const rateLimitMap = new Map<string, number[]>();

export function isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) || [];
  const recentAttempts = attempts.filter((t) => now - t < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return true;
  }

  recentAttempts.push(now);
  rateLimitMap.set(key, recentAttempts);
  return false;
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, string>>(data: T): T {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(data)) {
    sanitized[key as keyof T] = clampString(stripHtml(value), 1000) as T[keyof T];
  }
  return sanitized;
}
