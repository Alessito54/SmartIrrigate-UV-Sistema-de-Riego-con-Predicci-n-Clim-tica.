import { useEffect, useState, useCallback, memo } from "react";
import { ref, onValue, set, push, serverTimestamp } from "firebase/database";
import { db } from "../services/firebase";
import { WiRaindrop } from "react-icons/wi";
import { FiAlertTriangle, FiShield } from "react-icons/fi";
import { LuClock } from "react-icons/lu";

// ─── Constants ────────────────────────────────────────────────────────

const controlItems = {
  riego: {
    title: "Sistema de riego",
    icon: WiRaindrop,
    activeLabel: "Activado",
    inactiveLabel: "Desactivado",
    activeDescription: "Válvula abierta — regando cultivos",
    inactiveDescription: "Válvula cerrada — sin riego activo",
    activateText: "Activar riego",
    deactivateText: "Desactivar riego",
    confirmActivate: "¿Deseas activar el sistema de riego? La válvula se abrirá y comenzará a regar.",
    confirmDeactivate: "¿Deseas desactivar el riego? Se cerrará la válvula y se registrará la sesión.",
    gradient: "from-sky-500/10 via-blue-500/5 to-cyan-500/10 dark:from-sky-500/15 dark:via-blue-500/10 dark:to-cyan-900/20",
    accentActive: "bg-sky-500",
    accentInactive: "bg-gray-300 dark:bg-gray-600",
    ringActive: "ring-sky-200/50 dark:ring-sky-800/30",
    ringInactive: "ring-gray-200/50 dark:ring-gray-700/30",
    btnActivate: "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20",
    btnDeactivate: "bg-gray-500 hover:bg-gray-400 shadow-gray-500/20",
    haloColor: "bg-sky-400/15 dark:bg-sky-400/10",
    dbPath: "invernadero/control/riego",
  },
  malla: {
    title: "Malla sombra",
    icon: FiShield,
    activeLabel: "Abierta",
    inactiveLabel: "Cerrada",
    activeDescription: "Protegiendo cultivos del sol directo",
    inactiveDescription: "Sin protección solar activa",
    activateText: "Abrir malla",
    deactivateText: "Cerrar malla",
    confirmActivate: "¿Deseas abrir la malla sombra? Se desplegará para proteger del sol.",
    confirmDeactivate: "¿Deseas cerrar la malla sombra? Los cultivos quedarán expuestos al sol.",
    gradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10 dark:from-amber-500/15 dark:via-yellow-500/10 dark:to-orange-900/20",
    accentActive: "bg-amber-500",
    accentInactive: "bg-gray-300 dark:bg-gray-600",
    ringActive: "ring-amber-200/50 dark:ring-amber-800/30",
    ringInactive: "ring-gray-200/50 dark:ring-gray-700/30",
    btnActivate: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20",
    btnDeactivate: "bg-gray-500 hover:bg-gray-400 shadow-gray-500/20",
    haloColor: "bg-amber-400/15 dark:bg-amber-400/10",
    dbPath: "invernadero/control/malla",
  },
};

// ─── Subcomponents ────────────────────────────────────────────────────

