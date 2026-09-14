# Alpine E-Bike Fleet Tracker

Edge-first GPS/BLE fleet tracking and geofencing for e-bike rentals in alpine terrain
(initial focus: Sestriere / Via Lattea, Piedmont, Italy). Geofencing and lock decisions run
locally on-device against a trail-corridor polygon, with store-and-forward reporting once
connectivity returns — built for cellular dead zones and GPS canopy loss that generic
urban bike-share tracking doesn't handle.

See [`docs/project-brief.md`](docs/project-brief.md) for the full concept, hardware BOM,
connectivity architecture, compliance requirements, and business/funding context.

## Repository layout

```
firmware/bike-unit/   ESP32 firmware: GPS + local geofence evaluation + servo lock + OLED + Wi-Fi reporting
backend/server/       Local report-ingest server (Node.js/Express) the bike unit reports to
mobile/               Placeholder for the Flutter rider/operator app (not started yet)
docs/                 Project brief and reference material
```

## Current milestone: ESP32 proof-of-concept

Per the brief's "current prototype starting point": ESP32 reads GPS over UART, evaluates a
trail-corridor geofence polygon locally in firmware, drives a servo as the lock stand-in,
shows status on an OLED, and reports over Wi-Fi to a simple local server — buffering reports
locally when Wi-Fi is unavailable and flushing them on reconnect.

Status: firmware and backend scaffolding implemented; **not yet flashed/tested on real
hardware** in this session. See each subproject's README for build/run/wiring instructions
and what's left to verify on the bench.

## Getting started

- Firmware: [`firmware/bike-unit/README.md`](firmware/bike-unit/README.md)
- Backend: [`backend/server/README.md`](backend/server/README.md)
