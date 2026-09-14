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
firmware/bike-unit/   ESP32 firmware: GPS + local geofence evaluation + servo lock + OLED + reports to Supabase
backend/server/       Optional local report-ingest server (Node.js/Express) for offline bench testing
web/dashboard/         Operator web app: live fleet map + geofence-polygon editor (React/Leaflet/Supabase)
supabase/              SQL schema for the Supabase project the dashboard and the bike unit both talk to
mobile/               Placeholder for the Flutter rider/operator app (not started yet)
docs/                 Project brief and reference material
```

## Current milestones

**ESP32 proof-of-concept** — per the brief's "current prototype starting point": ESP32 reads
GPS over UART, evaluates a trail-corridor geofence polygon locally in firmware, drives a servo
as the lock stand-in, shows status on an OLED, and reports over Wi-Fi directly to Supabase —
buffering reports locally when Wi-Fi is unavailable and flushing the backlog on reconnect. The
throwaway `backend/server` from the very first prototype pass still works as an offline
alternative if you want to bench-test without touching Supabase.

Status: firmware written and hand-reviewed; **not yet flashed/tested on real hardware** (needs
a local machine with the ESP32 attached and PlatformIO able to reach its package registry —
see `firmware/bike-unit/README.md`).

**Operator web dashboard** — a fleet map (live positions, geofence status, lock state) and a
geofence editor that draws the trail-corridor polygon on a map and exports it as a firmware C
array, GeoJSON, or (once Supabase is configured) saves it straight to the database.

Status: running, built, and manually verified end-to-end (draw → save → export all confirmed
working). Works with mock data out of the box; wire up Supabase per `web/dashboard/README.md`
for live/persistent data.

## Getting started

- Firmware: [`firmware/bike-unit/README.md`](firmware/bike-unit/README.md)
- Bench backend: [`backend/server/README.md`](backend/server/README.md)
- Web dashboard: [`web/dashboard/README.md`](web/dashboard/README.md)
