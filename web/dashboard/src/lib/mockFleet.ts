import type { DeviceReportRow } from './supabase';
import { GEOFENCE_CENTER, isInsideGeofence, DEFAULT_GEOFENCE } from './geofence';

const MOCK_DEVICE_IDS = ['bike-001', 'bike-002', 'bike-003'];

type MockState = { lat: number; lon: number };

const state = new Map<string, MockState>(
  MOCK_DEVICE_IDS.map((id, i) => [
    id,
    {
      lat: GEOFENCE_CENTER[0] + (i - 1) * 0.006,
      lon: GEOFENCE_CENTER[1] + (i - 1) * 0.004,
    },
  ]),
);

// Small random walk per tick so the fleet map has something moving to look
// at before Supabase is wired up. Not physically meaningful — just enough
// drift to occasionally cross the geofence boundary and demonstrate the
// inside/outside + lock-state UI.
export function stepMockFleet(): DeviceReportRow[] {
  const now = new Date().toISOString();
  return MOCK_DEVICE_IDS.map((deviceId) => {
    const s = state.get(deviceId)!;
    s.lat += (Math.random() - 0.5) * 0.0015;
    s.lon += (Math.random() - 0.5) * 0.0015;

    const inside = isInsideGeofence([s.lat, s.lon], DEFAULT_GEOFENCE);
    return {
      device_id: deviceId,
      reported_at: now,
      lat: s.lat,
      lon: s.lon,
      inside_geofence: inside,
      locked: !inside,
      satellites: 6 + Math.floor(Math.random() * 4),
      battery: 60 + Math.floor(Math.random() * 40),
    };
  });
}
