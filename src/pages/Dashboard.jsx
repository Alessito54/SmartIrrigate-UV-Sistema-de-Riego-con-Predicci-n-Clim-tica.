import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";
import { obtenerPronostico } from "../services/weather";
import { generarPrediccionIA } from "../services/iaLocal";

import {
  WiHumidity,
  WiThermometer,
  WiDaySunny,
  WiStrongWind,
  WiRaindrop,
  WiRain,
  WiDayCloudy,
  WiNightClear
} from "react-icons/wi";
import { FiWifi, FiShield } from "react-icons/fi";
import { IoSparklesOutline } from "react-icons/io5";

// ─── Constants ────────────────────────────────────────────────────────

const unidades = {
  temperatura: "°C",
  humedad: "%",
  radiacion: "W/m²",
  viento: "m/s"
};

const iconMap = {
  temperatura: WiThermometer,
  humedad: WiHumidity,
  radiacion: WiDaySunny,
  viento: WiStrongWind
};

const sensorLabels = {
  temperatura: "Temperatura",
  humedad: "Humedad",
  radiacion: "Radiación UV",
  viento: "Viento"
};

const sensorDescripciones = {
  temperatura:
    "Mide el calor dentro del invernadero. Si sube demasiado, puede afectar a las plantas.",
  humedad:
    "Cantidad de vapor de agua en el aire. Fundamental para evitar hongos o deshidratación.",
  radiacion:
    "Cuánta luz solar directa recibe el cultivo. Ayuda a decidir si abrir o cerrar la malla.",
  viento:
    "Velocidad del aire dentro del invernadero. Útil para la seguridad de la malla y mecanismos."
};

// Gradient themes per sensor
const sensorThemes = {
  temperatura: {
    gradient: "from-orange-500/10 via-red-500/5 to-amber-500/10 dark:from-orange-500/15 dark:via-red-500/10 dark:to-amber-900/20",
    accent: "bg-orange-500",
    ring: "ring-orange-200/50 dark:ring-orange-800/30",
    iconBg: "bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-900/40 dark:to-red-900/30",
  },
  humedad: {
    gradient: "from-blue-500/10 via-sky-500/5 to-cyan-500/10 dark:from-blue-500/15 dark:via-sky-500/10 dark:to-cyan-900/20",
    accent: "bg-blue-500",
    ring: "ring-blue-200/50 dark:ring-blue-800/30",
    iconBg: "bg-gradient-to-br from-blue-100 to-sky-50 dark:from-blue-900/40 dark:to-sky-900/30",
  },
  radiacion: {
    gradient: "from-yellow-500/10 via-amber-500/5 to-orange-500/10 dark:from-yellow-500/15 dark:via-amber-500/10 dark:to-orange-900/20",
    accent: "bg-yellow-500",
    ring: "ring-yellow-200/50 dark:ring-yellow-800/30",
    iconBg: "bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/40 dark:to-amber-900/30",
  },
  viento: {
    gradient: "from-teal-500/10 via-emerald-500/5 to-green-500/10 dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-green-900/20",
    accent: "bg-teal-500",
    ring: "ring-teal-200/50 dark:ring-teal-800/30",
    iconBg: "bg-gradient-to-br from-teal-100 to-emerald-50 dark:from-teal-900/40 dark:to-emerald-900/30",
  }
};

// Ranges for gauge bar
const sensorRanges = {
  temperatura: { min: 0, max: 50 },
  humedad: { min: 0, max: 100 },
  radiacion: { min: 0, max: 1200 },
  viento: { min: 0, max: 20 }
};

