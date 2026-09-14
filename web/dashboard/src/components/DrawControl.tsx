import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { LatLng } from '../lib/geofence';

type Props = {
  initialPolygon: LatLng[];
  onChange: (polygon: LatLng[]) => void;
};

// Geoman instead of Leaflet.draw: Leaflet.draw hasn't been updated since
// 2018 (built against Leaflet 0.7) and has a well-known bug against modern
// Leaflet where its own double-click detection conflicts with Leaflet
// core's, closing a polygon after ~3 points instead of waiting for the user
// to finish — reproduced here and confirmed as the "can't add more than 3
// points" bug. Geoman is actively maintained and doesn't have this problem.
// It has no react-leaflet wrapper either, so this still drives it
// imperatively via useMap(). Supports a single editable polygon at a time,
// which is all one trail corridor needs.
export default function DrawControl({ initialPolygon, onChange }: Props) {
  const map = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const layerRef: { current: L.Polygon | null } = { current: null };

    const emitChange = () => {
      const layer = layerRef.current;
      if (!layer) {
        onChangeRef.current([]);
        return;
      }
      const ring = layer.getLatLngs()[0] as L.LatLng[];
      onChangeRef.current(ring.map((ll): LatLng => [ll.lat, ll.lng]));
    };

    const trackLayer = (layer: L.Polygon) => {
      layerRef.current = layer;
      layer.pm.enable({ allowSelfIntersection: false });
      layer.on('pm:edit', emitChange);
      layer.on('pm:markerdragend', emitChange);
      layer.on('pm:vertexadded', emitChange);
      layer.on('pm:vertexremoved', emitChange);
    };

    if (initialPolygon.length > 0) {
      const layer = L.polygon(initialPolygon).addTo(map);
      trackLayer(layer);
      map.fitBounds(layer.getBounds(), { padding: [24, 24] });
    }

    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      drawPolygon: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    const handleCreate = (e: { layer: L.Layer }) => {
      // One polygon at a time: a freshly drawn shape replaces whatever was
      // there before rather than adding a second one.
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      trackLayer(e.layer as L.Polygon);
      emitChange();
    };

    const handleRemove = () => {
      layerRef.current = null;
      emitChange();
    };

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);

    return () => {
      map.pm.removeControls();
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
    // initialPolygon is only used to seed the layer on mount by design —
    // re-syncing it on every parent re-render would fight the user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}
