#pragma once

// Copy this file to secrets.h (gitignored — never commit real credentials)
// and fill in real values. config.h includes secrets.h.

#define WIFI_SSID "CHANGE_ME"
#define WIFI_PASSWORD "CHANGE_ME"

// From the Supabase project: Project Settings -> API.
// The anon/public key is meant to be embedded in client code (browsers,
// firmware) and is safe here — access control is enforced by the
// database's row-level security policies, not by keeping this secret.
// Never put the service_role key in firmware.
#define SUPABASE_URL "https://CHANGE_ME.supabase.co"
#define SUPABASE_ANON_KEY "CHANGE_ME"

#define DEVICE_ID "bike-001"
