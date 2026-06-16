import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
    isModuleOnline,
    linkModuloToSeccion,
    unlinkModulo,
    getModuloLocation,
} from "../services/modulos";
import {
    isUsbSupported,
    getUsbUnavailableReason,
    connectToOASYSUsb,
    sendWiFiConfigUsb,
    requestWiFiScanUsb,
    requestDeviceStatusUsb,
    requestChangeWifiUsb,
    requestForgetWifiUsb,
    sendUsbCommand,
    listenForStatusUsb,
    disconnectUsb,
    isConnected as usbIsConnected,
    getDeviceName,
    getLastStatus,
} from "../services/usbService";
import {
    FiLink, FiCheckCircle, FiAlertTriangle, FiX,
    FiWifi, FiEye, FiEyeOff, FiChevronDown,
    FiCpu, FiMinusCircle, FiZap, FiInfo
} from "react-icons/fi";

// ── Labels de estado del ESP32 ────────────────────────────────────────────────
const STATUS_LABELS = {
    idle:       "Conectado — listo para configurar",
    connecting: "Conectando al WiFi...",
    needs_wifi: "Sin WiFi — primero configura la red",
    needs_link: "WiFi conectado — falta vincular invernadero",
    wifi_ok:    "WiFi conectado — listo para vincular",
    firebase_ok: "Firebase listo — vinculación en curso",
    vinculado:  "¡Vinculado exitosamente!",
    error:      "Error al configurar",
};

const RESET_REASONS = {
    1: "arranque por energía/USB",
    3: "reinicio por software",
    4: "crash/panic del firmware",
    5: "watchdog de interrupción",
    6: "watchdog de tarea",
    7: "watchdog general",
    9: "brownout: caída de voltaje/alimentación",
};

function formatResetReason(code) {
    if (code === undefined || code === null) return "causa no reportada";
    return RESET_REASONS[Number(code)] || `código ${code}`;
}

function parseJsonFromSerialLine(line) {
    const start = line.indexOf("{");
    const end = line.lastIndexOf("}");
    if (start === -1 || end <= start) return null;

    try {
        return JSON.parse(line.slice(start, end + 1));
    } catch {
        return null;
    }
}

