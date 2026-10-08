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

function getSharedSiteCookieDomain(req: Request) {
  const forwardedHost = req.headers["x-forwarded-host"];
  const forwardedOrigin = req.headers.origin;
  const candidates = [
    ...(Array.isArray(forwardedHost) ? forwardedHost : [forwardedHost]),
    req.hostname,
    ...(Array.isArray(forwardedOrigin) ? forwardedOrigin : [forwardedOrigin]),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const rawValue = String(candidate).split(",")[0].trim();
    const host = rawValue.includes("://") ? new URL(rawValue).hostname : rawValue.split(":")[0].toLowerCase();
    if (host === "teamshay-jerusalem-homes.co.il" || host.endsWith(".teamshay-jerusalem-homes.co.il")) {
      return ".teamshay-jerusalem-homes.co.il";
    }
  }

  return undefined;
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    domain: getSharedSiteCookieDomain(req),
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
