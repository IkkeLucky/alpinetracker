import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, type DeviceReportRow } from './supabase';
import { stepMockFleet } from './mockFleet';

export type FleetSource = 'supabase' | 'mock';

// Latest report per device, live-updated either from Supabase (realtime
// inserts on the `reports` table) or, when no Supabase project is
// configured yet, a local random-walk mock so the map isn't empty.
export function useFleetReports(): { reports: DeviceReportRow[]; source: FleetSource } {
  const [reports, setReports] = useState<DeviceReportRow[]>([]);
  const byDevice = useRef(new Map<string, DeviceReportRow>());

  useEffect(() => {
    if (!supabase) {
      const tick = () => {
        for (const report of stepMockFleet()) {
          byDevice.current.set(report.device_id, report);
        }
        setReports(Array.from(byDevice.current.values()));
      };
      tick();
      const interval = setInterval(tick, 2500);
      return () => clearInterval(interval);
    }

    const client = supabase;
    let cancelled = false;

    client
      .from('reports')
      .select('*')
      .order('reported_at', { ascending: false })
      .limit(500)
      .then(
        ({ data, error }) => {
          if (cancelled || error || !data) return;
          for (const row of data as DeviceReportRow[]) {
            const existing = byDevice.current.get(row.device_id);
            if (!existing || existing.reported_at < row.reported_at) {
              byDevice.current.set(row.device_id, row);
            }
          }
          setReports(Array.from(byDevice.current.values()));
        },
        (err: unknown) => {
          // A network-level failure (offline, DNS, blocked egress) rather
          // than a query error — log it and leave the fleet map empty
          // rather than crash the app.
          console.error('Failed to load reports from Supabase', err);
        },
      );

    const channel = client
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const row = payload.new as DeviceReportRow;
          byDevice.current.set(row.device_id, row);
          setReports(Array.from(byDevice.current.values()));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, []);

  return { reports, source: isSupabaseConfigured ? 'supabase' : 'mock' };
}
