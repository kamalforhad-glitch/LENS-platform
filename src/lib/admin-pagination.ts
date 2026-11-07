"use strict";

/**
 * Strict pagination query-string parser for admin list APIs.
 *
 * Accepts only canonical positive integer query strings (e.g. "1", "25").
 * Rejects decimals, negatives, zero, whitespace-only values, scientific
 * notation, partial numeric strings, non-numeric values, and unsafe
 * integers. Missing parameters fall back to safe defaults; malformed
 * parameters produce a discriminated error result carrying HTTP 400.
 *
 * No external dependencies are introduced.
 */

export type PaginationSuccess = {
  readonly ok: true;
  readonly page: number;
  readonly limit: number;
  readonly skip: number;
};

export type PaginationError = {
  readonly ok: false;
  readonly error: string;
  readonly status: number;
};

export type PaginationResult = PaginationSuccess | PaginationError;

export interface PaginationOptions {
  readonly defaultPage?: number;
  readonly defaultLimit?: number;
  readonly maxLimit?: number;
}

const CANONICAL_POSITIVE_INTEGER = /^[1-9]\d*$/;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function paginationError(message: string): PaginationError {
  return { ok: false, error: message, status: 400 };
}

/**
 * Validate a single query-string value as a canonical positive integer.
 *
 * Missing (null/undefined) is resolved to a default by the caller.
 * Empty ("") or any non-canonical value produces a 400 error. Nothing is
 * silently truncated or coerced.
 */
function parsePositiveInteger(
  raw: string,
  field: string
): { ok: true; value: number } | PaginationError {
  if (raw === "" || !CANONICAL_POSITIVE_INTEGER.test(raw)) {
    return paginationError(
      `Invalid ${field}: "${raw}". Must be a canonical positive integer (e.g. 1, 25).`
    );
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    return paginationError(
      `Invalid ${field}: "${raw}". Value must be a safe positive integer.`
    );
  }
  return { ok: true, value };
}

/**
 * Parse and validate `page` and `limit` query parameters.
 *
 * Behaviour:
 *   - Missing parameter        -> use default (page=1, limit=25)
 *   - Empty / malformed value  -> HTTP 400
 *   - page < 1                 -> HTTP 400
 *   - limit < 1 or > maxLimit  -> HTTP 400 (maxLimit defaults to 100)
 *   - unsafe page / limit / skip -> HTTP 400
 *
 * Returns a discriminated result: `{ ok: true; page; limit; skip }` on
 * success, or `{ ok: false; error; status: 400 }` on validation failure.
 *
 * `skip` is computed as `(page - 1) * limit` and must itself be a safe
 * integer (this rejects page/limit combinations that would overflow).
 */
export function parsePagination(
  pageParam: string | null | undefined,
  limitParam: string | null | undefined,
  options: PaginationOptions = {}
): PaginationResult {
  const {
    defaultPage = DEFAULT_PAGE,
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT,
  } = options;

  // Resolve page: missing -> default; present -> strict validation.
  let page: number;
  if (pageParam == null) {
    page = defaultPage;
  } else {
    const parsed = parsePositiveInteger(pageParam, "page");
    if (parsed.ok === false) return parsed;
    page = parsed.value;
  }

  // Resolve limit: missing -> default; present -> strict validation + cap.
  let limit: number;
  if (limitParam == null) {
    limit = defaultLimit;
  } else {
    const parsed = parsePositiveInteger(limitParam, "limit");
    if (parsed.ok === false) return parsed;
    limit = parsed.value;
    if (limit > maxLimit) {
      return paginationError(
        `Invalid limit: "${limitParam}". Limit must be between 1 and ${maxLimit}.`
      );
    }
  }

  // Validate skip = (page - 1) * limit; reject unsafe skip values.
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) {
    return paginationError(
      "Pagination skip value is unsafe. Reduce page or limit."
    );
  }

  return { ok: true, page, limit, skip };
}
