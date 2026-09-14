import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { LatLng } from '../lib/geofence';

type Props = {
  initialPolygon: LatLng[];
  onChange: (polygon: LatLng[]) => void;
};

// leaflet-draw is a vanilla-Leaflet plugin with no react-leaflet wrapper, so
// this drives it imperatively via useMap() rather than as normal JSX.
// Supports a single editable polygon at a time, which is all a trail
// corridor needs for now.
export default function DrawControl({ initialPolygon, onChange }: Props) {
  const map = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const featureGroup = new L.FeatureGroup();
    map.addLayer(featureGroup);

    if (initialPolygon.length > 0) {
      featureGroup.addLayer(L.polygon(initialPolygon));
      map.fitBounds(featureGroup.getBounds(), { padding: [24, 24] });
    }

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup },
    });
    map.addControl(drawControl);

    const emitChange = () => {
      const layers = featureGroup.getLayers();
      if (layers.length === 0) {
        onChangeRef.current([]);
        return;
      }
      const latlngs = (layers[0] as L.Polygon).getLatLngs()[0] as L.LatLng[];
      onChangeRef.current(latlngs.map((ll): LatLng => [ll.lat, ll.lng]));
    };

    const handleCreated = (e: L.LeafletEvent) => {
      featureGroup.clearLayers(); // one polygon at a time
      featureGroup.addLayer((e as L.DrawEvents.Created).layer);
      emitChange();
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, emitChange);
    map.on(L.Draw.Event.DELETED, emitChange);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(featureGroup);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, emitChange);
      map.off(L.Draw.Event.DELETED, emitChange);
    };
    // initialPolygon is only used to seed the layer on mount by design —
    // re-syncing it on every parent re-render would fight the user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}
