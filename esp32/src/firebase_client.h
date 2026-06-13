#ifndef FIREBASE_CLIENT_H
#define FIREBASE_CLIENT_H

#include <Arduino.h>

// ── Inicialización ──────────────────────────────────────────
// Configura Firebase con los IDs proporcionados.
// Si invId/secId están vacíos, usa los guardados en NVS.
bool firebaseInit(const String& invId = "", const String& secId = "");

// ── Estado ──────────────────────────────────────────────────
bool firebaseIsReady();

// ── Polling de control ──────────────────────────────────────
// Lee los valores de control (riego, malla) desde Firebase
// y ejecuta las acciones correspondientes en los actuadores.
void firebasePollControl();

// ── Heartbeat ───────────────────────────────────────────────
// Envía timestamp al nodo modulos/{chipId}/timestamp
void firebaseSendHeartbeat();

// ── Reporte serial ──────────────────────────────────────────
// Envía el estado actual como JSON por serial (para el monitor web)
void firebaseSerialReport();

// ── Obtener IDs activos ─────────────────────────────────────
String firebaseGetInvId();
String firebaseGetSecId();

#endif // FIREBASE_CLIENT_H
