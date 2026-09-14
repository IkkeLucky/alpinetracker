import { useEffect, useState } from 'react';
import { supabase, type GeofenceRow } from './supabase';
import { DEFAULT_GEOFENCE, type LatLng } from './geofence';

export const GEOFENCE_ID = 'sestriere-via-lattea';

// Module-level cache, outside React state: FleetMap and GeofenceEditor each
// mount this hook independently, and switching between them previously
// unmounted/remounted whichever page you left, resetting it back to
// DEFAULT_GEOFENCE and re-fetching from scratch — a visible flash of the
// wrong polygon on every tab switch, worse on slow connections. Caching the
// last-loaded row here means every mount after the first paints the real
// polygon immediately, with no fetch and no flash.
let cachedPolygon: LatLng[] | null = null;
let cachedUpdatedAt: string | null = null;

// The one geofence row, live-updated from Supabase (falls back to the
// placeholder polygon with no Supabase configured). Shared by the fleet map
// (so it draws whatever's actually saved, not a hardcoded polygon) and the
// geofence editor (as the value it seeds its drawing layer from).
export function useGeofencePolygon(): {
  polygon: LatLng[];
  updatedAt: string | null;
  loaded: boolean;
} {
  const [polygon, setPolygon] = useState<LatLng[]>(cachedPolygon ?? DEFAULT_GEOFENCE);
  const [updatedAt, setUpdatedAt] = useState<string | null>(cachedUpdatedAt);
  const [loaded, setLoaded] = useState(!supabase || cachedPolygon !== null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const applyRow = (row: GeofenceRow | null) => {
      if (!row?.polygon?.length) return;
      const mapped = row.polygon.map(([lat, lon]): LatLng => [lat, lon]);
      cachedPolygon = mapped;
      cachedUpdatedAt = row.updated_at;
      setPolygon(mapped);
      setUpdatedAt(row.updated_at);
      setLoaded(true);
    };

    client
      .from('geofences')
      .select('*')
      .eq('id', GEOFENCE_ID)
      .maybeSingle()
      .then(
        ({ data }) => applyRow(data as GeofenceRow | null),
        (err: unknown) => console.error('Failed to load geofence from Supabase', err),
      );

    const channel = client
      .channel('geofences-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'geofences', filter: `id=eq.${GEOFENCE_ID}` },
        (payload) => applyRow(payload.new as GeofenceRow),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { polygon, updatedAt, loaded };
}
