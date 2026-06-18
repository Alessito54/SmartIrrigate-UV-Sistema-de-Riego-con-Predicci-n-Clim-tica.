// Netlify Function: send-sms
// Sends SMS alerts via Twilio API (no SDK needed — uses fetch)

const JSON_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

function getEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Usa POST." });
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ok: false, error: "Body inválido." });
  }

  const { to, alerts } = body;

  if (!to || !alerts || !Array.isArray(alerts) || alerts.length === 0) {
    return json(400, {
      ok: false,
      error: "Faltan parámetros: 'to' (número destino) y 'alerts' (array de alertas).",
    });
  }

  // Validate phone format (must start with +)
  if (!/^\+\d{10,15}$/.test(to)) {
    return json(400, {
      ok: false,
      error: "Formato de número inválido. Usa formato internacional: +521234567890",
    });
  }

  const accountSid = getEnv("TWILIO_ACCOUNT_SID");
  const authToken = getEnv("TWILIO_AUTH_TOKEN");
  const fromNumber = getEnv("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    return json(500, {
      ok: false,
      error: "Twilio no está configurado en el servidor.",
    });
  }

  // Build SMS message
  const toneEmoji = {
    danger: "🔴",
    warning: "⚠️",
    info: "ℹ️",
    success: "✅",
  };

  const header = "🌱 OASYS — Alertas de sensores\n";
  const alertLines = alerts.slice(0, 8).map((a) => {
    const emoji = toneEmoji[a.tone] || "📢";
    return `${emoji} ${a.title}\n   ${a.detail}`;
  });
  const messageBody = `${header}\n${alertLines.join("\n\n")}\n\n— Sistema OASYS`;

  // Twilio REST API call (no SDK)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: messageBody,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[send-sms] Twilio error:", result);
      return json(response.status, {
        ok: false,
        error: result.message || "Error al enviar SMS.",
        code: result.code,
      });
    }

    return json(200, {
      ok: true,
      message: `SMS enviado a ${to}`,
      sid: result.sid,
      status: result.status,
    });
  } catch (err) {
    console.error("[send-sms] Fetch error:", err);
    return json(500, {
      ok: false,
      error: "Error de conexión con Twilio.",
    });
  }
}
