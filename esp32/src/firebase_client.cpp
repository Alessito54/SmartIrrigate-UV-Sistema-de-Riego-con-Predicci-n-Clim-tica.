#include "firebase_client.h"
#include "config.h"
#include "wifi_manager.h"
#include "actuators.h"
#include "sensors.h"

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
static bool _safeStateAppliedForBoot = false;
static bool _historyReady = false;
static bool _trackedBombaState = false;
static bool _trackedRiegoOwnedByWeb = false;
static unsigned long _trackedRiegoStartMs = 0;
static String _trackedRiegoMode = "manual";

static unsigned long _lastHeartbeat   = 0;
static unsigned long _lastPoll        = 0;
static unsigned long _lastSerialReport = 0;

// ── Helpers ─────────────────────────────────────────────────
static String _sectionPath() {
    return "invernaderos/" + _invId + "/secciones/" + _secId;
}

static String _invernaderoPath() {
    return "invernaderos/" + _invId;
}

static String _moduloPath() {
    return "modulos/" + _chipId;
}

static bool _getBoolOr(const String& path, bool fallback) {
    if (Firebase.RTDB.getBool(&_fbData, path)) {
        return _fbData.boolData();
    }
    Serial.println("[FB] No pude leer bool " + path + ": " + _fbData.errorReason());
    return fallback;
}

static float _getFloatOr(const String& path, float fallback) {
    if (Firebase.RTDB.getFloat(&_fbData, path)) {
        return _fbData.floatData();
    }
    if (Firebase.RTDB.getInt(&_fbData, path)) {
        return _fbData.intData();
    }
    return fallback;
}

static String _getStringOr(const String& path, const String& fallback) {
    if (Firebase.RTDB.getString(&_fbData, path)) {
        return _fbData.stringData();
    }
    return fallback;
}

static void _trackRiegoHistory(bool nextState, const String& mode) {
    if (_invId.length() == 0 || _secId.length() == 0 || !firebaseIsReady()) return;

    if (!_historyReady) {
        _trackedBombaState = getBombaState();
        if (_trackedBombaState) {
            _trackedRiegoStartMs = millis();
            _trackedRiegoMode = mode;
        }
        _historyReady = true;
    }

    if (nextState == _trackedBombaState) return;

    String sectionPath = _sectionPath();
    float litrosHora = _getFloatOr(sectionPath + "/configuracionBomba/litrosHora", DEFAULT_BOMBA_LITROS_HORA);
    if (litrosHora <= 0) litrosHora = DEFAULT_BOMBA_LITROS_HORA;

    if (nextState) {
        _trackedRiegoStartMs = millis();
        _trackedRiegoMode = mode;

        String estadoPath = sectionPath + "/estadoRiego";
        String existingOrigin = _getStringOr(estadoPath + "/origen", "");
        existingOrigin.trim();
        _trackedRiegoOwnedByWeb = existingOrigin == "web";
        if (_trackedRiegoOwnedByWeb) {
            Serial.println("[FB] Riego manual iniciado por web; ESP32 no duplicara historial.");
            _trackedBombaState = nextState;
            return;
        }

        Firebase.RTDB.setBool(&_fbData, estadoPath + "/activo", true);
        Firebase.RTDB.setString(&_fbData, estadoPath + "/modo", mode);
        Firebase.RTDB.setString(&_fbData, estadoPath + "/origen", "esp32");
        Firebase.RTDB.setFloat(&_fbData, estadoPath + "/litrosHora", litrosHora);
        Firebase.RTDB.setInt(&_fbData, estadoPath + "/inicioMs", _trackedRiegoStartMs);
        Firebase.RTDB.setTimestamp(&_fbData, estadoPath + "/inicioTs");
        Serial.println("[FB] Historial riego iniciado: " + estadoPath);
    } else {
        if (_trackedRiegoOwnedByWeb) {
            _trackedRiegoOwnedByWeb = false;
            _trackedBombaState = nextState;
            Serial.println("[FB] Riego manual cerrado por web; ESP32 no duplicara historial.");
            return;
        }

        unsigned long elapsedMs = millis() - _trackedRiegoStartMs;
        int duracionSeg = max(1, (int)((elapsedMs + 500) / 1000));
        float litros = (litrosHora / 3600.0) * duracionSeg;

        FirebaseJson json;
        json.set("duracion_seg", duracionSeg);
        json.set("litros", litros);
        json.set("litrosHora", litrosHora);
        json.set("modo", _trackedRiegoMode);
        json.set("tipo", _trackedRiegoMode);
        json.set("origen", "esp32");
        json.set("inicioMs", (int)_trackedRiegoStartMs);
        json.set("finMs", (int)millis());

        String historyPath = sectionPath + "/historial_riego";
        if (Firebase.RTDB.pushJSON(&_fbData, historyPath, &json)) {
            String key = _fbData.pushName();
            Firebase.RTDB.setTimestamp(&_fbData, historyPath + "/" + key + "/finTs");
            Firebase.RTDB.setBool(&_fbData, sectionPath + "/estadoRiego/activo", false);
            Serial.println("[FB] Historial riego guardado: " + historyPath + "/" + key);
        } else {
            Serial.println("[FB] No pude guardar historial riego: " + _fbData.errorReason());
        }
    }

    _trackedBombaState = nextState;
}

