#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

// ── Inicialización ──────────────────────────────────────────
// Intenta conectar con credenciales guardadas.
// Retorna true si se conectó, false si necesita configuración serial.
bool wifiInit();

// ── Estado ──────────────────────────────────────────────────
bool wifiIsConnected();
String wifiGetSSID();
String wifiGetIP();

// ── Conexión manual ─────────────────────────────────────────
bool wifiConnect(const String& ssid, const String& password);

// ── Escaneo de redes ────────────────────────────────────────
String wifiScan();  // Retorna JSON array de redes

// ── Gestión de credenciales (Preferences/NVS) ───────────────
void wifiSaveCredentials(const String& ssid, const String& password);
bool wifiHasSavedCredentials();
void wifiForgetCredentials();
String wifiGetSavedSSID();

// ── Gestión de IDs de invernadero ───────────────────────────
void wifiSaveInvernaderoConfig(const String& invId, const String& secId, const String& userId);
String wifiGetSavedInvId();
String wifiGetSavedSecId();
String wifiGetSavedUserId();

// ── Chip ID del ESP32 ───────────────────────────────────────
String getChipId();

#endif // WIFI_MANAGER_H
