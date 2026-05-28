export async function sendWhatsApp(phone: string, message: string, imageUrl?: string) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    throw new Error("Green API credentials are missing");
  }

  const base = `https://api.green-api.com/waInstance${instanceId}`;
  const normalized = phone.replace(/\D/g, "");
  const localNormalized = normalized.startsWith("972")
    ? normalized
    : `972${normalized.replace(/^0/, "")}`;
  const chatId = `${localNormalized}@c.us`;

  if (imageUrl) {
    return fetch(`${base}/sendFileByUrl/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        urlFile: imageUrl,
        fileName: "image.jpg",
        caption: message,
      }),
    });
  }

  return fetch(`${base}/sendMessage/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      message,
    }),
  });
}
