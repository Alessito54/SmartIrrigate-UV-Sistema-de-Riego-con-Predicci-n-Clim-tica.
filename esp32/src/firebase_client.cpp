#include "firebase_client.h"
#include "config.h"
#include "wifi_manager.h"
#include "actuators.h"

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ── Estado interno ──────────────────────────────────────────
static FirebaseData _fbData;
static FirebaseAuth _fbAuth;
static FirebaseConfig _fbConfig;

static String _invId  = "";
static String _secId  = "";
static String _chipId = "";

static bool _ready = false;

static unsigned long _lastHeartbeat   = 0;
static unsigned long _lastPoll        = 0;
static unsigned long _lastSerialReport = 0;

// ── Helpers ─────────────────────────────────────────────────
static String _sectionPath() {
    return "invernaderos/" + _invId + "/secciones/" + _secId;
}

static String _moduloPath() {
    return "modulos/" + _chipId;
}

// ── Inicialización ──────────────────────────────────────────
bool firebaseInit(const String& invId, const String& secId) {
    _chipId = getChipId();

    // Usar IDs proporcionados, o los guardados, o los por defecto
    _invId = invId.length() > 0 ? invId : wifiGetSavedInvId();
    _secId = secId.length() > 0 ? secId : wifiGetSavedSecId();

    if (_invId.length() == 0 || _secId.length() == 0) {
        Serial.println("[FB] Sin invernadero/sección configurados. Esperando vinculación...");
        Serial.println("{\"status\":\"needs_link\",\"chipId\":\"" + _chipId + "\"}");
        // No retornamos false — Firebase se inicializa de todos modos
        // para poder recibir la vinculación más tarde
    }

    // Configurar Firebase
    _fbConfig.api_key = FIREBASE_API_KEY;
    _fbConfig.database_url = FIREBASE_HOST;

    // Autenticación anónima (sign-up anónimo)
    // Para el ESP32 usamos acceso directo con las reglas de módulos
    _fbAuth.user.email = "";
    _fbAuth.user.password = "";

    // Token callback
    _fbConfig.token_status_callback = tokenStatusCallback;

    // Iniciar Firebase
    Firebase.begin(&_fbConfig, &_fbAuth);
    Firebase.reconnectNetwork(true);

    // Configurar timeout
    _fbData.setBSSLBufferSize(2048, 1024);
    _fbData.setResponseSize(1024);

    _ready = true;

    Serial.println("[FB] Firebase inicializado");
    Serial.println("[FB] ChipID: " + _chipId);
    if (_invId.length() > 0) {
        Serial.println("[FB] Invernadero: " + _invId);
        Serial.println("[FB] Sección: " + _secId);
        Serial.println("[FB] Ruta: " + _sectionPath());
    }

    return true;
}

// ── Estado ──────────────────────────────────────────────────
bool firebaseIsReady() {
    return _ready && Firebase.ready();
}

// ── Polling de control ──────────────────────────────────────
void firebasePollControl() {
    if (!firebaseIsReady()) return;
    if (_invId.length() == 0 || _secId.length() == 0) return;

    unsigned long now = millis();
    if (now - _lastPoll < FIREBASE_POLL_INTERVAL_MS) return;
    _lastPoll = now;

    String basePath = _sectionPath() + "/control";

    // Leer riego
    if (Firebase.RTDB.getBool(&_fbData, basePath + "/riego")) {
        bool riego = _fbData.boolData();
        setBomba(riego);
    } else {
        Serial.println("[FB] Error leyendo riego: " + _fbData.errorReason());
    }

    // Leer malla
    if (Firebase.RTDB.getBool(&_fbData, basePath + "/malla")) {
        bool malla = _fbData.boolData();
        setMalla(malla);
    } else {
        Serial.println("[FB] Error leyendo malla: " + _fbData.errorReason());
    }
}

// ── Heartbeat ───────────────────────────────────────────────
void firebaseSendHeartbeat() {
    if (!firebaseIsReady()) return;

    unsigned long now = millis();
    if (now - _lastHeartbeat < HEARTBEAT_INTERVAL_MS) return;
    _lastHeartbeat = now;

    String path = _moduloPath();

    // Enviar timestamp (millis desde epoch no disponible, usamos server timestamp)
    if (Firebase.RTDB.setTimestamp(&_fbData, path + "/timestamp")) {
        // OK
    } else {
        Serial.println("[FB] Error heartbeat: " + _fbData.errorReason());
    }

    // Enviar IP
    Firebase.RTDB.setString(&_fbData, path + "/ip", wifiGetIP());

    // Enviar invernaderoId si está configurado
    if (_invId.length() > 0) {
        Firebase.RTDB.setString(&_fbData, path + "/invernaderoId", _invId);
    }
}

// ── Reporte serial ──────────────────────────────────────────
void firebaseSerialReport() {
    unsigned long now = millis();
    if (now - _lastSerialReport < SERIAL_REPORT_INTERVAL_MS) return;
    _lastSerialReport = now;

    String json = "{\"monitor\":\"status\",\"payload\":{";
    json += "\"wifi\":" + String(wifiIsConnected() ? "true" : "false");
    json += ",\"ssid\":\"" + wifiGetSSID() + "\"";
    json += ",\"ip\":\"" + wifiGetIP() + "\"";
    json += ",\"chipId\":\"" + _chipId + "\"";
    json += ",\"firebase\":" + String(firebaseIsReady() ? "true" : "false");
    json += ",\"bomba\":" + String(getBombaState() ? "true" : "false");
    json += ",\"malla\":" + String(getMallaState() ? "true" : "false");
    json += ",\"invId\":\"" + _invId + "\"";
    json += ",\"secId\":\"" + _secId + "\"";
    json += ",\"uptime\":" + String(millis() / 1000);
    json += "}}";

    Serial.println(json);
}

// ── Getters ─────────────────────────────────────────────────
String firebaseGetInvId() {
    return _invId;
}

String firebaseGetSecId() {
    return _secId;
}
