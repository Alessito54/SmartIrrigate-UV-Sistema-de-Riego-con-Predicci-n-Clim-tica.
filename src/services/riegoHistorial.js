import { ref, get, push, remove, set } from "firebase/database";
import { db } from "./firebase";

export const DEFAULT_BOMBA_LITROS_HORA = 120;

export function getLitrosHora(section) {
  const value = Number(section?.configuracionBomba?.litrosHora ?? section?.bombaLitrosHora);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BOMBA_LITROS_HORA;
}

export function calcularLitrosPorRiego(duracionSeg, litrosHora) {
  const seconds = Math.max(0, Number(duracionSeg) || 0);
  const lph = Math.max(0, Number(litrosHora) || DEFAULT_BOMBA_LITROS_HORA);
  return Number(((lph / 3600) * seconds).toFixed(3));
}

export async function iniciarSesionRiego(sectionPath, { modo = "manual", tipo = "manual", litrosHora } = {}) {
  if (!sectionPath) return;
  const inicio = Date.now();
  await set(ref(db, `${sectionPath}/estadoRiego`), {
    activo: true,
    inicio,
    modo,
    tipo,
    litrosHora: Number(litrosHora) || DEFAULT_BOMBA_LITROS_HORA,
  });
}

export async function cerrarSesionRiego(sectionPath, { modo = "manual", tipo = "manual", litrosHora } = {}) {
  if (!sectionPath) return null;

  const estadoSnap = await get(ref(db, `${sectionPath}/estadoRiego`));
  const estado = estadoSnap.val() || {};
  const inicio = Number(estado.inicio) || Date.now();
  const fin = Date.now();
  const duracionSeg = Math.max(1, Math.round((fin - inicio) / 1000));
  const flujoLitrosHora = Number(estado.litrosHora || litrosHora) || DEFAULT_BOMBA_LITROS_HORA;
  const litros = calcularLitrosPorRiego(duracionSeg, flujoLitrosHora);

  const evento = {
    inicio,
    fin,
    duracion_seg: duracionSeg,
    litros,
    litrosHora: flujoLitrosHora,
    modo: estado.modo || modo,
    tipo: estado.tipo || tipo,
    origen: "web",
    creadoEn: fin,
  };

  await push(ref(db, `${sectionPath}/historial_riego`), evento);
  await remove(ref(db, `${sectionPath}/estadoRiego`));
  return evento;
}
