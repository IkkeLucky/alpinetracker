// Alpine E-Bike Fleet Tracker — bike-unit proof-of-concept firmware.
//
// Reads GPS over UART, evaluates the trail-corridor geofence locally
// on-device (see geofence.cpp), drives a servo as the physical-lock
// stand-in, shows live status on an OLED, and reports over Wi-Fi directly
// to Supabase's REST API (PostgREST) — buffering reports locally
// (report_buffer.h) whenever Wi-Fi is down and flushing the backlog once
// it's back, which is the store-and-forward behavior the real
// cellular/LoRaWAN device needs for dead zones.
//
// NOT YET FLASHED/TESTED ON HARDWARE. See README.md for wiring and the
// bench checklist.

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <TinyGPSPlus.h>
#include <ESP32Servo.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>

#include "config.h"
#include "geofence.h"
#include "report_buffer.h"

static HardwareSerial gpsSerial(2);
static TinyGPSPlus gps;
static Servo lockServo;
static Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
static ReportBuffer reportBuffer(REPORT_BUFFER_CAPACITY);

static bool currentlyLocked = true;  // fail-safe: locked until proven inside the geofence
static bool hasEverHadFix = false;
static unsigned long lastReportMillis = 0;
static unsigned long lastFlushMillis = 0;
static unsigned long lastWifiRetryMillis = 0;

// Plain digitalWrite pulses rather than tone(): works with either an
// active or passive buzzer module without pulling in extra tone-generation
// dependencies, at the cost of a less musical beep.
static void beep(int pulses) {
  for (int i = 0; i < pulses; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(BUZZER_PIN, LOW);
    delay(80);
  }
}

static void setLock(bool locked) {
  if (locked == currentlyLocked) return;
  currentlyLocked = locked;
  lockServo.write(locked ? SERVO_ANGLE_LOCKED : SERVO_ANGLE_UNLOCKED);
  beep(locked ? 2 : 1);
}

static bool connectWiFi(unsigned long timeoutMs) {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(200);
  }
  return WiFi.status() == WL_CONNECTED;
}

// Formats the current UTC time as ISO 8601. Until NTP has synced (only
// possible once Wi-Fi has connected at least once), this reads as an
// epoch-adjacent placeholder timestamp rather than wall-clock time — that's
// expected on a bench without connectivity and is fine for local testing.
static void getIsoTimestamp(char *out, size_t len) {
  time_t now;
  time(&now);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  strftime(out, len, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
}

static void captureAndBufferReport() {
  if (!gps.location.isValid()) return;

  double lat = gps.location.lat();
  double lon = gps.location.lng();
  bool inside = isInsideGeofence(lat, lon);
  hasEverHadFix = true;

  // Core geofence/lock decision, made entirely on-device: leaving the
  // trail corridor engages the lock, no network round-trip required.
  setLock(!inside);

  Report report;
  strncpy(report.deviceId, DEVICE_ID, sizeof(report.deviceId) - 1);
  report.deviceId[sizeof(report.deviceId) - 1] = '\0';
  getIsoTimestamp(report.timestamp, sizeof(report.timestamp));
  report.lat = lat;
  report.lon = lon;
  report.insideGeofence = inside;
  report.locked = currentlyLocked;
  report.satellites = gps.satellites.isValid() ? gps.satellites.value() : -1;
  report.batteryPercent = -1;  // no battery ADC wired up yet on the bench kit

  reportBuffer.push(report);
}

static void tryFlushBuffer() {
  if (reportBuffer.isEmpty()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  // PostgREST bulk-inserts a JSON array as a single statement: it's all
  // rows or none, unlike the old bench server's per-item accept/reject. A
  // malformed batch (e.g. an unregistered device_id — see schema.sql) fails
  // outright and keeps retrying every FLUSH_INTERVAL_MS rather than
  // silently dropping data, which is the right failure mode here: better
  // to keep buffering (and eventually drop the *oldest* points once full)
  // than to lose a whole backlog to one bad request.
  //
  // setInsecure() skips TLS certificate validation — the connection is
  // still encrypted, but not authenticated, so this is fine for a bench
  // prototype and not something to carry into a real deployment (pin
  // Supabase's root CA with setCACert() instead).
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, SUPABASE_REPORTS_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");
  int statusCode = http.POST(reportBuffer.toJsonArray());
  http.end();

  if (statusCode == 201) {
    reportBuffer.clear();
  } else {
    Serial.printf("Supabase report flush failed, status %d\n", statusCode);
  }
}

static void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "up" : "down");

  if (!hasEverHadFix) {
    display.println("GPS: no fix yet");
  } else {
    display.print("Sat: ");
    display.println(gps.satellites.isValid() ? gps.satellites.value() : 0);
    display.print("Lat: ");
    display.println(gps.location.lat(), 5);
    display.print("Lon: ");
    display.println(gps.location.lng(), 5);
    display.println(isInsideGeofence(gps.location.lat(), gps.location.lng())
                         ? "Zone: INSIDE"
                         : "Zone: OUTSIDE");
  }

  display.print("Lock: ");
  display.println(currentlyLocked ? "LOCKED" : "unlocked");
  display.print("Buffered: ");
  display.println(reportBuffer.size());

  display.display();
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  lockServo.attach(SERVO_PIN);
  lockServo.write(SERVO_ANGLE_LOCKED);  // fail-safe starting position

  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
    Serial.println("SSD1306 init failed");
  }
  display.clearDisplay();
  display.display();

  if (connectWiFi(WIFI_CONNECT_TIMEOUT_MS)) {
    Serial.println("Wi-Fi connected");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("Wi-Fi connect failed, will retry in loop()");
  }
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  unsigned long now = millis();

  if (now - lastReportMillis >= REPORT_INTERVAL_MS) {
    lastReportMillis = now;
    captureAndBufferReport();
  }

  if (WiFi.status() != WL_CONNECTED && now - lastWifiRetryMillis >= WIFI_CONNECT_TIMEOUT_MS) {
    lastWifiRetryMillis = now;
    connectWiFi(1000);  // short non-blocking-ish retry; full attempts happen over successive loops
  }

  if (now - lastFlushMillis >= FLUSH_INTERVAL_MS) {
    lastFlushMillis = now;
    tryFlushBuffer();
  }

  updateDisplay();
}
