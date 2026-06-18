/**
 * Service: Twilio SMS alerts via Netlify Function
 *
 * Calls /.netlify/functions/send-sms to dispatch sensor alerts.
 */

const SMS_ENDPOINT = "/.netlify/functions/send-sms";

/**
 * Send sensor alert notifications via SMS.
 *
 * @param {string} to   — Phone number in E.164 format, e.g. "+521234567890"
 * @param {Array}  alerts — Array of { tone, title, detail }
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function enviarAlertasSMS(to, alerts) {
  if (!to || !alerts || alerts.length === 0) {
    return { ok: false, error: "Número o alertas faltantes." };
  }

  try {
    const response = await fetch(SMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, alerts }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[SMS Service] Error:", err);
    return { ok: false, error: "No se pudo contactar al servidor." };
  }
}
