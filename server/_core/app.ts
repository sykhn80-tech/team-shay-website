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

function toMakeSingleMessage(message: string | null) {
  return message ? message.replace(/\r?\n/g, "\u2028") : null;
}

function normalizeWebhookSearch(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^A-Za-z0-9\u0590-\u05FF]+/g, "")
    .toLowerCase();
}

function searchMatches(value: string | null | undefined, query: string) {
  const normalizedValue = normalizeWebhookSearch(value);
  const normalizedQuery = normalizeWebhookSearch(query);
  return Boolean(normalizedValue && normalizedQuery && (
    normalizedValue === normalizedQuery ||
    normalizedValue.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedValue)
  ));
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
    const testRecipientName = typeof req.query.testRecipientName === "string" ? req.query.testRecipientName.trim() : "";
    const testChatId = typeof req.query.testChatId === "string" ? req.query.testChatId.trim() : "";
    const testPropertyAddress = typeof req.query.testPropertyAddress === "string" ? req.query.testPropertyAddress.trim() : "";
    const testMarketingActionId = req.query.testMarketingActionId ? Number(req.query.testMarketingActionId) : undefined;

    const payload = await getWeeklyMarketingPayload(weekNumber, year);
    const template = await getActiveMessageTemplate("exclusivity");
    const recipients = payload.actions.flatMap((action) =>
      action.recipients.map((recipient) => ({
        ...recipient,
        marketingActionId: action.marketingActionId,
        propertyId: action.property?.id ?? null,
        propertyTitle: action.property?.title ?? null,
        propertyAddress: action.property?.address ?? null,
      })),
    );
    const filteredTestRecipients = recipients.filter((recipient) => {
      if (testMarketingActionId && recipient.marketingActionId !== testMarketingActionId) return false;
      if (testPropertyAddress && !searchMatches(`${recipient.propertyAddress ?? ""} ${recipient.propertyTitle ?? ""}`, testPropertyAddress)) return false;
      return true;
    });
    const testScope = testMarketingActionId || testPropertyAddress ? filteredTestRecipients : recipients;
    const selectedTestRecipient = testRecipientName
      ? testScope.find((recipient) => searchMatches(recipient.name, testRecipientName)) ?? null
      : testScope.length === 1
        ? testScope[0]
        : null;
    const isTestRequest = Boolean(testRecipientName || testChatId || testPropertyAddress || testMarketingActionId);
    const responseRecipients = selectedTestRecipient
      ? [selectedTestRecipient]
      : isTestRequest
        ? testScope
        : recipients;
    const singleRecipient = selectedTestRecipient ?? (responseRecipients.length === 1 ? responseRecipients[0] : null);
    const updates = responseRecipients.map((recipient) => ({
      chatId: testChatId && singleRecipient?.leadId === recipient.leadId ? testChatId : recipient.chatId,
      message: recipient.message,
      makeMessage: toMakeSingleMessage(recipient.message),
      recipientName: recipient.name,
      leadId: recipient.leadId,
      marketingActionId: recipient.marketingActionId,
      propertyId: recipient.propertyId,
      propertyTitle: recipient.propertyTitle,
      propertyAddress: recipient.propertyAddress,
    }));

    res.json({
      weekNumber: payload.weekNumber,
      year: payload.year,
      template,
      recipients: responseRecipients,
      recipientCount: responseRecipients.length,
      updates,
      sellerUpdates: updates,
      chatId: singleRecipient && testChatId ? testChatId : singleRecipient?.chatId ?? null,
      message: singleRecipient?.message ?? null,
      makeMessage: toMakeSingleMessage(singleRecipient?.message ?? null),
      recipientName: singleRecipient?.name ?? null,
      marketingActionId: singleRecipient?.marketingActionId ?? null,
      propertyId: singleRecipient?.propertyId ?? null,
      propertyTitle: singleRecipient?.propertyTitle ?? null,
      propertyAddress: singleRecipient?.propertyAddress ?? null,
      testMode: Boolean(singleRecipient && testChatId),
      properties: payload.actions.map((action) => ({
        marketingActionId: action.marketingActionId,
        property: action.property,
        message: action.message,
        targetAudience: action.targetAudience,
        leads: action.leads,
        recipients: action.recipients,
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
