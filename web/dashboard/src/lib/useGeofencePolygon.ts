import { useEffect, useState } from 'react';
import { supabase, type GeofenceRow } from './supabase';
import { DEFAULT_GEOFENCE, type LatLng } from './geofence';

export const GEOFENCE_ID = 'sestriere-via-lattea';

// The one geofence row, live-updated from Supabase (falls back to the
// placeholder Sestriere polygon with no Supabase configured). Shared by the
// fleet map (so it draws whatever's actually saved, not a hardcoded
// polygon) and the geofence editor (as the value it seeds its drawing layer
// from).
export function useGeofencePolygon(): { polygon: LatLng[]; updatedAt: string | null } {
  const [polygon, setPolygon] = useState<LatLng[]>(DEFAULT_GEOFENCE);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const applyRow = (row: GeofenceRow | null) => {
      if (!row?.polygon?.length) return;
      setPolygon(row.polygon.map(([lat, lon]) => [lat, lon]));
      setUpdatedAt(row.updated_at);
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

  return { polygon, updatedAt };
}
