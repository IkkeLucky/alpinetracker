#include "geofence.h"

// PLACEHOLDER trail-corridor polygon around Sestriere / Via Lattea
// (center approx. 44.9558 N, 6.8789 E). These vertices are hand-picked to
// roughly bound the resort for bench testing only — replace with the
// actual surveyed trail-corridor polygon before any real pilot.
static const GeoPoint kGeofencePolygon[] = {
    {44.9650, 6.8650},
    {44.9680, 6.8850},
    {44.9600, 6.9000},
    {44.9450, 6.8950},
    {44.9400, 6.8700},
    {44.9500, 6.8600},
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
