import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import '../lib/leafletIconFix';
import { useFleetReports } from '../lib/useFleetReports';
import { useGeofencePolygon } from '../lib/useGeofencePolygon';
import { GEOFENCE_CENTER } from '../lib/geofence';
import FitBounds from '../components/FitBounds';

export default function FleetMap() {
  const { reports, source } = useFleetReports();
  const { polygon, updatedAt } = useGeofencePolygon();

  return (
    <div className="page">
      <div className="page-header">
        <h2>Fleet map</h2>
        <span className={`badge badge-${source}`}>
          {source === 'supabase' ? 'live: Supabase' : 'demo data (no Supabase configured)'}
        </span>
      </div>
      {updatedAt && (
        <p className="hint">Geofence last updated {new Date(updatedAt).toLocaleString()}</p>
      )}

      <MapContainer center={GEOFENCE_CENTER} zoom={13} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds polygon={polygon} />
        <Polygon positions={polygon} pathOptions={{ color: '#2563eb', fillOpacity: 0.08 }} />
        {reports.map((report) => (
          <Marker key={report.device_id} position={[report.lat, report.lon]}>
            <Popup>
              <strong>{report.device_id}</strong>
              <br />
              {report.inside_geofence ? 'Inside geofence' : 'Outside geofence'} &middot;{' '}
              {report.locked ? 'locked' : 'unlocked'}
              <br />
              sats: {report.satellites ?? '—'} · battery: {report.battery ?? '—'}%
              <br />
              <small>{new Date(report.reported_at).toLocaleTimeString()}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="table-scroll">
        <table className="fleet-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Zone</th>
              <th>Lock</th>
              <th>Sats</th>
              <th>Battery</th>
              <th>Last report</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.device_id}>
                <td>{r.device_id}</td>
                <td>{r.inside_geofence ? 'inside' : 'outside'}</td>
                <td>{r.locked ? 'locked' : 'unlocked'}</td>
                <td>{r.satellites ?? '—'}</td>
                <td>{r.battery ?? '—'}%</td>
                <td>{new Date(r.reported_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