static void _applySafeControlState() {
    if (_safeStateAppliedForBoot || _invId.length() == 0 || _secId.length() == 0) return;

    setBomba(false);
    setMalla(false);

    _safeStateAppliedForBoot = true;
    Serial.println("[FB] Estado seguro local aplicado: bomba/malla apagadas hasta leer Firebase");
}

static bool _resolveLinkedInvernadero() {
    if (!firebaseIsReady()) return false;

    String invLinkPath = _moduloPath() + "/invernaderoId";
    String secLinkPath = _moduloPath() + "/seccionId";
    Serial.println("[FB] Buscando vinculacion en: " + invLinkPath + " y " + secLinkPath);

    bool invOk = Firebase.RTDB.getString(&_fbData, invLinkPath);
    String linkedInvId = invOk ? _fbData.stringData() : "";
    if (!invOk) {
        Serial.println("[FB] No pude leer invernadero en " + invLinkPath + ": " + _fbData.errorReason());
    }

    bool secOk = Firebase.RTDB.getString(&_fbData, secLinkPath);
    String linkedSecId = secOk ? _fbData.stringData() : "";
    if (!secOk) {
        Serial.println("[FB] No pude leer seccion en " + secLinkPath + ": " + _fbData.errorReason());
    }

    if (invOk && secOk) {
        linkedInvId.trim();
        linkedSecId.trim();

        if (linkedInvId.length() > 0 && linkedInvId != "null"
            && linkedSecId.length() > 0 && linkedSecId != "null") {
            if (linkedInvId != _invId || linkedSecId != _secId) {
                _invId = linkedInvId;
                _secId = linkedSecId;
                _historyReady = false;
                wifiSaveInvernaderoConfig(_invId, _secId, wifiGetSavedUserId());
                Serial.println("[FB] Vinculación detectada: " + _sectionPath());
            }
            _applySafeControlState();
            return true;
        }

        if (_invId.length() > 0 || _secId.length() > 0) {
            _invId = "";
            _secId = "";
            _safeStateAppliedForBoot = false;
            _historyReady = false;
            wifiSaveInvernaderoConfig(_invId, _secId, wifiGetSavedUserId());
            Serial.println("[FB] Módulo sin sección vinculada.");
        }
    } else {
        String savedInvId = wifiGetSavedInvId();
        String savedSecId = wifiGetSavedSecId();
        savedInvId.trim();
        savedSecId.trim();

        if (savedInvId.length() > 0 && savedInvId != "null"
            && savedSecId.length() > 0 && savedSecId != "null") {
            if (savedInvId != _invId || savedSecId != _secId) {
                _invId = savedInvId;
                _secId = savedSecId;
                _historyReady = false;
                Serial.println("[FB] Usando sección guardada por configuración WiFi: " + _sectionPath());
            }
            _applySafeControlState();
            return true;
        }

        return false;
    }

    return false;
}

