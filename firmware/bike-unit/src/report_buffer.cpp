#include "report_buffer.h"

ReportBuffer::ReportBuffer(int capacity)
    : capacity_(capacity), count_(0), head_(0) {
  entries_ = new Report[capacity_];
}

ReportBuffer::~ReportBuffer() { delete[] entries_; }

void ReportBuffer::push(const Report &report) {
  int writeIndex = (head_ + count_) % capacity_;
  entries_[writeIndex] = report;
  if (count_ < capacity_) {
    count_++;
  } else {
    // Full: overwrite oldest, advance head so it stays the oldest-first order.
    head_ = (head_ + 1) % capacity_;
  }
}

bool ReportBuffer::isEmpty() const { return count_ == 0; }

int ReportBuffer::size() const { return count_; }

// -1 is this codebase's internal sentinel for "not measured"; PostgREST
// needs an actual JSON null for a nullable integer column, not a fake value
// the dashboard would otherwise render as a literal "-1".
static String intOrNull(int value) {
  return value < 0 ? String("null") : String(value);
}

String ReportBuffer::toJsonArray() const {
  // Field names match the Supabase `reports` table columns exactly
  // (supabase/schema.sql) — PostgREST inserts a JSON array as a bulk insert
  // in one request, which is what lets a whole offline backlog flush at once.
  String json = "[";
  for (int i = 0; i < count_; i++) {
    const Report &r = entries_[(head_ + i) % capacity_];
    if (i > 0) json += ",";
    json += "{";
    json += "\"device_id\":\"" + String(r.deviceId) + "\",";
    json += "\"reported_at\":\"" + String(r.timestamp) + "\",";
    json += "\"lat\":" + String(r.lat, 6) + ",";
    json += "\"lon\":" + String(r.lon, 6) + ",";
    json += "\"inside_geofence\":" + String(r.insideGeofence ? "true" : "false") + ",";
    json += "\"locked\":" + String(r.locked ? "true" : "false") + ",";
    json += "\"satellites\":" + intOrNull(r.satellites) + ",";
    json += "\"battery\":" + intOrNull(r.batteryPercent);
    json += "}";
  }
  json += "]";
  return json;
}

void ReportBuffer::clear() {
  count_ = 0;
  head_ = 0;
}
