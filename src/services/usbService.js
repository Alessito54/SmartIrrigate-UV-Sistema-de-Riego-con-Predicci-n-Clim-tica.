/**
 * usbService.js
 * ============================================================
 * Servicio Web Serial API para conectar con módulos OASYS vía USB.
 *
 * Requisitos:
 *   - Navegadores basados en Chromium (Chrome, Edge, Opera) en Desktop.
 *   - Secure Context obligatorio (HTTPS o localhost).
 * ============================================================
 */

let _port       = null;
let _reader     = null;
let _keepReading = false;
let _readPromise = null;
let _onDisconnectCb = null;  // callback para avisar que se perdió el dispositivo
let _lastPortInfo = null;
let _statusCallback = null;
let _readLoopActive = false;
let _recovering = false;
let _recoverWindowStarted = 0;
let _recoverCount = 0;
let _lastStatus = null;

const USB_BAUD_RATE = 115200;
const OASYS_BOOT_DELAY_MS = 1800;
const USB_RECONNECT_GRACE_MS = 6000;
const USB_WRITE_TIMEOUT_MS = 9000;
const USB_RECOVERY_WINDOW_MS = 15000;
const USB_MAX_RECOVERIES_PER_WINDOW = 2;
const SERIAL_FILTERS = [
    { usbVendorId: 0x303A }, // Espressif
    { usbVendorId: 0x10C4 }, // Silicon Labs CP210x
    { usbVendorId: 0x1A86 }, // QinHeng CH340/CH9102
    { usbVendorId: 0x0403 }, // FTDI
    { usbVendorId: 0x2341 }, // Arduino
];

// ============================================================
// DETECCIÓN DE SOPORTE
// ============================================================

export function isUsbSupported() {
    if (typeof navigator === "undefined") return false;
    if (typeof window !== "undefined" && !window.isSecureContext) return false;
    return "serial" in navigator;
}

export function getUsbUnavailableReason() {
    if (typeof navigator === "undefined") return "Entorno no compatible.";
    if (typeof window !== "undefined" && !window.isSecureContext) {
        return "La app debe abrirse en HTTPS para usar Web Serial. Asegúrate de usar https:// en la URL.";
    }
    if (!("serial" in navigator)) {
        return "Tu navegador no soporta conexión USB. Usa Chrome o Edge en una computadora de escritorio.";
    }
    return null;
}

// ============================================================
// ESTADO
// ============================================================

export function isConnected() {
    return _port !== null;
}

export function getDeviceName() {
    return _port ? "OASYS (USB)" : null;
}

export function getLastStatus() {
    return _lastStatus;
}

// ============================================================
// CONEXIÓN
// ============================================================

export async function connectToOASYSUsb(onDisconnect = null) {
    if (!isUsbSupported()) {
        throw new Error(getUsbUnavailableReason() ?? "USB no disponible.");
    }

    _onDisconnectCb = onDisconnect;
    _resetRecoveryBudget();

    if (_port) {
        if (!_port.readable && !_port.writable) {
            await _ensurePortReadable();
        }
        console.log("[USB] Reutilizando puerto serial abierto");
        return getDeviceName();
    }

    // Limpiar estado anterior si quedó sucio
    await _cleanupPort();

    // Solicita puerto al usuario (con filtros para evitar dispositivos BT bloqueados)
    _port = await navigator.serial.requestPort({ filters: SERIAL_FILTERS });
    _lastPortInfo = _port.getInfo?.() ?? null;

    // Escuchar desconexión física del dispositivo
    _port.addEventListener("disconnect", _handlePhysicalDisconnect);

    // Abre el puerto a 115200 baudios
    await _port.open({ baudRate: USB_BAUD_RATE });
    await _settlePortAfterOpen();

    console.log("[USB] Conectado al puerto serial");
    return "OASYS (USB)";
}

// ============================================================
// ENVIAR CONFIGURACIÓN
// ============================================================

export async function sendWiFiConfigUsb(ssid, password, invernaderoId, userId, seccionId = "") {
    const payload = JSON.stringify({ ssid, password, invernaderoId, seccionId, userId }) + "\n";
    await _writeToPort(payload);
    console.log(`[USB] Config enviada: ${payload}`);

    // Mantener lectura activa para capturar estados posteriores (wifi_ok / vinculado)
    // incluso si el OASYS reinicia temporalmente el puerto.
}

export async function requestWiFiScanUsb() {
    await _writeToPort(JSON.stringify({ command: "scan" }) + "\n");
    console.log("[USB] Escaneo de redes WiFi solicitado");
}

export async function requestDeviceStatusUsb() {
    const payload = JSON.stringify({ command: "status" }) + "\n";
    await _writeToPort(payload);
    console.log("[USB] Estado del dispositivo solicitado");
}

export async function sendUsbCommand(command, extra = {}) {
    const payload = JSON.stringify({ command, ...extra }) + "\n";
    await _writeToPort(payload);
    console.log(`[USB] Comando enviado: ${command}`);
}

