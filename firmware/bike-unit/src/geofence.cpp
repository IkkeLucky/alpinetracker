#include "geofence.h"

// Current bench-test geofence (Turin, ~45.0703 N, 7.6855 E) — drawn in the
// web dashboard's geofence editor and copied here by hand for now (see the
// "known gaps" note in web/dashboard/README.md: the firmware doesn't fetch
// this from Supabase, so a dashboard edit needs a re-copy + reflash to take
// effect on the device). Not the real Sestriere/Via Lattea trail corridor —
// swap in the real survey once past bench testing.
static const GeoPoint kGeofencePolygon[] = {
    {45.067253, 7.666277},
    {45.079739, 7.674688},
    {45.078933, 7.692773},
    {45.067435, 7.703098},
    {45.058341, 7.690481},
};
static const int kGeofencePolygonSize =
    sizeof(kGeofencePolygon) / sizeof(kGeofencePolygon[0]);

// Standard ray-casting (PNPOLY) point-in-polygon test: count how many
// polygon edges a horizontal ray from (lat, lon) to +infinity longitude
// crosses. Odd crossings => inside.
bool isInsideGeofence(double lat, double lon) {
  bool inside = false;
  for (int i = 0, j = kGeofencePolygonSize - 1; i < kGeofencePolygonSize; j = i++) {
    double latI = kGeofencePolygon[i].lat, lonI = kGeofencePolygon[i].lon;
    double latJ = kGeofencePolygon[j].lat, lonJ = kGeofencePolygon[j].lon;

    bool edgeStraddlesLat = (latI > lat) != (latJ > lat);
    if (!edgeStraddlesLat) continue;

    double lonAtLat = lonI + (lat - latI) * (lonJ - lonI) / (latJ - latI);
    if (lon < lonAtLat) {
      inside = !inside;
    }
  }
  return inside;
}
