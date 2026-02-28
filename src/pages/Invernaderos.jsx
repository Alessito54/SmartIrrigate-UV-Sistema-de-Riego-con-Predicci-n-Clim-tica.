import { useState, useEffect } from "react";
import { ref, set, push, remove, onValue } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import {
    FiPlus, FiCheckCircle, FiLayers, FiLink, FiSettings,
    FiChevronDown, FiChevronUp, FiDroplet, FiShield,
    FiCheck, FiX, FiWifi, FiWifiOff, FiEdit2, FiTrash2
} from "react-icons/fi";

// ─── Pre-loaded crops ──────────────────────────────────────────────────────
const CULTIVOS_PRESET = [
    { emoji: "🍅", nombre: "Tomate" },
    { emoji: "🫑", nombre: "Chile / Pimiento" },
    { emoji: "🥒", nombre: "Pepino" },
    { emoji: "🥬", nombre: "Lechuga" },
    { emoji: "🫒", nombre: "Aceitunas" },
    { emoji: "🌽", nombre: "Maíz" },
    { emoji: "🥕", nombre: "Zanahoria" },
    { emoji: "🧅", nombre: "Cebolla" },
    { emoji: "🧄", nombre: "Ajo" },
    { emoji: "🥦", nombre: "Brócoli" },
    { emoji: "🍓", nombre: "Fresa" },
    { emoji: "🫛", nombre: "Chícharo / Ejote" },
    { emoji: "🌿", nombre: "Hierbas aromáticas" },
    { emoji: "🍃", nombre: "Espinaca" },
    { emoji: "🥔", nombre: "Papa" },
    { emoji: "🍆", nombre: "Berenjena" },
    { emoji: "🫚", nombre: "Flor comestible" },
    { emoji: "🌱", nombre: "Otro" },
];

const DEFAULT_SECTION = {
    nombre: "Nueva Sección",
    control: { malla: false, riego: false },
    controlAutomatico: {
        activo: false,
        acciones: { malla: { altaRadiacion: false, altaTemperatura: false }, riego: { bajoHumedad: false } },
        umbrales: { humedad: { min: 40 }, radiacion: { max: 900 }, temperatura: { max: 35, min: 10 } },
    },
    sensores: { humedad: 0, radiacion: 0, temperatura: 0, viento: 0 },
};

// ─── Confirm dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeUp">
            <div className="glass rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="text-4xl text-center">⚠️</div>
                <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition text-sm">
                        Sí, eliminar
                    </button>
                    <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Control toggle ────────────────────────────────────────────────────────
function ControlToggle({ label, icon: Icon, color, active, onToggle, disabled }) {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95
                ${active ? `${color.bg} ${color.border} ${color.text} shadow-lg` : "bg-white/40 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-400"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
        >
            <Icon size={22} />
            <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
            <span className={`text-[10px] font-medium ${active ? "opacity-90" : "opacity-60"}`}>
                {active ? "Activado" : "Inactivo"}
            </span>
        </button>
    );
}

