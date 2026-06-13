import { useEffect, useState, useCallback, memo } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { WiRaindrop } from "react-icons/wi";
import {
    FiAlertTriangle, FiShield, FiToggleLeft, FiToggleRight,
    FiZap, FiDroplet, FiSun, FiCpu
} from "react-icons/fi";

// ─── Config de cada control ───────────────────────────────────
const controlItems = {
    automatico: {
        title: "Modo automático",
        icon: FiCpu,
        activeLabel: "Activo",
        inactiveLabel: "Inactivo",
        activeDescription: "El sistema opera según umbrales de sensores",
        inactiveDescription: "Control manual habilitado",
        activateText: "Activar automático",
        deactivateText: "Desactivar automático",
        confirmActivate: "¿Activar el modo automático? El sistema operará según los umbrales configurados.",
        confirmDeactivate: "¿Desactivar el modo automático? Podrás controlar manualmente la bomba y la malla.",
        gradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/15 dark:via-purple-500/10 dark:to-fuchsia-900/20",
        accentActive: "bg-violet-500",
        accentInactive: "bg-gray-300 dark:bg-gray-600",
        ringActive: "ring-violet-200/50 dark:ring-violet-800/30",
        ringInactive: "ring-gray-200/50 dark:ring-gray-700/30",
        btnActivate: "bg-violet-600 hover:bg-violet-500 shadow-violet-600/20",
        btnDeactivate: "bg-gray-500 hover:bg-gray-400 shadow-gray-500/20",
        haloColor: "bg-violet-400/15 dark:bg-violet-400/10",
        iconActiveColor: "text-violet-500",
    },
    riego: {
        title: "Bomba de agua",
        icon: WiRaindrop,
        activeLabel: "Encendida",
        inactiveLabel: "Apagada",
        activeDescription: "Bomba activa — regando cultivos",
        inactiveDescription: "Bomba inactiva — sin riego",
        activateText: "Encender bomba",
        deactivateText: "Apagar bomba",
        confirmActivate: "¿Encender la bomba de agua? Comenzará a regar los cultivos.",
        confirmDeactivate: "¿Apagar la bomba? Se detendrá el riego.",
        gradient: "from-sky-500/10 via-blue-500/5 to-cyan-500/10 dark:from-sky-500/15 dark:via-blue-500/10 dark:to-cyan-900/20",
        accentActive: "bg-sky-500",
        accentInactive: "bg-gray-300 dark:bg-gray-600",
        ringActive: "ring-sky-200/50 dark:ring-sky-800/30",
        ringInactive: "ring-gray-200/50 dark:ring-gray-700/30",
        btnActivate: "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20",
        btnDeactivate: "bg-gray-500 hover:bg-gray-400 shadow-gray-500/20",
        haloColor: "bg-sky-400/15 dark:bg-sky-400/10",
        iconActiveColor: "text-sky-500",
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
        confirmActivate: "¿Abrir la malla sombra? Se desplegará para proteger del sol.",
        confirmDeactivate: "¿Cerrar la malla sombra? Los cultivos quedarán expuestos.",
        gradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10 dark:from-amber-500/15 dark:via-yellow-500/10 dark:to-orange-900/20",
        accentActive: "bg-amber-500",
        accentInactive: "bg-gray-300 dark:bg-gray-600",
        ringActive: "ring-amber-200/50 dark:ring-amber-800/30",
        ringInactive: "ring-gray-200/50 dark:ring-gray-700/30",
        btnActivate: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20",
        btnDeactivate: "bg-gray-500 hover:bg-gray-400 shadow-gray-500/20",
        haloColor: "bg-amber-400/15 dark:bg-amber-400/10",
        iconActiveColor: "text-amber-500",
    },
};

// ─── Modal de confirmación ────────────────────────────────────
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
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

