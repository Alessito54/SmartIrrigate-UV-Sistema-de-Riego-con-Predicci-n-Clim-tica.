import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const JSON_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-oasys-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const ACTION_ON = new Set([
  "on",
  "start",
  "begin",
  "turn on",
  "activate",
  "open",
  "inicia",
  "iniciar",
  "inicie",
  "enciende",
  "encender",
  "prende",
  "prender",
  "activa",
  "activar",
]);

const ACTION_OFF = new Set([
  "off",
  "stop",
  "end",
  "turn off",
  "deactivate",
  "close",
  "apaga",
  "apagar",
  "deten",
  "detén",
  "detener",
  "para",
  "parar",
  "desactiva",
  "desactivar",
]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

function alexaResponse(text, shouldEndSession = true) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text,
      },
      shouldEndSession,
    },
  };
}

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(el|la|los|las|the|greenhouse|invernadero|section|seccion)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

function getPrivateKey() {
  let key = getEnv("FIREBASE_PRIVATE_KEY");
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function initFirebase() {
  if (getApps().length > 0) return getDatabase();

  const projectId = getEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getPrivateKey();
  const databaseURL = getEnv("FIREBASE_DATABASE_URL");

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error("Faltan variables Firebase Admin en Netlify.");
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });

  return getDatabase();
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function isAlexaRequest(body) {
  return body?.request?.type || body?.version === "1.0";
}

function getSlot(intent, names) {
  const slots = intent?.slots || {};
  for (const name of names) {
    const slot = slots[name];
    const value = slot?.value || slot?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name;
    if (value) return value;
  }
  return "";
}

function parseAction(rawAction, intentName = "", text = "") {
  const normalizedAction = normalize(rawAction);
  const normalizedIntent = normalize(intentName);
  const normalizedText = normalize(text);

  if (normalizedIntent.includes("stop") || normalizedIntent.includes("apagar")) return false;
  if (normalizedIntent.includes("start") || normalizedIntent.includes("iniciar")) return true;

  if (ACTION_ON.has(normalizedAction) || ACTION_ON.has(normalizedText)) return true;
  if (ACTION_OFF.has(normalizedAction) || ACTION_OFF.has(normalizedText)) return false;

  if (/\b(start|begin|on|activate|inicia|inicie|enciende|prende|activa)\b/.test(normalizedText)) return true;
  if (/\b(stop|off|deactivate|apaga|deten|detener|para|desactiva)\b/.test(normalizedText)) return false;

  return null;
}

