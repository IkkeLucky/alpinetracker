import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport } from '../src/validate.js';

const validReport = {
  deviceId: 'bike-001',
  timestamp: '2026-09-14T10:00:00.000Z',
  lat: 45.0,
  lon: 6.9,
  insideGeofence: true,
  locked: false,
};

test('accepts a well-formed report', () => {
  assert.equal(validateReport(validReport), null);
});

test('rejects missing deviceId', () => {
  const { deviceId, ...rest } = validReport;
  assert.match(validateReport(rest), /deviceId/);
});

test('rejects out-of-range latitude', () => {
  assert.match(validateReport({ ...validReport, lat: 200 }), /lat/);
});

test('rejects out-of-range longitude', () => {
  assert.match(validateReport({ ...validReport, lon: -200 }), /lon/);
});

test('rejects non-boolean insideGeofence', () => {
  assert.match(validateReport({ ...validReport, insideGeofence: 'yes' }), /insideGeofence/);
});

test('rejects invalid timestamp', () => {
  assert.match(validateReport({ ...validReport, timestamp: 'not-a-date' }), /timestamp/);
});
