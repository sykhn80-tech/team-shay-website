export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const getAgentLoginUrl = () => {
  if (typeof window === "undefined") return "/agent-login";

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const loginPath = "/agent-login";

  if (window.location.pathname === loginPath) {
    return loginPath;
  }

  const params = new URLSearchParams({ next: currentPath || "/admin" });
  return `${loginPath}?${params.toString()}`;
};

const ensureTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();

  if (!oauthPortalUrl || !appId) {
    return getAgentLoginUrl();
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL("app-auth", ensureTrailingSlash(oauthPortalUrl));
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch {
    return getAgentLoginUrl();
  }
};
