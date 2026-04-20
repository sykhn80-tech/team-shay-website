import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AgentAccount, User } from "../../drizzle/schema";
import { getAgentById } from "../db";
import { verifyAgentSessionToken } from "./agentSession";
import { sdk } from "./sdk";

export type AgentSession = Pick<
  AgentAccount,
  "id" | "email" | "name" | "phone" | "accountRole" | "roleTitle" | "photoUrl"
>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  agentSession: AgentSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  let user: User | null = null;
  let agentSession: AgentSession | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  const agentSessionCookie = opts.req.cookies?.team_shay_agent_session;
  const agentSessionHeader = opts.req.headers["x-team-shay-agent-session"];
  const headerToken = Array.isArray(agentSessionHeader)
    ? agentSessionHeader[0]
    : agentSessionHeader;

  let agentId = Number(agentSessionCookie);

  if ((!Number.isFinite(agentId) || agentId <= 0) && headerToken) {
    const verifiedHeaderSession = await verifyAgentSessionToken(headerToken);
    agentId = verifiedHeaderSession?.agentId ?? Number.NaN;
  }

  if (Number.isFinite(agentId) && agentId > 0) {
    try {
      const agent = await getAgentById(agentId);
      if (agent && agent.isActive) {
        agentSession = {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          phone: agent.phone,
          accountRole: agent.accountRole,
          roleTitle: agent.roleTitle,
          photoUrl: agent.photoUrl ?? null,
        };
      }
    } catch (error) {
      console.warn("[Agent Session] Failed to restore session:", error);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    agentSession,
  };
}
