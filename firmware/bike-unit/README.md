# bike-unit firmware (ESP32 proof-of-concept)

Implements the brief's "current prototype starting point": GPS over UART, geofence evaluated
locally against a trail-corridor polygon, a servo standing in for the physical lock, OLED
status, and Wi-Fi reporting to the bench backend with store-and-forward buffering when Wi-Fi
is down.

**Status: written but not yet flashed or run on real hardware in this session** — this
environment has no ESP32 attached and no network access to PlatformIO's package registry
(only a small CDN allowlist is reachable here). The geofence point-in-polygon logic
(`src/geofence.cpp`) was extracted and unit-checked standalone with a native compiler since
it has no Arduino dependency; everything touching `Arduino.h`, Wi-Fi, the GPS/OLED/servo
libraries, etc. has only been reviewed by hand, not compiled. Treat this as a solid starting
point to bring up on the bench, not as verified-working code.

## Wiring (ESP32 "Super Kit" board)

| Peripheral         | ESP32 pin        |
|---------------------|------------------|
| GPS module RX       | GPIO17 (TX2)     |
| GPS module TX       | GPIO16 (RX2)     |
| Servo signal         | GPIO13           |
| OLED SDA             | GPIO21           |
| OLED SCL             | GPIO22           |
| Buzzer               | GPIO25           |

GPS module and servo need their own 5V/3.3V + GND per their datasheet — see pin assignments
and timing constants in `include/config.h`.

## Before flashing

1. Edit `include/config.h`: set `WIFI_SSID`, `WIFI_PASSWORD`, `SERVER_URL` (the bench
   machine's LAN IP running `backend/server`, not `localhost`), and `DEVICE_ID`.
2. The geofence polygon in `src/geofence.cpp` is a **placeholder** rough box around Sestriere
   — replace it with real surveyed trail-corridor coordinates before relying on it for
   anything beyond a bench smoke test.

## Build / flash

```sh
pio run                 # build
pio run --target upload # flash over USB
pio device monitor      # serial log at 115200 baud
```

(Requires [PlatformIO](https://platformio.org/) with network access to its package registry
to pull the `espressif32` platform and the libraries in `platformio.ini`.)

## Bench checklist (not yet done)

- [ ] Confirm `pio run` builds cleanly against the actual toolchain
- [ ] Verify GPS module gets a fix outdoors (NEO-6M-class modules generally won't fix indoors)
- [ ] Confirm the OLED shows live lat/lon/satellite count and updates the lock state
- [ ] Walk/drive across the placeholder geofence boundary and confirm the servo moves and the
      buzzer chirps at the transition
- [ ] Confirm reports land in the backend (`GET /api/devices/<DEVICE_ID>` on the bench server)
- [ ] Kill Wi-Fi mid-run, confirm the OLED's "Buffered: N" count climbs, restore Wi-Fi, confirm
      the backlog flushes and `Buffered` drops back to 0
