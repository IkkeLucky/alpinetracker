# bike-unit firmware (ESP32 proof-of-concept)

Implements the brief's "current prototype starting point": GPS over UART, geofence evaluated
locally against a trail-corridor polygon, a servo standing in for the physical lock, OLED
status, and Wi-Fi reporting straight to Supabase's REST API with store-and-forward buffering
when Wi-Fi is down.

**Status: written but not yet flashed or run on real hardware.** This code has been developed
in a cloud sandbox with no ESP32 attached and no network access to PlatformIO's package
registry, so `pio run` has never actually been executed against it. The geofence
point-in-polygon logic (`src/geofence.cpp`) was extracted and unit-checked standalone with a
native compiler since it has no Arduino dependency; everything touching `Arduino.h`, Wi-Fi,
HTTPS, the GPS/OLED/servo libraries, etc. has only been reviewed by hand. Treat this as a
solid starting point to bring up on the bench, not as verified-working code — flashing it on
your own machine (where PlatformIO can actually reach its registry) is the next real test.

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

1. `cp include/secrets.example.h include/secrets.h` and fill in:
   - `WIFI_SSID` / `WIFI_PASSWORD` — the bench Wi-Fi network.
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — from the Supabase project's Settings -> API (the
     `anon`/`public` key; never the `service_role` key). Same project the web dashboard uses —
     see `../../web/dashboard/README.md` and `../../supabase/schema.sql`.
   - `DEVICE_ID` — must have a matching row in the `devices` table (`schema.sql` seeds
     `bike-001`); `reports.device_id` is a foreign key, so an unregistered device's uploads
     will fail outright. Add a row per real unit before flashing it.
   - `secrets.h` is gitignored — real credentials never get committed. `config.h` includes it.
2. The geofence polygon in `src/geofence.cpp` is a **placeholder** rough box around Sestriere
   — replace it with real surveyed trail-corridor coordinates (or whatever's currently saved
   in Supabase via the dashboard's geofence editor) before relying on it for anything beyond a
   bench smoke test.

## Build / flash

```sh
pio run                 # build
pio run --target upload # flash over USB
pio device monitor      # serial log at 115200 baud
```

(Requires [PlatformIO](https://platformio.org/) with network access to its package registry
to pull the `espressif32` platform and the libraries in `platformio.ini`.)

## How it reports

Every `FLUSH_INTERVAL_MS` (default 10s), the device POSTs its buffered reports as a JSON array
to `{SUPABASE_URL}/rest/v1/reports` with the anon key in the `apikey`/`Authorization` headers —
PostgREST inserts the whole array as one bulk insert. That's all-or-nothing: if any row in the
batch is malformed (or the device isn't registered in `devices`), the whole flush fails and
the buffer keeps everything to retry next interval, rather than silently dropping data. TLS
certificate validation is skipped (`WiFiClientSecure::setInsecure()`) for bench simplicity —
fine for now, not for a real deployment.

## Bench checklist (not yet done)

- [ ] Confirm `pio run` builds cleanly against the actual toolchain
- [ ] Verify GPS module gets a fix outdoors (NEO-6M-class modules generally won't fix indoors)
- [ ] Confirm the OLED shows live lat/lon/satellite count and updates the lock state
- [ ] Walk/drive across the placeholder geofence boundary and confirm the servo moves and the
      buzzer chirps at the transition
- [ ] Confirm reports land in Supabase (`select * from reports order by reported_at desc` in
      the SQL editor, or watch them show up live on the web dashboard's fleet map)
- [ ] Kill Wi-Fi mid-run, confirm the OLED's "Buffered: N" count climbs, restore Wi-Fi, confirm
      the backlog flushes and `Buffered` drops back to 0
