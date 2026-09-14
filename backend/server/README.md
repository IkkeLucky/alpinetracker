# alpinetracker-server

Minimal local ingest server for the bike-unit prototype. Accepts geofence/lock status reports
over HTTP and stores them in an append-only log, so it can absorb the batched backlog a bike
unit uploads after reconnecting from a dead zone.

This is intentionally a throwaway bench-test server, not the event-sourced production backend
described in the project brief — good enough to watch the ESP32 prototype report real data
while wiring things up on a breadboard.

## Run it

```sh
npm install
npm start        # listens on :3000 (override with PORT=xxxx)
```

## API

- `GET /health` — liveness check.
- `POST /api/reports` — body is a single report object, or an array of reports (for batched
  store-and-forward uploads). Each report:

  ```json
  {
    "deviceId": "bike-001",
    "timestamp": "2026-09-14T10:00:00.000Z",
    "lat": 45.0,
    "lon": 6.9,
    "insideGeofence": true,
    "locked": false,
    "satellites": 7,
    "battery": 87
  }
  ```

  `deviceId`, `timestamp`, `lat`, `lon`, `insideGeofence`, `locked` are required; `satellites`
  and `battery` are optional passthrough fields. Returns `201` if every report was accepted,
  `207` if some were rejected (see `rejected` in the response body for per-item errors).

- `GET /api/devices` — latest known report for every device.
- `GET /api/devices/:deviceId` — latest known report for one device (`404` if unseen).

## Test

```sh
npm test
```
