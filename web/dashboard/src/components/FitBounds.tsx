import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLng } from '../lib/geofence';

// Recenters/refits the map whenever the polygon actually changes (not on
// every render) — lets the fleet map follow wherever the geofence
// currently is instead of staying centered on the Sestriere placeholder.
export default function FitBounds({ polygon }: { polygon: LatLng[] }) {
  const map = useMap();
  const lastFitted = useRef<string | null>(null);

  useEffect(() => {
    if (polygon.length < 3) return;
    const key = JSON.stringify(polygon);
    if (key === lastFitted.current) return;
    lastFitted.current = key;
    map.fitBounds(polygon, { padding: [24, 24] });
  }, [map, polygon]);

  return null;
}