export async function requestChangeWifiUsb() {
    return sendUsbCommand("change_wifi");
}

export async function requestForgetWifiUsb() {
    return sendUsbCommand("forget_wifi");
}

async function _writeToPort(text) {
    if (!_keepReading) {
        throw new Error("El puerto USB se desconectó. Vuelve a conectar el módulo USB.");
    }

    const bytes = new TextEncoder().encode(text);
    let port = await _waitForWritablePort();

    try {
        const writer = port.writable.getWriter();
        try {
            await writer.write(bytes);
        } finally {
            writer.releaseLock();
        }
        _kickReadLoop();
    } catch (err) {
        const lost =
            err?.message?.includes("device has been lost") ||
            err?.name === "NetworkError";

        if (!lost) throw err;

        _port = null;
        port = await _waitForWritablePort();
        const writer = port.writable.getWriter();
        try {
            await writer.write(bytes);
        } finally {
            writer.releaseLock();
        }
        _kickReadLoop();
    }
}

// ============================================================
// ESCUCHAR NOTIFICACIONES DE ESTADO
// ============================================================

export async function listenForStatusUsb(callback) {
    if (!_port) throw new Error("No hay dispositivo USB conectado.");

    _statusCallback = callback;
    _keepReading = true;
    _kickReadLoop();
}

async function _readLoop(callback) {
    if (_readLoopActive) return;
    _readLoopActive = true;

    // Cada iteración del while recrea el stream para manejar reinicios del OASYS
    try {
        while (_keepReading) {
            if (!_port) {
                const recovered = await _recoverAfterDeviceLoss();
                if (!recovered) {
                    _stopReadingAndNotify();
                    break;
                }
            }

            if (!_port?.readable) {
                const opened = await _ensurePortReadable();
                if (!opened) {
                    const recovered = await _recoverAfterDeviceLoss();
                    if (!recovered) {
                        _stopReadingAndNotify();
                        break;
                    }
                }
            }

            if (!_port?.readable) {
                await new Promise((r) => setTimeout(r, 500));
                continue;
            }

            const decoder = new TextDecoder();
            _reader = _port.readable.getReader();
            let buffer = "";

            try {
                while (_keepReading) {
                    const { value, done } = await _reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Procesar líneas completas
                    const lines = buffer.split("\n");
                    buffer = lines.pop(); // parte incompleta queda en el buffer

                    for (let line of lines) {
                        line = line.trim();
                        if (!line) continue;
                        _resetRecoveryBudget();

                        if (line.startsWith("{") && line.endsWith("}")) {
                            try {
                                const parsed = JSON.parse(line);
                                _lastStatus = parsed;
                                console.log("[USB] Estado recibido:", parsed);
                                callback(parsed);
                            } catch {
                                callback({ type: "raw", line, ts: Date.now() });
                            }
                        } else {
                            callback({ type: "raw", line, ts: Date.now() });
                        }
                    }
                }
            } catch (err) {
                const isDeviceLost =
                    err?.message?.includes("device has been lost") ||
                    err?.name === "NetworkError";

                if (isDeviceLost && _keepReading) {
                    if (!_canAttemptRecovery()) {
                        console.warn("[USB] El OASYS está reiniciando el puerto repetidamente. Deteniendo lectura.");
                        callback({ type: "raw", line: "[USB] El OASYS reinició demasiadas veces. Reconecta manualmente el módulo.", ts: Date.now() });
                        _stopReadingAndNotify();
                        continue;
                    }
                    callback({ type: "raw", line: "[USB] OASYS reinició el puerto, esperando reconexión...", ts: Date.now() });
                    const recovered = await _recoverAfterDeviceLoss();
                    if (!recovered && _keepReading) {
                        console.warn("[USB] No se pudo recuperar el puerto USB.");
                        _stopReadingAndNotify();
                    }
                } else if (_keepReading) {
                    console.error("[USB] Error leyendo datos seriales:", err);
                }
            } finally {
                try {
                    _reader?.releaseLock();
                } catch { /* ya liberado */ }
                _reader = null;
            }
        }
    } finally {
        _readLoopActive = false;
    }

    console.log("[USB] Loop de lectura terminado.");
}

// ============================================================
// DESCONEXIÓN FÍSICA (evento del navegador)
// ============================================================

function _handlePhysicalDisconnect() {
    console.warn("[USB] Dispositivo USB desconectado o reiniciado.");
    _dropCurrentPort().catch(() => {});

    setTimeout(async () => {
        if (!_keepReading) return;
        const recovered = await _recoverAfterDeviceLoss();
        if (recovered) return;

        _stopReadingAndNotify();
    }, 700);
}

// ============================================================
// DESCONECTAR (manual, desde la app)
// ============================================================

export async function disconnectUsb() {
    _keepReading = false;

    try {
        if (_reader) {
            await _reader.cancel().catch(() => {});
        }

        if (_readPromise) {
            await _readPromise.catch(() => {});
        }
    } catch { /* ignorar */ }

    await _cleanupPort();
    console.log("[USB] Desconectado por el usuario.");
}

