import { ref, get, onValue, set } from "firebase/database";
import { db } from "./firebase";

// Módulo considerado online si su heartbeat llegó hace menos de 30 segundos
const ONLINE_WINDOW_MS = 30_000;

// Cache de geolocalizaciones por IP (por sesión, evita llamadas repetidas a ipapi.co)
const _locationCache = new Map();

/**
 * Determina si un módulo está online según su timestamp de heartbeat.
 * @param {object|null} modulo — objeto del módulo de Firebase (con campo timestamp)
 */
export function isModuleOnline(modulo) {
  const timestamp = Number(modulo?.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp < ONLINE_WINDOW_MS;
}

/**
 * Escucha en tiempo real todos los módulos OASYS.
 * @param {function} callback — llamado con { [moduloId]: { timestamp, ip, invernaderoId, seccionId } }
 * @returns {function} unsuscribe
 */
export function listenToModulos(callback) {
  return onValue(ref(db, "modulos"), (snap) => {
    callback(snap.val() || {});
  });
}

function normalizeId(value) {
  return typeof value === "string" && value.trim() && value !== "null"
    ? value.trim()
    : "";
}

/**
 * Vincula un módulo a una sección.
 * La fuente de verdad queda en:
 * - modulos/{moduloId}/invernaderoId
 * - modulos/{moduloId}/seccionId
 * - invernaderos/{invId}/secciones/{secId}/moduloId
 */
export async function linkModuloToSeccion(moduloId, invId, secId) {
  if (!moduloId || !invId || !secId) {
    throw new Error("Falta módulo, invernadero o sección para vincular.");
  }

  const currentInvSnap = await get(ref(db, `modulos/${moduloId}/invernaderoId`));
  const currentSecSnap = await get(ref(db, `modulos/${moduloId}/seccionId`));
  const currentInvId = normalizeId(currentInvSnap.val());
  const currentSecId = normalizeId(currentSecSnap.val());

  if (currentInvId && currentSecId && (currentInvId !== invId || currentSecId !== secId)) {
    await set(ref(db, `invernaderos/${currentInvId}/secciones/${currentSecId}/moduloId`), null);
  }
  if (currentInvId && currentInvId !== invId) {
    await set(ref(db, `invernaderos/${currentInvId}/moduloId`), null);
  }

  await set(ref(db, `modulos/${moduloId}/invernaderoId`), invId);
  await set(ref(db, `modulos/${moduloId}/seccionId`), secId);
  await set(ref(db, `modulos/${moduloId}/timestamp`), Date.now());
  await set(ref(db, `modulos/${moduloId}/lastLinkedAt`), Date.now()).catch(() => {});
  await set(ref(db, `invernaderos/${invId}/moduloId`), null);
  await set(ref(db, `invernaderos/${invId}/secciones/${secId}/moduloId`), moduloId);

  const sectionPath = `invernaderos/${invId}/secciones/${secId}`;
  const controlSnap = await get(ref(db, `${sectionPath}/control`));
  if (!controlSnap.exists()) {
    await set(ref(db, `${sectionPath}/control`), { riego: false, malla: false });
  }

  const autoSnap = await get(ref(db, `${sectionPath}/controlAutomatico`));
  if (!autoSnap.exists()) {
    await set(ref(db, `${sectionPath}/controlAutomatico`), {
      activo: false,
      acciones: {
        riego: { bajoHumedad: true },
        malla: { altaTemperatura: true, altaRadiacion: false },
      },
      umbrales: {
        humedad: { min: 40 },
        radiacion: { max: 900 },
        temperatura: { max: 35, min: 10 },
      },
    });
  } else {
    await set(ref(db, `${sectionPath}/controlAutomatico/activo`), false);
  }
}

/**
 * Desvincula un módulo de una sección.
 */
export async function unlinkModulo(moduloId, invId, secId = null) {
  const currentInvId = invId || normalizeId((await get(ref(db, `modulos/${moduloId}/invernaderoId`))).val());
  const currentSecId = secId || normalizeId((await get(ref(db, `modulos/${moduloId}/seccionId`))).val());
  await set(ref(db, `modulos/${moduloId}/invernaderoId`), null);
  await set(ref(db, `modulos/${moduloId}/seccionId`), null);
  if (currentInvId) {
    await set(ref(db, `invernaderos/${currentInvId}/moduloId`), null);
  }
  if (currentInvId && currentSecId) {
    await set(ref(db, `invernaderos/${currentInvId}/secciones/${currentSecId}/moduloId`), null);
  }
}

/**
 * Obtiene la ubicación aproximada de una IP pública usando ipapi.co.
 * Retorna null si la IP es privada, inválida o hay error de red.
 * El resultado se cachea en memoria para evitar llamadas duplicadas.
 * @param {string} ip — IP pública del módulo
 * @returns {Promise<{city, country, lat, lon}|null>}
 */
export async function getModuloLocation(ip) {
  if (!ip) return null;

  // Ignorar IPs privadas/localhost
  if (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.") ||
    ip === "127.0.0.1" ||
    ip === "localhost"
  ) {
    return null;
  }

  if (_locationCache.has(ip)) return _locationCache.get(ip);

  try {
    const resp = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.error) return null;
    const result = {
      city: data.city || "Desconocida",
      country: data.country_name || "",
      lat: data.latitude,
      lon: data.longitude,
    };
    _locationCache.set(ip, result);
    return result;
  } catch {
    return null;
  }
}