// ─── Tarjeta de control ───────────────────────────────────────
const ControlCard = memo(function ControlCard({ type, value, onToggle, index, disabled }) {
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
                animate-fadeUp
                ${disabled ? "opacity-50 pointer-events-none" : ""}
            `}
            style={{ animationDelay: `${index * 80}ms` }}
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
                    <config.icon className={`text-3xl ${isActive ? config.iconActiveColor : "text-gray-400 dark:text-gray-500"} transition-colors duration-300`} />
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
                            ${isActive ? `${config.accentActive} shadow-[0_0_10px_rgba(0,0,0,0.2)] animate-breathe` : config.accentInactive}
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

            {/* Disabled overlay message */}
            {disabled && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-xs text-violet-600 dark:text-violet-300 font-medium">
                    Control deshabilitado — modo automático activo
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 relative">
                <button
                    className={`
                        flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-white
                        shadow-lg transition-all duration-300 active:scale-[0.97]
                        ${isActive || disabled ? "opacity-40 cursor-not-allowed" : config.btnActivate}
                    `}
                    onClick={() => !isActive && !disabled && onToggle(type, true)}
                    disabled={isActive || disabled}
                >
                    {config.activateText}
                </button>

                <button
                    className={`
                        flex-1 px-5 py-3 rounded-xl text-sm font-semibold text-white
                        shadow-lg transition-all duration-300 active:scale-[0.97]
                        ${!isActive || disabled ? "opacity-40 cursor-not-allowed" : config.btnDeactivate}
                    `}
                    onClick={() => isActive && !disabled && onToggle(type, false)}
                    disabled={!isActive || disabled}
                >
                    {config.deactivateText}
                </button>
            </div>
        </div>
    );
});

// ─── Componente principal ─────────────────────────────────────
export default function ControlManual() {
    const { sectionPath } = useAuth();
    const [automatico, setAutomatico] = useState(null);
    const [riego, setRiego] = useState(null);
    const [malla, setMalla] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ open: false, type: null, value: null });

    // Listeners en tiempo real
    useEffect(() => {
        if (!sectionPath) return;
        const unsubs = [
            onValue(ref(db, `${sectionPath}/controlAutomatico/activo`), (s) => setAutomatico(s.val())),
            onValue(ref(db, `${sectionPath}/control/riego`), (s) => setRiego(s.val())),
            onValue(ref(db, `${sectionPath}/control/malla`), (s) => setMalla(s.val())),
        ];
        return () => unsubs.forEach((u) => u());
    }, [sectionPath]);

    const pedirConfirmacion = useCallback((type, value) => {
        setModal({ open: true, type, value });
    }, []);

    const cerrarModal = useCallback(() => {
        setModal({ open: false, type: null, value: null });
    }, []);

    const confirmarAccion = useCallback(async () => {
        if (!sectionPath) return;
        setLoading(true);
        try {
            if (modal.type === "automatico") {
                await set(ref(db, `${sectionPath}/controlAutomatico/activo`), modal.value);
            } else if (modal.type === "riego") {
                await set(ref(db, `${sectionPath}/control/riego`), modal.value);
            } else if (modal.type === "malla") {
                await set(ref(db, `${sectionPath}/control/malla`), modal.value);
            }
        } finally {
            setLoading(false);
            setModal({ open: false, type: null, value: null });
        }
    }, [modal, sectionPath]);

    const modalConfig = modal.type ? controlItems[modal.type] : null;
    const modalMessage = modalConfig
        ? (modal.value ? modalConfig.confirmActivate : modalConfig.confirmDeactivate)
        : "";

    const manualDisabled = automatico === true;

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
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
                    <FiToggleRight size={32} className="text-emerald-500" />
                    Control del sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Activa o desactiva el modo automático, la bomba de agua y la malla sombra.
                    Cuando el modo automático está activo, los controles manuales se deshabilitan.
                </p>
            </header>

            {/* Auto mode info banner */}
            {manualDisabled && (
                <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 animate-fadeUp">
                    <FiCpu className="text-xl mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold">Modo automático activo</p>
                        <p className="text-xs mt-0.5 opacity-80">
                            Los controles manuales de bomba y malla están deshabilitados.
                            Desactiva el modo automático para controlar manualmente.
                        </p>
                    </div>
                </div>
            )}

            {/* Control cards */}
            <div className="grid gap-6">
                {/* Auto mode — siempre habilitado */}
                <ControlCard
                    type="automatico"
                    value={automatico}
                    onToggle={pedirConfirmacion}
                    index={0}
                    disabled={false}
                />

                {/* Bomba y malla — deshabilitados si auto mode activo */}
                <div className="grid gap-6 sm:grid-cols-2">
                    <ControlCard
                        type="riego"
                        value={riego}
                        onToggle={pedirConfirmacion}
                        index={1}
                        disabled={manualDisabled}
                    />
                    <ControlCard
                        type="malla"
                        value={malla}
                        onToggle={pedirConfirmacion}
                        index={2}
                        disabled={manualDisabled}
                    />
                </div>
            </div>

            {/* Info footer */}
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">
                <FiZap className="flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs space-y-1">
                    <p><strong>¿Cómo funciona?</strong></p>
                    <p>1. <strong>Modo automático</strong> — El ESP32 opera según los umbrales de sensores configurados en Automatización.</p>
                    <p>2. <strong>Bomba de agua</strong> — Enciende o apaga el relé que controla la bomba de riego.</p>
                    <p>3. <strong>Malla sombra</strong> — Abre o cierra el motor de la malla para proteger los cultivos.</p>
                    <p className="opacity-70 mt-1">Los cambios se sincronizan en tiempo real con el módulo ESP32 vía Firebase.</p>
                </div>
            </div>
        </div>
    );
}
