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

String ReportBuffer::toJsonArray() const {
  String json = "[";
  for (int i = 0; i < count_; i++) {
    const Report &r = entries_[(head_ + i) % capacity_];
    if (i > 0) json += ",";
    json += "{";
    json += "\"deviceId\":\"" + String(r.deviceId) + "\",";
    json += "\"timestamp\":\"" + String(r.timestamp) + "\",";
    json += "\"lat\":" + String(r.lat, 6) + ",";
    json += "\"lon\":" + String(r.lon, 6) + ",";
    json += "\"insideGeofence\":" + String(r.insideGeofence ? "true" : "false") + ",";
    json += "\"locked\":" + String(r.locked ? "true" : "false") + ",";
    json += "\"satellites\":" + String(r.satellites) + ",";
    json += "\"battery\":" + String(r.batteryPercent);
    json += "}";
  }
  json += "]";
  return json;
}

void ReportBuffer::clear() {
  count_ = 0;
  head_ = 0;
}
