import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { obtenerPronostico } from "../services/weather";
import { generarPrediccionIA } from "../services/iaLocal";
import { isModuleOnline, getModuloLocation } from "../services/modulos";
import { getLitrosHora } from "../services/riegoHistorial";

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
import { FiBarChart2, FiClock, FiPlus, FiTrash2, FiWifi, FiShield, FiChevronDown } from "react-icons/fi";
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
  humedadAmbiente: WiHumidity,
  temperaturasuelo: WiThermometer,
  humedad: WiHumidity,
  radiacion: WiDaySunny,
  viento: WiStrongWind
};

const sensorLabels = {
  temperatura: "Temp. Ambiente",
  humedadAmbiente: "Hum. Ambiente",
  temperaturasuelo: "Temp. Suelo",
  humedad: "Hum. Suelo",
  radiacion: "Radiación UV",
  viento: "Viento"
};

const sensorDescripciones = {
  temperatura:
    "Temperatura del aire dentro del invernadero (SHT31). Si sube demasiado, puede afectar a las plantas.",
  humedadAmbiente:
    "Humedad relativa del ambiente (SHT31). Fundamental para evitar hongos o deshidratación.",
  temperaturasuelo:
    "Temperatura del sustrato o suelo (SHT10). Clave para el desarrollo de las raíces.",
  humedad:
    "Humedad del suelo o sustrato (SHT10). Decide cuándo activar el riego.",
  radiacion:
    "Radiación solar directa recibida. Ayuda a decidir si abrir o cerrar la malla.",
  viento:
    "Velocidad del aire. Útil para la seguridad de la malla y mecanismos."
};

