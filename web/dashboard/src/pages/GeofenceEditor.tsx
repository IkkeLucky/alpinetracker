import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import '../lib/leafletIconFix';
import DrawControl from '../components/DrawControl';
import { type LatLng } from '../lib/geofence';
import { GEOFENCE_ID, useGeofencePolygon } from '../lib/useGeofencePolygon';
import { supabase, isSupabaseConfigured, type GeofenceRow } from '../lib/supabase';

// Hardcoded prototype-only gate so a casual visitor can't reshape the fence
// by accident — this is NOT real security (it ships in the client bundle,
// visible to anyone who opens dev tools). Replace with real auth once the
// planned admin site exists.
const SAVE_CODE = 'alpinetracker';

export default function GeofenceEditor() {
  const { polygon: loadedPolygon, updatedAt: loadedUpdatedAt, loaded } = useGeofencePolygon();
  const [polygon, setPolygon] = useState<LatLng[]>(loadedPolygon);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(loadedUpdatedAt);
  // Bumped after the shared hook's first real load so DrawControl re-seeds
  // its layer with the loaded shape instead of whatever it mounted with
  // (DrawControl intentionally ignores polygon prop changes otherwise).
  const [loadKey, setLoadKey] = useState(0);
  const seededRef = useRef(loaded);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (seededRef.current || !loaded) return;
    seededRef.current = true;
    setPolygon(loadedPolygon);
    setUpdatedAt(loadedUpdatedAt);
    setLoadKey((k) => k + 1);
  }, [loaded, loadedPolygon, loadedUpdatedAt]);

  const cArraySnippet = polygon
    .map(([lat, lon]) => `    {${lat.toFixed(6)}, ${lon.toFixed(6)}},`)
    .join('\n');

  const ring = polygon.length > 0 ? [...polygon, polygon[0]] : [];
  const geoJson = JSON.stringify(
    { type: 'Polygon', coordinates: [ring.map(([lat, lon]) => [lon, lat])] },
    null,
    2,
  );

  async function saveToSupabase() {
    if (!supabase) {
      setSaveStatus('No Supabase project configured yet — copy a snippet below instead.');
      return;
    }
    // .select().single() to get the row back with the trigger-set
    // updated_at, rather than trusting a client-side clock for it.
    const { data, error } = await supabase
      .from('geofences')
      .upsert({ id: GEOFENCE_ID, name: 'Sestriere / Via Lattea', polygon }, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      setSaveStatus(`Save failed: ${error.message}`);
      return;
    }
    setUpdatedAt((data as GeofenceRow).updated_at);
    setSaveStatus('Saved to Supabase.');
  }

  function handleSaveClick() {
    setOtpValue('');
    setOtpError(null);
    setOtpOpen(true);
  }

  function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (otpValue !== SAVE_CODE) {
      setOtpError('Incorrect code.');
      return;
    }
    setOtpOpen(false);
    saveToSupabase();
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
        {updatedAt && ` Last updated ${new Date(updatedAt).toLocaleString()}.`}
      </p>

      <MapContainer center={loadedPolygon[0]} zoom={13} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl key={loadKey} initialPolygon={polygon} onChange={setPolygon} />
      </MapContainer>

      <div className="editor-actions">
        <button onClick={handleSaveClick}>Save geofence</button>
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

      {otpOpen && (
        <div className="modal-overlay" onClick={() => setOtpOpen(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleOtpSubmit}
          >
            <h3>Confirm save</h3>
            <p className="hint">Enter the prototype access code to save this geofence.</p>
            <input
              type="password"
              autoFocus
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              placeholder="Access code"
            />
            {otpError && <p className="modal-error">{otpError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setOtpOpen(false)}>
                Cancel
              </button>
              <button type="submit">Confirm</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
