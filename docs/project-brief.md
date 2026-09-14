# Alpine E-Bike Fleet Tracker — Project Brief

## Concept
GPS/BLE fleet tracking and geofencing for e-bike rentals in alpine terrain (initial focus:
Sestriere / Via Lattea, Piedmont, Italy), engineered for connectivity dead zones (cellular gaps,
GPS canopy loss) that generic urban bike-share tracking doesn't handle.

## Core innovation
Edge-first / offline-tolerant architecture: geofencing and lock decisions run locally on-device
against a trail-corridor polygon (not a simple bounding shape), with store-and-forward reporting
once connectivity returns. Existing competitors (PowUnity, Trackting, etc.) assume good
connectivity — nobody has productized the alpine-specific version. This is the patentable core.

## Hardware — Bike unit (cellular + GNSS + BLE)
- Multi-constellation GNSS (GPS+GLONASS+Galileo+BeiDou) — better fix quality under canopy/in valleys
- Cellular modem: LTE-M/NB-IoT primary, 2G/3G fallback
- BLE/MCU: ESP32-C3 (Wi-Fi adds AP-fingerprint positioning + known-network reporting)
- IMU (accelerometer/gyro): confirms bike has stopped before engaging the physical lock
  (safety — never lock wheels mid-descent)
- Rechargeable LiPo, cold-tolerant chemistry preferred (LiFePO4)
- IP67 enclosure; lock actuator = buy a motorized lock module, don't design one from scratch
- Target BOM: ~$81/unit at pilot volume (~20-50 units), ~$45/unit at 10,000 units

## Hardware — Gear tag (BLE only, ski boots/equipment)
- Nordic nRF52810-class BLE module (best power efficiency)
- Coin cell (CR2032/CR2477): 2-3 yr life at 1s advertising interval, 7+ yr at longer intervals
- IP67 enclosure, target size ~AirTag or smaller
- Optional: Google Find Hub third-party partner program (no Apple-style MFi fee) as a
  supplementary detection layer
- Target BOM: ~$22/unit pilot volume, ~$10/unit at 10,000 units

## Connectivity architecture
- Cellular (LTE-M/NB-IoT) = primary path
- Resort-operated LoRaWAN gateways (RAK/Dragino class) at high line-of-sight points (lift
  stations, rifugios) = private backhaul, up to ~10-15km range in alpine terrain
- Offline store-and-forward: device buffers GPS points locally, bulk-uploads on reconnect
- iOS: use CoreLocation beacon-region monitoring via a native Swift bridge, not plain
  background BLE scanning — more reliable, though still not perfectly consistent

## Software stack
- Mobile app: Flutter for MVP speed; native Swift/Kotlin bridge for OS-specific radio/location APIs
- Core logic (post-MVP): consider a Rust core compiled via FFI into both platforms for the
  geofencing algorithm and crypto
- Backend: Go or Node.js, event-sourced — handles many concurrent, out-of-order device reports
  from dead-zone reconnects
- Firmware: C / Zephyr RTOS (nRF Connect SDK) for nRF52-class; Arduino/ESP-IDF for ESP32-class

## Current prototype starting point
- Have an ESP32 "Super Kit" on hand: ESP32 board (Wi-Fi+BLE), breadboard, jumper wires, OLED
  display, SG90 servo, relay module, PIR/ultrasonic/DHT11 sensors, buzzer, buttons
- Still need to buy: a GPS module (u-blox NEO-6M class, ~$5-15) and a LiPo battery + TP4056
  charger (~$3-5) for portability; a real motorized bike lock comes later — the kit's servo is
  a fine stand-in for the first proof-of-concept
- First build target: ESP32 reads GPS over UART, evaluates the geofence locally in firmware,
  drives the servo as the lock stand-in, shows status on the OLED, reports over Wi-Fi to a
  simple local server

## Compliance requirements
- Radio Equipment Directive (2014/53/EU): CE self-declaration achievable via harmonized
  standards (EN 300 328 BLE/Wi-Fi, EN 301 489 EMC); pre-certified modules ease this
- RED cybersecurity requirements apply since Aug 2025; Cyber Resilience Act phases in through 2027
- GDPR: riders' location data needs a privacy policy before any live pilot
- Product liability insurance needed before real users are on real bikes

## Business / funding context (Italy)
- Legal structure: "startup innovativa" srl — ~EUR 1,500-3,500 to register, ~1-2 weeks
- Patent: file early via telematic filing (EUR 50 official fee) — secures priority date within
  days; full grant takes years, but "patent pending" is what matters for pitching
- Funding: Interreg ALCOTRA microprogetti (EUR 25,000-75,000 — best fit for the initial pilot,
  covers the Western Alps/Via Lattea cross-border territory directly); Smart&Start Italia
  (EUR 100,000-1,500,000, 0%-interest loan — better fit once scaling); Fondo di Garanzia PMI
  (state-backed bank loan guarantee, removes need for personal collateral)
- Pilot budget estimate (~20 bikes): ~EUR 13,000 all-in (see cost model spreadsheet)
- Revenue model (bottom-up, not a generic market-report figure): short-run (~10 shops)
  ~EUR 29k/yr; long-run (~300 shops) ~EUR 1.44M/yr

## Existing contacts / assets
- Rental-industry contacts in the Piedmont/Western Alps (Sestriere, Via Lattea) for pilot
  testing and bike access
- Full-stack programming ability; open to hands-on hardware prototyping

## Reference documents (keep alongside this file)
- alpine_ebike_cost_model.xlsx — full editable cost/funding/revenue model
- alpine_ebike_technical_spec.docx — one-page hardware/software spec for a contractor

## Roadmap
1. Legal setup (1-2 weeks)
2. Prototype build (weeks to ~4 months)
3. Patent filing (priority secured in days)
4. Pilot season (~20 bikes, one season)
5. Funding secured (2-4 months)
6. Scale up (year 3-5)
