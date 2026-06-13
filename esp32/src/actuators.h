#ifndef ACTUATORS_H
#define ACTUATORS_H

#include <Arduino.h>

// ── Inicialización ──────────────────────────────────────────
void actuatorsInit();

// ── Bomba de agua ───────────────────────────────────────────
void setBomba(bool on);
bool getBombaState();

// ── Malla sombra ────────────────────────────────────────────
void setMalla(bool open);
bool getMallaState();

// ── Actualización (llamar en loop para manejar tiempos) ─────
void actuatorsUpdate();

#endif // ACTUATORS_H
