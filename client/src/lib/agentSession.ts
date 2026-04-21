const AGENT_SESSION_STORAGE_KEY = "team_shay_agent_session_token";
const AGENT_SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){2}$/;

export function getStoredAgentSessionToken() {
  if (typeof window === "undefined") return null;

  const token = window.localStorage.getItem(AGENT_SESSION_STORAGE_KEY)?.trim() ?? "";
  if (!token) return null;

  if (!AGENT_SESSION_TOKEN_PATTERN.test(token)) {
    window.localStorage.removeItem(AGENT_SESSION_STORAGE_KEY);
    return null;
  }

  return token;
}

export function storeAgentSessionToken(token: string) {
  if (typeof window === "undefined") return;

  const normalizedToken = token.trim();
  if (!AGENT_SESSION_TOKEN_PATTERN.test(normalizedToken)) {
    window.localStorage.removeItem(AGENT_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AGENT_SESSION_STORAGE_KEY, normalizedToken);
}
