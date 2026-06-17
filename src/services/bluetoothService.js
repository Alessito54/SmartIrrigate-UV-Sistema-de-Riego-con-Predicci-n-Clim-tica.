/**
 * bluetoothService.js
 * ============================================================
 * Servicio Web Bluetooth API para conectar con módulos OASYS.
 *
 * Requisitos:
 *   - Chrome 56+ / Edge 79+ / Android Chrome
 *   - HTTPS o localhost (Secure Context obligatorio)
 *
 * UUIDs deben coincidir exactamente con bluetooth_manager.h en el OASYS.
 * ============================================================
 */

// UUIDs del servicio GATT (deben coincidir con bluetooth_manager.h)
const SERVICE_UUID     = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_CONFIG_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // WRITE
const CHAR_STATUS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9"; // NOTIFY

// Estado interno
let _device        = null;
let _server        = null;
let _charConfig    = null;
let _charStatus    = null;
let _statusCb      = null;   // callback de listenForStatus, se re-registra al reconectar
let _onDisconnectCb = null;  // callback externo cuando se pierde el dispositivo definitivamente
let _reconnecting  = false;
let _intentionalDisconnect = false;

// ============================================================
// DETECCIÓN DE SOPORTE
// ============================================================

export function isBluetoothSupported() {
    if (typeof navigator === "undefined") return false;
    if (typeof window !== "undefined" && !window.isSecureContext) return false;
    return "bluetooth" in navigator;
}

export function getBluetoothUnavailableReason() {
    if (typeof navigator === "undefined") return "Entorno no compatible.";
    if (typeof window !== "undefined" && !window.isSecureContext) {
        return "La app debe abrirse en HTTPS para usar Bluetooth. Asegúrate de usar https:// en la URL.";
    }
    if (!("bluetooth" in navigator)) {
        return "Tu navegador no soporta Bluetooth. Usa Chrome o Edge en desktop/Android.";
    }
    return null;
}

// ============================================================
// ESTADO
// ============================================================

export function isConnected() {
    return _server !== null && _server.connected;
}

export function getDeviceName() {
    return _device?.name ?? null;
}

// ============================================================
// CONEXIÓN
// ============================================================

export async function connectToOASYS(onDisconnect = null) {
    if (!isBluetoothSupported()) {
        throw new Error(getBluetoothUnavailableReason() ?? "Bluetooth no disponible.");
    }

    _intentionalDisconnect = false;
    _onDisconnectCb = onDisconnect;

    // Solicitar dispositivo al usuario
    _device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "OASYS-" }],
        optionalServices: [SERVICE_UUID],
    });

    // Escuchar desconexiones GATT
    _device.addEventListener("gattserverdisconnected", _handleGattDisconnected);

    // Conectar y obtener características
    await _connectGatt();

    console.log(`[BLE] Conectado a: ${_device.name}`);
    return _device.name;
}

// ============================================================
// CONEXIÓN GATT INTERNA (reutilizable para reconexión)
// ============================================================

async function _connectGatt() {
    _server = await _device.gatt.connect();
    const service = await _server.getPrimaryService(SERVICE_UUID);
    _charConfig   = await service.getCharacteristic(CHAR_CONFIG_UUID);
    _charStatus   = await service.getCharacteristic(CHAR_STATUS_UUID);

    // Re-registrar el listener de estado si ya había uno activo
    if (_statusCb) {
        await _charStatus.startNotifications();
        _charStatus.addEventListener("characteristicvaluechanged", _onCharValueChanged);
        console.log("[BLE] Notificaciones re-registradas tras reconexión");
    }
}

// ============================================================
// MANEJO DE DESCONEXIÓN GATT + RECONEXIÓN AUTOMÁTICA
// ============================================================

async function _handleGattDisconnected() {
    if (_intentionalDisconnect) return; // el usuario desconectó manualmente

    console.warn("[BLE] GATT desconectado. Intentando reconectar...");
    _server     = null;
    _charConfig = null;
    _charStatus = null;

    if (_reconnecting) return;
    _reconnecting = true;

    const MAX_INTENTOS = 5;
    const DELAY_MS = [1000, 2000, 3000, 4000, 5000]; // backoff progresivo

    for (let i = 0; i < MAX_INTENTOS; i++) {
        await new Promise((r) => setTimeout(r, DELAY_MS[i] ?? 5000));

        if (_intentionalDisconnect) break; // el usuario desconectó mientras reintentaba

        try {
            console.log(`[BLE] Intento de reconexión ${i + 1}/${MAX_INTENTOS}...`);
            await _connectGatt();
            console.log("[BLE] ✅ Reconexión exitosa");
            _reconnecting = false;
            return;
        } catch (err) {
            console.warn(`[BLE] Intento ${i + 1} fallido:`, err.message);
        }
    }

    // Agotados los intentos
    _reconnecting = false;
    console.error("[BLE] ❌ No se pudo reconectar al dispositivo BLE.");

    if (typeof _onDisconnectCb === "function") {
        _onDisconnectCb();
    }

    _cleanupState();
}