// ============================================================
// LIMPIEZA INTERNA
// ============================================================

async function _cleanupPort() {
    if (_port) {
        try {
            _port.removeEventListener("disconnect", _handlePhysicalDisconnect);
            // Solo cerrar si está abierto (readable o writable presentes)
            if (_port.readable || _port.writable) {
                await _port.close().catch(() => {});
            }
        } catch { /* ignorar */ }
        _port = null;
    }
    _reader = null;
    _readPromise = null;
    _onDisconnectCb = null;
    _statusCallback = null;
    _readLoopActive = false;
    _recovering = false;
    _lastStatus = null;
    _resetRecoveryBudget();
}

async function _ensurePortReadable() {
    if (!_port) return false;
    if (_port.readable) return true;
    try {
        await _port.open({ baudRate: USB_BAUD_RATE });
        await _settlePortAfterOpen();
        return true;
    } catch {
        return false;
    }
}

async function _ensurePortWritable() {
    if (!_port) return false;
    if (_port.writable) return true;
    try {
        await _port.open({ baudRate: USB_BAUD_RATE });
        await _settlePortAfterOpen();
        return true;
    } catch {
        return false;
    }
}

async function _tryAutoReconnect(quiet = false) {
    if (!isUsbSupported()) return false;
    try {
        const ports = await navigator.serial.getPorts();
        if (!ports?.length) return false;

        const matched = ports.find((p) => {
            const info = p.getInfo?.() ?? {};
            if (!_lastPortInfo) return false;
            return (
                info.usbVendorId === _lastPortInfo.usbVendorId &&
                info.usbProductId === _lastPortInfo.usbProductId
            );
        });

        const candidate = matched || ports.find((p) => {
            const info = p.getInfo?.() ?? {};
            return SERIAL_FILTERS.some((f) => f.usbVendorId === info.usbVendorId);
        }) || ports[0];
        if (!candidate) return false;

        _port = candidate;
        _lastPortInfo = _port.getInfo?.() ?? _lastPortInfo;
        _port.removeEventListener("disconnect", _handlePhysicalDisconnect);
        _port.addEventListener("disconnect", _handlePhysicalDisconnect);

        if (!_port.readable) {
            await _port.open({ baudRate: USB_BAUD_RATE });
            await _settlePortAfterOpen();
        }

        return true;
    } catch (err) {
        if (!quiet) {
            console.warn("[USB] No se pudo reconectar automáticamente:", err?.message || err);
        }
        return false;
    }
}

async function _waitForWritablePort(timeoutMs = USB_WRITE_TIMEOUT_MS) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        if (!_port) {
            await _tryAutoReconnect(true).catch(() => false);
        } else if (!_port.writable) {
            await _ensurePortWritable().catch(() => false);
        }

        if (_port?.writable) return _port;
        await _delay(300);
    }

    throw new Error("No hay dispositivo USB conectado o puerto no escribible.");
}

async function _dropCurrentPort() {
    const port = _port;
    _port = null;

    try {
        await _reader?.cancel().catch(() => {});
    } catch { /* ignorar */ }

    try {
        if (port?.readable || port?.writable) {
            await port.close().catch(() => {});
        }
    } catch { /* ignorar */ }
}

function _stopReadingAndNotify() {
    if (!_keepReading) return;
    _keepReading = false;
    if (typeof _onDisconnectCb === "function") {
        _onDisconnectCb();
    }
}

async function _settlePortAfterOpen() {
    try {
        await _port?.setSignals?.({ dataTerminalReady: false, requestToSend: false });
    } catch { /* setSignals no está disponible en todos los adaptadores */ }
    await _delay(OASYS_BOOT_DELAY_MS);
}

function _canAttemptRecovery() {
    const now = Date.now();
    if (!(_recoverWindowStarted > 0) || now - _recoverWindowStarted > USB_RECOVERY_WINDOW_MS) {
        _recoverWindowStarted = now;
        _recoverCount = 0;
    }

    _recoverCount += 1;
    return _recoverCount <= USB_MAX_RECOVERIES_PER_WINDOW;
}

function _resetRecoveryBudget() {
    _recoverWindowStarted = 0;
    _recoverCount = 0;
}

async function _recoverAfterDeviceLoss(timeoutMs = USB_RECONNECT_GRACE_MS) {
    if (_recovering) {
        const started = Date.now();
        while (_recovering && Date.now() - started < timeoutMs) {
            await _delay(150);
        }
        return Boolean(_port?.readable || _port?.writable);
    }
    _recovering = true;

    try {
        await _dropCurrentPort();
        const started = Date.now();

        while (_keepReading && Date.now() - started < timeoutMs) {
            const recovered = await _tryAutoReconnect(true).catch(() => false);
            if (recovered) {
                return true;
            }
            await _delay(350);
        }

        return false;
    } finally {
        _recovering = false;
    }
}

function _kickReadLoop() {
    if (!_keepReading || !_statusCallback || _readLoopActive) return;
    _readPromise = _readLoop(_statusCallback);
}

function _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