const ModalConfirm = memo(function ModalConfirm({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl p-6 sm:p-8 w-[90%] max-w-md animate-pop shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-2">
          <FiAlertTriangle className="text-2xl text-amber-500 flex-shrink-0" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            {title}
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed ml-[44px]">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="
              px-5 py-2.5 rounded-xl text-sm font-semibold
              bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200
              hover:bg-gray-200 dark:hover:bg-gray-700
              transition-all duration-200 active:scale-95
            "
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="
              px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-emerald-600 hover:bg-emerald-500
              shadow-lg shadow-emerald-600/20
              transition-all duration-200 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
});

const ControlCard = memo(function ControlCard({ type, value, onToggle, index }) {
  const config = controlItems[type];
  const isActive = value === true;

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${isActive ? config.gradient : "from-gray-100/50 to-gray-50/50 dark:from-gray-800/30 dark:to-gray-900/30"}
        glass ring-1 ${isActive ? config.ringActive : config.ringInactive}
        p-6 sm:p-8 rounded-2xl
        transition-all duration-500
        hover:shadow-xl
        animate-fadeUp stagger-${index + 1}
      `}
    >
      {/* Decorative halo */}
      <div
        className={`
          pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full
          ${isActive ? config.haloColor : "bg-gray-300/10 dark:bg-gray-700/10"}
          blur-[60px] transition-colors duration-700
        `}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <config.icon className="text-3xl text-gray-700 dark:text-gray-200" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              {config.title}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isActive ? config.activeDescription : config.inactiveDescription}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2">
          <span
            className={`
              w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-500
              ${isActive
                ? `${config.accentActive} shadow-[0_0_10px_rgba(0,0,0,0.2)] animate-breathe`
                : config.accentInactive
              }
            `}
          />
          <span
            className={`
              text-xs font-semibold tracking-wide uppercase transition-colors duration-300
              ${isActive ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}
            `}
          >
            {isActive ? config.activeLabel : config.inactiveLabel}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 relative">
        <button
          className={`
            flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-white
            shadow-lg transition-all duration-300 active:scale-[0.97]
            ${isActive ? "opacity-40 cursor-not-allowed" : config.btnActivate}
          `}
          onClick={() => !isActive && onToggle(type, true)}
          disabled={isActive}
        >
          {config.activateText}
        </button>

        <button
          className={`
            flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-white
            shadow-lg transition-all duration-300 active:scale-[0.97]
            ${!isActive ? "opacity-40 cursor-not-allowed" : config.btnDeactivate}
          `}
          onClick={() => isActive && onToggle(type, false)}
          disabled={!isActive}
        >
          {config.deactivateText}
        </button>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────

export default function Control() {
  const [riego, setRiego] = useState(null);
  const [malla, setMalla] = useState(null);
  const [inicioRiego, setInicioRiego] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    type: null,
    value: null,
  });

  // Realtime listeners with cleanup
  useEffect(() => {
    const unsubs = [
      onValue(ref(db, "invernadero/control/riego"), (s) => setRiego(s.val())),
      onValue(ref(db, "invernadero/control/malla"), (s) => setMalla(s.val())),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const pedirConfirmacion = useCallback((type, value) => {
    setModal({ open: true, type, value });
  }, []);

  const cerrarModal = useCallback(() => {
    setModal({ open: false, type: null, value: null });
  }, []);

  const confirmarAccion = useCallback(async () => {
    setLoading(true);
    try {
      if (modal.type === "riego") {
        const nuevoEstado = modal.value;
        await set(ref(db, "invernadero/control/riego"), nuevoEstado);
        setRiego(nuevoEstado);

        if (nuevoEstado === true) {
          setInicioRiego(Date.now());
        }

        if (nuevoEstado === false && inicioRiego) {
          const fin = Date.now();
          const duracionSeg = Math.floor((fin - inicioRiego) / 1000);
          const caudal = 0.028;
          const litros = parseFloat((duracionSeg * caudal).toFixed(2));

          await push(ref(db, "invernadero/historial_riego"), {
            inicio: new Date(inicioRiego).toISOString(),
            fin: new Date(fin).toISOString(),
            duracion_seg: duracionSeg,
            litros,
            timestamp: serverTimestamp(),
          });

          setInicioRiego(null);
        }
      }

      if (modal.type === "malla") {
        await set(ref(db, "invernadero/control/malla"), modal.value);
        setMalla(modal.value);
      }
    } finally {
      setLoading(false);
      setModal({ open: false, type: null, value: null });
    }
  }, [modal, inicioRiego]);

  // Dynamic modal message
  const modalConfig = modal.type
    ? controlItems[modal.type]
    : null;

  const modalMessage = modalConfig
    ? (modal.value ? modalConfig.confirmActivate : modalConfig.confirmDeactivate)
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp">

      {/* Modal */}
      <ModalConfirm
        open={modal.open}
        onClose={cerrarModal}
        onConfirm={confirmarAccion}
        title="Confirmar acción"
        message={modalMessage}
        loading={loading}
      />

      {/* Header */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
          Control del sistema
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
          Controla manualmente el riego y la malla sombra del invernadero.
        </p>
      </header>

      {/* Control cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ControlCard
          type="riego"
          value={riego}
          onToggle={pedirConfirmacion}
          index={0}
        />
        <ControlCard
          type="malla"
          value={malla}
          onToggle={pedirConfirmacion}
          index={1}
        />
      </div>

      {/* Active session indicator */}
      {inicioRiego && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-fadeUp border-l-[3px] border-l-sky-500">
          <LuClock className="text-xl text-sky-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              Sesión de riego en curso
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Iniciada a las {new Date(inicioRiego).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — se registrará al desactivar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