// ── Inicialización ──────────────────────────────────────────
bool firebaseInit(const String& invId, const String& secId) {
    _chipId = getChipId();
    _safeStateAppliedForBoot = false;

    // La fuente de verdad de la vinculación es Firebase:
    // modulos/{chipId}/invernaderoId + modulos/{chipId}/seccionId.
    // No usamos NVS como fuente primaria para evitar rutas viejas si se
    // reasigna desde la web.
    _invId = invId;
    _secId = secId;

    if (_invId.length() == 0 || _secId.length() == 0) {
        Serial.println("[FB] Sin sección configurada. Esperando vinculación...");
        Serial.println("{\"status\":\"needs_link\",\"chipId\":\"" + _chipId + "\"}");
        // No retornamos false — Firebase se inicializa de todos modos
        // para poder recibir la vinculación más tarde
    }

    // Configurar Firebase
    _fbConfig.api_key = FIREBASE_API_KEY;
    _fbConfig.database_url = FIREBASE_HOST;

    // El ESP32 usa rutas RTDB públicas/controladas por reglas:
    // - lee modulos/{chipId}/invernaderoId + seccionId y control
    // - escribe sensores/heartbeat
    // No inicia sesión como usuario de la app web.
    _fbConfig.signer.test_mode = true;

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
        if (_secId.length() > 0) Serial.println("[FB] Sección: " + _secId);
        if (_secId.length() > 0) Serial.println("[FB] Ruta control: " + _sectionPath());
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

    unsigned long now = millis();
    if (now - _lastPoll < FIREBASE_POLL_INTERVAL_MS) return;
    _lastPoll = now;

    if (!_resolveLinkedInvernadero()) return;

    String sectionPath = _sectionPath();
    String controlPath = sectionPath + "/control";
    String autoPath = sectionPath + "/controlAutomatico";
    Serial.println("[FB] Leyendo control desde: " + controlPath);
    Serial.println("[FB] Ruta riego: " + controlPath + "/riego");
    bool automatico = _getBoolOr(autoPath + "/activo", false);

    if (!automatico) {
        // Modo manual: leer ordenes directas de la app.
        bool riego = _getBoolOr(controlPath + "/riego", getBombaState());
        bool malla = _getBoolOr(controlPath + "/malla", getMallaState());
        Serial.println("[FB] Control manual: riego=" + String(riego ? "true" : "false") + ", malla=" + String(malla ? "true" : "false"));
        _trackRiegoHistory(riego, "manual");
        setBomba(riego);
        setMalla(malla);
        return;
    }

    // Modo automatico minimo: sensores locales + umbrales del invernadero.
    bool accionRiego = _getBoolOr(autoPath + "/acciones/riego/bajoHumedad", true);
    bool accionMallaTemp = _getBoolOr(autoPath + "/acciones/malla/altaTemperatura", true);
    bool accionMallaRad = _getBoolOr(autoPath + "/acciones/malla/altaRadiacion", false);

    float humedadMin = _getFloatOr(autoPath + "/umbrales/humedad/min", 40.0);
    float tempMax = _getFloatOr(autoPath + "/umbrales/temperatura/max", 35.0);
    float radiacionMax = _getFloatOr(autoPath + "/umbrales/radiacion/max", 900.0);
    float radiacion = _getFloatOr(sectionPath + "/sensores/radiacion", 0.0);

    bool riegoAuto = accionRiego && getHumedadSuelo() > 0.0 && getHumedadSuelo() < humedadMin;
    bool mallaAuto = (accionMallaTemp && getTemperaturaAire() > tempMax)
                  || (accionMallaRad && radiacion > radiacionMax);

    _trackRiegoHistory(riegoAuto, "automatico");
    setBomba(riegoAuto);
    setMalla(mallaAuto);
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
    if (!Firebase.RTDB.setString(&_fbData, path + "/ip", wifiGetIP())) {
        Serial.println("[FB] Error IP: " + _fbData.errorReason());
    }

    if (!Firebase.RTDB.setBool(&_fbData, path + "/online", true)) {
        Serial.println("[FB] Error online: " + _fbData.errorReason());
    }

    if (_invId.length() == 0 || _secId.length() == 0) {
        _resolveLinkedInvernadero();
    }
}

// ── Envío de Sensores ───────────────────────────────────────
void firebaseSendSensors(float tempAire, float humAire, float tempSuelo, float humSuelo) {
    if (!firebaseIsReady()) return;
    if (!_resolveLinkedInvernadero()) return;

    static unsigned long _lastSensorSend = 0;
    unsigned long now = millis();
    
    if (now - _lastSensorSend < FIREBASE_SENSOR_INTERVAL_MS) return;
    _lastSensorSend = now;

    String basePath = _sectionPath() + "/sensores";

    // Enviar variables a la sección vinculada
    Firebase.RTDB.setFloat(&_fbData, basePath + "/temperatura", tempAire);
    Firebase.RTDB.setFloat(&_fbData, basePath + "/humedadAmbiente", humAire);

    Firebase.RTDB.setFloat(&_fbData, basePath + "/temperaturasuelo", tempSuelo);
    Firebase.RTDB.setFloat(&_fbData, basePath + "/humedad", humSuelo);
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
    json += ",\"temperatura\":" + String(getTemperaturaAire());
    json += ",\"humedadAmbiente\":" + String(getHumedadAire());
    json += ",\"temperaturasuelo\":" + String(getTemperaturaSuelo());
    json += ",\"humedad\":" + String(getHumedadSuelo());
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
