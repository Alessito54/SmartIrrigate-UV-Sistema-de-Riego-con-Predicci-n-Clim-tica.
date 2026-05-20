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

const USB_BAUD_RATE = 115200;
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

// ============================================================
// CONEXIÓN
// ============================================================

export async function connectToOASYSUsb(onDisconnect = null) {
    if (!isUsbSupported()) {
        throw new Error(getUsbUnavailableReason() ?? "USB no disponible.");
    }

    // Limpiar estado anterior si quedó sucio
    await _cleanupPort();

    _onDisconnectCb = onDisconnect;

    // Solicita puerto al usuario (con filtros para evitar dispositivos BT bloqueados)
    _port = await navigator.serial.requestPort({ filters: SERIAL_FILTERS });
    _lastPortInfo = _port.getInfo?.() ?? null;

    // Escuchar desconexión física del dispositivo
    _port.addEventListener("disconnect", _handlePhysicalDisconnect);

    // Abre el puerto a 115200 baudios
    await _port.open({ baudRate: USB_BAUD_RATE });

    console.log("[USB] Conectado al puerto serial");
    return "OASYS (USB)";
}

// ============================================================
// ENVIAR CONFIGURACIÓN
// ============================================================

export async function sendWiFiConfigUsb(ssid, password, invernaderoId, userId) {
    if (!_port?.writable) throw new Error("No hay dispositivo USB conectado o puerto no escribible.");

    const payload = JSON.stringify({ ssid, password, invernaderoId, userId }) + "\n";
    await _writeToPort(payload);
    console.log(`[USB] Config enviada: ${payload}`);

    // Mantener lectura activa para capturar estados posteriores (wifi_ok / vinculado)
    // incluso si el ESP32 reinicia temporalmente el puerto.
}

export async function requestWiFiScanUsb() {
    if (!_port?.writable) throw new Error("No hay dispositivo USB conectado o puerto no escribible.");

    const payload = JSON.stringify({ command: "scan" }) + "\n";
    await _writeToPort(payload);
    console.log("[USB] Escaneo de redes WiFi solicitado");
}

export async function requestDeviceStatusUsb() {
    if (!_port?.writable) throw new Error("No hay dispositivo USB conectado o puerto no escribible.");

    const payload = JSON.stringify({ command: "status" }) + "\n";
    await _writeToPort(payload);
    console.log("[USB] Estado del dispositivo solicitado");
}

export async function sendUsbCommand(command, extra = {}) {
    if (!_port?.writable) throw new Error("No hay dispositivo USB conectado o puerto no escribible.");

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
    const textEncoder = new TextEncoderStream();
    // No guardamos writableStreamClosed — solo necesitamos escribir
    textEncoder.readable.pipeTo(_port.writable).catch(() => {});
    const writer = textEncoder.writable.getWriter();
    await writer.write(text);
    writer.releaseLock();
}

// ============================================================
// ESCUCHAR NOTIFICACIONES DE ESTADO
// ============================================================

export async function listenForStatusUsb(callback) {
    if (!_port) throw new Error("No hay dispositivo USB conectado.");

    _keepReading = true;
    _readPromise = _readLoop(callback);
}

async function _readLoop(callback) {
    // Cada iteración del while recrea el stream para manejar reinicios del ESP32
    while (_keepReading) {
        if (!_port) {
            const recovered = await _tryAutoReconnect();
            if (!recovered) {
                await new Promise((r) => setTimeout(r, 800));
                continue;
            }
        }

        if (!_port?.readable) {
            const opened = await _ensurePortOpen();
            if (!opened) {
                const recovered = await _tryAutoReconnect();
                if (!recovered) {
                    await new Promise((r) => setTimeout(r, 800));
                    continue;
                }
            }
        }

        if (!_port?.readable) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
        }

        const textDecoder = new TextDecoderStream();

        // pipeTo puede lanzar si el dispositivo se desconecta — lo capturamos
        const pipeClosed = _port.readable
            .pipeTo(textDecoder.writable)
            .catch((err) => {
                // "The device has been lost" llega aquí — es esperado si el ESP32 reinicia
                if (_keepReading) {
                    console.warn("[USB] Pipe cerrado (posible reinicio del ESP32):", err.message);
                }
            });

        _reader = textDecoder.readable.getReader();
        let buffer = "";

        try {
            while (_keepReading) {
                const { value, done } = await _reader.read();
                if (done) break;

                buffer += value;

                // Procesar líneas completas
                const lines = buffer.split("\n");
                buffer = lines.pop(); // parte incompleta queda en el buffer

                for (let line of lines) {
                    line = line.trim();
                    if (!line) continue;

                    if (line.startsWith("{") && line.endsWith("}")) {
                        try {
                            const parsed = JSON.parse(line);
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
                console.warn("[USB] Dispositivo perdido (reinicio del ESP32). Esperando reconexión...");
                await new Promise((r) => setTimeout(r, 1200));
                await _ensurePortOpen().catch(() => {});
                await _tryAutoReconnect().catch(() => {});
            } else if (_keepReading) {
                console.error("[USB] Error leyendo datos seriales:", err);
            }
        } finally {
            try {
                _reader?.releaseLock();
            } catch { /* ya liberado */ }
            _reader = null;

            // Esperar que el pipe anterior termine antes de re-crear
            await pipeClosed.catch(() => {});
        }
    }

    console.log("[USB] Loop de lectura terminado.");
}

// ============================================================
// DESCONEXIÓN FÍSICA (evento del navegador)
// ============================================================

function _handlePhysicalDisconnect() {
    console.warn("[USB] Dispositivo USB desconectado físicamente.");
    // No cerramos flujo de inmediato: damos oportunidad de autoreconexión
    // (reinicio del ESP32 o reconexión rápida del puerto).
    _port = null;

    setTimeout(async () => {
        if (!_keepReading) return;
        const recovered = await _tryAutoReconnect();
        if (!recovered && typeof _onDisconnectCb === "function") {
            _onDisconnectCb();
        }
    }, 1200);
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
}

async function _ensurePortOpen() {
    if (!_port) return false;
    if (_port.readable) return true;
    try {
        await _port.open({ baudRate: USB_BAUD_RATE });
        return true;
    } catch {
        return false;
    }
}

async function _tryAutoReconnect() {
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

        const candidate = matched || ports[0];
        if (!candidate) return false;

        _port = candidate;
        _lastPortInfo = _port.getInfo?.() ?? _lastPortInfo;
        _port.removeEventListener("disconnect", _handlePhysicalDisconnect);
        _port.addEventListener("disconnect", _handlePhysicalDisconnect);

        if (!_port.readable) {
            await _port.open({ baudRate: USB_BAUD_RATE });
        }

        console.log("[USB] Reconexión automática completada.");
        return true;
    } catch {
        return false;
    }
}
