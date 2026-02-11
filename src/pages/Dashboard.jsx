import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";
import { obtenerPronostico } from "../services/weather";
import { generarPrediccionIA } from "../services/iaLocal";

import {
  WiHumidity,
  WiThermometer,
  WiDaySunny,
  WiStrongWind
} from "react-icons/wi";

// Colores según valor del sensor
function getColor(sensor, value) {
  switch (sensor) {
    case "temperatura":
      if (value < 10) return "text-blue-500 dark:text-blue-400";
      if (value < 30) return "text-green-600 dark:text-green-400";
      return "text-red-500 dark:text-red-400";
    case "humedad":
      if (value < 30) return "text-yellow-500 dark:text-yellow-400";
      if (value < 70) return "text-green-600 dark:text-green-400";
      return "text-blue-500 dark:text-blue-400";
    case "radiacion":
      if (value < 300) return "text-green-600 dark:text-green-400";
      if (value < 700) return "text-yellow-500 dark:text-yellow-400";
      return "text-red-500 dark:text-red-400";
    case "viento":
      if (value < 3) return "text-green-600 dark:text-green-400";
      if (value < 8) return "text-yellow-500 dark:text-yellow-400";
      return "text-red-500 dark:text-red-400";
    default:
      return "text-green-600 dark:text-green-400";
  }
}

// Unidades por sensor
const unidades = {
  temperatura: "°C",
  humedad: "%",
  radiacion: "W/m²",
  viento: "m/s"
};

// Íconos por sensor
const icons = {
  temperatura: <WiThermometer className="text-5xl" />,
  humedad: <WiHumidity className="text-5xl" />,
  radiacion: <WiDaySunny className="text-5xl" />,
  viento: <WiStrongWind className="text-5xl" />
};

