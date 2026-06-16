#include <Arduino.h>

static const int PIN_BOMBA = 26;
static const int PIN_LED = 2;

// Ajustes de tu relevador:
// - BOMBA_ACTIVE_HIGH: true si IN del relevador se activa con HIGH.
// - BOMBA_CONTACTO_NC: false para energizar el relé solo cuando la bomba está ON.
static const bool BOMBA_ACTIVE_HIGH = false;
static const bool BOMBA_CONTACTO_NC = false;

static const unsigned long OFF_MS = 5000;
static const unsigned long ON_MS = 3000;

void writePump(bool pumpOn) {
  const bool relayEnergized = BOMBA_CONTACTO_NC ? !pumpOn : pumpOn;
  const int activeLevel = BOMBA_ACTIVE_HIGH ? HIGH : LOW;
  const int inactiveLevel = BOMBA_ACTIVE_HIGH ? LOW : HIGH;
  digitalWrite(PIN_BOMBA, relayEnergized ? activeLevel : inactiveLevel);
  digitalWrite(PIN_LED, pumpOn ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  delay(800);

  pinMode(PIN_BOMBA, OUTPUT);
  pinMode(PIN_LED, OUTPUT);

  writePump(false);

  Serial.println();
  Serial.println("======================================");
  Serial.println("  OASYS - TEST BOMBA / RELEVADOR");
  Serial.println("======================================");
  Serial.println("GPIO bomba: 26");
  Serial.println("Modo: rele solo activo cuando bomba ON");
  Serial.println("Relevador: activo en LOW");
  Serial.println("Ciclo: 5s apagada, 3s encendida");
  Serial.println();
}

void loop() {
  Serial.println("[TEST] Bomba APAGADA - rele desenergizado");
  writePump(false);
  delay(OFF_MS);

  Serial.println("[TEST] Bomba ENCENDIDA - rele energizado");
  writePump(true);
  delay(ON_MS);
}
