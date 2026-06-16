#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>
#include <Preferences.h>
#include <esp_wifi.h>
#include <esp_system.h>

// ── Estado interno ──────────────────────────────────────────
static Preferences _prefs;
static String _currentSSID = "";

static String jsonEscape(const String& value) {
    String escaped = "";
    escaped.reserve(value.length() + 8);

    for (size_t i = 0; i < value.length(); i++) {
        char c = value.charAt(i);
        switch (c) {
            case '\\': escaped += "\\\\"; break;
            case '"':  escaped += "\\\""; break;
            case '\b': escaped += "\\b"; break;
            case '\f': escaped += "\\f"; break;
            case '\n': escaped += "\\n"; break;
            case '\r': escaped += "\\r"; break;
            case '\t': escaped += "\\t"; break;
            default:
                if ((uint8_t)c < 0x20) {
                    escaped += " ";
                } else {
                    escaped += c;
                }
                break;
        }
    }

    return escaped;
}

// ── Chip ID ─────────────────────────────────────────────────
String getChipId() {
    uint64_t mac = ESP.getEfuseMac();
    char chipId[20];
    snprintf(chipId, sizeof(chipId), "INV_%012llX", mac);
    return String(chipId);
}

// ── Inicialización ──────────────────────────────────────────
bool wifiInit() {
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
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

    WiFi.disconnect(false);
    delay(200);
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.setAutoReconnect(true);
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

// ── Escaneo de redes ──────────────────────────────────────
String wifiScan() {
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.setTxPower(WIFI_POWER_2dBm);
    esp_wifi_set_ps(WIFI_PS_NONE);
    WiFi.scanDelete();
    delay(250);

    Serial.println("{\"scanStatus\":\"start\"}");
    Serial.println("{\"scanStatus\":\"diag\",\"resetReason\":" + String((int)esp_reset_reason()) + ",\"heap\":" + String(ESP.getFreeHeap()) + "}");
    Serial.flush();

    int n = WiFi.scanNetworks(false, false, false, 250);
    if (n <= 0) {
        Serial.println("{\"scanStatus\":\"retry_active\",\"code\":" + String(n) + "}");
        Serial.flush();
        WiFi.scanDelete();
        delay(250);
        n = WiFi.scanNetworks(false, true, false, 350);
    }

    Serial.println("{\"scanStatus\":\"done\",\"count\":" + String(n > 0 ? n : 0) + ",\"code\":" + String(n) + "}");
    Serial.flush();

    String json = "{\"scan\":[";
    if (n > 0) {
        for (int i = 0; i < n; i++) {
            if (i > 0) json += ",";
            json += "{\"ssid\":\"" + jsonEscape(WiFi.SSID(i)) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + "}";
        }
    }
    json += "],\"count\":" + String(n > 0 ? n : 0);
    if (n < 0) {
        json += ",\"error\":\"scan_failed\",\"code\":" + String(n);
    }
    json += "}";
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
