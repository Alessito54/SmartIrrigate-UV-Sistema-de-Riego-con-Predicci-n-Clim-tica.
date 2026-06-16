#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
//  OASYS ESP32 — Archivo de Configuración Central
//  -------------------------------------------------------
//  Todos los parámetros configurables del sistema están aquí.
//  NO debe haber ningún valor constante suelto en otro archivo.
// ============================================================

// ── Hardware: Pines GPIO ────────────────────────────────────
// Bomba de agua (relé)
static const int PIN_BOMBA           = 26;

// Malla sombra (motor bidireccional — 2 GPIOs)
static const int PIN_MALLA_ABRIR     = 27;
static const int PIN_MALLA_CERRAR    = 14;

// LED indicador de estado (built-in o externo)
static const int PIN_LED_STATUS      = 2;

// Sensor SHT31 (I2C)
static const int PIN_I2C_SDA         = 21;
static const int PIN_I2C_SCL         = 22;

// Sensor SHT10 (Humedad/Temperatura de suelo)
static const int PIN_SHT10_DATA      = 18;
static const int PIN_SHT10_CLK       = 19;

// ── Hardware: Lógica de actuadores ──────────────────────────
// true = relé activo en HIGH, false = relé activo en LOW (invertido)
static const bool BOMBA_ACTIVE_HIGH  = false;
static const bool MALLA_ACTIVE_HIGH  = true;
// false = el relé solo se energiza cuando la app pide encender la bomba.
static const bool BOMBA_CONTACTO_NC  = false;

// Tiempo que el motor de la malla se mantiene activo (ms)
static const unsigned long MALLA_ACTUACION_MS = 5000;

// ── Comunicación Serial ─────────────────────────────────────
static const unsigned long SERIAL_BAUD_RATE = 115200;

// ── WiFi ────────────────────────────────────────────────────
// Máximo de reintentos antes de volver a modo serial
static const int WIFI_MAX_RETRIES        = 20;
// Tiempo entre reintentos de conexión WiFi (ms)
static const unsigned long WIFI_RETRY_INTERVAL_MS = 500;
// Tiempo de timeout total para conexión WiFi (ms)
static const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;

// ── Firebase RTDB ───────────────────────────────────────────
// Credenciales en archivo separado (no se sube a Git)
// Copia secrets.example.h → secrets.h y rellena tus valores.
#include "secrets.h"

// ── Firebase: Intervalos de tiempo ──────────────────────────
// Intervalo de heartbeat al nodo modulos/{chipId}/timestamp (ms)
static const unsigned long HEARTBEAT_INTERVAL_MS      = 10000;
// Intervalo de polling para leer control desde Firebase (ms)
static const unsigned long FIREBASE_POLL_INTERVAL_MS   = 3000;
// Intervalo de reporte serial del estado (ms)
static const unsigned long SERIAL_REPORT_INTERVAL_MS   = 5000;
// Intervalo para enviar datos del sensor SHT31 a Firebase (ms)
static const unsigned long FIREBASE_SENSOR_INTERVAL_MS = 5000;

// ── Firebase: Plantillas de rutas ───────────────────────────
// Estas se construyen dinámicamente con invId + secId.
// Ruta base de control: invernaderos/{invId}/secciones/{secId}
// Sub-rutas:
//   /control/riego         → bool
//   /control/malla         → bool
//   /controlAutomatico/activo → bool

// ── EEPROM / Preferences ────────────────────────────────────
static const char* PREF_NAMESPACE    = "oasys";
static const char* PREF_KEY_SSID     = "wifi_ssid";
static const char* PREF_KEY_PASS     = "wifi_pass";
static const char* PREF_KEY_INV_ID   = "inv_id";
static const char* PREF_KEY_SEC_ID   = "sec_id";
static const char* PREF_KEY_USER_ID  = "user_id";

#endif // CONFIG_H
