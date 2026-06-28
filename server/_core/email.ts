import { ENV } from "./env";

type LeadNotificationInput = {
  leadId: number;
  fullName: string;
  phone: string;
  neighborhood: string;
  rooms: number;
  sqm: number;
  notes?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendLeadNotificationEmail(input: LeadNotificationInput) {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY is missing; lead notification email was not sent.");
    return false;
  }

  const subject = `ליד חדש מהאתר — ${input.fullName}`;
  const rows = [
    ["שם מלא", input.fullName],
    ["טלפון", input.phone],
    ["שכונה / אזור", input.neighborhood],
    ["חדרים", String(input.rooms)],
    ["גודל במ״ר", String(input.sqm)],
    ["מספר ליד", String(input.leadId)],
    ["הערות", input.notes || "—"],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#6b6b6b;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;color:#1A1A1A;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [ENV.leadNotificationEmail],
        subject,
        text,
        html: `
          <div dir="rtl" style="font-family:Arial, sans-serif;background:#FDF8F0;padding:24px;">
            <div style="max-width:620px;margin:0 auto;background:white;border-radius:18px;padding:24px;border:1px solid #ead9aa;">
              <p style="margin:0;color:#D4AF37;font-weight:800;">Team Shay</p>
              <h1 style="margin:8px 0 18px;color:#1A1A1A;">ליד חדש מהאתר</h1>
              <table style="width:100%;border-collapse:collapse;">${htmlRows}</table>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.warn("[Email] Failed to send lead notification email:", response.status, errorBody);
      return false;
    }
  } catch (error) {
    console.warn("[Email] Failed to send lead notification email:", error);
    return false;
  }

  return true;
}
