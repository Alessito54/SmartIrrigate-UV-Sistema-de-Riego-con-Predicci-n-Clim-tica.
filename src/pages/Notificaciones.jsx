import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, get } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { isModuleOnline } from "../services/modulos";
import { enviarAlertasSMS } from "../services/twilioSms";
import { FiBell, FiFilter, FiSearch, FiChevronLeft, FiAlertTriangle, FiCheckCircle, FiInfo, FiAlertCircle, FiX, FiSmartphone, FiSend } from "react-icons/fi";
import { WiRaindrop } from "react-icons/wi";

// ─── Sensor notification config (shared with Dashboard) ───────────────
const notificationSensorConfig = [
  { key: "humedad", label: "Hum. Suelo", unit: "%", defaultMin: 40, defaultMax: 90, lowTone: "danger", highTone: "warning" },
  { key: "humedadAmbiente", label: "Hum. Ambiente", unit: "%", defaultMin: 30, defaultMax: 80, lowTone: "warning", highTone: "warning" },
  { key: "radiacion", label: "Radiación UV", unit: "W/m²", defaultMin: 0, defaultMax: 900, lowTone: "info", highTone: "warning" },
  { key: "temperatura", label: "Temp. Ambiente", unit: "°C", defaultMin: 10, defaultMax: 35, lowTone: "info", highTone: "warning" },
  { key: "temperaturasuelo", label: "Temp. Suelo", unit: "°C", defaultMin: 10, defaultMax: 35, lowTone: "info", highTone: "warning" },
  { key: "viento", label: "Viento", unit: "m/s", defaultMin: 0, defaultMax: 12, lowTone: "info", highTone: "warning" },
];

function getRiegoTimestamp(item) {
  const raw = item?.fin ?? item?.finTs ?? item?.creadoEn ?? item?.inicio ?? item?.inicioTs;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// ─── Tone config ──────────────────────────────────────────────────────
const toneConfig = {
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800/50",
    text: "text-red-700 dark:text-red-300",
    accent: "bg-red-500",
    icon: FiAlertCircle,
    label: "Crítica",
    badgeBg: "bg-red-100 dark:bg-red-900/40",
    badgeText: "text-red-700 dark:text-red-300",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/50",
    text: "text-amber-700 dark:text-amber-300",
    accent: "bg-amber-500",
    icon: FiAlertTriangle,
    label: "Advertencia",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    text: "text-emerald-700 dark:text-emerald-300",
    accent: "bg-emerald-500",
    icon: FiCheckCircle,
    label: "Activo",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800/50",
    text: "text-sky-700 dark:text-sky-300",
    accent: "bg-sky-500",
    icon: FiInfo,
    label: "Info",
    badgeBg: "bg-sky-100 dark:bg-sky-900/40",
    badgeText: "text-sky-700 dark:text-sky-300",
  },
};

