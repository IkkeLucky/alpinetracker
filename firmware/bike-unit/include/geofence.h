#pragma once

struct GeoPoint {
  double lat;
  double lon;
};

// Ray-casting point-in-polygon test against the trail-corridor polygon
// below. This is the on-device geofence check called from the main loop —
// no network round-trip needed, which is the point: it has to keep working
// through cellular gaps and GPS canopy loss.
bool isInsideGeofence(double lat, double lon);