function getColor(sensor, value) {
  switch (sensor) {
    case "temperatura":
      if (value < 10) return "text-blue-500 dark:text-blue-400";
      if (value < 30) return "text-emerald-600 dark:text-emerald-400";
      return "text-red-500 dark:text-red-400";
    case "humedad":
      if (value < 30) return "text-amber-500 dark:text-amber-400";
      if (value < 70) return "text-emerald-600 dark:text-emerald-400";
      return "text-blue-500 dark:text-blue-400";
    case "radiacion":
      if (value < 300) return "text-emerald-600 dark:text-emerald-400";
      if (value < 700) return "text-amber-500 dark:text-amber-400";
      return "text-red-500 dark:text-red-400";
    case "viento":
      if (value < 3) return "text-emerald-600 dark:text-emerald-400";
      if (value < 8) return "text-amber-500 dark:text-amber-400";
      return "text-red-500 dark:text-red-400";
    default:
      return "text-emerald-600 dark:text-emerald-400";
  }
}

function getBarColor(sensor, value) {
  switch (sensor) {
    case "temperatura":
      if (value < 10) return "bg-blue-400";
      if (value < 30) return "bg-emerald-400";
      return "bg-red-400";
    case "humedad":
      if (value < 30) return "bg-amber-400";
      if (value < 70) return "bg-emerald-400";
      return "bg-blue-400";
    case "radiacion":
      if (value < 300) return "bg-emerald-400";
      if (value < 700) return "bg-amber-400";
      return "bg-red-400";
    case "viento":
      if (value < 3) return "bg-emerald-400";
      if (value < 8) return "bg-amber-400";
      return "bg-red-400";
    default:
      return "bg-emerald-400";
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Buenos días", Icon: WiDaySunny };
  if (h < 19) return { text: "Buenas tardes", Icon: WiDayCloudy };
  return { text: "Buenas noches", Icon: WiNightClear };
}

// ─── Subcomponents ────────────────────────────────────────────────────

const SkeletonClima = memo(function SkeletonClima() {
  return (
    <div className="glass rounded-3xl p-6 sm:p-8 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-200/60 dark:bg-gray-700/40" />
          <div className="space-y-2.5">
            <div className="w-44 h-5 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
            <div className="w-32 h-4 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
            <div className="w-48 h-4 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="w-20 h-3 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
              <div className="w-14 h-4 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const SkeletonSensores = memo(function SkeletonSensores() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-2xl p-5 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200/60 dark:bg-gray-700/40" />
            <div className="w-20 h-4 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
          </div>
          <div className="w-24 h-8 rounded-lg bg-gray-200/60 dark:bg-gray-700/40 mb-3" />
          <div className="w-full h-2 rounded-full bg-gray-200/60 dark:bg-gray-700/40" />
        </div>
      ))}
    </div>
  );
});

const SensorCardDash = memo(function SensorCardDash({ sensorKey, value, onHelp, index }) {
  const Icon = iconMap[sensorKey];
  const color = getColor(sensorKey, value);
  const barColor = getBarColor(sensorKey, value);
  const theme = sensorThemes[sensorKey];
  const range = sensorRanges[sensorKey];
  const percent = Math.min(100, Math.max(0, ((value - range.min) / (range.max - range.min)) * 100));

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${theme.gradient}
        glass ring-1 ${theme.ring}
        p-5 rounded-2xl
        transition-all duration-500
        hover:shadow-xl hover:-translate-y-1
        animate-fadeUp stagger-${index + 1}
        group/card
      `}
    >
      {/* Help button */}
      <button
        className="
          absolute top-3 right-3 
          w-6 h-6 rounded-full 
          bg-white/60 dark:bg-slate-800/60
          text-gray-500 dark:text-gray-400 
          text-[11px] font-bold
          flex items-center justify-center
          opacity-0 group-hover/card:opacity-100
          hover:bg-emerald-500 hover:text-white
          transition-all duration-300
          border border-gray-200/50 dark:border-gray-700/50
        "
        onClick={onHelp}
      >
        ?
      </button>

      {/* Header: icon + label */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`${theme.iconBg} p-2 rounded-xl`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {sensorLabels[sensorKey]}
        </span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className={`text-3xl sm:text-4xl font-extrabold tabular-nums ${color}`}>
          {value}
        </span>
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 ml-1">
          {unidades[sensorKey]}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="w-full h-1.5 rounded-full bg-gray-200/60 dark:bg-gray-700/30 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} animate-gauge`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});

