// ============================================================
//  OASYS ESP32 — main.cpp
//  Sistema de Riego con Predicción Climática
//  -------------------------------------------------------
//  Punto de entrada principal del firmware.
//  Flujo:
//    1. Iniciar serial
//    2. Iniciar actuadores
//    3. Intentar conectar WiFi (si falla → modo serial)
//    4. Iniciar Firebase
//    5. Loop: procesar serial + polling Firebase + heartbeat
// ============================================================

#include <Arduino.h>
#include <ArduinoJson.h>
#include <esp_system.h>

#include "config.h"
#include "wifi_manager.h"
#include "actuators.h"
#include "firebase_client.h"
#include "sensors.h"

// ── Estado global ───────────────────────────────────────────
static bool _wifiConfigured = false;
static bool _firebaseStarted = false;

// ── Prototipos ──────────────────────────────────────────────
void processSerialCommand(const String& line);
void handleSerialConfig(JsonDocument& doc);
bool processSerialAvailable();
void printStatusJson();

// ============================================================
//  SETUP
// ============================================================
void setup() {
    // 1. Serial
    Serial.begin(SERIAL_BAUD_RATE);
    delay(500);
    Serial.println();
    Serial.println("============================================");
    Serial.println("  OASYS — Sistema de Riego Inteligente");
    Serial.println("  Expo Ciencia UV");
    Serial.println("============================================");
    Serial.println("[SYS] Chip ID: " + getChipId());
    Serial.println("[SYS] Reset reason: " + String((int)esp_reset_reason()));
    Serial.println("[SYS] Iniciando...");

    // 2. Actuadores y Sensores
    actuatorsInit();
    sensorsInit();

    // 3. WiFi
    _wifiConfigured = wifiInit();

    if (_wifiConfigured) {
        // 4. Firebase
        firebaseInit();
        _firebaseStarted = true;
    } else {
        Serial.println("[SYS] Esperando configuración WiFi por serial...");
        Serial.println("[SYS] Envía JSON: {\"ssid\":\"...\",\"password\":\"...\"}");
    }
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
    // ── Procesar comandos serial ────────────────────────────
    processSerialAvailable();

    // ── Si WiFi está conectado pero Firebase no arrancó ─────
    if (_wifiConfigured && !_firebaseStarted && wifiIsConnected()) {
        firebaseInit();
        _firebaseStarted = true;
    }

    // ── Reconexión WiFi ─────────────────────────────────────
    if (_wifiConfigured && !wifiIsConnected()) {
        static unsigned long lastReconnect = 0;
        if (millis() - lastReconnect > WIFI_RETRY_INTERVAL_MS * 10) {
            lastReconnect = millis();
            Serial.println("[SYS] WiFi perdido. Reintentando...");
            // WiFi.reconnect() ya está habilitado en wifiInit
        }
    }

    // ── Firebase: polling, heartbeat y sensores ─────────────
    if (_firebaseStarted && wifiIsConnected()) {
        if (processSerialAvailable()) {
            actuatorsUpdate();
            return;
        }

        firebasePollControl();
        if (processSerialAvailable()) {
            actuatorsUpdate();
            return;
        }

        firebaseSendHeartbeat();
        if (processSerialAvailable()) {
            actuatorsUpdate();
            return;
        }

        static unsigned long lastSensorRead = 0;
        if (millis() - lastSensorRead >= FIREBASE_SENSOR_INTERVAL_MS) {
            lastSensorRead = millis();
            
            float tempA, humA;
            readSHT31(tempA, humA);
            
            float tempS, humS;
            readSHT10(tempS, humS);
            
            firebaseSendSensors(tempA, humA, tempS, humS);
        }

        firebaseSerialReport();
    }

    // ── Actualizar actuadores (temporización malla) ─────────
    actuatorsUpdate();
}

// ============================================================
//  Procesamiento de comandos serial
// ============================================================
bool processSerialAvailable() {
    if (!Serial.available()) return false;

    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
        processSerialCommand(line);
        return true;
    }

    return false;
}

