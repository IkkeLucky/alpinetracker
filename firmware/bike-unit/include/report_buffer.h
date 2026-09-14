#pragma once

#include <Arduino.h>

// One geofence/lock status sample, shaped to match the backend's
// POST /api/reports schema (see backend/server/src/validate.js).
struct Report {
  char deviceId[32];
  char timestamp[32];  // ISO 8601, UTC
  double lat;
  double lon;
  bool insideGeofence;
  bool locked;
  int satellites;
  int batteryPercent;
};

// Fixed-capacity ring buffer used for store-and-forward: reports pile up
// here whenever Wi-Fi is down or a POST fails, and get drained in order
// once connectivity returns. Oldest entries are overwritten once full —
// for a bench prototype, losing the tail of a long offline stretch is an
// acceptable tradeoff against unbounded RAM growth.
class ReportBuffer {
 public:
  explicit ReportBuffer(int capacity);
  ~ReportBuffer();

  void push(const Report &report);
  bool isEmpty() const;
  int size() const;

  // Builds a JSON array string of everything currently buffered, oldest
  // first, without removing it (caller drops entries via clear() only
  // after a confirmed successful upload).
  String toJsonArray() const;
  void clear();

 private:
  Report *entries_;
  int capacity_;
  int count_;
  int head_;  // index of oldest entry
};
