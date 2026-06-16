#include "sensors.h"
#include "config.h"
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <SHT1x-ESP.h>

static Adafruit_SHT31 sht31 = Adafruit_SHT31();
static bool sht31_found = false;

static SHT1x sht10(PIN_SHT10_DATA, PIN_SHT10_CLK);

static float _lastTempAire = 0.0;
static float _lastHumAire = 0.0;
static float _lastTempSuelo = 0.0;
static float _lastHumSuelo = 0.0;

void sensorsInit() {
    Serial.println("[SNS] Inicializando bus I2C...");
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

    Serial.println("[SNS] Buscando sensor SHT31...");
    if (!sht31.begin(0x44)) {   // La dirección I2C por defecto para el SHT31 suele ser 0x44 o 0x45
        Serial.println("[SNS] Error: No se pudo encontrar el sensor SHT31.");
        sht31_found = false;
    } else {
        Serial.println("[SNS] Sensor SHT31 inicializado correctamente.");
        sht31_found = true;
    }

    Serial.println("[SNS] El sensor SHT10 está configurado en pines DATA=" + String(PIN_SHT10_DATA) + " CLK=" + String(PIN_SHT10_CLK));
}

bool readSHT31(float &temperatura, float &humedad) {
    if (!sht31_found) {
        return false;
    }

    float t = sht31.readTemperature();
    float h = sht31.readHumidity();

    if (!isnan(t) && !isnan(h)) {
        temperatura = t;
        humedad = h;
        _lastTempAire = t;
        _lastHumAire = h;
        return true;
    } else {
        Serial.println("[SNS] Error leyendo datos del SHT31.");
        return false;
    }
}

bool readSHT10(float &temperaturaSuelo, float &humedadSuelo) {
    float t = sht10.readTemperatureC();
    float h = sht10.readHumidity();

    // SHT1x-ESP devuelve números inválidos si hay error o desconexión
    // Asumiremos que valores absurdos como <-40 o >120 son error de lectura.
    if (!isnan(t) && !isnan(h) && t > -40.0 && t < 120.0) {
        temperaturaSuelo = t;
        humedadSuelo = h;
        _lastTempSuelo = t;
        _lastHumSuelo = h;
        return true;
    } else {
        Serial.println("[SNS] Error leyendo datos del SHT10.");
        return false;
    }
}

float getTemperaturaAire() {
    return _lastTempAire;
}

float getHumedadAire() {
    return _lastHumAire;
}

float getTemperaturaSuelo() {
    return _lastTempSuelo;
}

float getHumedadSuelo() {
    return _lastHumSuelo;
}