void printStatusJson() {
    String json = "{\"status\":\"";
    if (!_wifiConfigured || !wifiIsConnected()) {
        json += "needs_wifi";
    } else if (!_firebaseStarted || !firebaseIsReady()) {
        json += "connecting";
    } else if (firebaseGetInvId().length() == 0 || firebaseGetSecId().length() == 0) {
        json += "needs_link";
    } else {
        json += "wifi_ok";
    }
    json += "\",\"chipId\":\"" + getChipId() + "\"";
    json += ",\"ssid\":\"" + wifiGetSSID() + "\"";
    json += ",\"ip\":\"" + wifiGetIP() + "\"";
    json += ",\"wifi\":" + String(wifiIsConnected() ? "true" : "false");
    json += ",\"firebase\":" + String(firebaseIsReady() ? "true" : "false");
    json += ",\"bomba\":" + String(getBombaState() ? "true" : "false");
    json += ",\"malla\":" + String(getMallaState() ? "true" : "false");
    json += ",\"invId\":\"" + firebaseGetInvId() + "\"";
    json += ",\"secId\":\"" + firebaseGetSecId() + "\"";
    json += ",\"resetReason\":" + String((int)esp_reset_reason());
    json += "}";
    Serial.println(json);
}

void processSerialCommand(const String& line) {
    if (line == "status") {
        printStatusJson();
        return;
    }

    if (line == "scan") {
        Serial.println("[SYS] Escaneando redes WiFi...");
        String result = wifiScan();
        Serial.println(result);
        return;
    }

    // Intentar parsear como JSON
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, line);

    if (err) {
        // No es JSON — eco simple
        Serial.println("[SERIAL] Recibido (no-JSON): " + line);
        return;
    }

    // ── Comandos del usbService.js ──────────────────────────

    // Comando: status
    if (doc["command"] == "status") {
        printStatusJson();
        return;
    }

    // Comando: scan (redes WiFi)
    if (doc["command"] == "scan") {
        Serial.println("[SYS] Escaneando redes WiFi...");
        String result = wifiScan();
        Serial.println(result);
        return;
    }

    // Comando: change_wifi (reiniciar configuración WiFi)
    if (doc["command"] == "change_wifi") {
        Serial.println("{\"status\":\"needs_wifi\",\"chipId\":\"" + getChipId() + "\"}");
        _wifiConfigured = false;
        _firebaseStarted = false;
        return;
    }

    // Comando: forget_wifi (borrar credenciales y reiniciar)
    if (doc["command"] == "forget_wifi") {
        wifiForgetCredentials();
        Serial.println("{\"status\":\"needs_wifi\",\"chipId\":\"" + getChipId() + "\"}");
        delay(500);
        ESP.restart();
        return;
    }

    // ── Configuración WiFi (desde Vinculación) ──────────────
    if (!doc["ssid"].isNull()) {
        handleSerialConfig(doc);
        return;
    }

    // ── Comando desconocido ─────────────────────────────────
    Serial.println("[SERIAL] Comando no reconocido: " + line);
}

// ============================================================
//  Configuración WiFi recibida por serial
// ============================================================
void handleSerialConfig(JsonDocument& doc) {
    String ssid     = doc["ssid"].as<String>();
    String password = doc["password"] | "";
    String invId    = doc["invernaderoId"] | "";
    String secId    = doc["seccionId"] | "";
    String userId   = doc["userId"] | "";

    Serial.println("[CFG] Configurando WiFi: " + ssid);

    // Guardar IDs si vienen
    if (invId.length() > 0) {
        wifiSaveInvernaderoConfig(invId, secId, userId);
    }

    // Conectar al WiFi
    bool connected = wifiConnect(ssid, password);

    if (connected) {
        _wifiConfigured = true;

        // Iniciar Firebase si no estaba
        if (!_firebaseStarted) {
            firebaseInit(invId, secId);
            _firebaseStarted = true;
        }
    }
}
