import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Null when PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY aren't set (e.g.
// first run before a project exists) — callers fall back to mock data
// instead of crashing. See ../../README.md for how to configure these.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

export type DeviceReportRow = {
  device_id: string;
  reported_at: string;
  lat: number;
  lon: number;
  inside_geofence: boolean;
  locked: boolean;
  satellites: number | null;
  battery: number | null;
};

export type GeofenceRow = {
  id: string;
  name: string;
  polygon: [number, number][]; // [lat, lon] pairs
  updated_at: string;
};
