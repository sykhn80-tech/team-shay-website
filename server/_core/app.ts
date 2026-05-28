import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import {
  getActiveMessageTemplate,
  getWeeklyMarketingPayload,
  markMarketingActionSent,
} from "../db";

function hasValidWebhookSecret(req: express.Request) {
  const header = req.header("x-webhook-secret");
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return false;
  return header === expected;
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/webhooks/weekly-marketing", async (req, res) => {
    if (!hasValidWebhookSecret(req)) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    const weekNumber = req.query.weekNumber ? Number(req.query.weekNumber) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const payload = await getWeeklyMarketingPayload(weekNumber, year);
    const template = await getActiveMessageTemplate("exclusivity");

    res.json({
      weekNumber: payload.weekNumber,
      year: payload.year,
      template,
      properties: payload.actions.map((action) => ({
        marketingActionId: action.marketingActionId,
        property: action.property,
        message: action.message,
        targetAudience: action.targetAudience,
        leads: action.leads,
      })),
      actions: payload.actions,
    });
  });

  app.get("/api/webhooks/shabbat-template", async (req, res) => {
    if (!hasValidWebhookSecret(req)) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    const template = await getActiveMessageTemplate("shabbat");
    res.json({
      content: template?.content ?? "",
      imageUrl: template?.imageUrl ?? null,
      template,
    });
  });

  app.post("/api/webhooks/mark-sent", async (req, res) => {
    if (!hasValidWebhookSecret(req)) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    const marketingActionId = Number(req.body?.marketingActionId);
    const recipientCount = Number(req.body?.recipientCount ?? 0);

    if (!Number.isFinite(marketingActionId) || marketingActionId <= 0) {
      res.status(400).json({ error: "marketingActionId is required" });
      return;
    }

    const updated = await markMarketingActionSent(marketingActionId, Number.isFinite(recipientCount) ? recipientCount : 0);
    res.json({ success: true, updated });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

export default createApp();
