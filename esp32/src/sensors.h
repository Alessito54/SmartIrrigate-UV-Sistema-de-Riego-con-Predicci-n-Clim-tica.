#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// ── Inicialización ──────────────────────────────────────────
// Inicia el bus I2C y configura el sensor SHT31
void sensorsInit();

// ── Lectura ─────────────────────────────────────────────────
// Retorna true si la lectura de cada sensor fue exitosa.
bool readSHT31(float &temperatura, float &humedad);
bool readSHT10(float &temperaturaSuelo, float &humedadSuelo);

// ── Getters del último valor leído ──────────────────────────
float getTemperaturaAire();
float getHumedadAire();
float getTemperaturaSuelo();
float getHumedadSuelo();

#endif // SENSORS_H