// ============================================================
// ENVIAR CONFIGURACIÓN
// ============================================================

export async function sendWiFiConfig(ssid, password, invernaderoId, userId, seccionId = "") {
    await _ensureConnected();
    const payload = JSON.stringify({ ssid, password, invernaderoId, seccionId, userId });
    const encoder = new TextEncoder();
    console.log(`[BLE] Enviando config: ${payload}`);
    await _charConfig.writeValueWithoutResponse(encoder.encode(payload));

    // Marcar como desconexion intencional AHORA que la config fue enviada.
    // El OASYS va a cortar BLE para conectar WiFi — no queremos que la app
    // intente reconectar porque eso causa el loop infinito.
    console.log("[BLE] Config enviada — esperando que OASYS corte BLE para conectar WiFi");
    _intentionalDisconnect = true;
}

// Garantiza que estamos conectados antes de escribir (reintenta si no)
async function _ensureConnected() {
    if (!_device) throw new Error("No hay dispositivo BLE seleccionado.");
    if (_charConfig && _server?.connected) return;

    // Reconexión bajo demanda
    console.log("[BLE] Reconectando antes de enviar...");
    try {
        await _connectGatt();
    } catch (err) {
        throw new Error(`GATT Server is disconnected. (Re)connect first: ${err.message}`);
    }
}

// ============================================================
// ESCUCHAR NOTIFICACIONES DE ESTADO
// ============================================================

let _bleBuffer = "";

function _onCharValueChanged(event) {
    try {
        const chunk = new TextDecoder().decode(event.target.value);
        _bleBuffer += chunk;

        // Detectar JSON completo contando llaves balanceadas
        let depth = 0;
        let jsonStart = -1;

        for (let i = 0; i < _bleBuffer.length; i++) {
            if (_bleBuffer[i] === "{") {
                if (depth === 0) jsonStart = i;
                depth++;
            } else if (_bleBuffer[i] === "}") {
                depth--;
                if (depth === 0 && jsonStart !== -1) {
                    const jsonStr = _bleBuffer.substring(jsonStart, i + 1);
                    _bleBuffer = _bleBuffer.substring(i + 1);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        console.log("[BLE] Estado recibido:", parsed);
                        if (typeof _statusCb === "function") _statusCb(parsed);
                    } catch (parseErr) {
                        console.warn("[BLE] JSON inválido recibido:", jsonStr);
                    }
                    i = -1;
                    depth = 0;
                    jsonStart = -1;
                }
            }
        }
    } catch (err) {
        console.error("[BLE] Error procesando notificación:", err);
    }
}

export async function listenForStatus(callback) {
    if (!_charStatus) throw new Error("No hay dispositivo BLE conectado.");

    _statusCb  = callback;
    _bleBuffer = "";

    await _charStatus.startNotifications();
    _charStatus.addEventListener("characteristicvaluechanged", _onCharValueChanged);
}

// ============================================================
// DESCONECTAR (intencional)
// ============================================================

export async function disconnect() {
    _intentionalDisconnect = true;
    _reconnecting = false;

    try {
        if (_charStatus) {
            _charStatus.removeEventListener("characteristicvaluechanged", _onCharValueChanged);
            await _charStatus.stopNotifications().catch(() => {});
        }
        if (_server?.connected) _server.disconnect();
    } catch (err) {
        console.warn("[BLE] Error al desconectar:", err);
    } finally {
        _cleanupState();
    }
    console.log("[BLE] Desconectado por el usuario.");
}

// ============================================================
// LIMPIEZA INTERNA
// ============================================================

function _cleanupState() {
    _server     = null;
    _charConfig = null;
    _charStatus = null;
    _statusCb   = null;
    _bleBuffer  = "";
    // _device se mantiene por si el usuario quiere re-intentar
}
