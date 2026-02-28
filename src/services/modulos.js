import { ref, onValue, update } from "firebase/database";
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
  if (!modulo?.timestamp) return false;
  return Date.now() - modulo.timestamp < ONLINE_WINDOW_MS;
}

/**
 * Escucha en tiempo real todos los módulos OASYS.
 * @param {function} callback — llamado con { [moduloId]: { timestamp, ip, invernaderoId } }
 * @returns {function} unsuscribe
 */
export function listenToModulos(callback) {
  return onValue(ref(db, "modulos"), (snap) => {
    callback(snap.val() || {});
  });
}

/**
 * Vincula atómicamente un módulo a un invernadero (escritura multi-path).
 * Actualiza módulo.invernaderoId e invernadero.moduloId en una sola operación.
 */
export async function linkModuloToInvernadero(moduloId, invId) {
  await update(ref(db), {
    [`modulos/${moduloId}/invernaderoId`]: invId,
    [`invernaderos/${invId}/moduloId`]: moduloId,
  });
}

/**
 * Desvincula atómicamente un módulo de un invernadero.
 */
export async function unlinkModulo(moduloId, invId) {
  await update(ref(db), {
    [`modulos/${moduloId}/invernaderoId`]: null,
    [`invernaderos/${invId}/moduloId`]: null,
  });
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