// ─── Notification Card ────────────────────────────────────────────────
const NotificationCard = memo(function NotificationCard({ item, index, onDismiss }) {
  const config = toneConfig[item.tone] || toneConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-2xl border ${config.border} ${config.bg}
        p-4 sm:p-5
        transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5
        animate-fadeUp
        group
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Accent bar left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent} rounded-l-2xl`} />

      {onDismiss && (
        <button
          onClick={() => onDismiss(item.id)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
          title="Borrar notificación"
        >
          <FiX size={16} />
        </button>
      )}

      <div className="flex items-start gap-3 sm:gap-4 pl-2">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl
          flex items-center justify-center
          ${config.bg} border ${config.border}
          transition-transform duration-300 group-hover:scale-110
        `}>
          <Icon className={`text-lg ${config.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`text-sm font-bold ${config.text} leading-snug`}>
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {item.detail}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`
                text-[10px] font-bold uppercase tracking-wider
                px-2 py-0.5 rounded-full
                ${config.badgeBg} ${config.badgeText}
              `}>
                {item.label}
              </span>
              <span className={`
                text-[10px] font-bold uppercase tracking-wider
                px-2 py-0.5 rounded-full
                ${config.badgeBg} ${config.badgeText}
              `}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Config Panel ─────────────────────────────────────────────────────
const ConfigPanel = memo(function ConfigPanel({ config }) {
  if (!config) return null;
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <FiFilter className="text-emerald-500" />
        Umbrales configurados
      </h3>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
        Estos son los rangos definidos para cada sensor. Si una lectura sale de rango, se genera una alerta.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {config.map((sensor) => (
          <div
            key={sensor.key}
            className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/45 px-4 py-3 transition-all hover:shadow-md"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              {sensor.label}
            </p>
            <p className="text-base font-extrabold text-gray-800 dark:text-gray-100">
              {sensor.min} — {sensor.max}
              <span className="text-xs font-semibold text-gray-400 ml-1">{sensor.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Filter Chip ──────────────────────────────────────────────────────
function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
        transition-all duration-200 border
        ${active
          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
          : "bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        }
      `}
    >
      {children}
      {count !== undefined && (
        <span className={`
          text-[10px] font-bold px-1.5 py-0.5 rounded-full
          ${active
            ? "bg-white/20 text-white"
            : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Notificaciones() {
  const { sectionPath, invPath, invId, secId, currentSection, invernaderos, modulos, user } = useAuth();
  const navigate = useNavigate();

  const [sensores, setSensores] = useState(null);
  const [riego, setRiego] = useState(null);
  const [riegoFisico, setRiegoFisico] = useState(false);
  const [malla, setMalla] = useState(null);
  const [automatico, setAutomatico] = useState(false);
  const [autoConfig, setAutoConfig] = useState(null);
  const [historialRiego, setHistorialRiego] = useState([]);
  const [filterTone, setFilterTone] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // SMS state
  const [userPhone, setUserPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null); // { ok, message/error }

  // Load user phone from Firebase
  useEffect(() => {
    if (!user) return;
    get(ref(db, `usuarios/${user.uid}/telefono`)).then((snap) => {
      if (snap.exists()) setUserPhone(snap.val());
    }).catch(() => {});
  }, [user]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("oasys_dismissed_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("oasys_dismissed_notifications", JSON.stringify(newDismissed));
  };

  const handleRestoreDismissed = () => {
    setDismissedIds([]);
    localStorage.removeItem("oasys_dismissed_notifications");
  };

  const linkedModuloEntry = invId && secId
    ? Object.entries(modulos || {}).find(([, modulo]) => modulo?.invernaderoId === invId && modulo?.seccionId === secId)
    : null;
  const moduloId = invId && secId
    ? (invernaderos[invId]?.secciones?.[secId]?.moduloId || linkedModuloEntry?.[0] || null)
    : null;
  const moduloData = moduloId ? modulos[moduloId] : null;
  const moduleOnline = isModuleOnline(moduloData);
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
      onValue(ref(db, `${sectionPath}/controlAutomatico`), (s) => {
        const value = s.val() || {};
        setAutoConfig(value);
        setAutomatico(value.activo === true);
      }),
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

  // Build all notifications (no limit)
  const allNotifications = useMemo(() => {
    const list = [];
    const liveAutoConfig = autoConfig || currentSection?.controlAutomatico || {};
    const umbrales = liveAutoConfig.umbrales || {};
    const acciones = liveAutoConfig.acciones || {};

    notificationSensorConfig.forEach((sensor) => {
      const raw = sensores?.[sensor.key];
      const value = Number(raw);
      const min = Number(umbrales?.[sensor.key]?.min ?? sensor.defaultMin);
      const max = Number(umbrales?.[sensor.key]?.max ?? sensor.defaultMax);
      const hasData = raw !== null && raw !== undefined && Number.isFinite(value);

      if (!hasData) {
        list.push({
          id: `${sensor.key}-sin-datos`,
          tone: "info",
          label: "Sin datos",
          title: `${sensor.label} sin lectura`,
          detail: "OASYS no ha enviado datos para este sensor todavía.",
        });
        return;
      }

      if (value < min) {
        const isCriticalSoilHumidity = sensor.key === "humedad" && value < Math.max(5, min * 0.55);
        list.push({
          id: `${sensor.key}-bajo`,
          tone: isCriticalSoilHumidity ? "danger" : sensor.lowTone,
          label: "Mínimo",
          title: `${sensor.label} bajo el mínimo`,
          detail: `Actual ${value.toFixed(1)} ${sensor.unit}. Rango configurado: ${min} a ${max} ${sensor.unit}.`,
        });
        return;
      }

      if (value > max) {
        const titleByAction = sensor.key === "humedad" && acciones?.riego?.bajoHumedad
          ? `${sensor.label} sobre el máximo`
          : sensor.key === "temperatura" && acciones?.malla?.altaTemperatura
            ? "Malla recomendada por temperatura alta"
            : sensor.key === "radiacion" && acciones?.malla?.altaRadiacion
              ? "Malla recomendada por radiación alta"
              : `${sensor.label} sobre el máximo`;
        list.push({
          id: `${sensor.key}-alto`,
          tone: sensor.highTone,
          label: "Máximo",
          title: titleByAction,
          detail: `Actual ${value.toFixed(1)} ${sensor.unit}. Rango configurado: ${min} a ${max} ${sensor.unit}.`,
        });
      }
    });

    if (riegoActivo) {
      list.push({
        id: "riego-activo",
        tone: "success",
        label: "Riego",
        title: "Riego activo",
        detail: automatico ? "El sistema está regando en modo automático o por programación." : "La bomba está encendida desde control manual.",
      });
    }

    if (malla) {
      list.push({
        id: "malla-activa",
        tone: "success",
        label: "Malla",
        title: "Malla sombra desplegada",
        detail: "La malla está activa para proteger el cultivo.",
      });
    }

    const lastRiego = historialRiego.length > 0 ? historialRiego[historialRiego.length - 1] : null;
    const lastTs = lastRiego ? getRiegoTimestamp(lastRiego) : 0;
    if (lastTs && Date.now() - lastTs < 60 * 60 * 1000) {
      list.push({
        id: "riego-reciente",
        tone: "info",
        label: "Historial",
        title: "Riego registrado recientemente",
        detail: `Último riego: ${(Number(lastRiego.litros) || 0).toFixed(2)} L durante ${Math.round((Number(lastRiego.duracion_seg) || 0) / 60) || 1} min.`,
      });
    }

    // Module online/offline status
    if (moduloId) {
      list.push({
        id: "modulo-status",
        tone: moduleOnline ? "success" : "danger",
        label: "Módulo",
        title: moduleOnline ? "OASYS Módulo conectado" : "OASYS Módulo sin conexión",
        detail: moduleOnline
          ? "El módulo está transmitiendo datos al servidor correctamente."
          : "No se ha recibido señal reciente. Verifica la alimentación y conexión WiFi del módulo.",
      });
    }

    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [automatico, autoConfig, currentSection, historialRiego, malla, riegoActivo, sensores, moduloId, moduleOnline, dismissedIds]);

  // Filter + search
  const filteredNotifications = useMemo(() => {
    let items = allNotifications;
    if (filterTone !== "all") {
      items = items.filter((n) => n.tone === filterTone);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.detail.toLowerCase().includes(q) ||
          n.label.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allNotifications, filterTone, searchQuery]);

  // Count by tone
  const toneCounts = useMemo(() => {
    const counts = { danger: 0, warning: 0, success: 0, info: 0 };
    allNotifications.forEach((n) => {
      if (counts[n.tone] !== undefined) counts[n.tone]++;
    });
    return counts;
  }, [allNotifications]);

  const notificationConfig = useMemo(() => {
    const liveAutoConfig = autoConfig || currentSection?.controlAutomatico || {};
    const umbrales = liveAutoConfig.umbrales || {};
    return notificationSensorConfig.map((sensor) => ({
      key: sensor.key,
      label: sensor.label,
      unit: sensor.unit,
      min: Number(umbrales?.[sensor.key]?.min ?? sensor.defaultMin),
      max: Number(umbrales?.[sensor.key]?.max ?? sensor.defaultMax),
    }));
  }, [autoConfig, currentSection]);

  const hasActiveAlerts = toneCounts.danger + toneCounts.warning > 0;

  // Alerts eligible for SMS (exclude riego/malla status notifications)
  const smsAlerts = useMemo(() =>
    allNotifications.filter((n) =>
      n.id !== "riego-activo" &&
      n.id !== "malla-activa" &&
      n.id !== "riego-reciente" &&
      n.id !== "modulo-status"
    ),
    [allNotifications]
  );

  const handleSendSMS = useCallback(async () => {
    if (!userPhone || smsAlerts.length === 0) return;
    setSmsSending(true);
    setSmsResult(null);
    try {
      const result = await enviarAlertasSMS(userPhone, smsAlerts);
      setSmsResult(result);
      if (result.ok) {
        setTimeout(() => setSmsResult(null), 5000);
      }
    } catch {
      setSmsResult({ ok: false, error: "Error inesperado al enviar SMS." });
    } finally {
      setSmsSending(false);
    }
  }, [userPhone, smsAlerts]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeUp">

      {/* ═══ HEADER ═══ */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition mb-2"
          >
            <FiChevronLeft size={14} />
            Volver al panel
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasActiveAlerts ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"} transition-colors duration-500`}>
                <FiBell className={`text-xl ${hasActiveAlerts ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
              </div>
              {hasActiveAlerts && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                  {toneCounts.danger + toneCounts.warning}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
                Notificaciones
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Alertas y estado en tiempo real de tus sensores
              </p>
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 flex-wrap">
          <div className="glass rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</p>
            <p className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{allNotifications.length}</p>
          </div>
          {toneCounts.danger > 0 && (
            <div className="rounded-xl px-3 py-2 text-center min-w-[72px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Críticas</p>
              <p className="text-xl font-extrabold text-red-700 dark:text-red-300">{toneCounts.danger}</p>
            </div>
          )}
          {toneCounts.warning > 0 && (
            <div className="rounded-xl px-3 py-2 text-center min-w-[72px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Alertas</p>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{toneCounts.warning}</p>
            </div>
          )}
        </div>
      </header>

      {/* ═══ NO SECTION ═══ */}
      {!secId && (
        <div className="glass rounded-3xl p-10 sm:p-14 text-center space-y-4">
          <p className="text-6xl">🔔</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sin sección activa</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Selecciona un invernadero y una sección para ver las notificaciones y alertas.
          </p>
          <button
            onClick={() => navigate("/invernaderos")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 mt-2"
          >
            Ir a Invernaderos
          </button>
        </div>
      )}

      {secId && (
        <>
          {/* ═══ SMS PANEL ═══ */}
          <div className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <FiSmartphone className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Alertas por SMS</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Envía las alertas de sensores a tu celular (excluye estados de riego y malla)</p>
              </div>
            </div>

            {!userPhone ? (
              <div className="rounded-xl border border-dashed border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 text-center">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Sin número configurado</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Ve a <button onClick={() => navigate("/ajustes")} className="underline text-emerald-600 dark:text-emerald-400 font-semibold">Ajustes</button> para agregar tu número de teléfono.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/45 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FiSmartphone className="text-gray-400" size={14} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{userPhone}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    {smsAlerts.length} alerta{smsAlerts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <button
                  onClick={handleSendSMS}
                  disabled={smsSending || smsAlerts.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/20"
                >
                  <FiSend size={14} />
                  {smsSending ? "Enviando..." : smsAlerts.length === 0 ? "Sin alertas para enviar" : `Enviar ${smsAlerts.length} alerta${smsAlerts.length !== 1 ? "s" : ""} por SMS`}
                </button>

                {smsResult && (
                  <div className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                    smsResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300"
                  }`}>
                    {smsResult.ok ? `✅ ${smsResult.message}` : `❌ ${smsResult.error}`}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="glass rounded-2xl p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notificaciones..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap">
              <FilterChip
                active={filterTone === "all"}
                onClick={() => setFilterTone("all")}
                count={allNotifications.length}
              >
                Todas
              </FilterChip>
              <FilterChip
                active={filterTone === "danger"}
                onClick={() => setFilterTone("danger")}
                count={toneCounts.danger}
              >
                Críticas
              </FilterChip>
              <FilterChip
                active={filterTone === "warning"}
                onClick={() => setFilterTone("warning")}
                count={toneCounts.warning}
              >
                Advertencias
              </FilterChip>
              <FilterChip
                active={filterTone === "success"}
                onClick={() => setFilterTone("success")}
                count={toneCounts.success}
              >
                Activos
              </FilterChip>
              <FilterChip
                active={filterTone === "info"}
                onClick={() => setFilterTone("info")}
                count={toneCounts.info}
              >
                Info
              </FilterChip>
            </div>
            
            {dismissedIds.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={handleRestoreDismissed}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Restaurar {dismissedIds.length} notificación(es) oculta(s)
                </button>
              </div>
            )}
          </div>

          {/* ═══ NOTIFICATIONS LIST ═══ */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="glass rounded-3xl p-10 sm:p-14 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FiCheckCircle className="text-3xl text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {searchQuery || filterTone !== "all" ? "Sin resultados" : "Todo en orden"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery || filterTone !== "all"
                    ? "No se encontraron notificaciones con los filtros aplicados."
                    : "Todos los sensores operan dentro de los parámetros configurados. No hay alertas activas."}
                </p>
                {(searchQuery || filterTone !== "all") && (
                  <button
                    onClick={() => { setSearchQuery(""); setFilterTone("all"); }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((item, i) => (
                <NotificationCard key={item.id} item={item} index={i} onDismiss={handleDismiss} />
              ))
            )}
          </div>

          {/* ═══ CONFIG PANEL ═══ */}
          <ConfigPanel config={notificationConfig} />
        </>
      )}
    </div>
  );
}
