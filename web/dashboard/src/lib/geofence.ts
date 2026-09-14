export type LatLng = [lat: number, lon: number];

// Fallback used only when Supabase isn't configured (see useGeofencePolygon)
// — same current bench-test polygon as firmware/bike-unit/src/geofence.cpp
// (Turin), kept in sync by hand for now. Once Supabase is wired up this is
// never shown; the real polygon comes from the `geofences` table instead.
export const DEFAULT_GEOFENCE: LatLng[] = [
  [45.067253, 7.666277],
  [45.079739, 7.674688],
  [45.078933, 7.692773],
  [45.067435, 7.703098],
  [45.058341, 7.690481],
];

export const GEOFENCE_CENTER: LatLng = [45.0703, 7.6855];

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
