import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import '../lib/leafletIconFix';
import DrawControl from '../components/DrawControl';
import { DEFAULT_GEOFENCE, GEOFENCE_CENTER, type LatLng } from '../lib/geofence';
import { supabase, isSupabaseConfigured, type GeofenceRow } from '../lib/supabase';

const GEOFENCE_ID = 'sestriere-via-lattea';

export default function GeofenceEditor() {
  const [polygon, setPolygon] = useState<LatLng[]>(DEFAULT_GEOFENCE);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  // Bumped after a fresh load from Supabase so DrawControl re-seeds its
  // layer with the loaded shape instead of the DEFAULT_GEOFENCE it mounted
  // with (DrawControl intentionally ignores polygon prop changes otherwise).
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('geofences')
      .select('*')
      .eq('id', GEOFENCE_ID)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as GeofenceRow | null;
        if (row?.polygon?.length) {
          setPolygon(row.polygon.map(([lat, lon]) => [lat, lon]));
          setLoadKey((k) => k + 1);
        }
      });
  }, []);

  const cArraySnippet = polygon
    .map(([lat, lon]) => `    {${lat.toFixed(6)}, ${lon.toFixed(6)}},`)
    .join('\n');

  const ring = polygon.length > 0 ? [...polygon, polygon[0]] : [];
  const geoJson = JSON.stringify(
    { type: 'Polygon', coordinates: [ring.map(([lat, lon]) => [lon, lat])] },
    null,
    2,
  );

  async function handleSave() {
    if (!supabase) {
      setSaveStatus('No Supabase project configured yet — copy a snippet below instead.');
      return;
    }
    const { error } = await supabase
      .from('geofences')
      .upsert(
        { id: GEOFENCE_ID, name: 'Sestriere / Via Lattea', polygon },
        { onConflict: 'id' },
      );
    setSaveStatus(error ? `Save failed: ${error.message}` : 'Saved to Supabase.');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Geofence editor</h2>
        <span className={`badge badge-${isSupabaseConfigured ? 'supabase' : 'mock'}`}>
          {isSupabaseConfigured ? 'live: Supabase' : 'not connected — export manually'}
        </span>
      </div>

      <p className="hint">
        Draw or edit the trail-corridor polygon on the map, then save it. Once Supabase is
        configured this writes straight to the <code>geofences</code> table; until then, copy the
        generated firmware snippet by hand into{' '}
        <code>firmware/bike-unit/src/geofence.cpp</code>.
      </p>

      <MapContainer center={GEOFENCE_CENTER} zoom={13} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl key={loadKey} initialPolygon={polygon} onChange={setPolygon} />
      </MapContainer>

      <div className="editor-actions">
        <button onClick={handleSave}>Save geofence</button>
        {saveStatus && <span className="save-status">{saveStatus}</span>}
      </div>

      <div className="export-grid">
        <div>
          <h3>Firmware C array</h3>
          <pre>{`static const GeoPoint kGeofencePolygon[] = {\n${cArraySnippet}\n};`}</pre>
        </div>
        <div>
          <h3>GeoJSON</h3>
          <pre>{geoJson}</pre>
        </div>
      </div>
    </div>
  );
}
