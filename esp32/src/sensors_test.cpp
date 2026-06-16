#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <SHT1x-ESP.h>

#include "config.h"

static Adafruit_SHT31 sht31 = Adafruit_SHT31();
static SHT1x sht10(PIN_SHT10_DATA, PIN_SHT10_CLK);

static bool sht31Found = false;

static const unsigned long READ_INTERVAL_MS = 2000;
static unsigned long lastRead = 0;

static void printWiring() {
    Serial.println();
    Serial.println("============================================");
    Serial.println("  OASYS - Test de sensores");
    Serial.println("============================================");
    Serial.println("[PIN] SHT31 SDA -> GPIO " + String(PIN_I2C_SDA));
    Serial.println("[PIN] SHT31 SCL -> GPIO " + String(PIN_I2C_SCL));
    Serial.println("[PIN] SHT10 DATA -> GPIO " + String(PIN_SHT10_DATA));
    Serial.println("[PIN] SHT10 CLK  -> GPIO " + String(PIN_SHT10_CLK));
    Serial.println("[PIN] VCC sensores -> 3.3V");
    Serial.println("[PIN] GND sensores -> GND compartido");
    Serial.println("============================================");
    Serial.println();
}

static void scanI2C() {
    Serial.println("[I2C] Escaneando bus...");
    byte count = 0;

    for (byte address = 1; address < 127; address++) {
        Wire.beginTransmission(address);
        byte error = Wire.endTransmission();

        if (error == 0) {
            Serial.print("[I2C] Dispositivo encontrado en 0x");
            if (address < 16) Serial.print("0");
            Serial.println(address, HEX);
            count++;
        }
    }

    if (count == 0) {
        Serial.println("[I2C] No se encontraron dispositivos. Revisa SDA/SCL, VCC y GND.");
    }
}

static void initSHT31() {
    Serial.println("[SHT31] Probando direccion 0x44...");
    if (sht31.begin(0x44)) {
        sht31Found = true;
        Serial.println("[SHT31] OK en 0x44.");
        return;
    }

    Serial.println("[SHT31] No respondió en 0x44. Probando 0x45...");
    if (sht31.begin(0x45)) {
        sht31Found = true;
        Serial.println("[SHT31] OK en 0x45.");
        return;
    }

    sht31Found = false;
    Serial.println("[SHT31] No detectado. Revisa SDA=21, SCL=22, 3.3V y GND.");
}

static void readSHT31Test() {
    if (!sht31Found) {
        Serial.println("[SHT31] SKIP: sensor no detectado.");
        return;
    }

    float temp = sht31.readTemperature();
    float hum = sht31.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("[SHT31] ERROR: lectura invalida.");
        return;
    }

    Serial.println("[SHT31] Aire: " + String(temp, 2) + " C, " + String(hum, 2) + " %HR");
}

static void readSHT10Test() {
    float temp = sht10.readTemperatureC();
    float hum = sht10.readHumidity();

    if (isnan(temp) || isnan(hum) || temp < -40.0 || temp > 120.0 || hum < 0.0 || hum > 120.0) {
        Serial.println("[SHT10] ERROR: lectura invalida. Revisa DATA=18, CLK=19, 3.3V y GND.");
        return;
    }

    Serial.println("[SHT10] Suelo: " + String(temp, 2) + " C, " + String(hum, 2) + " %HR");
}

void setup() {
    Serial.begin(SERIAL_BAUD_RATE);
    delay(800);

    printWiring();

    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setClock(100000);

    scanI2C();
    initSHT31();

    Serial.println("[SHT10] Configurado. DATA=" + String(PIN_SHT10_DATA) + ", CLK=" + String(PIN_SHT10_CLK));
    Serial.println("[TEST] Lecturas cada 2 segundos.");
    Serial.println();
}

void loop() {
    unsigned long now = millis();
    if (now - lastRead < READ_INTERVAL_MS) return;
    lastRead = now;

    Serial.println("---------- lectura ----------");
    readSHT31Test();
    readSHT10Test();
}
