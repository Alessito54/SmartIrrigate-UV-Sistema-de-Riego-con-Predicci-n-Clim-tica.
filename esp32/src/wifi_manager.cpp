#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>
#include <Preferences.h>

// ── Estado interno ──────────────────────────────────────────
static Preferences _prefs;
static String _currentSSID = "";

// ── Chip ID ─────────────────────────────────────────────────
String getChipId() {
    uint64_t mac = ESP.getEfuseMac();
    char chipId[20];
    snprintf(chipId, sizeof(chipId), "INV_%012llX", mac);
    return String(chipId);
}

// ── Inicialización ──────────────────────────────────────────
bool wifiInit() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);

    _prefs.begin(PREF_NAMESPACE, true);  // read-only
    String savedSSID = _prefs.getString(PREF_KEY_SSID, "");
    String savedPass = _prefs.getString(PREF_KEY_PASS, "");
    _prefs.end();

    if (savedSSID.length() == 0) {
        Serial.println("{\"status\":\"needs_wifi\",\"chipId\":\"" + getChipId() + "\"}");
        return false;
    }

    Serial.println("{\"status\":\"connecting\",\"ssid\":\"" + savedSSID + "\"}");

    WiFi.begin(savedSSID.c_str(), savedPass.c_str());

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println("{\"status\":\"needs_wifi\",\"error\":\"timeout\",\"chipId\":\"" + getChipId() + "\"}");
            return false;
        }
        delay(WIFI_RETRY_INTERVAL_MS);
        Serial.print(".");
    }
    Serial.println();

    _currentSSID = savedSSID;

    Serial.println("{\"status\":\"wifi_ok\",\"ssid\":\"" + savedSSID +
                   "\",\"ip\":\"" + WiFi.localIP().toString() +
                   "\",\"chipId\":\"" + getChipId() + "\"}");

    return true;
}

// ── Estado ──────────────────────────────────────────────────
bool wifiIsConnected() {
    return WiFi.status() == WL_CONNECTED;
}

String wifiGetSSID() {
    return _currentSSID;
}

String wifiGetIP() {
    if (WiFi.status() == WL_CONNECTED) {
        return WiFi.localIP().toString();
    }
    return "0.0.0.0";
}

// ── Conexión manual ─────────────────────────────────────────
bool wifiConnect(const String& ssid, const String& password) {
    Serial.println("{\"status\":\"connecting\",\"ssid\":\"" + ssid + "\"}");

    WiFi.disconnect(true);
    delay(200);
    WiFi.begin(ssid.c_str(), password.c_str());

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println("{\"status\":\"error\",\"error\":\"No se pudo conectar al WiFi (timeout)\"}");
            return false;
        }
        delay(WIFI_RETRY_INTERVAL_MS);
        Serial.print(".");
    }
    Serial.println();

    _currentSSID = ssid;

    // Guardar credenciales para próximo arranque
    wifiSaveCredentials(ssid, password);

    Serial.println("{\"status\":\"wifi_ok\",\"ssid\":\"" + ssid +
                   "\",\"ip\":\"" + WiFi.localIP().toString() +
                   "\",\"chipId\":\"" + getChipId() + "\"}");

    return true;
}

// ── Escaneo de redes ────────────────────────────────────────
String wifiScan() {
    int n = WiFi.scanNetworks();
    String json = "{\"scan\":[";

    for (int i = 0; i < n; i++) {
        if (i > 0) json += ",";
        json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + "}";
    }

    json += "]}";
    WiFi.scanDelete();
    return json;
}

// ── Gestión de credenciales ─────────────────────────────────
void wifiSaveCredentials(const String& ssid, const String& password) {
    _prefs.begin(PREF_NAMESPACE, false);  // read-write
    _prefs.putString(PREF_KEY_SSID, ssid);
    _prefs.putString(PREF_KEY_PASS, password);
    _prefs.end();
}

bool wifiHasSavedCredentials() {
    _prefs.begin(PREF_NAMESPACE, true);
    String ssid = _prefs.getString(PREF_KEY_SSID, "");
    _prefs.end();
    return ssid.length() > 0;
}

void wifiForgetCredentials() {
    _prefs.begin(PREF_NAMESPACE, false);
    _prefs.remove(PREF_KEY_SSID);
    _prefs.remove(PREF_KEY_PASS);
    _prefs.end();
    _currentSSID = "";
}

String wifiGetSavedSSID() {
    _prefs.begin(PREF_NAMESPACE, true);
    String ssid = _prefs.getString(PREF_KEY_SSID, "");
    _prefs.end();
    return ssid;
}

// ── Gestión de IDs ──────────────────────────────────────────
void wifiSaveInvernaderoConfig(const String& invId, const String& secId, const String& userId) {
    _prefs.begin(PREF_NAMESPACE, false);
    _prefs.putString(PREF_KEY_INV_ID, invId);
    _prefs.putString(PREF_KEY_SEC_ID, secId);
    _prefs.putString(PREF_KEY_USER_ID, userId);
    _prefs.end();
}

String wifiGetSavedInvId() {
    _prefs.begin(PREF_NAMESPACE, true);
    String val = _prefs.getString(PREF_KEY_INV_ID, DEFAULT_INVERNADERO_ID);
    _prefs.end();
    return val;
}

String wifiGetSavedSecId() {
    _prefs.begin(PREF_NAMESPACE, true);
    String val = _prefs.getString(PREF_KEY_SEC_ID, DEFAULT_SECCION_ID);
    _prefs.end();
    return val;
}

String wifiGetSavedUserId() {
    _prefs.begin(PREF_NAMESPACE, true);
    String val = _prefs.getString(PREF_KEY_USER_ID, "");
    _prefs.end();
    return val;
}
