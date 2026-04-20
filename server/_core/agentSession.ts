import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const AGENT_SESSION_AUDIENCE = "team-shay-agent-session";
const AGENT_SESSION_ISSUER = "team-shay-admin";

function getAgentSessionSecret() {
  const secret = ENV.cookieSecret || ENV.appId || "team-shay-local-agent-session-secret";
  return new TextEncoder().encode(secret);
}

export async function createAgentSessionToken(agentId: number) {
  const secretKey = getAgentSessionSecret();

  return new SignJWT({
    agentId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(AGENT_SESSION_ISSUER)
    .setAudience(AGENT_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey);
}

export async function verifyAgentSessionToken(token: string | null | undefined) {
  if (!token) return null;

  try {
    const secretKey = getAgentSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
      issuer: AGENT_SESSION_ISSUER,
      audience: AGENT_SESSION_AUDIENCE,
    });

    const agentId = Number(payload.agentId);
    if (!Number.isFinite(agentId) || agentId <= 0) {
      return null;
    }

    return {
      agentId,
    };
  } catch {
    return null;
  }
}
