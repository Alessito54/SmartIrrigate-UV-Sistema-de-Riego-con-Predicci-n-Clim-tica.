import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    isModuleOnline,
    linkModuloToInvernadero,
    unlinkModulo,
    getModuloLocation,
} from "../services/modulos";
import { FiLink, FiCheckCircle, FiAlertTriangle, FiWifi, FiWifiOff, FiX } from "react-icons/fi";

export default function Vinculacion() {
    const { invernaderos, modulos, reloadInvernaderos } = useAuth();
    const [selectedModuloId, setSelectedModuloId] = useState("");
    const [selectedInvId, setSelectedInvId] = useState("");
    const [linking, setLinking] = useState(false);
    const [unlinkingId, setUnlinkingId] = useState(null);
    const [status, setStatus] = useState(null);
    const [locations, setLocations] = useState({}); // { [ip]: locationObj }

    // Derived data
    const moduloEntries = Object.entries(modulos);
    const invEntries = Object.entries(invernaderos || {});

    // Invernaderos that don't have a module yet (available for linking)
    const invAvailable = invEntries.filter(([, inv]) => !inv?.moduloId);

    // Active linkings: invernaderos that have a moduloId
    const activeLinkings = invEntries
        .filter(([, inv]) => inv?.moduloId)
        .map(([iId, inv]) => ({
            invId: iId,
            invName: inv.nombre || iId.slice(-8),
            moduloId: inv.moduloId,
            modulo: modulos[inv.moduloId] || null,
        }));

    // Fetch locations for online modules with a known IP
    useEffect(() => {
        const onlineWithIp = moduloEntries.filter(([, m]) => isModuleOnline(m) && m.ip);
        onlineWithIp.forEach(([, m]) => {
            if (locations[m.ip]) return; // already cached
            getModuloLocation(m.ip).then((loc) => {
                if (loc) setLocations((prev) => ({ ...prev, [m.ip]: loc }));
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modulos]);

    async function handleLink() {
        if (!selectedModuloId || !selectedInvId) return;
        setLinking(true);
        setStatus(null);
        try {
            await linkModuloToInvernadero(selectedModuloId, selectedInvId);
            await reloadInvernaderos();
            const invName = invernaderos[selectedInvId]?.nombre || selectedInvId.slice(-8);
            setStatus({ type: "success", msg: `Módulo vinculado a "${invName}" correctamente.` });
            setSelectedModuloId("");
            setSelectedInvId("");
        } catch (err) {
            setStatus({ type: "error", msg: `Error al vincular: ${err.message}` });
        } finally { setLinking(false); }
    }

    async function handleUnlink(moduloId, invId) {
        setUnlinkingId(moduloId);
        setStatus(null);
        try {
            await unlinkModulo(moduloId, invId);
            await reloadInvernaderos();
            setStatus({ type: "success", msg: "Módulo desvinculado correctamente." });
        } catch (err) {
            setStatus({ type: "error", msg: `Error al desvincular: ${err.message}` });
        } finally { setUnlinkingId(null); }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeUp">
            {/* Header */}
            <header>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
                    <FiLink size={32} className="text-emerald-500" />
                    Vincular OASYS Módulo Climático
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Asocia un módulo físico a uno de tus invernaderos. El módulo debe estar encendido y conectado a Internet.
                </p>
            </header>

            {/* Status banner */}
            {status && (
                <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border animate-fadeUp ${
                    status.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                }`}>
                    {status.type === "success"
                        ? <FiCheckCircle className="text-xl mt-0.5 flex-shrink-0" />
                        : <FiAlertTriangle className="text-xl mt-0.5 flex-shrink-0" />
                    }
                    <p className="text-sm font-medium">{status.msg}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Module browser */}
                <div className="glass rounded-3xl p-6 space-y-4">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                        Módulos detectados
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Selecciona un módulo <span className="font-semibold text-emerald-600 dark:text-emerald-400">online</span> sin invernadero asignado para vincularlo.
                    </p>

                    {moduloEntries.length === 0 ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-4 text-sm text-amber-700 dark:text-amber-400">
                            No hay módulos disponibles o conectados
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {moduloEntries.map(([mId, m]) => {
                                const online = isModuleOnline(m);
                                const loc = m.ip ? locations[m.ip] : null;
                                const linkedInvName = m.invernaderoId
                                    ? (invernaderos[m.invernaderoId]?.nombre || m.invernaderoId.slice(-8))
                                    : null;
                                const isSelectable = online && !m.invernaderoId;
                                const isSelected = selectedModuloId === mId;

                                return (
                                    <div
                                        key={mId}
                                        onClick={() => { if (isSelectable) setSelectedModuloId(isSelected ? "" : mId); }}
                                        className={`rounded-2xl px-4 py-3 border-2 transition ${
                                            isSelected
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : isSelectable
                                                    ? "border-transparent bg-white/40 dark:bg-slate-800/40 hover:border-emerald-300 cursor-pointer"
                                                    : "border-transparent bg-white/20 dark:bg-slate-800/20 opacity-60 cursor-not-allowed"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {online
                                                    ? <FiWifi size={14} className="text-emerald-500 flex-shrink-0" />
                                                    : <FiWifiOff size={14} className="text-gray-400 flex-shrink-0" />
                                                }
                                                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                                                    {mId}
                                                </span>
                                            </div>
                                            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                online
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                                    : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                                            }`}>
                                                {online ? "Online" : "Offline"}
                                            </span>
                                        </div>

                                        {m.ip && (
                                            <p className="text-[10px] font-mono text-gray-400 mt-1">IP: {m.ip}</p>
                                        )}
                                        {loc && (
                                            <p className="text-[10px] text-sky-500 mt-0.5">
                                                Ubicación: {loc.city}, {loc.country}
                                            </p>
                                        )}
                                        {linkedInvName && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">
                                                Vinculado a: {linkedInvName}
                                            </p>
                                        )}
                                        {isSelected && (
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                                                ✓ Seleccionado — elige un invernadero a la derecha
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: Link form + active linkings */}
                <div className="space-y-6">
                    {/* Link form */}
                    <div className="glass rounded-3xl p-6 space-y-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                            Vincular a invernadero
                        </h2>

                        {/* Selected module display */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Módulo seleccionado</label>
                            <div className="mt-1.5 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-700 dark:text-gray-300 break-all min-h-[40px] flex items-center">
                                {selectedModuloId
                                    ? <span className="text-emerald-600 dark:text-emerald-300">{selectedModuloId}</span>
                                    : <span className="text-gray-400">Selecciona un módulo online desde la lista</span>
                                }
                            </div>
                        </div>

                        {/* Invernadero picker */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invernadero destino</label>
                            {invAvailable.length === 0 ? (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 italic">
                                    Todos tus invernaderos ya tienen un módulo asignado. Desvincula uno primero.
                                </p>
                            ) : (
                                <select
                                    value={selectedInvId}
                                    onChange={(e) => setSelectedInvId(e.target.value)}
                                    className="mt-1.5 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                                >
                                    <option value="">Seleccionar invernadero...</option>
                                    {invAvailable.map(([iId, inv]) => (
                                        <option key={iId} value={iId}>
                                            {inv.nombre || iId.slice(-8)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <button
                            onClick={handleLink}
                            disabled={linking || !selectedModuloId || !selectedInvId}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                            {linking ? "Vinculando..." : "✅ Confirmar vinculación"}
                        </button>
                    </div>

                    {/* Active linkings */}
                    <div className="glass rounded-3xl p-6 space-y-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                            <FiWifi className="text-emerald-500" /> Vínculos activos
                        </h2>
                        {activeLinkings.length === 0 ? (
                            <p className="text-sm text-gray-400">Sin vínculos configurados.</p>
                        ) : (
                            activeLinkings.map(({ invId, invName, moduloId, modulo }) => {
                                const online = isModuleOnline(modulo);
                                return (
                                    <div key={invId} className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 rounded-2xl px-4 py-3">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{invName}</p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-0.5 break-all">{moduloId}</p>
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold mt-1 ${online ? "text-emerald-500" : "text-gray-400"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                                {online ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleUnlink(moduloId, invId)}
                                            disabled={unlinkingId === moduloId}
                                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-40 flex-shrink-0"
                                            title="Desvincular"
                                        >
                                            {unlinkingId === moduloId ? "..." : <FiX size={16} />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
