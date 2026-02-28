import { useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { FiLink, FiCheckCircle, FiAlertTriangle, FiCopy, FiWifi, FiChevronDown } from "react-icons/fi";

export default function Vinculacion() {
    const { invernaderos } = useAuth();
    const [selectedInvId, setSelectedInvId] = useState("");
    const [selectedSecId, setSelectedSecId] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(null);

    const invEntries = Object.entries(invernaderos || {});
    const selectedInv = selectedInvId ? invernaderos[selectedInvId] : null;
    const selectedSec = selectedInvId && selectedSecId ? selectedInv?.secciones?.[selectedSecId] : null;

    // Flattened list of all sections: [{invId, invName, secId, secName, espId}]
    const allSections = invEntries.flatMap(([invId, inv]) =>
        Object.entries(inv?.secciones || {}).map(([secId, sec]) => ({
            invId, invName: inv?.nombre || invId.slice(-8),
            secId, secName: sec?.nombre || secId,
            espId: sec?.espId,
            online: inv?.estado?.online,
        }))
    );

    function selectSection(invId, secId) {
        setSelectedInvId(invId);
        setSelectedSecId(secId);
        setShowDropdown(false);
        setStatus(null);
    }

    function buildPath(part) {
        if (!selectedInvId || !selectedSecId) return `invernaderos/{invId}/secciones/{secId}/${part}`;
        return `invernaderos/${selectedInvId}/secciones/${selectedSecId}/${part}`;
    }

    function copyToClipboard(text, key) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    async function marcarVinculado() {
        if (!selectedInvId || !selectedSecId) return;
        setSaving(true);
        try {
            await set(ref(db, `invernaderos/${selectedInvId}/secciones/${selectedSecId}/espId`), `esp_${selectedSecId.slice(-6)}`);
            setStatus({ type: "success", msg: `✅ ¡Sección marcada como vinculada! Tu ESP32 debe publicar en la ruta mostrada abajo.` });
        } catch (err) {
            setStatus({ type: "error", msg: `Error: ${err.message}` });
        } finally { setSaving(false); }
    }

    const paths = [
        { key: "sensores", label: "Sensores →", desc: "ESP32 publica aquí", color: "text-emerald-600 dark:text-emerald-400" },
        { key: "control", label: "Control ←", desc: "ESP32 lee aquí", color: "text-sky-600 dark:text-sky-400" },
        { key: "controlAutomatico", label: "Auto Config ←", desc: "ESP32 lee aquí", color: "text-violet-600 dark:text-violet-400" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeUp">
            {/* Header */}
            <header>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
                    <FiLink size={32} className="text-emerald-500" />
                    Vincular ESP32
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Selecciona la sección y configura tu ESP32 con las rutas Firebase generadas.
                </p>
            </header>

            {/* Status message */}
            {status && (
                <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border animate-fadeUp ${status.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    }`}>
                    {status.type === "success" ? <FiCheckCircle className="text-xl mt-0.5 flex-shrink-0" /> : <FiAlertTriangle className="text-xl mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{status.msg}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Step 1: Select section */}
                <div className="glass rounded-3xl p-6 space-y-5">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                        Selecciona la sección
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Elige el invernadero y sección donde conectarás el ESP32.
                    </p>

                    {invEntries.length === 0 ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                            No tienes invernaderos. Primero crea uno en <b>Invernaderos</b>.
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-full flex items-center justify-between bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-left hover:border-emerald-400 transition"
                            >
                                {selectedInvId && selectedSecId ? (
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{selectedInv?.nombre || selectedInvId.slice(-8)}</p>
                                        <p className="text-xs text-gray-400">{selectedSec?.nombre || selectedSecId}</p>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Selecciona un invernadero / sección...</span>
                                )}
                                <FiChevronDown className={`text-gray-400 transition ${showDropdown ? "rotate-180" : ""}`} />
                            </button>

                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                                    {invEntries.map(([invId, inv]) => {
                                        const secs = Object.entries(inv?.secciones || {});
                                        return (
                                            <div key={invId}>
                                                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${inv?.estado?.online ? "bg-emerald-400" : "bg-gray-400"}`} />
                                                    🏠 {inv?.nombre || invId.slice(-8)}
                                                </div>
                                                {secs.map(([secId, sec]) => (
                                                    <button
                                                        key={secId}
                                                        onClick={() => selectSection(invId, secId)}
                                                        className={`w-full text-left px-6 py-2.5 text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 ${selectedInvId === invId && selectedSecId === secId ? "text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-900/10" : "text-gray-700 dark:text-gray-300"}`}
                                                    >
                                                        <span>{sec?.cultivoActual?.split(" ")[0] || "🌱"}</span>
                                                        {sec?.nombre || secId}
                                                        {sec?.espId && <span className="ml-auto text-[10px] text-emerald-500 font-bold">✓ Vinculado</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedInvId && selectedSecId && (
                        <button
                            onClick={marcarVinculado}
                            disabled={saving}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : "✅ Confirmar vinculación"}
                        </button>
                    )}
                </div>

                {/* Step 2: Paths */}
                <div className="space-y-5">
                    <div className="glass rounded-3xl p-6 space-y-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                            Rutas para tu ESP32
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedInvId ? "Copia estas rutas en tu firmware:" : "Selecciona una sección para ver las rutas exactas."}
                        </p>
                        <div className="space-y-3">
                            {paths.map((item) => {
                                const fullPath = buildPath(item.key);
                                return (
                                    <div key={item.key} className="bg-slate-900/10 dark:bg-slate-800/60 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold ${item.color}`}>{item.label} <span className="font-normal text-gray-400">{item.desc}</span></p>
                                            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all mt-1">{fullPath}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(fullPath, item.key)}
                                            className={`flex-shrink-0 p-1.5 rounded-lg transition ${copied === item.key ? "text-emerald-500" : "text-gray-400 hover:text-emerald-500"}`}
                                            title="Copiar"
                                        >
                                            {copied === item.key ? <FiCheckCircle /> : <FiCopy />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status of all sections */}
                    <div className="glass rounded-3xl p-6 space-y-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                            <FiWifi className="text-emerald-500" /> Estado de Dispositivos
                        </h2>
                        {allSections.length === 0 && <p className="text-sm text-gray-400">Sin secciones configuradas.</p>}
                        {allSections.map((s) => (
                            <div key={`${s.invId}-${s.secId}`} className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 rounded-2xl px-4 py-3">
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold">{s.invName}</p>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{s.secName}</p>
                                    {s.espId && <p className="text-[10px] font-mono text-gray-400">ESP: {s.espId}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.online ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                        {s.online ? "Online" : "Offline"}
                                    </span>
                                    {s.espId && <span className="text-[10px] text-emerald-500 font-bold">✓ Vinculado</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
