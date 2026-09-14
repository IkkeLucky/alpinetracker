#pragma once

// ---- Wiring (ESP32 "Super Kit" dev board) ----------------------------
// GPS module (u-blox NEO-6M class) on UART2
#define GPS_RX_PIN 16  // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN 17  // ESP32 TX2 -> GPS RX
#define GPS_BAUD 9600

// SG90 servo standing in for the motorized lock actuator
#define SERVO_PIN 13
#define SERVO_ANGLE_LOCKED 0
#define SERVO_ANGLE_UNLOCKED 90

// SSD1306 128x64 OLED over I2C (default ESP32 pins)
#define OLED_SDA_PIN 21
#define OLED_SCL_PIN 22
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_I2C_ADDRESS 0x3C

// Buzzer, chirps once on every lock-state change
#define BUZZER_PIN 25

// ---- Wi-Fi / Supabase credentials --------------------------------------
// WIFI_SSID, WIFI_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY, DEVICE_ID live
// in secrets.h (gitignored) rather than here, so real credentials never end
// up committed. Copy secrets.example.h to secrets.h and fill it in.
// The production device will use LTE-M/NB-IoT instead of Wi-Fi, per the
// connectivity architecture in docs/project-brief.md.
#include "secrets.h"

#define SUPABASE_REPORTS_ENDPOINT SUPABASE_URL "/rest/v1/reports"

// ---- Timing --------------------------------------------------------
#define GPS_READ_TIMEOUT_MS 1000    // how long to poll GPS UART per loop
#define REPORT_INTERVAL_MS 5000     // capture + buffer a report this often
#define FLUSH_INTERVAL_MS 10000     // attempt to flush the buffer this often
#define WIFI_CONNECT_TIMEOUT_MS 8000

// ---- Store-and-forward buffer ---------------------------------------
// Ring buffer capacity while offline. At one report per REPORT_INTERVAL_MS
// (5s default) this is ~5 minutes of buffered history before oldest points
// are dropped to make room for new ones — plenty for bench testing; a real
// dead-zone deployment needs a much larger capacity (or SPIFFS spillover).
#define REPORT_BUFFER_CAPACITY 64
