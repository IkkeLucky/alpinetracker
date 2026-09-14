export type LatLng = [lat: number, lon: number];

// Same placeholder trail-corridor polygon as firmware/bike-unit/src/geofence.cpp
// (rough box around Sestriere / Via Lattea) — kept in sync by hand for now.
// Replace both copies with real surveyed coordinates before a real pilot, and
// see GeofenceEditor for the tool that will eventually generate this from a
// drawn shape instead of a hand-maintained literal.
export const DEFAULT_GEOFENCE: LatLng[] = [
  [44.965, 6.865],
  [44.968, 6.885],
  [44.96, 6.9],
  [44.945, 6.895],
  [44.94, 6.87],
  [44.95, 6.86],
];

export const GEOFENCE_CENTER: LatLng = [44.9558, 6.8789];

// Ray-casting point-in-polygon test, same algorithm as the firmware's
// isInsideGeofence() so the dashboard's notion of "inside" matches the
// on-device decision exactly.
export function isInsideGeofence(point: LatLng, polygon: LatLng[]): boolean {
  const [lat, lon] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];

    const edgeStraddlesLat = latI > lat !== latJ > lat;
    if (!edgeStraddlesLat) continue;

    const lonAtLat = lonI + ((lat - latI) * (lonJ - lonI)) / (latJ - latI);
    if (lon < lonAtLat) {
      inside = !inside;
    }
  }
  return inside;
}
