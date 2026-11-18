import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

const CONNECTION_STRING_REGEX = /(postgresql|postgres|prisma|mysql|mongodb(\+srv)?):\/\/[^\s]*/g;
const URL_USERINFO_REGEX = /\/\/[^/\s:]+:[^/\s@]+@/g;
const CREDENTIAL_QUERY_REGEX = /([?&](?:password|passwd|pwd|token|api_?key|secret|access_?key)=)[^&\s"']+/gi;
const JWT_REGEX = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const AUTH_HEADER_REGEX = /(Authorization|Bearer)\s+[^\s,}]+/gi;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function sanitizeError(error: unknown): string {
  if (!(error instanceof Error)) return "Operation failed";

  let message = error.message;
  message = message.replace(CONNECTION_STRING_REGEX, "[REDACTED_CONNECTION_STRING]");
  message = message.replace(URL_USERINFO_REGEX, "//[REDACTED_CREDENTIALS]@");
  message = message.replace(CREDENTIAL_QUERY_REGEX, "$1[REDACTED]");
  message = message.replace(JWT_REGEX, "[REDACTED_TOKEN]");
  message = message.replace(AUTH_HEADER_REGEX, "$1 [REDACTED_TOKEN]");

  return message || "Operation failed";
}

export const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  console.error("[lens-backend] Unhandled error:", sanitizeError(error));
  res.status(500).json({ error: "Internal server error" });
};