const ForecastPill = memo(function ForecastPill({ d, index }) {
  return (
    <div
      className={`
        flex-shrink-0 w-[130px]
        glass rounded-2xl p-3.5
        text-center
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        animate-fadeUp stagger-${index + 1}
      `}
    >
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {d.fecha}
      </p>
      <img
        src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
        className="w-12 h-12 mx-auto drop-shadow-md"
        alt={d.descripcion}
        loading="lazy"
      />
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{d.max}°</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">/</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{d.min}°</span>
      </div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <WiRaindrop className="text-xs text-blue-500" />
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {d.lluvia}%
        </span>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 capitalize leading-tight">
        {d.descripcion}
      </p>
    </div>
  );
});

const WeatherPanel = memo(function WeatherPanel({ clima, formattedDate }) {
  return (
    <div
      className="
        relative overflow-hidden
        glass rounded-3xl
        p-6 sm:p-8
        shadow-lg
      "
    >
      {/* Decorative halos */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-sky-400/10 dark:bg-sky-400/5 blur-[60px]" />

      <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative">
        {/* City + icon */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl" />
            <img
              src={`https://openweathermap.org/img/wn/${clima.icon}@4x.png`}
              className="w-20 h-20 sm:w-24 sm:h-24 relative z-10 drop-shadow-2xl animate-float"
              alt="Icono climático"
              loading="lazy"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
              {clima.ciudad}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 tracking-wide">
              {formattedDate}
            </p>
            <p className="text-lg sm:text-xl mt-1.5 capitalize font-semibold text-emerald-600 dark:text-emerald-400">
              {clima.descripcion}
            </p>
          </div>
        </div>

        {/* Weather stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 flex-1">
          <WeatherStat label="Temperatura" value={`${clima.temp}°C`} large />
          <WeatherStat label="Sensación" value={`${clima.feels_like}°C`} />
          <WeatherStat label="Mínima" value={`${clima.temp_min}°C`} />
          <WeatherStat label="Máxima" value={`${clima.temp_max}°C`} />
          <WeatherStat label="Humedad" value={`${clima.humedad}%`} />
          <WeatherStat label="Nubes" value={`${clima.nubes}%`} />
          <WeatherStat label="Prob. lluvia" value={`${clima.lluvia_prob}%`} />
          <WeatherStat label="Viento" value={`${clima.viento} m/s`} />
        </div>
      </div>

      {/* Forecast pills */}
      {clima.pronosticoDias && (
        <div className="mt-6 pt-5 border-t border-gray-200/40 dark:border-gray-700/30">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Próximos días
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
            {clima.pronosticoDias.map((d, i) => (
              <ForecastPill key={d.fecha} d={d} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const WeatherStat = memo(function WeatherStat({ label, value, large }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className={`font-bold text-gray-800 dark:text-gray-100 ${large ? "text-xl sm:text-2xl" : "text-sm sm:text-base"}`}>
        {value}
      </div>
    </div>
  );
});

const IAPanel = memo(function IAPanel({ ia }) {
  return (
    <section
      className="
        relative overflow-hidden
        bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10
        dark:from-violet-500/15 dark:via-purple-500/10 dark:to-indigo-900/20
        glass ring-1 ring-purple-200/40 dark:ring-purple-800/30
        p-6 rounded-2xl
        animate-fadeUp
      "
    >
      <div className="pointer-events-none absolute -top-12 -right-8 w-36 h-36 rounded-full bg-purple-400/15 blur-[60px]" />
      <div className="flex items-center gap-2.5 mb-3 relative">
        <IoSparklesOutline className="text-xl text-purple-500 dark:text-purple-400" />
        <h2 className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-300 tracking-tight">
          Predicción inteligente
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed relative">
        {ia}
      </p>
    </section>
  );
});

const StatusCard = memo(function StatusCard({ title, icon, status, description, accentColor, isActive }) {
  return (
    <div
      className={`
        glass rounded-2xl p-4 
        flex items-center gap-4
        transition-all duration-300
        hover:shadow-md
        border-l-[3px] ${accentColor}
      `}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
          {isActive !== undefined && (
            <span
              className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${isActive
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-breathe"
                  : "bg-red-400"
                }
              `}
            />
          )}
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{status}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
});

const StatusChip = memo(function StatusChip({ active, activeClass, inactiveClass, children }) {
  return (
    <span
      className={`
        inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold
        glass border tracking-wide
        transition-all duration-300
        ${active ? activeClass : inactiveClass}
      `}
    >
      {children}
    </span>
  );
});

// ─── Main Component ───────────────────────────────────────────────────

export default function Dashboard() {
  const [sensores, setSensores] = useState(null);
  const [riego, setRiego] = useState(null);
  const [malla, setMalla] = useState(null);
  const [online, setOnline] = useState(null);
  const [clima, setClima] = useState(null);
  const [ia, setIa] = useState(null);

  // Firebase listeners
  useEffect(() => {
    const unsubs = [
      onValue(ref(db, "invernadero/sensores"), (s) => setSensores(s.val())),
      onValue(ref(db, "invernadero/control/riego"), (s) => setRiego(s.val())),
      onValue(ref(db, "invernadero/control/malla"), (s) => setMalla(s.val())),
      onValue(ref(db, "invernadero/estado/online"), (s) => setOnline(s.val()))
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  // Geolocation → weather
  useEffect(() => {
    let cancelled = false;

    async function cargarClima() {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (cancelled) return;
              const datos = await obtenerPronostico(
                pos.coords.latitude,
                pos.coords.longitude
              );
              datos.ciudad = "Tu ubicación actual";
              setClima(datos);
            },
            async () => {
              if (cancelled) return;
              try {
                const resp = await fetch("https://ipapi.co/json/");
                const ip = await resp.json();
                const datos = await obtenerPronostico(ip.latitude, ip.longitude);
                datos.ciudad = ip.city || "Ubicación por IP";
                setClima(datos);
              } catch {
                if (cancelled) return;
                const datos = await obtenerPronostico(19.4326, -99.1332);
                datos.ciudad = "Ubicación aproximada";
                setClima(datos);
              }
            }
          );
        }
      } catch {
        if (cancelled) return;
        const datos = await obtenerPronostico(19.4326, -99.1332);
        datos.ciudad = "Ubicación aproximada";
        setClima(datos);
      }
    }

    cargarClima();
    return () => { cancelled = true; };
  }, []);

  // IA prediction (debounced 500ms)
  useEffect(() => {
    if (!clima || !sensores) return;

    const timer = setTimeout(() => {
      generarPrediccionIA(clima, sensores, riego, malla).then(setIa);
    }, 500);

    return () => clearTimeout(timer);
  }, [clima, sensores, riego, malla]);

  const formattedDate = useMemo(
    () =>
      new Date()
        .toLocaleString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sensorEntries = useMemo(
    () => (sensores ? Object.entries(sensores) : []),
    [sensores]
  );

  const handleHelp = useCallback((e, sensorKey) => {
    e.stopPropagation();
    alert(sensorDescripciones[sensorKey]);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeUp">

      {/* ═══ HEADER ═══ */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <greeting.Icon className="text-xl text-amber-500 dark:text-amber-400" />
            {greeting.text}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight mt-1">
            Panel principal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
            Monitorea en tiempo real tus sensores, clima y estado del invernadero.
          </p>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <StatusChip
            active={online}
            activeClass="border-emerald-200/60 text-emerald-700 dark:border-emerald-700/40 dark:text-emerald-300"
            inactiveClass="border-red-200/60 text-red-700 dark:border-red-700/40 dark:text-red-300"
          >
            <span
              className={`
                h-1.5 w-1.5 rounded-full
                ${online
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-breathe"
                  : "bg-red-400"
                }
              `}
            />
            {online ? "ESP32 online" : "ESP32 offline"}
          </StatusChip>

          <StatusChip
            active={riego}
            activeClass="border-sky-200/60 text-sky-700 dark:border-sky-700/40 dark:text-sky-300"
            inactiveClass="border-gray-200/60 text-gray-500 dark:border-gray-700/40 dark:text-gray-400"
          >
            <WiRaindrop className="text-base" /> {riego ? "Riego activo" : "Riego off"}
          </StatusChip>

          <StatusChip
            active={malla}
            activeClass="border-amber-200/60 text-amber-700 dark:border-amber-700/40 dark:text-amber-300"
            inactiveClass="border-gray-200/60 text-gray-500 dark:border-gray-700/40 dark:text-gray-400"
          >
            <FiShield className="text-xs" /> Malla {malla ? "abierta" : "cerrada"}
          </StatusChip>
        </div>
      </header>

      {/* ═══ WEATHER HERO ═══ */}
      {clima ? (
        <WeatherPanel clima={clima} formattedDate={formattedDate} />
      ) : (
        <SkeletonClima />
      )}

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* Left column: sensors + IA */}
        <div className="space-y-6">
          {/* Sensor section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                  Variables del invernadero
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Datos en tiempo real · ESP32
                </p>
              </div>
            </div>

            {sensores ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sensorEntries.map(([key, value], i) => (
                  <SensorCardDash
                    key={key}
                    sensorKey={key}
                    value={value}
                    index={i}
                    onHelp={(e) => handleHelp(e, key)}
                  />
                ))}
              </div>
            ) : (
              <SkeletonSensores />
            )}
          </section>

          {/* IA Panel */}
          {ia && <IAPanel ia={ia} />}
        </div>

        {/* Right column: system status */}
        <aside className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              Estado del sistema
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Conexión y actuadores
            </p>
          </div>

          <div className="space-y-3">
            <StatusCard
              title="ESP32"
              icon={<FiWifi className="text-2xl text-emerald-500" />}
              accentColor={online ? "border-l-emerald-500" : "border-l-red-400"}
              isActive={online}
              status={online ? "Conectado" : "Sin conexión"}
              description={online ? "Módulo enviando datos en tiempo real" : "Verifica la alimentación del módulo"}
            />

            <StatusCard
              title="Sistema de riego"
              icon={<WiRaindrop className="text-2xl text-sky-500" />}
              accentColor={riego ? "border-l-sky-500" : "border-l-gray-300 dark:border-l-gray-600"}
              isActive={riego}
              status={riego ? "Activo — regando" : "Apagado"}
              description={riego ? "Válvula de riego abierta" : "Válvula cerrada, sin riego activo"}
            />

            <StatusCard
              title="Malla sombra"
              icon={<FiShield className="text-2xl text-amber-500" />}
              accentColor={malla ? "border-l-amber-500" : "border-l-gray-300 dark:border-l-gray-600"}
              isActive={malla}
              status={malla ? "Desplegada" : "Recogida"}
              description={malla ? "Protegiendo del sol directo" : "Sin protección solar activa"}
            />
          </div>

          {/* Quick summary card */}
          <div className="glass rounded-2xl p-4 mt-2">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Resumen rápido
            </h3>
            <div className="space-y-2">
              {sensores && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><WiThermometer className="text-base" /> Temp</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {sensores.temperatura}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><WiRaindrop className="text-base" /> Humedad</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {sensores.humedad}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><WiDaySunny className="text-base" /> UV</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {sensores.radiacion} W/m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><WiStrongWind className="text-base" /> Viento</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {sensores.viento} m/s
                    </span>
                  </div>
                </>
              )}
              {clima && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><WiRain className="text-base" /> Lluvia</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {clima.lluvia_prob}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
