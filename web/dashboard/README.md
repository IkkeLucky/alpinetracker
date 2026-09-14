# alpinetracker-dashboard

Operator-facing web app: a live fleet map and a geofence editor for drawing/editing the
trail-corridor polygon the bike units enforce. React + Vite + Leaflet, backed by Supabase.

Works with **no backend configured at all** — without Supabase env vars it falls back to a
random-walk mock fleet and lets you export a drawn geofence by hand, so there's something to
look at from the first `npm run dev`.

## Run it

```sh
npm install
npm run dev
```

Map tiles come from the public OpenStreetMap tile servers, so you'll need normal internet
access in whatever environment you run this in (they won't load in a sandboxed CI/agent
container with a restrictive egress allowlist — everything else still works, just without the
basemap imagery).

## Wiring up Supabase (optional but recommended)

1. Create a free project at [supabase.com](https://supabase.com) — pick an EU region (e.g.
   Frankfurt) since this handles riders' location data and GDPR is in scope per the project
   brief.
2. In the SQL editor, run `../../supabase/schema.sql` (from the repo root) — creates
   `devices`, `reports`, `geofences`, enables realtime on `reports`, and seeds the placeholder
   Sestriere geofence.
3. Project Settings -> API: copy the Project URL and the `anon` `public` key (**not**
   `service_role`, which must never end up in browser-shipped code).
4. `cp .env.example .env.local` and fill in `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`.
   (Named `PUBLIC_` rather than Vite's usual `VITE_` prefix — Vercel's dashboard rejects env
   var names starting with `VITE_`, so `vite.config.ts` sets `envPrefix: 'PUBLIC_'` instead.
   Set the same two names, same way, in Vercel's Project Settings -> Environment Variables for
   the deployed site — tick both Production and Preview.)
5. Restart `npm run dev`. The fleet map's badge switches from "demo data" to "live: Supabase",
   and the geofence editor loads/saves the real polygon instead of just exporting snippets.

Once this is wired up, the ESP32 firmware reports directly to Supabase's REST endpoint
(`POST {url}/rest/v1/reports` with the anon key) — see `firmware/bike-unit/README.md`.

## What's here

- `src/pages/FleetMap.tsx` — live map + table of the fleet's last-known position, geofence
  status, and lock state.
- `src/pages/GeofenceEditor.tsx` — draw/edit the trail-corridor polygon ([Geoman](https://geoman.io/)),
  save to Supabase behind a save-code prompt, and/or copy a ready-to-paste firmware C array or
  GeoJSON.
- `src/lib/geofence.ts` — the same point-in-polygon check as the firmware
  (`firmware/bike-unit/src/geofence.cpp`), kept in sync by hand so "inside the zone" means the
  same thing in both places.
- `src/lib/useGeofencePolygon.ts` — the current geofence, live from Supabase (realtime
  subscription) with a module-level cache so switching between Fleet map and Geofence editor
  doesn't re-fetch or flash back to the fallback polygon. Shared by both pages.
- `src/lib/mockFleet.ts` / `useFleetReports.ts` — the no-Supabase fallback and the
  Supabase-backed live data hook.

## Known gaps

- The RLS policies in `supabase/schema.sql` are wide open (anon key can read/write everything)
  — fine for a private bench project, not for anything with real riders. Tighten before a pilot.
- The firmware's geofence polygon and the dashboard/Supabase one are two independent copies
  right now; nothing pushes an edited geofence back down to a device. Fine for the current
  single-hardcoded-device prototype, but worth revisiting once there's more than one bike unit.
- The "Save geofence" access code (hardcoded `alpinetracker` in `GeofenceEditor.tsx`) is **not
  real security** — it ships in the client bundle, readable by anyone who opens dev tools. It
  only stops a casual visitor from reshaping the fence by accident. Replace with real auth
  (the planned admin site) before this matters for anything but a private prototype.
