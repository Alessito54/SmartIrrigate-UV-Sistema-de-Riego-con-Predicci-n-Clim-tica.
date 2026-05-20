/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { getDatabase, ref, update, get } = require("firebase/database");
const app = express();
app.use(express.json());
app.use(cors());

// Inicializar Firebase
let db = null;
try {
  const admin = require("firebase-admin");
  const serviceAccount = require("./firebase-key.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://tu-app.firebaseio.com",
  });
  db = admin.database();
} catch (err) {
  console.log("[Server] Firebase Admin no configurado, solo IA disponible");
}

// Almacenar tokens de emparejamiento: { token: { moduloId, ip, expiresAt } }
const pairingTokens = {};

// Limpiar tokens expirados cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const token in pairingTokens) {
    if (pairingTokens[token].expiresAt < now) {
      delete pairingTokens[token];
      console.log(`[Pairing] Token expirado: ${token}`);
    }
  }
}, 10 * 60 * 1000);

// Ruta IA local
app.post("/ia", (req, res) => {
  const prompt = req.body.prompt;

  exec(`ollama run llama3 "${prompt}"`, (error, stdout) => {
    if (error) {
      return res.json({ error: error.message });
    }
    res.json({ result: stdout });
  });
});

// Registrar token de emparejamiento desde ESP32
// Body: { token, moduloId, ip }
app.post("/pairing/register", (req, res) => {
  const { token, moduloId, ip } = req.body;

  if (!token || !moduloId || !ip) {
    return res.status(400).json({ error: "Faltan parametros" });
  }

  pairingTokens[token] = {
    moduloId,
    ip,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  console.log(`[Pairing] Token registrado: ${token} -> ${moduloId} (${ip})`);
  res.json({ ok: true, message: "Token registrado" });
});

// Validar token y vincular módulo
// Body: { token, invernaderoId, userId }
app.post("/pairing/verify", async (req, res) => {
  const { token, invernaderoId, userId } = req.body;

  if (!token || !invernaderoId || !userId) {
    return res.status(400).json({ error: "Faltan parametros" });
  }

  const pairingData = pairingTokens[token];

  if (!pairingData) {
    return res.status(400).json({ error: "Token invalido o expirado" });
  }

  if (pairingData.expiresAt < Date.now()) {
    delete pairingTokens[token];
    return res.status(400).json({ error: "Token expirado" });
  }

  if (!db) {
    return res.status(500).json({ error: "Firebase no disponible" });
  }

  const { moduloId, ip } = pairingData;

  try {
    const invRef = db.ref(`invernaderos/${invernaderoId}`);
    const invSnap = await invRef.once("value");

    if (!invSnap.exists()) {
      return res.status(404).json({ error: "Invernadero no encontrado" });
    }

    const invData = invSnap.val();
    if (invData.usuarioId !== userId) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    // Registrar módulo y vincular
    const updates = {};
    updates[`modulos/${moduloId}`] = {
      timestamp: Date.now(),
      ip,
      invernaderoId,
      createdAt: Date.now(),
    };
    updates[`invernaderos/${invernaderoId}/moduloId`] = moduloId;

    await db.ref().update(updates);

    // Consumir token
    delete pairingTokens[token];

    console.log(`[Pairing] Modulo ${moduloId} vinculado a ${invernaderoId}`);
    res.json({
      ok: true,
      message: "Modulo vinculado exitosamente",
      moduloId,
      invernaderoId,
    });
  } catch (err) {
    console.error("[Pairing] Error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener info de token
// Query: ?token=ABC123
app.get("/pairing/info", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  const pairingData = pairingTokens[token];

  if (!pairingData) {
    return res.status(404).json({ error: "Token no encontrado" });
  }

  if (pairingData.expiresAt < Date.now()) {
    delete pairingTokens[token];
    return res.status(404).json({ error: "Token expirado" });
  }

  res.json({
    moduloId: pairingData.moduloId,
    ip: pairingData.ip,
    expiresIn: Math.ceil((pairingData.expiresAt - Date.now()) / 1000),
  });
});

// Configurar HTTPS con certificados autofirmados
const certDir = path.join(__dirname, ".certs");
const certFile = path.join(certDir, "cert.pem");
const keyFile = path.join(certDir, "key.pem");

// Crear directorio de certificados si no existe
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Verificar si ya existen certificados
let useHttps = false;
let httpsOptions = {};

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  useHttps = true;
  httpsOptions = {
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
  };
} else {
  console.warn("[Server] ⚠️  No se encontraron certificados SSL autofirmados.");
  console.warn("[Server] ⚠️  Para generar certificados, ejecuta:");
  console.warn('[Server]     openssl req -x509 -newkey rsa:2048 -keyout .certs/key.pem -out .certs/cert.pem -days 365 -nodes -subj "/CN=localhost"');
  console.warn("[Server] [IMPORTANTE] Web Bluetooth API requiere HTTPS. Sin certificados, Bluetooth no funcionará.");
}

// IMPORTANTE: escuchar en 0.0.0.0 para permitir celulares
const PORT = process.env.PORT || 3001;

if (useHttps) {
  https.createServer(httpsOptions, app).listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] ✅ Servidor HTTPS corriendo en https://localhost:${PORT}`);
    console.log(`[Server] 🔓 Certificado autofirmado - acepta la advertencia en Chrome`);
    console.log(`[Server] 📱 Accessible desde: https://0.0.0.0:${PORT}`);
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] ❌ Servidor HTTP (Bluetooth NO funcionará en Chrome)`);
    console.log(`[Server] Por favor, genera certificados SSL para HTTPS`);
  });
}
