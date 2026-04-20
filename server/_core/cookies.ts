import type { CookieOptions, Request } from "express";

function hasHttpsProtocol(value?: string | string[]) {
  if (!value) return false;

  const raw = Array.isArray(value) ? value.join(",") : value;

  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .some((item) => item === "https" || item.startsWith("https://"));
}

function headerUsesHttps(headerValue?: string | string[]) {
  if (!headerValue) return false;

  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!raw) return false;

  try {
    return new URL(raw).protocol === "https:";
  } catch {
    return false;
  }
}

function isSecureRequest(req: Request) {
  if (req.secure || req.protocol === "https") return true;
  if (hasHttpsProtocol(req.headers["x-forwarded-proto"])) return true;
  if (headerUsesHttps(req.headers.origin)) return true;
  if (headerUsesHttps(req.headers.referer)) return true;
  return false;
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