// Gradient themes per sensor
const sensorThemes = {
  temperatura: {
    gradient: "from-orange-500/10 via-red-500/5 to-amber-500/10 dark:from-orange-500/15 dark:via-red-500/10 dark:to-amber-900/20",
    accent: "bg-orange-500",
    ring: "ring-orange-200/50 dark:ring-orange-800/30",
    iconBg: "bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-900/40 dark:to-red-900/30",
  },
  humedadAmbiente: {
    gradient: "from-sky-500/10 via-cyan-500/5 to-blue-500/10 dark:from-sky-500/15 dark:via-cyan-500/10 dark:to-blue-900/20",
    accent: "bg-sky-500",
    ring: "ring-sky-200/50 dark:ring-sky-800/30",
    iconBg: "bg-gradient-to-br from-sky-100 to-cyan-50 dark:from-sky-900/40 dark:to-cyan-900/30",
  },
  temperaturasuelo: {
    gradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10 dark:from-amber-500/15 dark:via-yellow-500/10 dark:to-orange-900/20",
    accent: "bg-amber-500",
    ring: "ring-amber-200/50 dark:ring-amber-800/30",
    iconBg: "bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/30",
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
  temperatura:      { min: 0, max: 50 },
  humedadAmbiente:  { min: 0, max: 100 },
  temperaturasuelo: { min: 0, max: 50 },
  humedad:          { min: 0, max: 100 },
  radiacion:        { min: 0, max: 1200 },
  viento:           { min: 0, max: 20 }
};

function getColor(sensor, value) {
  switch (sensor) {
    case "temperatura":
    case "temperaturasuelo":
      if (value < 10) return "text-blue-500 dark:text-blue-400";
      if (value < 30) return "text-emerald-600 dark:text-emerald-400";
      return "text-red-500 dark:text-red-400";
    case "humedad":
    case "humedadAmbiente":
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
    case "temperaturasuelo":
      if (value < 10) return "bg-blue-400";
      if (value < 30) return "bg-emerald-400";
      return "bg-red-400";
    case "humedad":
    case "humedadAmbiente":
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
  const isOffline = value === null || value === undefined;
  const Icon = iconMap[sensorKey];
  const color = isOffline ? "text-red-400 dark:text-red-400" : getColor(sensorKey, value);
  const barColor = isOffline ? "bg-red-300" : getBarColor(sensorKey, value);
  const theme = sensorThemes[sensorKey];
  const range = sensorRanges[sensorKey];
  const percent = isOffline ? 0 : Math.min(100, Math.max(0, ((value - range.min) / (range.max - range.min)) * 100));
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${isOffline
          ? "from-red-500/5 via-red-400/5 to-red-500/10 dark:from-red-900/20 dark:via-red-800/10 dark:to-red-900/20"
          : theme.gradient
        }
        glass ring-1 ${isOffline ? "ring-red-300/50 dark:ring-red-700/30" : theme.ring}
        p-5 rounded-2xl min-w-0
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

      <div className="flex items-center gap-3 mb-4 min-w-0 pr-7">
        <div className={`${
          isOffline
            ? "bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/30"
            : theme.iconBg
        } p-2 rounded-xl`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-tight min-w-0">
          {sensorLabels[sensorKey]}
        </span>
      </div>

      {/* Value or offline state */}
      {isOffline ? (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">
              Sin conexión
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
            Sensor no detectado. Verifica las conexiones.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center py-1">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32">
            <svg className="-rotate-90 h-28 w-28 sm:h-32 sm:w-32" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-gray-200/70 dark:text-slate-700/60"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`${barColor.replace("bg-", "text-")} transition-all duration-700`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-extrabold tabular-nums leading-none ${color}`}>
                {typeof value === "number" ? value.toFixed(1) : value}
              </span>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1">
                {unidades[sensorKey]}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                {Math.round(percent)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-gray-400 dark:text-gray-500">
        <span>{range.min}{unidades[sensorKey]}</span>
        <span>{range.max}{unidades[sensorKey]}</span>
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

const WeatherPanel = memo(function WeatherPanel({ clima, formattedDate, title }) {
  return (
    <div
      className="
        relative overflow-hidden
        glass rounded-3xl
        p-5 sm:p-7
        shadow-lg
        min-w-0
      "
    >
      {/* Title badge */}
      {title && (
        <div className="relative z-10 mb-4 flex justify-start xl:absolute xl:top-4 xl:right-4 xl:mb-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-slate-700/50">
            {title}
          </span>
        </div>
      )}
      {/* Decorative halos */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-sky-400/10 dark:bg-sky-400/5 blur-[60px]" />

      <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-5 sm:gap-6 relative min-w-0">
        {/* City + icon */}
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl" />
            <img
              src={`https://openweathermap.org/img/wn/${clima.icon}@4x.png`}
              className="w-16 h-16 sm:w-24 sm:h-24 relative z-10 drop-shadow-2xl animate-float"
              alt="Icono climático"
              loading="lazy"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight leading-tight break-words">
              {clima.ciudad}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 tracking-wide">
              {formattedDate}
            </p>
            <p className="text-base sm:text-xl mt-1.5 capitalize font-semibold text-emerald-600 dark:text-emerald-400 leading-snug break-words">
              {clima.descripcion}
            </p>
          </div>
        </div>

        {/* Weather stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 flex-1 min-w-0">
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
    <div className="min-w-0">
      <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight">
        {label}
      </span>
      <div className={`font-bold text-gray-800 dark:text-gray-100 leading-tight break-words ${large ? "text-lg sm:text-2xl" : "text-sm sm:text-base"}`}>
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
        glass rounded-2xl p-3.5
        flex items-center gap-3
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
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{description}</p>
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

function getRiegoTimestamp(item) {
  const raw = item?.fin ?? item?.finTs ?? item?.creadoEn ?? item?.inicio ?? item?.inicioTs;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function buildWaterBars(items, period) {
  const now = new Date();
  const buckets = period === "dia"
    ? Array.from({ length: 24 }, (_, i) => ({ label: `${String(i).padStart(2, "0")}:00`, litros: 0 }))
    : period === "mes"
      ? Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, i) => ({ label: String(i + 1), litros: 0 }))
      : Array.from({ length: 12 }, (_, i) => ({ label: new Date(now.getFullYear(), i, 1).toLocaleString("es-MX", { month: "short" }), litros: 0 }));

  items.forEach((item) => {
    const ts = getRiegoTimestamp(item);
    if (!ts) return;
    const d = new Date(ts);
    if (period === "dia" && sameDay(d, now)) buckets[d.getHours()].litros += Number(item.litros) || 0;
    if (period === "mes" && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      buckets[d.getDate() - 1].litros += Number(item.litros) || 0;
    }
    if (period === "anio" && d.getFullYear() === now.getFullYear()) {
      buckets[d.getMonth()].litros += Number(item.litros) || 0;
    }
  });

  return buckets.map((bucket) => ({ ...bucket, litros: Number(bucket.litros.toFixed(2)) }));
}

const WaterConsumptionChart = memo(function WaterConsumptionChart({ items, period, onPeriodChange, litrosHora }) {
  const bars = useMemo(() => buildWaterBars(items, period), [items, period]);
  const rawMax = Math.max(...bars.map((item) => item.litros), 0);
  const max = Math.max(Math.ceil(rawMax), 1);
  const total = bars.reduce((acc, item) => acc + item.litros, 0);
  const activeBars = bars.filter((item) => item.litros > 0).length;
  const average = activeBars > 0 ? total / activeBars : 0;
  const riegos = items.filter((item) => {
    const ts = getRiegoTimestamp(item);
    if (!ts) return false;
    const d = new Date(ts);
    const now = new Date();
    if (period === "dia") return sameDay(d, now);
    if (period === "mes") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return d.getFullYear() === now.getFullYear();
  }).length;
  const periodInfo = {
    dia: {
      label: "Día",
      title: "Consumo de hoy por hora",
      subtitle: new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }),
      xLabel: "Horas del día",
      unitLabel: "L/hora",
    },
    mes: {
      label: "Mes",
      title: "Consumo del mes por día",
      subtitle: new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      xLabel: "Días del mes",
      unitLabel: "L/día",
    },
    anio: {
      label: "Año",
      title: "Consumo anual por mes",
      subtitle: String(new Date().getFullYear()),
      xLabel: "Meses",
      unitLabel: "L/mes",
    },
  }[period];
  const yTicks = [max, max * 0.75, max * 0.5, max * 0.25, 0];
  const hasData = bars.some((item) => item.litros > 0);

  return (
    <section className="glass rounded-3xl p-5 sm:p-6 border border-sky-100/70 dark:border-sky-900/30">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
              <FiBarChart2 className="text-sky-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Consumo de agua
              </h2>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 capitalize">
                {periodInfo.title}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {periodInfo.subtitle} · bomba configurada a {litrosHora} L/h
          </p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 dark:bg-slate-800/60 rounded-2xl p-1 w-fit">
          {[
            { key: "dia", label: "Día" },
            { key: "mes", label: "Mes" },
            { key: "anio", label: "Año" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPeriodChange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${period === key ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/40 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Agua estimada</p>
          <p className="text-2xl font-extrabold text-sky-700 dark:text-sky-300 mt-1">
            {total.toFixed(1)} <span className="text-sm font-semibold text-sky-400">L</span>
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Riegos</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{riegos}</p>
        </div>
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Promedio activo</p>
          <p className="text-2xl font-extrabold text-violet-700 dark:text-violet-300 mt-1">
            {average.toFixed(1)} <span className="text-sm font-semibold text-violet-400">L</span>
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Escala</p>
          <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mt-1">
            {max.toFixed(0)} <span className="text-sm font-semibold text-gray-400">L máx.</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white/45 dark:bg-slate-900/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{periodInfo.unitLabel}</p>
            <p className="text-[11px] text-gray-400">{periodInfo.xLabel}</p>
          </div>
          <p className="text-[11px] font-semibold text-gray-400">Litros aproximados</p>
        </div>

        <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
          <div className="h-64 flex flex-col justify-between text-right pr-1">
            {yTicks.map((tick, index) => (
              <span key={index} className="text-[10px] font-semibold text-gray-400">
                {tick.toFixed(tick >= 10 ? 0 : 1)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, index) => (
                <span key={index} className="block border-t border-dashed border-gray-200/80 dark:border-slate-700/70" />
              ))}
            </div>

            <div className="relative overflow-x-auto pb-1">
              <div className="h-64 flex items-end gap-1.5 sm:gap-2 min-w-max">
                {bars.map((item, index) => {
                  const height = item.litros > 0 ? Math.max(8, (item.litros / max) * 100) : 0;
                  return (
                    <div key={`${item.label}-${index}`} className="relative h-full min-w-[24px] sm:min-w-[28px] flex items-end group">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${item.litros > 0
                            ? "bg-gradient-to-t from-sky-600 via-sky-400 to-cyan-300 shadow-[0_10px_24px_rgba(14,165,233,0.22)]"
                            : "bg-gray-200/60 dark:bg-slate-700/60"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="pointer-events-none absolute left-1/2 bottom-[calc(100%+8px)] z-20 -translate-x-1/2 rounded-xl bg-slate-950 text-white px-2.5 py-1.5 text-[11px] font-semibold opacity-0 shadow-xl transition group-hover:opacity-100 whitespace-nowrap">
                          {item.label}: {item.litros.toFixed(2)} L
                        </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-1.5 sm:gap-2 min-w-max border-t border-gray-100 dark:border-slate-800 pt-2">
                {bars.map((item, index) => {
                  const showLabel = period === "dia" ? index % 3 === 0 : period === "mes" ? index % 3 === 0 : true;
                  return (
                    <div key={`label-${item.label}-${index}`} className="min-w-[24px] sm:min-w-[28px] text-center">
                      <span className={`block text-[10px] leading-none text-gray-400 ${showLabel ? "" : "opacity-0"}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="mt-4 rounded-2xl border border-dashed border-sky-200 dark:border-sky-800/50 bg-sky-50/50 dark:bg-sky-900/10 px-4 py-4 text-center">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Sin consumo registrado en este periodo</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Enciende y apaga la bomba para crear un evento de historial y calcular litros aproximados.
          </p>
        </div>
      )}
    </section>
  );
});

// ─── Main Component ───────────────────────────────────────────────────

export default function Dashboard() {
  const { sectionPath, invPath, invId, secId, currentSection, invernaderos, selectInvernadero, selectSeccion, modulos } = useAuth();
  const navigate = useNavigate();
  const [sensores, setSensores] = useState(null);
  const [riego, setRiego] = useState(null);
  const [riegoFisico, setRiegoFisico] = useState(false);
  const [malla, setMalla] = useState(null);
  const [automatico, setAutomatico] = useState(false);
  const [riegoProgramado, setRiegoProgramado] = useState({});
  const [historialRiego, setHistorialRiego] = useState([]);
  const [waterPeriod, setWaterPeriod] = useState("dia");
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [scheduleDuration, setScheduleDuration] = useState(10);
  const [scheduleType, setScheduleType] = useState("goteo");
  const [clima, setClima] = useState(null);
  const [moduloClima, setModuloClima] = useState(null);
  const [ia, setIa] = useState(null);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [moduloLocation, setModuloLocation] = useState(null);

  // Estado derivado del módulo OASYS (sin listener propio: usa el de AuthContext)
  const linkedModuloEntry = invId && secId
    ? Object.entries(modulos || {}).find(([, modulo]) => modulo?.invernaderoId === invId && modulo?.seccionId === secId)
    : null;
  const moduloId = invId && secId
    ? (invernaderos[invId]?.secciones?.[secId]?.moduloId || linkedModuloEntry?.[0] || null)
    : null;
  const moduloData = moduloId ? modulos[moduloId] : null;
  const moduleOnline = isModuleOnline(moduloData);
  const litrosHora = getLitrosHora(currentSection);
  const riegoActivo = riegoFisico || riego;

  // Firebase listeners
  useEffect(() => {
    if (!sectionPath || !invPath) return;
    const unsubs = [
      onValue(ref(db, `${invPath}/sensores`), (s) => {
        const rootSensors = s.val();
        if (rootSensors) setSensores((current) => current || rootSensors);
      }),
      onValue(ref(db, `${sectionPath}/sensores`), (s) => {
        setSensores(s.val() || null);
      }),
      onValue(ref(db, `${sectionPath}/control/riego`), (s) => setRiego(s.val() === true)),
      onValue(ref(db, `${sectionPath}/estadoRiego/activo`), (s) => setRiegoFisico(s.val() === true)),
      onValue(ref(db, `${sectionPath}/control/malla`), (s) => setMalla(s.val() === true)),
      onValue(ref(db, `${sectionPath}/controlAutomatico/activo`), (s) => setAutomatico(s.val() === true)),
      onValue(ref(db, `${sectionPath}/controlAutomatico/programaciones/riego`), (s) => setRiegoProgramado(s.val() || {})),
      onValue(ref(db, `${sectionPath}/historial_riego`), (s) => {
        const val = s.val() || {};
        const rows = Object.entries(val)
          .map(([id, item]) => ({ id, ...item }))
          .sort((a, b) => getRiegoTimestamp(a) - getRiegoTimestamp(b));
        setHistorialRiego(rows);
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [sectionPath, invPath]);

  // Geolocation to weather
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

  // Geolocalización del módulo OASYS por IP
  useEffect(() => {
    if (!moduloData?.ip) { setModuloLocation(null); return; }
    let cancelled = false;
    getModuloLocation(moduloData.ip).then((loc) => {
      if (!cancelled) setModuloLocation(loc);
    });
    return () => { cancelled = true; };
  }, [moduloData?.ip]);

  // Clima en la ubicación del módulo OASYS
  useEffect(() => {
    if (!moduloLocation || !moduleOnline) { setModuloClima(null); return; }
    let cancelled = false;
    obtenerPronostico(moduloLocation.lat, moduloLocation.lon).then((datos) => {
      if (!cancelled) {
        datos.ciudad = `${moduloLocation.city}`;
        setModuloClima(datos);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [moduloLocation, moduleOnline]);

  // IA prediction (debounced 500ms)
  useEffect(() => {
    if (!clima || !sensores) return;

    const timer = setTimeout(() => {
      generarPrediccionIA(clima, sensores, riegoActivo, malla).then(setIa);
    }, 500);

    return () => clearTimeout(timer);
  }, [clima, sensores, riegoActivo, malla]);

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

  // Solo mostrar las variables de sensor que conocemos (excluir flags y metadata)
  const SENSOR_KEYS_CONOCIDAS = ["temperatura", "humedad", "humedadAmbiente", "temperaturasuelo", "radiacion", "viento"];
  const sensorEntries = useMemo(
    () => sensores
      ? Object.entries(sensores).filter(([k]) => SENSOR_KEYS_CONOCIDAS.includes(k))
      : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sensores]
  );

  const handleHelp = useCallback((e, sensorKey) => {
    e.stopPropagation();
    alert(sensorDescripciones[sensorKey]);
  }, []);

  const programaciones = useMemo(
    () => Object.entries(riegoProgramado || {})
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => String(a.hora || "").localeCompare(String(b.hora || ""))),
    [riegoProgramado]
  );

  const proximoRiego = useMemo(() => {
    if (programaciones.length === 0) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return programaciones.find((item) => {
      const [hour, minute] = String(item.hora || "00:00").split(":").map(Number);
      return hour * 60 + minute >= nowMinutes;
    }) || programaciones[0];
  }, [programaciones]);

  const agregarRiegoProgramado = useCallback(async () => {
    if (!sectionPath || !scheduleTime) return;
    const id = `${scheduleTime.replace(":", "")}_${Date.now()}`;
    const duracionMin = Math.min(120, Math.max(1, Number(scheduleDuration) || 1));
    await set(ref(db, `${sectionPath}/controlAutomatico/programaciones/riego/${id}`), {
      hora: scheduleTime,
      duracionMin,
      tipo: scheduleType,
      litrosHora,
      litrosEstimados: Number(((litrosHora / 60) * duracionMin).toFixed(2)),
      activo: true,
      creadoEn: Date.now(),
    });
  }, [litrosHora, sectionPath, scheduleTime, scheduleDuration, scheduleType]);

  const eliminarRiegoProgramado = useCallback(async (id) => {
    if (!sectionPath || !id) return;
    await remove(ref(db, `${sectionPath}/controlAutomatico/programaciones/riego/${id}`));
  }, [sectionPath]);

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

        <div className="flex flex-col items-start sm:items-end gap-2">
          {/* Active section switcher dropdown */}
          {(() => {
            const sec = invId && secId ? invernaderos?.[invId]?.secciones?.[secId] : null;
            const invName = invId ? (invernaderos?.[invId]?.nombre || invId.slice(-8)) : null;
            const invEntries = Object.entries(invernaderos || {});
            return (
              <div className="relative">
                <button
                  onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                  className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 hover:border-emerald-400 transition"
                >
                  <span className="text-xl">{sec?.cultivoActual?.split(" ")[0] || ""}</span>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sección activa</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sec?.nombre || (secId ? "Sección" : "Seleccionar")}</p>
                    {invName && <p className="text-[10px] text-gray-400">{invName}</p>}
                  </div>
                  <FiChevronDown className={`text-gray-400 transition ml-1 ${sectionDropdownOpen ? "rotate-180" : ""}`} size={14} />
                </button>
                {sectionDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                    {invEntries.map(([iId, inv]) => {
                      const secs = Object.entries(inv?.secciones || {});
                      const iOnline = secs.some(([sId]) => {
                        const secModuleId = inv?.secciones?.[sId]?.moduloId
                          || Object.entries(modulos || {}).find(([, modulo]) => modulo?.invernaderoId === iId && modulo?.seccionId === sId)?.[0];
                        return secModuleId ? isModuleOnline(modulos[secModuleId]) : false;
                      });
                      return (
                        <div key={iId}>
                          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${iOnline ? "bg-emerald-400" : "bg-gray-400"}`} />
                             {inv?.nombre || iId.slice(-8)}
                          </div>
                          {secs.map(([sId, s]) => {
                            const isActive = invId === iId && secId === sId;
                            return (
                              <button
                                key={sId}
                                onClick={() => { selectInvernadero(iId); selectSeccion(sId); setSectionDropdownOpen(false); }}
                                className={`w-full text-left px-5 py-2.5 text-sm flex items-center gap-2 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${isActive ? "text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-900/10" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                <span>{s?.cultivoActual?.split(" ")[0] || ""}</span>
                                {s?.nombre || sId}
                                {isActive && <span className="ml-auto text-[10px] font-bold text-emerald-500">Activo</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            <StatusChip
              active={moduleOnline}
              activeClass="border-emerald-200/60 text-emerald-700 dark:border-emerald-700/40 dark:text-emerald-300"
              inactiveClass="border-red-200/60 text-red-700 dark:border-red-700/40 dark:text-red-300"
            >
              <span
                className={`
                h-1.5 w-1.5 rounded-full
                ${moduleOnline
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-breathe"
                    : "bg-red-400"
                  }
              `}
              />
              {moduleOnline ? "Módulo online" : "Módulo offline"}
            </StatusChip>

            <StatusChip
              active={riegoActivo}
              activeClass="border-sky-200/60 text-sky-700 dark:border-sky-700/40 dark:text-sky-300"
              inactiveClass="border-gray-200/60 text-gray-500 dark:border-gray-700/40 dark:text-gray-400"
            >
              <WiRaindrop className="text-base" /> {riegoActivo ? "Riego activo" : "Riego off"}
            </StatusChip>

            <StatusChip
              active={malla}
              activeClass="border-amber-200/60 text-amber-700 dark:border-amber-700/40 dark:text-amber-300"
              inactiveClass="border-gray-200/60 text-gray-500 dark:border-gray-700/40 dark:text-gray-400"
            >
              <FiShield className="text-xs" /> Malla {malla ? "abierta" : "cerrada"}
            </StatusChip>
          </div>
        </div>
      </header>

      {/* ═══ WEATHER PANELS ═══ */}
      <div className="grid gap-6">
        {/* Panel usuario */}
        {clima ? (
          <WeatherPanel clima={clima} formattedDate={formattedDate} title="Tu ubicación" />
        ) : (
          <SkeletonClima />
        )}

        {/* Panel OASYS: solo aparece cuando hay clima disponible */}
        {moduloId && moduleOnline && moduloClima && (
          <WeatherPanel clima={moduloClima} formattedDate={formattedDate} title="OASYS Módulo" />
        )}
      </div>

      {/* ═══ NO SECTION SELECTED ═══ */}
      {!secId && (
        <div className="glass rounded-3xl p-10 sm:p-14 text-center space-y-4 animate-fadeUp">
          <p className="text-6xl"></p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sin sección activa</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Selecciona un invernadero y una sección desde el menú superior para comenzar a monitorear en tiempo real.
          </p>
          <button
            onClick={() => navigate("/invernaderos")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 mt-2"
          >
            Ir a Invernaderos
          </button>
        </div>
      )}

      {/* ═══ MAIN GRID ═══ */}
      {secId && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

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
                  Datos en tiempo real · OASYS Módulo Climático
                  {moduloLocation && (
                    <span className="ml-2 text-[10px] text-sky-500">
                      · Módulo en {moduloLocation.city}, {moduloLocation.country}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {sensores ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
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

          <WaterConsumptionChart
            items={historialRiego}
            period={waterPeriod}
            onPeriodChange={setWaterPeriod}
            litrosHora={litrosHora}
          />

          {/* IA Panel */}
          {ia ? (
            <IAPanel ia={ia} />
          ) : (clima && sensores) ? (
            <div className="glass rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-5 h-5 rounded-full bg-violet-200/70 dark:bg-violet-700/40" />
                <div className="w-40 h-4 rounded-full bg-violet-200/70 dark:bg-violet-700/40" />
              </div>
              <div className="space-y-2.5">
                <div className="h-3 bg-gray-200/60 dark:bg-gray-700/40 rounded-full w-full" />
                <div className="h-3 bg-gray-200/60 dark:bg-gray-700/40 rounded-full w-11/12" />
                <div className="h-3 bg-gray-200/60 dark:bg-gray-700/40 rounded-full w-4/5" />
                <div className="h-3 bg-gray-200/60 dark:bg-gray-700/40 rounded-full w-5/6" />
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column: system status */}
        <aside className="flex flex-col gap-3">
          <div className="order-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              Estado del sistema
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Conexión y actuadores
            </p>
          </div>

          <div className="order-2 space-y-2.5">
            <StatusCard
              title="OASYS Módulo Climático"
              icon={<FiWifi className="text-2xl text-emerald-500" />}
              accentColor={moduleOnline ? "border-l-emerald-500" : "border-l-red-400"}
              isActive={moduleOnline}
              status={moduleOnline ? "Conectado" : "Sin conexión"}
              description={moduleOnline ? "Módulo enviando datos en tiempo real" : "Verifica la alimentación del módulo"}
            />

            <StatusCard
              title="Sistema de riego"
              icon={<WiRaindrop className="text-2xl text-sky-500" />}
              accentColor={riegoActivo ? "border-l-sky-500" : "border-l-gray-300 dark:border-l-gray-600"}
              isActive={riegoActivo}
              status={riegoActivo ? "Activo — regando" : "Apagado"}
              description={riegoActivo ? "Bomba de riego encendida" : "Bomba en reposo, sin riego activo"}
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

          <div className="order-3 glass rounded-2xl p-3.5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FiClock className="text-emerald-500" />
                  Riego por hora
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Agenda horarios fijos para complementar el riego por sensores.
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${automatico ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"}`}>
                {automatico ? "Auto ON" : "Auto OFF"}
              </span>
            </div>

            <div className="mb-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-900/15 px-3 py-2">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Próximo riego
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                {proximoRiego
                  ? `${proximoRiego.hora} · ${proximoRiego.duracionMin || 1} min · ${proximoRiego.tipo || "riego"}`
                  : "Sin horario definido"}
              </p>
              {!automatico && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Activa el modo automático para editar la agenda.
                </p>
              )}
            </div>

            <div className={`grid grid-cols-2 gap-2 ${automatico ? "" : "opacity-50"}`}>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Hora de inicio
                </span>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={!automatico}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Duración (min)
                </span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(e.target.value)}
                  disabled={!automatico}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                  title="Duración en minutos"
                />
              </label>
              <label className="col-span-2 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Tipo de riego
                </span>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  disabled={!automatico}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="goteo">Goteo lento</option>
                  <option value="aspersión">Aspersión</option>
                  <option value="manual">Pulso programado</option>
                </select>
              </label>
              <button
                type="button"
                onClick={agregarRiegoProgramado}
                disabled={!automatico}
                className="col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiPlus size={14} />
                Agregar riego
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {programaciones.length === 0 ? (
                <div className="text-center py-3 px-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Sin riegos programados
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    Agrega una hora y duración para crear la primera agenda.
                  </p>
                </div>
              ) : (
                programaciones.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/45 dark:bg-slate-800/45 border border-gray-200/70 dark:border-slate-700/70">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.hora}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        {item.tipo || "riego"} · {item.duracionMin || 1} min
                        {item.litrosEstimados ? ` · ${item.litrosEstimados} L est.` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarRiegoProgramado(item.id)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Eliminar riego"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick summary card */}
          <div className="order-4 glass rounded-2xl p-3.5">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Resumen rápido
            </h3>
            {sensores ? (
              <div className="space-y-3">
                {[
                  { label: "Temp Amb", Icon: WiThermometer, value: sensores.temperatura, unit: "°C", max: 50, bar: "bg-orange-400", sensorNombre: "SHT31" },
                  { label: "Hum Amb", Icon: WiHumidity, value: sensores.humedadAmbiente, unit: "%", max: 100, bar: "bg-sky-400", sensorNombre: "SHT31" },
                  { label: "Temp Suelo", Icon: WiThermometer, value: sensores.temperaturasuelo, unit: "°C", max: 50, bar: "bg-amber-400", sensorNombre: "SHT10" },
                  { label: "Hum Suelo", Icon: WiRaindrop, value: sensores.humedad, unit: "%", max: 100, bar: "bg-blue-400", sensorNombre: "SHT10" },
                ].map(({ label, Icon, value, unit, max, bar, sensorNombre }) => {
                  const offline = value === null || value === undefined;
                  return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Icon className="text-base" /> {label}
                        <span className="text-[9px] text-gray-400 dark:text-gray-600 ml-0.5">({sensorNombre})</span>
                      </span>
                      {offline ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          Sin conexión
                        </span>
                      ) : (
                        <span className="font-bold text-gray-800 dark:text-gray-100">
                          {typeof value === "number" ? value.toFixed(1) : value}
                          <span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${offline ? "bg-red-300" : bar} rounded-full transition-all duration-1000`}
                        style={{ width: offline ? "100%" : `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
                      />
                    </div>
                  </div>
                  );
                })}
                {clima && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <WiRain className="text-base" /> Lluvia
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {clima.lluvia_prob}<span className="text-[10px] font-normal text-gray-400 ml-0.5">%</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-3">Sin datos de sensores</p>
            )}
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}
