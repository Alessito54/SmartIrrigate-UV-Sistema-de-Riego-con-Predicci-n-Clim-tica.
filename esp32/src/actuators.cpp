#include "actuators.h"
#include "config.h"

// ── Estado interno ──────────────────────────────────────────
static bool _bombaState      = false;
static bool _mallaState      = false;  // true = abierta, false = cerrada
static bool _mallaMoving     = false;
static unsigned long _mallaStartTime = 0;
static bool _mallaTargetOpen = false;

// ── Inicialización ──────────────────────────────────────────
void actuatorsInit() {
    // Configurar pines como salida
    pinMode(PIN_BOMBA, OUTPUT);
    pinMode(PIN_MALLA_ABRIR, OUTPUT);
    pinMode(PIN_MALLA_CERRAR, OUTPUT);
    pinMode(PIN_LED_STATUS, OUTPUT);

    // Estado inicial: todo apagado
    digitalWrite(PIN_BOMBA, BOMBA_ACTIVE_HIGH ? LOW : HIGH);
    digitalWrite(PIN_MALLA_ABRIR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
    digitalWrite(PIN_MALLA_CERRAR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
    digitalWrite(PIN_LED_STATUS, LOW);

    _bombaState  = false;
    _mallaState  = false;
    _mallaMoving = false;

    Serial.println("[ACT] Actuadores inicializados");
}

// ── Bomba de agua ───────────────────────────────────────────
void setBomba(bool on) {
    // Evitar comandos redundantes
    if (on == _bombaState) return;

    _bombaState = on;

    if (on) {
        digitalWrite(PIN_BOMBA, BOMBA_ACTIVE_HIGH ? HIGH : LOW);
        Serial.println("[ACT] Bomba ENCENDIDA");
    } else {
        digitalWrite(PIN_BOMBA, BOMBA_ACTIVE_HIGH ? LOW : HIGH);
        Serial.println("[ACT] Bomba APAGADA");
    }
}

bool getBombaState() {
    return _bombaState;
}

// ── Malla sombra ────────────────────────────────────────────
void setMalla(bool open) {
    // Evitar comandos redundantes
    if (open == _mallaState && !_mallaMoving) return;

    // Si ya se está moviendo hacia el mismo destino, ignorar
    if (_mallaMoving && _mallaTargetOpen == open) return;

    // Detener movimiento actual si lo hay
    if (_mallaMoving) {
        digitalWrite(PIN_MALLA_ABRIR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
        digitalWrite(PIN_MALLA_CERRAR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
    }

    _mallaTargetOpen = open;
    _mallaMoving     = true;
    _mallaStartTime  = millis();

    if (open) {
        // Activar motor dirección "abrir"
        digitalWrite(PIN_MALLA_ABRIR, MALLA_ACTIVE_HIGH ? HIGH : LOW);
        digitalWrite(PIN_MALLA_CERRAR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
        Serial.println("[ACT] Malla ABRIENDO...");
    } else {
        // Activar motor dirección "cerrar"
        digitalWrite(PIN_MALLA_ABRIR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
        digitalWrite(PIN_MALLA_CERRAR, MALLA_ACTIVE_HIGH ? HIGH : LOW);
        Serial.println("[ACT] Malla CERRANDO...");
    }
}

bool getMallaState() {
    return _mallaState;
}

// ── Actualización (llamar en loop) ──────────────────────────
void actuatorsUpdate() {
    // Manejar temporización del motor de la malla
    if (_mallaMoving) {
        if (millis() - _mallaStartTime >= MALLA_ACTUACION_MS) {
            // Detener motor
            digitalWrite(PIN_MALLA_ABRIR, MALLA_ACTIVE_HIGH ? LOW : HIGH);
            digitalWrite(PIN_MALLA_CERRAR, MALLA_ACTIVE_HIGH ? LOW : HIGH);

            _mallaState  = _mallaTargetOpen;
            _mallaMoving = false;

            Serial.println(_mallaState
                ? "[ACT] Malla ABIERTA (motor detenido)"
                : "[ACT] Malla CERRADA (motor detenido)");
        }
    }

    // LED de estado: parpadea si hay actividad
    static unsigned long lastBlink = 0;
    if (_bombaState || _mallaMoving) {
        if (millis() - lastBlink >= 500) {
            lastBlink = millis();
            digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
        }
    } else {
        // LED fijo si todo está en reposo
        digitalWrite(PIN_LED_STATUS, LOW);
    }
}