export default function Vinculacion() {
    const { invernaderos, modulos, reloadInvernaderos, user, selectInvernadero, selectSeccion } = useAuth();

    // ── Módulos existentes ────────────────────────────────────────────────────
    const [unlinkingId,  setUnlinkingId]  = useState(null);
    const [globalStatus, setGlobalStatus] = useState(null);   // {type, msg}
    const [locations,    setLocations]    = useState({});

    // ── Estado USB ────────────────────────────────────────────────────────────
    const [usbDevice,     setUsbDevice]     = useState(null);   // nombre del módulo
    const [usbConnecting, setUsbConnecting] = useState(false);
    const [usbStatus,     setUsbStatus]     = useState(null);   // {status, ip, chipId, error}
    const [usbSending,    setUsbSending]    = useState(false);
    const [usbPanel,      setUsbPanel]      = useState(false);
    const [usbScanLoading, setUsbScanLoading] = useState(false);
    const [esperandoReinicio, setEsperandoReinicio] = useState(false);
    const [scanModalOpen, setScanModalOpen] = useState(false);
    const [scanResults, setScanResults] = useState([]);
    const [scanError, setScanError] = useState("");
    const [serialLogs, setSerialLogs] = useState([]);
    const scanInFlightRef = useRef(false);
    const scanStartedRef = useRef(false);
    const serialLogRef = useRef(null);
    const statusTimerRef = useRef(null);

    // ── Formulario de config ──────────────────────────────────────────────────
    const [ssid,     setSsid]     = useState("");
    const [password, setPassword] = useState("");
    const [showPw,   setShowPw]   = useState(false);
    const [invId,    setInvId]    = useState("");
    const [secId,    setSecId]    = useState("");

    // ── Datos derivados ───────────────────────────────────────────────────────
    const moduloEntries   = Object.entries(modulos);
    const invEntries      = Object.entries(invernaderos || {});
    const sectionEntries   = invEntries.flatMap(([iId, inv]) =>
        Object.entries(inv?.secciones || {}).map(([sId, sec]) => ({ iId, inv, sId, sec }))
    );
    const moduleForSection = (iId, sId, sec) => {
        const directModuloId = sec?.moduloId;
        if (directModuloId) {
            return { moduloId: directModuloId, modulo: modulos[directModuloId] || null };
        }

        const entry = Object.entries(modulos || {}).find(([, modulo]) =>
            modulo?.invernaderoId === iId && modulo?.seccionId === sId
        );
        return entry ? { moduloId: entry[0], modulo: entry[1] } : null;
    };
    const sectionsAvailable = sectionEntries.filter(({ iId, sId, sec }) =>
        !moduleForSection(iId, sId, sec)
    );
    const activeLinkings  = sectionEntries
        .map(({ iId, inv, sId, sec }) => {
            const link = moduleForSection(iId, sId, sec);
            if (!link) return null;
            return {
                invId:    iId,
                invName:  inv.nombre || iId.slice(-8),
                secId:    sId,
                secName:  sec.nombre || sId.slice(-8),
                moduloId: link.moduloId,
                modulo:   link.modulo,
            };
        })
        .filter(Boolean);

    const usbAvailable = isUsbSupported();
    const usbReason    = getUsbUnavailableReason();
    const wifiReady = usbStatus?.status === "wifi_ok"
        || usbStatus?.status === "needs_link"
        || usbStatus?.status === "vinculado"
        || usbStatus?.firebase === true
        || usbStatus?.wifi === true;

    // Geolocalización de módulos online
    useEffect(() => {
        const onlineWithIp = moduloEntries.filter(([, m]) => isModuleOnline(m) && m.ip);
        onlineWithIp.forEach(([, m]) => {
            if (locations[m.ip]) return;
            getModuloLocation(m.ip).then((loc) => {
                if (loc) setLocations((prev) => ({ ...prev, [m.ip]: loc }));
            });
        });
    }, [modulos]);

    // Reset bleSending cuando llega respuesta final
    useEffect(() => {
        if (usbStatus?.status === "vinculado" || usbStatus?.status === "error") {
            setUsbSending(false);
        }
    }, [usbStatus]);

    useEffect(() => {
        const el = serialLogRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [serialLogs]);

    async function handleUsbStatus(st) {
        if (st?.type === "raw") {
            setSerialLogs((prev) => {
                const next = [...prev, `[ESP32] ${st.line}`];
                return next.slice(-250);
            });
            const parsedRaw = parseJsonFromSerialLine(st.line);
            if (parsedRaw) {
                handleUsbMessage(parsedRaw);
            }
            if (scanInFlightRef.current && st.line.includes("Recibido (no-JSON)")) {
                setUsbScanLoading(false);
                setScanError("El ESP32 recibió el comando, pero el firmware no reconoce el escaneo. Flashea el firmware actualizado.");
            }
            return;
        }

        if (st && st.monitor) {
            setSerialLogs((prev) => {
                const next = [...prev, `[MONITOR:${st.monitor}] ${JSON.stringify(st.payload ?? {})}`];
                return next.slice(-250);
            });
            setUsbStatus(st.payload ? st.payload : { monitor: st.monitor });
            return;
        }

        handleUsbMessage(st);

        if (st.status === "wifi_ok") {
            setEsperandoReinicio(false);
            if (st.ssid) setSsid(st.ssid);
            setGlobalStatus({
                type: "success",
                msg: `WiFi conectado (${st.ssid || ssid || "red configurada"}). Ya puedes asignar el invernadero desde la app.`,
            });
        }

        if (st.status === "needs_wifi") {
            setEsperandoReinicio(false);
            setGlobalStatus({
                type: "error",
                msg: "El módulo no tiene WiFi. Primero configura la red para continuar con Firebase y la vinculación.",
            });
        }

        if (st.status === "vinculado") {
            setEsperandoReinicio(false);
            await reloadInvernaderos();
            setGlobalStatus({
                type: "success",
                msg: `¡Módulo ${st.chipId?.slice(-8) || ""} vinculado a "${invernaderos[invId]?.nombre || invId}" exitosamente!`,
            });
            setUsbPanel(false);
            setUsbDevice(null);
        }
    }

    useEffect(() => {
        if (!usbIsConnected()) return;

        setUsbDevice(getDeviceName() || "OASYS (USB)");
        setUsbPanel(true);
        const lastStatus = getLastStatus();
        if (lastStatus) {
            handleUsbMessage(lastStatus);
        }
        listenForStatusUsb(handleUsbStatus).then(() => {
            setTimeout(() => {
                requestDeviceStatusUsb().catch(() => {});
            }, 300);
        }).catch((err) => {
            setGlobalStatus({ type: "error", msg: `USB: ${err.message}` });
        });
    }, []);

    // ── Conectar por USB ──────────────────────────────────────────────────────
    async function handleUsbConnect() {
        if (!usbAvailable) {
            setGlobalStatus({ type: "error", msg: usbReason ?? "USB no disponible." });
            return;
        }
        setUsbConnecting(true);
        setUsbStatus(null);
        setSerialLogs([]);
        setSsid("");
        setPassword("");
        setInvId("");
        setSecId("");

        try {
            const onDisconnect = () => {
                if (statusTimerRef.current) {
                    clearTimeout(statusTimerRef.current);
                    statusTimerRef.current = null;
                }
                scanInFlightRef.current = false;
                scanStartedRef.current = false;
                setUsbDevice(null);
                setUsbStatus((prev) => prev ?? { status: "error", error: "Puerto USB desconectado" });
                setUsbPanel(false);
                setUsbScanLoading(false);
                if (!usbSending && !esperandoReinicio) {
                    setGlobalStatus({ type: "info", msg: "El ESP32 reinició el puerto USB. Presiona de nuevo “Conectar módulo USB” y luego escanea redes." });
                }
            };

            const name = await connectToOASYSUsb(onDisconnect);
            setUsbDevice(name);
            setUsbPanel(true);

            await listenForStatusUsb(handleUsbStatus);

            setTimeout(() => {
                requestDeviceStatusUsb().catch(() => {});
            }, 700);
        } catch (err) {
            if (err.name !== "NotFoundError") {
                setGlobalStatus({ type: "error", msg: `USB: ${err.message}` });
            }
        } finally {
            setUsbConnecting(false);
        }
    }

    function handleUsbMessage(st) {
        if (scanInFlightRef.current && st.status === "needs_wifi") {
            if (scanStartedRef.current) {
                scanInFlightRef.current = false;
                scanStartedRef.current = false;
                setUsbScanLoading(false);
                setScanError(`El ESP32 se reinició durante el escaneo WiFi (${formatResetReason(st.resetReason)}). Prueba otro cable/puerto USB o escribe el SSID manualmente para continuar.`);
                setScanModalOpen(true);
            }
            return;
        }

        setUsbStatus(st);

        if (st.scanStatus) {
            if (st.scanStatus === "start") {
                scanStartedRef.current = true;
            }
            setSerialLogs((prev) => {
                const next = [...prev, `[SCAN] ${st.scanStatus}${st.count !== undefined ? ` count=${st.count}` : ""}${st.code !== undefined ? ` code=${st.code}` : ""}`];
                return next.slice(-250);
            });
        }

        if (Array.isArray(st.scan) || Array.isArray(st.networks)) {
            scanInFlightRef.current = false;
            scanStartedRef.current = false;
            const networks = (st.scan || st.networks).map((entry) =>
                typeof entry === "string" ? { ssid: entry } : entry
            );
            setScanResults(networks);
            if (st.error) {
                setScanError(`Error del ESP32: ${st.error}${st.code !== undefined ? ` (${st.code})` : ""}`);
            } else if (st.count === 0) {
                setScanError("El ESP32 respondió, pero no encontró redes 2.4 GHz cercanas.");
            } else {
                setScanError("");
            }
            setScanModalOpen(true);
            setUsbScanLoading(false);
        }
    }

    // ── Desconectar USB manualmente ───────────────────────────────────────────
    async function handleUsbDisconnect() {
        if (statusTimerRef.current) {
            clearTimeout(statusTimerRef.current);
            statusTimerRef.current = null;
        }
        scanInFlightRef.current = false;
        scanStartedRef.current = false;
        await disconnectUsb().catch(() => {});
        setUsbDevice(null);
        setUsbPanel(false);
        setUsbStatus(null);
        setUsbSending(false);
        setScanModalOpen(false);
    }

    // ── Enviar configuración al ESP32 ─────────────────────────────────────────
    async function handleSend() {
        setUsbSending(true);
        setUsbStatus(null);
        try {
            if (!wifiReady) {
                if (!ssid.trim()) {
                    throw new Error("Escribe el SSID de la red WiFi.");
                }
                setEsperandoReinicio(true);
                setSerialLogs((prev) => [...prev, `[TX] wifi ${ssid.trim()}`].slice(-250));
                await sendWiFiConfigUsb(ssid.trim(), password, invId || "", user?.uid ?? "", secId || "");
                setGlobalStatus({
                    type: "info",
                    msg: "WiFi enviada. El módulo se reiniciará; espera a que vuelva a responder con estado WiFi OK.",
                });
            } else {
                if (!invId || !secId) {
                    throw new Error("Selecciona una sección para vincular.");
                }
                if (!usbStatus?.chipId) {
                    throw new Error("No se recibió el Chip ID del módulo.");
                }
                await linkModuloToSeccion(usbStatus.chipId, invId, secId);
                await reloadInvernaderos();
                selectInvernadero(invId);
                selectSeccion(secId);
                setEsperandoReinicio(false);
                const secName = invernaderos[invId]?.secciones?.[secId]?.nombre || secId;
                setGlobalStatus({
                    type: "success",
                    msg: `Módulo vinculado a "${invernaderos[invId]?.nombre || invId}" · sección "${secName}".`,
                });
            }
        } catch (err) {
            setGlobalStatus({ type: "error", msg: `Error al enviar: ${err.message}` });
        } finally {
            setUsbSending(false);
        }
    }

    async function handleChangeWifi() {
        if (!usbDevice) return;
        setUsbSending(true);
        try {
            setGlobalStatus({
                type: "info",
                msg: "Solicitando cambio de WiFi. El módulo reiniciará y volverá al modo configuración.",
            });
            await requestChangeWifiUsb();
            setEsperandoReinicio(true);
        } catch (err) {
            setGlobalStatus({ type: "error", msg: `No se pudo pedir el cambio de WiFi: ${err.message}` });
        } finally {
            setUsbSending(false);
        }
    }

    async function handleForgetWifi() {
        if (!usbDevice) return;
        setUsbSending(true);
        try {
            setGlobalStatus({
                type: "info",
                msg: "Olvidando la red WiFi actual. El módulo reiniciará y quedará listo para configurar otra red.",
            });
            await requestForgetWifiUsb();
            setEsperandoReinicio(true);
        } catch (err) {
            setGlobalStatus({ type: "error", msg: `No se pudo olvidar la red WiFi: ${err.message}` });
        } finally {
            setUsbSending(false);
        }
    }

    // ── Desvincular módulo ────────────────────────────────────────────────────
    async function handleUnlink(moduloId, iId, sId) {
        setUnlinkingId(moduloId);
        setGlobalStatus(null);
        try {
            await unlinkModulo(moduloId, iId, sId);
            await reloadInvernaderos();
            setGlobalStatus({ type: "success", msg: "Módulo desvinculado correctamente." });
        } catch (err) {
            setGlobalStatus({ type: "error", msg: `Error al desvincular: ${err.message}` });
        } finally {
            setUnlinkingId(null);
        }
    }

    const onlineCount = moduloEntries.filter(([, m]) => isModuleOnline(m)).length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeUp">

            {/* ── Header ── */}
            <header>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
                    <FiCpu size={32} className="text-emerald-500" />
                    Configurar módulo OASYS
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                    Conecta el módulo a tu laptop con un cable USB para configurarlo por fases: primero WiFi y después la sección.
                    Una vez vinculado, puedes desconectar el cable.
                </p>
            </header>

            {/* ── Alerta global ── */}
            {globalStatus && (
                <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border animate-fadeUp ${
                    globalStatus.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : globalStatus.type === "info"
                            ? "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300"
                            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                }`}>
                    {globalStatus.type === "success"
                        ? <FiCheckCircle className="text-xl mt-0.5 flex-shrink-0" />
                        : globalStatus.type === "info"
                            ? <FiInfo className="text-xl mt-0.5 flex-shrink-0" />
                            : <FiAlertTriangle className="text-xl mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{globalStatus.msg}</p>
                    <button onClick={() => setGlobalStatus(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100">
                        <FiX />
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN PRINCIPAL: Conectar y configurar
            ══════════════════════════════════════════════════════════════ */}
            <div className="glass rounded-3xl p-6 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                            <FiZap className="text-amber-400" size={20} />
                            Configurar módulo nuevo
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Primero configura WiFi. Cuando el ESP32 confirme WiFi OK, se habilita la vinculación a una sección.
                        </p>
                    </div>

                    {/* Botón conectar / desconectar */}
                    {!usbDevice ? (
                        <button
                            onClick={handleUsbConnect}
                            disabled={usbConnecting || !usbAvailable}
                            title={!usbAvailable ? usbReason : undefined}
                            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-600/20"
                        >
                            <FiCpu size={16} className={usbConnecting ? "animate-pulse" : ""} />
                            {usbConnecting ? "Buscando puerto..." : "Conectar módulo USB"}
                        </button>
                    ) : (
                        <button
                            onClick={handleUsbDisconnect}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-200 dark:border-red-800 rounded-xl font-semibold text-sm transition"
                        >
                            <FiX size={14} />
                            Desconectar
                        </button>
                    )}
                </div>

                {/* Aviso de soporte */}
                {!usbAvailable && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                        <FiInfo className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">{usbReason}</p>
                    </div>
                )}

                {/* Badge módulo conectado */}
                {usbDevice && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-fadeUp">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                Módulo detectado: <span className="font-mono">{usbDevice}</span>
                            </p>
                            {usbStatus?.chipId && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                    Chip ID: {usbStatus.chipId}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {usbDevice && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleChangeWifi}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/35 transition"
                        >
                            Cambiar WiFi
                        </button>
                        {wifiReady && (
                            <button
                                type="button"
                                onClick={handleForgetWifi}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/35 transition"
                            >
                                Olvidar WiFi actual
                            </button>
                        )}
                    </div>
                )}

                {/* ── Panel de configuración (visible cuando el módulo está conectado) ── */}
                {usbPanel && (
                    <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-5 animate-fadeUp bg-white/50 dark:bg-slate-800/50">

                        {/* Estado del módulo */}
                        {usbStatus && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                                usbStatus.status === "vinculado"
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300"
                                    : usbStatus.status === "error"
                                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300"
                                        : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300"
                            }`}>
                                {usbStatus.status === "vinculado"
                                    ? <FiCheckCircle className="flex-shrink-0" />
                                    : usbStatus.status === "error"
                                        ? <FiAlertTriangle className="flex-shrink-0" />
                                        : <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse flex-shrink-0" />}
                                <span>
                                    {STATUS_LABELS[usbStatus.status] ?? usbStatus.status}
                                    {usbStatus.error ? `: ${usbStatus.error}` : ""}
                                    {usbStatus.ip ? ` — IP: ${usbStatus.ip}` : ""}
                                </span>
                            </div>
                        )}

                        {/* ─── Formulario ─── */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {!wifiReady && (
                                <>
                                    {/* SSID */}
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Nombre de la red WiFi (SSID)
                                        </label>
                                        <div className="relative mt-1.5">
                                            <FiWifi className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                value={ssid}
                                                onChange={(e) => setSsid(e.target.value)}
                                                placeholder="Ej: MiCasa_2.4G"
                                                autoComplete="off"
                                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                                            />
                                        </div>
                                        {/* Botón para escanear redes vía ESP32 */}
                                        <div className="mt-2 flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        setUsbScanLoading(true);
                                                        setScanResults([]);
                                                        setScanError("");
                                                        scanInFlightRef.current = true;
                                                        scanStartedRef.current = false;
                                                        setScanModalOpen(true);
                                                        setSerialLogs((prev) => [...prev, "[TX] scan"].slice(-250));
                                                        await requestWiFiScanUsb();
                                                    } catch (err) {
                                                        setGlobalStatus({ type: "error", msg: `Error al solicitar escaneo: ${err.message}` });
                                                        setUsbScanLoading(false);
                                                    } finally {
                                                        setTimeout(() => {
                                                            if (!scanInFlightRef.current) return;
                                                            scanInFlightRef.current = false;
                                                            scanStartedRef.current = false;
                                                            setUsbScanLoading(false);
                                                            setScanError("Sin respuesta del ESP32. Revisa que el firmware nuevo esté flasheado y que el puerto no esté ocupado.");
                                                        }, 70000);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm"
                                            >
                                                {usbScanLoading ? "Escaneando..." : "Escanear redes cercanas"}
                                            </button>

                                            <p className="text-xs text-gray-400">Puedes tocar una red para rellenar el SSID</p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Escribe el nombre exacto (distingue mayúsculas). Usa red 2.4 GHz.
                                        </p>
                                    </div>

                                    {/* Contraseña */}
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Contraseña WiFi
                                        </label>
                                        <div className="relative mt-1.5">
                                            <input
                                                type={showPw ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Contraseña (dejar vacío si es abierta)"
                                                className="w-full px-4 py-2.5 pr-11 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                            >
                                                {showPw ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {wifiReady && usbStatus?.ssid && (
                                <div className="sm:col-span-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                                    WiFi detectado: <strong>{usbStatus.ssid}</strong>
                                </div>
                            )}

                            {/* Sección */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Asignar a la sección
                                </label>
                                {!wifiReady ? (
                                    <div className="mt-1.5 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300">
                                        Primero conecta WiFi. Cuando el ESP32 responda con <strong>WiFi OK</strong>, podrás asignar la sección.
                                    </div>
                                ) : sectionsAvailable.length === 0 ? (
                                    <p className="mt-1.5 text-xs text-amber-500 italic">
                                        Todas las secciones ya tienen un módulo asignado.
                                    </p>
                                ) : (
                                    <div className="relative mt-1.5">
                                        <select
                                            value={invId && secId ? `${invId}::${secId}` : ""}
                                            onChange={(e) => {
                                                const [nextInvId, nextSecId] = e.target.value.split("::");
                                                setInvId(nextInvId || "");
                                                setSecId(nextSecId || "");
                                            }}
                                            className="w-full appearance-none px-4 py-2.5 pr-9 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                                        >
                                            <option value="">Seleccionar sección...</option>
                                            {sectionsAvailable.map(({ iId, inv, sId, sec }) => (
                                                <option key={`${iId}-${sId}`} value={`${iId}::${sId}`}>
                                                    {(inv.nombre || iId.slice(-8))} · {(sec.nombre || sId.slice(-8))}
                                                </option>
                                            ))}
                                        </select>
                                        <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botón enviar */}
                        <button
                            onClick={handleSend}
                            disabled={usbSending || (!wifiReady && !ssid.trim()) || (wifiReady && (!invId || !secId))}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            {usbSending ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {wifiReady ? "Vinculando..." : "Enviando WiFi..."}
                                </>
                            ) : wifiReady ? (
                                <>
                                    <FiZap size={15} />
                                    Vincular módulo
                                </>
                            ) : (
                                <>
                                    <FiZap size={15} />
                                    Conectar WiFi
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                            Primero se envía el WiFi. Después, cuando el módulo responda con WiFi OK, puedes asignarle la sección para dejarlo vinculado.
                        </p>

                        {esperandoReinicio && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                Esperando reinicio del ESP32 y confirmación de WiFi...
                            </div>
                        )}

                        <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <div className="px-3 py-2 bg-gray-100 dark:bg-slate-900/70 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-between">
                                <span>Monitor Serial ESP32</span>
                                <button
                                    type="button"
                                    onClick={() => setSerialLogs([])}
                                    className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    Limpiar
                                </button>
                            </div>
                            <div ref={serialLogRef} className="max-h-48 overflow-auto bg-black/90 text-emerald-300 font-mono text-[11px] p-3 space-y-1 scroll-smooth">
                                {serialLogs.length === 0 ? (
                                    <p className="text-emerald-500/70">Esperando mensajes del ESP32...</p>
                                ) : (
                                    serialLogs.map((line, idx) => <p key={`${idx}-${line.slice(0, 24)}`}>{line}</p>)
                                )}
                            </div>
                            {/* ── Input interactivo para enviar comandos al ESP32 ── */}
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const input = e.target.elements.serialInput;
                                    const text = input.value.trim();
                                    if (!text) return;
                                    try {
                                        if (!usbIsConnected()) {
                                            setGlobalStatus({ type: "error", msg: "No hay dispositivo USB conectado." });
                                            return;
                                        }

                                        if (text.startsWith("{")) {
                                            // JSON directo — enviar como WiFi config o comando
                                            try {
                                                const parsed = JSON.parse(text);
                                                if (parsed.ssid) {
                                                    await sendWiFiConfigUsb(parsed.ssid, parsed.password || "", parsed.invernaderoId || "", parsed.userId || "", parsed.seccionId || "");
                                                } else if (parsed.command) {
                                                    await sendUsbCommand(parsed.command, parsed);
                                                } else {
                                                    await sendUsbCommand("raw", parsed);
                                                }
                                            } catch {
                                                await sendUsbCommand(text);
                                            }
                                        } else {
                                            // Comando de texto plano (scan, status, etc.) — enviar directo sin envolver en JSON
                                            if (text === "scan") {
                                                await requestWiFiScanUsb();
                                            } else if (text === "status") {
                                                await requestDeviceStatusUsb();
                                            } else {
                                                await sendUsbCommand(text);
                                            }
                                        }
                                        setSerialLogs((prev) => [...prev, `[TX] ${text}`].slice(-250));
                                        input.value = "";
                                    } catch (err) {
                                        setGlobalStatus({ type: "error", msg: `Error enviando: ${err.message}` });
                                    }
                                }}
                                className="flex border-t border-gray-200 dark:border-slate-700"
                            >
                                <span className="flex items-center px-2 bg-gray-100 dark:bg-slate-900/70 text-emerald-400 font-mono text-xs select-none">$</span>
                                <input
                                    name="serialInput"
                                    type="text"
                                    placeholder='Escribir comando... (ej: status, scan, {"ssid":"MiRed","password":"1234"})'
                                    autoComplete="off"
                                    className="flex-1 px-3 py-2 bg-black/80 text-emerald-300 font-mono text-[11px] outline-none placeholder:text-emerald-600/40"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                >
                                    Enviar
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {scanModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">Escaneo WiFi</h3>
                            <button
                                type="button"
                                onClick={() => setScanModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="p-4 max-h-80 overflow-auto space-y-2">
                            {usbScanLoading && scanResults.length === 0 && (
                                <p className="text-sm text-gray-500">Escaneando redes, espera un momento...</p>
                            )}
                            {!usbScanLoading && scanResults.length === 0 && (
                                <p className="text-sm text-gray-500">{scanError || "No se detectaron redes."}</p>
                            )}
                            {scanResults.map((net, idx) => (
                                <button
                                    key={`${net.ssid || "sin-ssid"}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        setSsid(net.ssid || "");
                                        setScanModalOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
                                >
                                    <span className="truncate text-sm text-gray-800 dark:text-gray-100">{net.ssid || "<sin nombre>"}</span>
                                    <span className="text-[11px] text-gray-400 ml-2">{net.rssi ? `${net.rssi} dBm` : ""}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                GRID: Módulos online + Vínculos activos
            ══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Módulos en Firebase */}
                <div className="glass rounded-3xl p-6 space-y-4">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        <FiWifi className="text-emerald-500" />
                        Módulos en red
                        <span className="ml-auto text-xs font-normal text-gray-400">
                            {onlineCount} online
                        </span>
                    </h2>

                    <p className="text-xs text-gray-400">
                        El módulo trabaja por fases: WiFi → Firebase → vínculo con sección.
                    </p>

                    {moduloEntries.length === 0 ? (
                        <p className="text-sm text-gray-400">Sin módulos registrados aún.</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {moduloEntries.map(([mId, m]) => {
                                const online = isModuleOnline(m);
                                const loc    = locations[m.ip];
                                const linked = !!m.invernaderoId && !!m.seccionId;
                                return (
                                    <div
                                        key={mId}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40"
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-mono text-gray-700 dark:text-gray-200 truncate">{mId}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {online ? "Online" : "Offline"}
                                                {m.ip ? ` · ${m.ip}` : ""}
                                                {loc ? ` · ${loc.city}` : ""}
                                                {linked ? " · Vinculado" : ""}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Vínculos activos */}
                <div className="glass rounded-3xl p-6 space-y-4">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        <FiLink className="text-emerald-500" />
                        Vínculos activos
                    </h2>

                    {activeLinkings.length === 0 ? (
                        <p className="text-sm text-gray-400">Sin vínculos configurados.</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {activeLinkings.map(({ invId: iId, secId: sId, invName, secName, moduloId, modulo }) => {
                                const online = isModuleOnline(modulo);
                                return (
                                    <div key={`${iId}-${sId}`} className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{invName}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Sección: {secName}</p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">{moduloId}</p>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 ${online ? "text-emerald-500" : "text-gray-400"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                                {online ? "Online" : "Offline"}
                                                {modulo?.ip ? ` · ${modulo.ip}` : ""}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleUnlink(moduloId, iId, sId)}
                                            disabled={unlinkingId === moduloId}
                                            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl transition disabled:opacity-40 flex-shrink-0"
                                            title="Desvincular módulo"
                                        >
                                            {unlinkingId === moduloId
                                                ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                                : <FiMinusCircle size={12} />}
                                            Desvincular
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Info footer ── */}
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">
                <FiInfo className="flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs space-y-1">
                    <p><strong>¿Cómo funciona?</strong></p>
                    <p>1. Conecta el módulo OASYS a esta laptop con un cable USB.</p>
                    <p>2. Presiona "Conectar módulo USB" y selecciona el puerto serial en el navegador.</p>
                            <p>3. Escribe el nombre y contraseña de tu red WiFi (2.4 GHz) y presiona "Conectar WiFi".</p>
                            <p>4. Cuando aparezca WiFi OK, selecciona la sección y presiona "Vincular módulo".</p>
                            <p>5. Una vez vinculado, puedes desconectar el cable. El módulo operará por WiFi de forma autónoma.</p>
                </div>
            </div>
        </div>
    );
}