// ─── Section card ──────────────────────────────────────────────────────────
function SeccionCard({ invId, secId, sec, inv, onReload }) {
    const [riego, setRiego] = useState(sec?.control?.riego ?? false);
    const [malla, setMalla] = useState(sec?.control?.malla ?? false);
    const [toggling, setToggling] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [cultivo, setCultivo] = useState(sec?.cultivoActual || "");
    const [showCrops, setShowCrops] = useState(false);
    const [espId, setEspId] = useState("");
    const [linking, setLinking] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState(false);
    const [autoConfig, setAutoConfig] = useState(null);
    const [savingAuto, setSavingAuto] = useState(false);

    // Rename section
    const [editingName, setEditingName] = useState(false);
    const [draftName, setDraftName] = useState(sec?.nombre || "");
    const [savingName, setSavingName] = useState(false);

    // Delete section
    const [confirmDelete, setConfirmDelete] = useState(false);

    const secPath = `invernaderos/${invId}/secciones/${secId}`;

    useEffect(() => {
        const unsub = onValue(ref(db, `${secPath}/controlAutomatico`), (snap) => {
            setAutoConfig(snap.val() || {
                activo: false,
                umbrales: { humedad: { min: 40 }, temperatura: { max: 35, min: 10 }, radiacion: { max: 900 } },
                acciones: { riego: { bajoHumedad: false }, malla: { altaTemperatura: false, altaRadiacion: false } },
            });
        });
        return () => unsub();
    }, [secPath]);

    async function toggle(tipo, nuevoVal) {
        setToggling(tipo);
        try {
            await set(ref(db, `${secPath}/control/${tipo}`), nuevoVal);
            if (tipo === "riego") setRiego(nuevoVal);
            else setMalla(nuevoVal);
        } finally { setToggling(null); }
    }

    async function selectCultivo(c) {
        await set(ref(db, `${secPath}/cultivoActual`), `${c.emoji} ${c.nombre}`);
        setCultivo(`${c.emoji} ${c.nombre}`);
        setShowCrops(false);
    }

    async function vincularEsp() {
        if (!espId.trim()) return;
        setLinking(true);
        try {
            await set(ref(db, `${secPath}/espId`), espId.trim());
            setLinkSuccess(true);
            setTimeout(() => setLinkSuccess(false), 3000);
        } finally { setLinking(false); }
    }

    async function guardarAutoConfig() {
        setSavingAuto(true);
        try { await set(ref(db, `${secPath}/controlAutomatico`), autoConfig); }
        finally { setSavingAuto(false); }
    }

    function setUmbral(pathParts, value) {
        setAutoConfig((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            let node = next;
            for (let i = 0; i < pathParts.length - 1; i++) node = node[pathParts[i]];
            node[pathParts[pathParts.length - 1]] = value;
            return next;
        });
    }

    async function guardarNombreSeccion() {
        if (!draftName.trim()) return;
        setSavingName(true);
        try {
            await set(ref(db, `${secPath}/nombre`), draftName.trim());
            await onReload();
            setEditingName(false);
        } finally { setSavingName(false); }
    }

    async function eliminarSeccion() {
        await remove(ref(db, secPath));
        await onReload();
        setConfirmDelete(false);
    }

    const sensors = sec?.sensores || {};
    const isOnline = inv?.estado?.online ?? false;

    return (
        <>
            {confirmDelete && (
                <ConfirmDialog
                    message={`¿Eliminar la sección "${sec?.nombre || secId}"? Se borrarán todos sus datos, configuración e historial.`}
                    onConfirm={eliminarSeccion}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-slate-700/40">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{cultivo?.split(" ")[0] || "🌱"}</span>
                        <div>
                            {editingName ? (
                                <div className="flex items-center gap-1.5">
                                    <input
                                        autoFocus
                                        value={draftName}
                                        onChange={(e) => setDraftName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") guardarNombreSeccion(); if (e.key === "Escape") setEditingName(false); }}
                                        className="text-sm font-bold bg-white dark:bg-slate-700 border border-emerald-400 rounded-lg px-2 py-0.5 outline-none w-36"
                                    />
                                    <button onClick={guardarNombreSeccion} disabled={savingName} className="p-1 text-emerald-500 hover:text-emerald-600"><FiCheck size={13} /></button>
                                    <button onClick={() => setEditingName(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={13} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 group/secname">
                                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{sec?.nombre || secId}</p>
                                    <button
                                        onClick={() => { setDraftName(sec?.nombre || ""); setEditingName(true); }}
                                        className="opacity-0 group-hover/secname:opacity-100 p-0.5 text-gray-300 hover:text-emerald-500 transition"
                                        title="Renombrar sección"
                                    >
                                        <FiEdit2 size={11} />
                                    </button>
                                </div>
                            )}
                            <p className="text-[11px] text-gray-400 font-mono">{secId.slice(-10)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${isOnline ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"}`}>
                            {isOnline ? <FiWifi size={10} /> : <FiWifiOff size={10} />}
                            {isOnline ? "Online" : "Offline"}
                        </span>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                            title="Configurar sección"
                        >
                            {showConfig ? <FiChevronUp size={16} /> : <FiSettings size={16} />}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-1.5 rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="Eliminar sección"
                        >
                            <FiTrash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Sensor minibar */}
                <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-slate-700/50 px-1">
                    {[
                        { key: "temperatura", label: "Temp", unit: "°C", icon: "🌡️" },
                        { key: "humedad", label: "Hum.", unit: "%", icon: "💧" },
                        { key: "radiacion", label: "UV", unit: "W", icon: "☀️" },
                        { key: "viento", label: "Viento", unit: "m/s", icon: "💨" },
                    ].map(({ key, label, unit, icon }) => (
                        <div key={key} className="flex flex-col items-center py-2.5 px-1">
                            <span className="text-base">{icon}</span>
                            <span className="text-[10px] font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                                {sensors[key] ?? "--"}<span className="font-normal text-gray-400 ml-0.5">{unit}</span>
                            </span>
                            <span className="text-[9px] text-gray-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Manual controls */}
                <div className="px-4 pb-4 pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Control Manual</p>
                    <div className="grid grid-cols-2 gap-2">
                        <ControlToggle label="Riego" icon={FiDroplet}
                            color={{ bg: "bg-sky-100 dark:bg-sky-900/40", border: "border-sky-400 dark:border-sky-700", text: "text-sky-700 dark:text-sky-400" }}
                            active={riego} onToggle={() => toggle("riego", !riego)} disabled={toggling === "riego"} />
                        <ControlToggle label="Malla" icon={FiShield}
                            color={{ bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-400 dark:border-amber-700", text: "text-amber-700 dark:text-amber-400" }}
                            active={malla} onToggle={() => toggle("malla", !malla)} disabled={toggling === "malla"} />
                    </div>
                </div>

                {/* Config panel */}
                {showConfig && (
                    <div className="border-t border-gray-100 dark:border-slate-700/50 px-4 py-4 space-y-5 bg-gray-50/50 dark:bg-slate-900/30">
                        {/* Crop selector */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🌾 Cultivo</p>
                            <button onClick={() => setShowCrops(!showCrops)}
                                className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-left hover:border-emerald-400 transition">
                                <span className={cultivo ? "text-gray-800 dark:text-gray-100 font-medium" : "text-gray-400"}>{cultivo || "Selecciona un cultivo..."}</span>
                                <FiChevronDown className={`text-gray-400 transition ${showCrops ? "rotate-180" : ""}`} />
                            </button>
                            {showCrops && (
                                <div className="mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                                    <div className="grid grid-cols-3 gap-1 p-3 max-h-52 overflow-y-auto">
                                        {CULTIVOS_PRESET.map((c) => (
                                            <button key={c.nombre} onClick={() => selectCultivo(c)}
                                                className={`flex flex-col items-center text-center gap-1 p-2.5 rounded-xl text-xs font-medium transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${cultivo === `${c.emoji} ${c.nombre}` ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                                                <span className="text-2xl">{c.emoji}</span>
                                                <span className="leading-tight">{c.nombre}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ESP32 */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📡 Vincular ESP32</p>
                            <p className="text-[11px] text-gray-400 mb-2">
                                Ruta de datos:<br />
                                <code className="text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                    invernaderos/{invId}/secciones/{secId}/sensores
                                </code>
                            </p>
                            {sec?.espId ? (
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                                    <FiCheckCircle className="text-emerald-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">ESP32 Vinculado</p>
                                        <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">{sec.espId}</p>
                                    </div>
                                    <button onClick={() => { set(ref(db, `${secPath}/espId`), null); onReload(); }}
                                        className="text-red-400 hover:text-red-500 transition p-1" title="Desvincular">
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input type="text" value={espId} onChange={(e) => setEspId(e.target.value)}
                                        placeholder="ID o MAC del ESP32..."
                                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
                                    <button onClick={vincularEsp} disabled={linking || !espId.trim()}
                                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-1">
                                        {linkSuccess ? <FiCheck /> : <FiLink />}
                                        {linking ? "..." : linkSuccess ? "¡Listo!" : "Vincular"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Automatic mode */}
                        {autoConfig && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">⚡ Modo Automático</p>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 mb-3">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Control automático</p>
                                        <p className="text-[11px] text-gray-400">El ESP32 actúa según los umbrales</p>
                                    </div>
                                    <button onClick={() => setUmbral(["activo"], !autoConfig.activo)}
                                        className={`relative inline-flex h-7 w-12 rounded-full transition-all duration-300 flex-shrink-0 ${autoConfig.activo ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                                        <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${autoConfig.activo ? "translate-x-5" : ""}`} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 space-y-2">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">💧 Humedad mínima</p>
                                        <input type="range" min={0} max={100} value={autoConfig.umbrales?.humedad?.min ?? 40}
                                            onChange={(e) => setUmbral(["umbrales", "humedad", "min"], parseInt(e.target.value))} className="w-full accent-blue-500" />
                                        <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{autoConfig.umbrales?.humedad?.min ?? 40}%</p>
                                        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <input type="checkbox" checked={autoConfig.acciones?.riego?.bajoHumedad ?? false}
                                                onChange={(e) => setUmbral(["acciones", "riego", "bajoHumedad"], e.target.checked)} className="accent-emerald-500" />
                                            Activar riego al bajar
                                        </label>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 space-y-2">
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400">🌡️ Temperatura máx.</p>
                                        <input type="range" min={20} max={50} value={autoConfig.umbrales?.temperatura?.max ?? 35}
                                            onChange={(e) => setUmbral(["umbrales", "temperatura", "max"], parseInt(e.target.value))} className="w-full accent-orange-500" />
                                        <p className="text-lg font-extrabold text-orange-600 dark:text-orange-400">{autoConfig.umbrales?.temperatura?.max ?? 35}°C</p>
                                        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <input type="checkbox" checked={autoConfig.acciones?.malla?.altaTemperatura ?? false}
                                                onChange={(e) => setUmbral(["acciones", "malla", "altaTemperatura"], e.target.checked)} className="accent-emerald-500" />
                                            Activar malla al superar
                                        </label>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 space-y-2 sm:col-span-2">
                                        <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">☀️ Radiación máx. (W/m²)</p>
                                        <input type="range" min={0} max={1200} value={autoConfig.umbrales?.radiacion?.max ?? 900}
                                            onChange={(e) => setUmbral(["umbrales", "radiacion", "max"], parseInt(e.target.value))} className="w-full accent-yellow-500" />
                                        <p className="text-lg font-extrabold text-yellow-600 dark:text-yellow-400">{autoConfig.umbrales?.radiacion?.max ?? 900} W/m²</p>
                                        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <input type="checkbox" checked={autoConfig.acciones?.malla?.altaRadiacion ?? false}
                                                onChange={(e) => setUmbral(["acciones", "malla", "altaRadiacion"], e.target.checked)} className="accent-emerald-500" />
                                            Activar malla por radiación alta
                                        </label>
                                    </div>
                                </div>
                                <button onClick={guardarAutoConfig} disabled={savingAuto}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                                    {savingAuto ? "Guardando..." : "💾 Guardar configuración automática"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Invernadero card ──────────────────────────────────────────────────────
function InvernaderoCard({ invId, inv, isActive, onSelect, onReload, onDelete }) {
    const secs = Object.entries(inv?.secciones || {});
    const [expanded, setExpanded] = useState(isActive);
    const [addingSection, setAddingSection] = useState(false);
    const [newSecName, setNewSecName] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [draftName, setDraftName] = useState(inv?.nombre || "");
    const [savingName, setSavingName] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function guardarNombre() {
        if (!draftName.trim()) return;
        setSavingName(true);
        try {
            await set(ref(db, `invernaderos/${invId}/nombre`), draftName.trim());
            await onReload();
            setEditingName(false);
        } finally { setSavingName(false); }
    }

    async function crearSeccion() {
        if (!newSecName.trim()) return;
        setSaving(true);
        try {
            const secRef = push(ref(db, `invernaderos/${invId}/secciones`));
            await set(secRef, { ...DEFAULT_SECTION, nombre: newSecName.trim() });
            await onReload();
            setNewSecName("");
            setAddingSection(false);
        } finally { setSaving(false); }
    }

    return (
        <>
            {confirmDelete && (
                <ConfirmDialog
                    message={`¿Eliminar el invernadero "${inv?.nombre || invId.slice(-8)}"? Se eliminarán todas sus secciones y datos permanentemente.`}
                    onConfirm={() => onDelete(invId)}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
            <div className={`glass rounded-3xl overflow-hidden transition-all duration-300 ${isActive ? "ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10" : "hover:shadow-lg"}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-white/40 dark:bg-slate-800/30"
                    onClick={() => setExpanded(!expanded)}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${isActive ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-gray-100 dark:bg-slate-700"}`}>
                            🏠
                        </div>
                        <div>
                            {editingName ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <input autoFocus value={draftName}
                                        onChange={(e) => setDraftName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") guardarNombre(); if (e.key === "Escape") setEditingName(false); }}
                                        className="font-bold text-sm bg-white/70 dark:bg-slate-700/70 border border-emerald-400 rounded-lg px-2 py-1 outline-none" />
                                    <button onClick={guardarNombre} disabled={savingName} className="p-1 text-emerald-500 hover:text-emerald-600"><FiCheck size={14} /></button>
                                    <button onClick={() => setEditingName(false)} className="p-1 text-gray-400 hover:text-gray-600"><FiX size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 group/name">
                                    <h2 className="font-bold text-gray-900 dark:text-white">
                                        {inv?.nombre || `Invernadero ${invId.slice(-6)}`}
                                    </h2>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDraftName(inv?.nombre || ""); setEditingName(true); }}
                                        className="opacity-0 group-hover/name:opacity-100 p-1 text-gray-300 hover:text-emerald-500 transition"
                                        title="Renombrar"
                                    >
                                        <FiEdit2 size={12} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${inv?.estado?.online ? "bg-emerald-400 animate-pulse" : "bg-gray-300"}`} />
                                <p className="text-xs text-gray-500">{inv?.estado?.online ? "En línea" : "Sin conexión"} · {secs.length} sección(es)</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isActive && (
                            <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition">
                                Seleccionar
                            </button>
                        )}
                        {isActive && <span className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl">✓ Activo</span>}
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                            className="p-1.5 rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="Eliminar invernadero">
                            <FiTrash2 size={16} />
                        </button>
                        <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>

                {/* Sections */}
                {expanded && (
                    <div className="px-4 pb-4 pt-2 space-y-3">
                        {secs.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">Sin secciones. Agrega una abajo.</p>
                        )}
                        {secs.map(([sId, sec]) => (
                            <SeccionCard key={sId} invId={invId} secId={sId} sec={sec} inv={inv} onReload={onReload} />
                        ))}
                        {addingSection ? (
                            <div className="flex gap-2">
                                <input autoFocus type="text" value={newSecName}
                                    onChange={(e) => setNewSecName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && crearSeccion()}
                                    placeholder="Nombre de la sección (Ej: Zona Norte)"
                                    className="flex-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
                                <button onClick={crearSeccion} disabled={saving || !newSecName.trim()}
                                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition disabled:opacity-50">
                                    {saving ? "..." : <FiCheck />}
                                </button>
                                <button onClick={() => setAddingSection(false)}
                                    className="px-3 py-2 bg-gray-200 dark:bg-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-slate-600 transition">
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setAddingSection(true)}
                                className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400 rounded-2xl text-sm font-medium hover:border-emerald-400 hover:text-emerald-500 transition flex items-center justify-center gap-2">
                                <FiPlus /> Agregar sección
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Invernaderos() {
    const { user, invernaderos, invId, reloadInvernaderos, selectInvernadero } = useAuth();
    const [newInvName, setNewInvName] = useState("");
    const [addingInv, setAddingInv] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    function flash(msg) {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 3000);
    }

    async function crearInvernadero() {
        if (!newInvName.trim()) return;
        setSaving(true);
        try {
            const invRef = push(ref(db, "invernaderos"));
            const newId = invRef.key;
            const secRef = push(ref(db, `invernaderos/${newId}/secciones`));
            await set(invRef, {
                nombre: newInvName.trim(),
                estado: { online: false },
                secciones: {
                    [secRef.key]: { ...DEFAULT_SECTION, nombre: "Sección Principal" }
                },
            });
            await set(ref(db, `usuarios/${user.uid}/invernaderos/${newId}`), true);
            await reloadInvernaderos();
            flash(`✅ Invernadero "${newInvName}" creado`);
            setNewInvName("");
            setAddingInv(false);
        } finally { setSaving(false); }
    }

    async function eliminarInvernadero(id) {
        await remove(ref(db, `invernaderos/${id}`));
        await set(ref(db, `usuarios/${user.uid}/invernaderos/${id}`), null);
        await reloadInvernaderos();
        flash("🗑️ Invernadero eliminado");
    }

    const invEntries = Object.entries(invernaderos || {});

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp">
            {/* Header */}
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
                        <FiLayers size={32} className="text-emerald-500" />
                        Mis Invernaderos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona secciones, cultivos, automatización y dispositivos ESP32.
                    </p>
                </div>
                <button onClick={() => setAddingInv(!addingInv)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
                    <FiPlus /> Nuevo
                </button>
            </header>

            {/* Toast */}
            {success && (
                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 animate-fadeUp">
                    <FiCheckCircle className="flex-shrink-0" /> {success}
                </div>
            )}

            {/* New invernadero form */}
            {addingInv && (
                <div className="glass rounded-2xl p-5 space-y-3 animate-fadeUp border border-emerald-200/50 dark:border-emerald-800/30">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">¿Cómo se llama tu nuevo invernadero?</p>
                    <div className="flex gap-3">
                        <input autoFocus type="text" value={newInvName}
                            onChange={(e) => setNewInvName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && crearInvernadero()}
                            placeholder="Ej: Invernadero Norte, Módulo A, Zona 2..."
                            className="flex-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
                        <button onClick={crearInvernadero} disabled={saving || !newInvName.trim()}
                            className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                            {saving ? "Creando..." : <><FiCheck /> Crear</>}
                        </button>
                        <button onClick={() => setAddingInv(false)}
                            className="px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                            <FiX />
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {invEntries.length === 0 && !addingInv && (
                <div className="glass rounded-3xl p-14 text-center space-y-4">
                    <div className="text-6xl">🏠</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sin invernaderos aún</h2>
                    <p className="text-gray-500 text-sm">Crea tu primer invernadero para comenzar a monitorear.</p>
                    <button onClick={() => setAddingInv(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
                        <FiPlus /> Crear invernadero
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {invEntries.map(([id, inv]) => (
                    <InvernaderoCard
                        key={id}
                        invId={id}
                        inv={inv}
                        isActive={invId === id}
                        onSelect={() => selectInvernadero(id)}
                        onReload={reloadInvernaderos}
                        onDelete={eliminarInvernadero}
                    />
                ))}
            </div>
        </div>
    );
}
