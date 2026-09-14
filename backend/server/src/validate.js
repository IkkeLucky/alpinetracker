// Returns an error message string, or null if the report is valid.
export function validateReport(report) {
  if (typeof report !== 'object' || report === null) {
    return 'report must be an object';
  }
  if (typeof report.deviceId !== 'string' || report.deviceId.length === 0) {
    return 'deviceId is required and must be a non-empty string';
  }
  if (typeof report.timestamp !== 'string' || Number.isNaN(Date.parse(report.timestamp))) {
    return 'timestamp is required and must be an ISO 8601 string';
  }
  if (typeof report.lat !== 'number' || report.lat < -90 || report.lat > 90) {
    return 'lat is required and must be a number in [-90, 90]';
  }
  if (typeof report.lon !== 'number' || report.lon < -180 || report.lon > 180) {
    return 'lon is required and must be a number in [-180, 180]';
  }
  if (typeof report.insideGeofence !== 'boolean') {
    return 'insideGeofence is required and must be a boolean';
  }
  if (typeof report.locked !== 'boolean') {
    return 'locked is required and must be a boolean';
  }
  return null;
}