function parseTextCommand(text) {
  const action = parseAction("", "", text);
  const quoted = [...String(text).matchAll(/[“"']([^“"']+)[”"']/g)].map((match) => match[1]);

  if (quoted.length >= 2) {
    return { action, greenhouseName: quoted[0], sectionName: quoted[1] };
  }

  const normalizedText = String(text).replace(/[“”"]/g, "");
  const match = normalizedText.match(
    /(?:riego|irrigation).*?(?:en|in)\s+(?:el\s+|la\s+|the\s+)?(?:invernadero\s+|greenhouse\s+)?(.+?)\s+(?:en|in)\s+(?:la\s+|the\s+)?(?:secci[oó]n|section)\s+(.+)$/i
  );

  if (!match) return { action, greenhouseName: "", sectionName: "" };
  return {
    action,
    greenhouseName: match[1].trim(),
    sectionName: match[2].trim(),
  };
}

   parseCommand(body) {
  if (isAlexaRequest(body)) {
    const request = body.request;
    if (request?.type === "LaunchRequest") {
      return { launch: true };
    }
    if (request?.type !== "IntentRequest") {
      return { ignored: true };
    }

    const intent = request.intent || {};

    const commandText = getSlot(intent, [
  "command",
  "Command",
  "comando",
  "Comando",
]);

if (commandText) {
  return {
    alexa: true,
    ...parseTextCommand(commandText),
    locale: request.locale || "es-MX",
  };
}

    const greenhouseName = getSlot(intent, [
      "greenhouseName",
      "GreenhouseName",
      "invernadero",
      "Invernadero",
      "nombreInvernadero",
    ]);
    const sectionName = getSlot(intent, [
      "sectionName",
      "SectionName",
      "seccion",
      "sección",
      "Seccion",
      "nombreSeccion",
    ]);
    const actionSlot = getSlot(intent, ["action", "Action", "accion", "Accion"]);
    const action = parseAction(actionSlot, intent.name);

    return {
      alexa: true,
      action,
      greenhouseName,
      sectionName,
      locale: request.locale || body.request?.locale || "es-MX",
    };
  }

  if (body.text || body.command) {
    return {
      ...parseTextCommand(body.text || body.command),
      locale: body.locale || "es-MX",
    };
  }

  return {
    action: typeof body.estado === "boolean" ? body.estado : parseAction(body.action || body.accion || ""),
    invId: body.invId || body.invernaderoId || "",
    secId: body.secId || body.seccionId || "",
    greenhouseName: body.greenhouseName || body.invernadero || body.nombreInvernadero || "",
    sectionName: body.sectionName || body.seccion || body.nombreSeccion || "",
    locale: body.locale || "es-MX",
  };
}

function namesMatch(candidateName, requestedName) {
  const candidate = normalize(candidateName);
  const requested = normalize(requestedName);
  if (!candidate || !requested) return false;
  return candidate === requested || candidate.includes(requested) || requested.includes(candidate);
}

async function findSectionByName(db, greenhouseName, sectionName) {
  const userId = getEnv("ALEXA_USER_ID");
  const snap = await db.ref("invernaderos").once("value");
  const invernaderos = snap.val() || {};
  let allowedIds = null;

  if (userId) {
    const userSnap = await db.ref(`usuarios/${userId}/invernaderos`).once("value");
    allowedIds = new Set(Object.keys(userSnap.val() || {}));
  }

  const candidates = Object.entries(invernaderos)
    .filter(([invId]) => !allowedIds || allowedIds.has(invId))
    .filter(([, inv]) => namesMatch(inv?.nombre, greenhouseName));

  for (const [invId, inv] of candidates) {
    const sections = Object.entries(inv?.secciones || {});
    const found = sections.find(([, sec]) => namesMatch(sec?.nombre, sectionName));
    if (found) {
      const [secId, sec] = found;
      return {
        invId,
        secId,
        invName: inv?.nombre || invId,
        secName: sec?.nombre || secId,
      };
    }
  }

  return null;
}

async function resolveTarget(db, command) {
  if (command.invId && command.secId) {
    return {
      invId: command.invId,
      secId: command.secId,
      invName: command.greenhouseName || command.invId,
      secName: command.sectionName || command.secId,
    };
  }

  const greenhouseName = command.greenhouseName || getEnv("ALEXA_DEFAULT_INVERNADERO") || getEnv("ALEXA_DEFAULT_GREENHOUSE");
  const sectionName = command.sectionName || getEnv("ALEXA_DEFAULT_SECCION") || getEnv("ALEXA_DEFAULT_SECTION");

  if (!greenhouseName || !sectionName) {
    throw new Error("Falta nombre del invernadero o de la sección.");
  }

  const target = await findSectionByName(db, greenhouseName, sectionName);
  if (!target) {
    throw new Error(`No encontré el invernadero "${greenhouseName}" con la sección "${sectionName}".`);
  }

  return target;
}

function validateToken(event, body) {
  const expected = getEnv("ALEXA_CONTROL_TOKEN");
  if (!expected) return true;

  const received =
    event.headers?.["x-oasys-token"] ||
    event.headers?.["X-OASYS-Token"] ||
    event.queryStringParameters?.token ||
    body.token;

  return received === expected;
}

function localizedText(locale, esText, enText) {
  return String(locale || "").toLowerCase().startsWith("en") ? enText : esText;
}

async function handleControl(event, body) {
  if (!validateToken(event, body)) {
    return json(401, { ok: false, error: "Token inválido." });
  }

  const command = parseCommand(body);
  if (command.launch) {
    return json(200, alexaResponse("OASYS listo. Puedes pedirme iniciar o apagar riego en un invernadero y sección.", false));
  }
  if (command.ignored) {
    return json(200, alexaResponse("Listo."));
  }
  if (command.action === null) {
    const text = localizedText(
      command.locale,
      "No entendí si quieres iniciar o apagar el riego.",
      "I did not understand whether you want to start or stop irrigation."
    );
    return json(200, isAlexaRequest(body) ? alexaResponse(text) : { ok: false, error: text });
  }

  const db = initFirebase();
  const target = await resolveTarget(db, command);
  const path = `invernaderos/${target.invId}/secciones/${target.secId}/control/riego`;

  await db.ref(path).set(command.action);

  const esText = command.action
    ? `Listo, inicié el riego en ${target.invName}, sección ${target.secName}.`
    : `Listo, apagué el riego en ${target.invName}, sección ${target.secName}.`;
  const enText = command.action
    ? `Done, I started irrigation in ${target.invName}, section ${target.secName}.`
    : `Done, I stopped irrigation in ${target.invName}, section ${target.secName}.`;
  const text = localizedText(command.locale, esText, enText);

  if (isAlexaRequest(body)) {
    return json(200, alexaResponse(text));
  }

  return json(200, {
    ok: true,
    message: text,
    path,
    value: command.action,
    invId: target.invId,
    secId: target.secId,
  });
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Usa POST." });
  }

  const body = parseBody(event);

  try {
    return await handleControl(event, body);
  } catch (err) {
    const message = err?.message || "Error interno.";
    if (isAlexaRequest(body)) {
      return json(200, alexaResponse(message));
    }
    return json(500, { ok: false, error: message });
  }
}