export default function Dashboard() {
  const [sensores, setSensores] = useState(null);
  const [riego, setRiego] = useState(null);
  const [malla, setMalla] = useState(null);
  const [online, setOnline] = useState(null);
  const [clima, setClima] = useState(null);
  const [ia, setIa] = useState(null);

  // Firebase
  useEffect(() => {
    onValue(ref(db, "invernadero/sensores"), (s) => setSensores(s.val()));
    onValue(ref(db, "invernadero/control/riego"), (s) => setRiego(s.val()));
    onValue(ref(db, "invernadero/control/malla"), (s) => setMalla(s.val()));
    onValue(ref(db, "invernadero/estado/online"), (s) => setOnline(s.val()));
  }, []);

  // === UBICACIÓN INTELIGENTE (3 fallbacks) ===
  useEffect(() => {
    async function cargarClima() {
      try {
        // 1) GPS del navegador
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              const datos = await obtenerPronostico(lat, lon);

              datos.ciudad = "Tu ubicación actual";
              setClima(datos);
            },
            async () => {
              // 2) IP API si falla el GPS
              try {
                const resp = await fetch("https://ipapi.co/json/");
                const ip = await resp.json();

                const datos = await obtenerPronostico(ip.latitude, ip.longitude);
                datos.ciudad = ip.city || "Ubicación por IP";
                setClima(datos);
              } catch {
                // 3) Fallback final si todo falla
                const datos = await obtenerPronostico(19.4326, -99.1332);
                datos.ciudad = "Ubicación aproximada";
                setClima(datos);
              }
            }
          );
        }
      } catch {
        // Fallback final
        const datos = await obtenerPronostico(19.4326, -99.1332);
        datos.ciudad = "Ubicación aproximada";
        setClima(datos);
      }
    }

    cargarClima();
  }, []);

  // IA
  useEffect(() => {
    if (clima && sensores) {
      generarPrediccionIA(clima, sensores, riego, malla).then(setIa);
    }
  }, [clima, sensores, riego, malla]);

  return (
    <main
      className="
        max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 
        animate-fadeUp
        bg-gradient-to-br from-emerald-50/40 via-sky-50/40 to-emerald-100/40
        dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950
        rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.25)]
      "
    >
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 dark:text-emerald-400">
            Invernadero inteligente
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 mt-1">
            Panel principal
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 max-w-xl">
            Monitorea en tiempo real la temperatura, humedad, radiación y viento,
            junto con el estado del riego, malla sombra y conexión con RiegUV.
          </p>
        </div>

        {/* Chips de estado rápido */}
        <div className="flex flex-wrap gap-3 justify-start sm:justify-end">
          <span
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold
              backdrop-blur-xl border
              ${
                online
                  ? "bg-emerald-100/70 border-emerald-200/70 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700/60 dark:text-emerald-300"
                  : "bg-red-100/70 border-red-200/70 text-red-800 dark:bg-red-900/40 dark:border-red-700/60 dark:text-red-300"
              }
            `}
          >
            <span
              className={`
                h-2 w-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]
                ${online ? "bg-emerald-500" : "bg-red-500"}
              `}
            />
            {online ? "ESP32 conectado" : "ESP32 desconectado"}
          </span>

          <span
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold
              backdrop-blur-xl border
              ${
                riego
                  ? "bg-sky-100/70 border-sky-200/70 text-sky-800 dark:bg-sky-900/40 dark:border-sky-800/60 dark:text-sky-300"
                  : "bg-gray-100/70 border-gray-200/70 text-gray-700 dark:bg-gray-800/60 dark:border-gray-700/70 dark:text-gray-300"
              }
            `}
          >
            {riego ? "Riego activado" : "Riego detenido"}
          </span>

          <span
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold
              backdrop-blur-xl border
              ${
                malla
                  ? "bg-amber-100/70 border-amber-200/70 text-amber-800 dark:bg-amber-900/40 dark:border-amber-800/60 dark:text-amber-300"
                  : "bg-slate-100/70 border-slate-200/70 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700/70 dark:text-slate-100"
              }
            `}
          >
            Malla {malla ? "abierta" : "cerrada"}
          </span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <section className="space-y-8">
        {/* PRONÓSTICO PRINCIPAL */}
        {clima ? (
          <div
            className="
              relative overflow-hidden
              bg-white/70 dark:bg-slate-950/70
              border border-white/40 dark:border-emerald-900/60 
              p-6 sm:p-8 rounded-3xl shadow-xl
              backdrop-blur-2xl
            "
          >
            {/* halo decorativo */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-xl" />
                  <img
                    src={`https://openweathermap.org/img/wn/${clima.icon}@4x.png`}
                    className="w-20 h-20 sm:w-24 sm:h-24 relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                    alt="Icono climático"
                  />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {clima.ciudad}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1">
                    {new Date()
                      .toLocaleString("es-MX", {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                      .toUpperCase()}
                  </p>
                  <p className="text-lg sm:text-xl mt-2 capitalize text-emerald-700 dark:text-emerald-300">
                    {clima.descripcion}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 text-sm sm:text-base">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Temperatura
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.temp}°C
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Sensación
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.feels_like}°C
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Mínima
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.temp_min}°C
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Máxima
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.temp_max}°C
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Humedad
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.humedad}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Nubes
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.nubes}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Prob. lluvia
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.lluvia_prob}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Viento
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {clima.viento} m/s
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de próximos días */}
            {clima.pronosticoDias && (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/30 dark:border-emerald-900/60 text-left text-gray-500 dark:text-gray-400">
                      <th className="py-2 pr-4 font-normal">Día</th>
                      <th className="py-2 pr-4 font-normal">Mín</th>
                      <th className="py-2 pr-4 font-normal">Máx</th>
                      <th className="py-2 pr-4 font-normal">Lluvia</th>
                      <th className="py-2 font-normal">Condición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clima.pronosticoDias.map((d) => (
                      <tr
                        key={d.fecha}
                        className="border-b border-white/10 dark:border-emerald-900/40 last:border-0"
                      >
                        <td className="py-2 pr-4 whitespace-nowrap text-gray-800 dark:text-gray-100">
                          {d.fecha}
                        </td>
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                          {d.min}°C
                        </td>
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                          {d.max}°C
                        </td>
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                          {d.lluvia}%
                        </td>
                        <td className="py-2 flex items-center gap-2 capitalize text-gray-800 dark:text-gray-100">
                          <img
                            src={`https://openweathermap.org/img/wn/${d.icon}.png`}
                            className="w-7 h-7"
                            alt="Icono pronóstico"
                          />
                          {d.descripcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Skeleton clima
          <div className="bg-white/60 dark:bg-slate-950/60 border border-blue-100/60 dark:border-blue-900/60 p-6 sm:p-8 rounded-3xl shadow-md animate-pulse backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="w-40 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="w-32 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="w-48 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="w-24 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="w-16 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-6 rounded-full bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
          </div>
        )}

        {/* GRID 2 COLUMNAS (sensores + IA / estados) */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Columna izquierda: sensores + IA */}
          <div className="space-y-6">
            {/* SENSORES EN TIEMPO REAL */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">
                  Variables del invernadero
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Datos en tiempo real desde el módulo ESP32
                </span>
              </div>

              {sensores ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {Object.entries(sensores).map(([key, value]) => (
                    <div
                      key={key}
                      className="
                        relative
                        bg-white/70 dark:bg-slate-950/70 
                        border border-white/40 dark:border-slate-800/80 
                        p-5 rounded-3xl shadow-lg 
                        flex flex-col items-center text-center 
                        transition-all duration-300 
                        hover:shadow-2xl hover:-translate-y-1 hover:bg-white/85 dark:hover:bg-slate-950/90
                        backdrop-blur-2xl
                      "
                    >
                      {/* Botón de ayuda */}
                      <div
                        className="
                          absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 
                          text-gray-700 dark:text-gray-200 
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold 
                          shadow-md border border-gray-200/70 dark:border-gray-700/70
                          hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500
                          cursor-pointer transition
                        "
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(
                            {
                              temperatura:
                                "Mide el calor dentro del invernadero. Si sube demasiado, puede afectar a las plantas.",
                              humedad:
                                "Cantidad de vapor de agua en el aire. Fundamental para evitar hongos o deshidratación.",
                              radiacion:
                                "Cuánta luz solar directa recibe el cultivo. Ayuda a decidir si abrir o cerrar la malla.",
                              viento:
                                "Velocidad del aire dentro del invernadero. Útil para la seguridad de la malla y mecanismos."
                            }[key]
                          );
                        }}
                      >
                        ?
                      </div>

                      <div className={`mb-3 ${getColor(key, value)}`}>
                        {icons[key]}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold capitalize mb-1 text-gray-900 dark:text-gray-50">
                        {key}
                      </h3>
                      <p className={`text-2xl sm:text-3xl font-bold ${getColor(key, value)}`}>
                        {value}
                        <span className="text-base sm:text-lg ml-1 text-gray-500 dark:text-gray-400">
                          {unidades[key]}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                // Skeleton sensores
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="
                        bg-white/60 dark:bg-slate-950/70 
                        border border-white/40 dark:border-slate-800/80 
                        p-5 rounded-3xl shadow-md animate-pulse 
                        flex flex-col items-center text-center
                        backdrop-blur-xl
                      "
                    >
                      <div className="mb-3 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="w-24 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
                      <div className="w-20 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* IA LOCAL */}
            {ia && (
              <section
                className="
                  relative overflow-hidden
                  bg-purple-50/70 dark:bg-purple-950/40 
                  border border-purple-200/70 dark:border-purple-900/70 
                  p-6 rounded-3xl shadow-md backdrop-blur-2xl
                "
              >
                <div className="pointer-events-none absolute -top-16 -right-10 w-44 h-44 rounded-full bg-purple-400/20 blur-3xl" />
                <h2 className="text-lg sm:text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2 relative">
                  Predicción inteligente
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed relative">
                  {ia}
                </p>
              </section>
            )}
          </div>

          {/* Columna derecha: estados */}
          <aside className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-gray-50">
              Estado del sistema
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Revisa de un vistazo el estado de conexión y actuadores.
            </p>

            <div className="space-y-4">
              <div
                className="
                  bg-white/70 dark:bg-slate-950/70 
                  border border-emerald-100/80 dark:border-emerald-900/60 
                  p-4 rounded-2xl shadow-md backdrop-blur-2xl
                "
              >
                <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-50">
                  ESP32
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {online ? "🟢 Conectado y enviando datos" : "🔴 Sin conexión"}
                </p>
              </div>

              <div
                className="
                  bg-white/70 dark:bg-slate-950/70 
                  border border-sky-100/80 dark:border-sky-900/60 
                  p-4 rounded-2xl shadow-md backdrop-blur-2xl
                "
              >
                <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-50">
                  Riego
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {riego
                    ? "💧 Sistema de riego activo"
                    : "Riego actualmente apagado"}
                </p>
              </div>

              <div
                className="
                  bg-white/70 dark:bg-slate-950/70 
                  border border-amber-100/80 dark:border-amber-900/60 
                  p-4 rounded-2xl shadow-md backdrop-blur-2xl
                "
              >
                <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-50">
                  Malla sombra
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {malla
                    ? "🕸️ Malla desplegada para sombrear"
                    : "Malla recogida"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
