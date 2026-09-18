# Mobile App — Feature Specification
## AI-Based Early Warning and Landslide Risk Monitoring System (NER)

**Audience:** Mobile development team
**Platform:** Flutter (offline-first)
**Role of this app:** Read-only risk information tool for Users (mobile app). This app does NOT collect field reports, photos, videos, or any user-submitted data. It is strictly a one-way information channel (system → user).

---

## 1. Product Scope

### In scope
- View local landslide risk level (offline-capable)
- View road connectivity status
- View weather-linked forecast
- Receive push alerts
- Multilingual UI
- Voice/IVR-friendly alert support

### Explicitly out of scope (do not build)
- Photo/video capture or upload
- Text or voice-note issue reporting
- Any user-submitted data collection
- Real-time chat or two-way communication
- User accounts requiring heavy KYC (keep auth minimal — phone number + OTP is sufficient)

---

## 2. Core Features

### 2.1 Offline-First Risk Viewer
- On app launch (or whenever any connectivity is detected — Wi-Fi or mobile data), sync and cache:
  - Local risk heatmap tile for the user's selected/detected zone(s)
  - Risk score (low / medium / high / critical) per zone
  - Time-to-failure window text, where available (e.g., "elevated risk, next 3–10 days")
  - Road connectivity status for nearby roads
  - Weather-linked forecast summary (rainfall trend vs. risk trend)
- All cached data must remain fully viewable with zero network connection.
- Display a clear "Last updated: [timestamp]" label so users know data freshness — critical for trust during connectivity gaps.
- Cache expiry/staleness indicator: if cached data is older than 24 hours, show a visible warning banner ("Risk data may be outdated — reconnect to refresh").

### 2.2 Push Alerts
- Integrate FCM (Firebase Cloud Messaging) for push notifications.
- Alert types to support:
  - Risk level upgrade (e.g., medium → high) for the user's zone
  - Road closure/blockage near the user's zone
  - Critical evacuation advisory (highest priority, distinct sound/visual treatment)
- When offline, the last received alert must remain visible in an in-app "Alerts" tab (locally stored, not just a transient push notification).
- Support silent/background sync so alerts update the cached risk map without requiring the user to manually refresh.

### 2.3 Road Connectivity View
- Map layer showing roads color-coded: open (green), at-risk (amber), blocked (red).
- Tap on a road segment to see: status, last updated time, and reason if available (e.g., "blocked — landslide reported near KM 42").
- Must work fully offline using cached tile data.

### 2.4 Route Rerouting
- When a user's usual/selected route includes an at-risk or blocked segment, suggest an alternate route using cached road network data.
- This is advisory only — no live turn-by-turn navigation is required; a simple "suggested alternate: via [road name]" is sufficient for v1.

### 2.5 Weather-Linked Forecast Panel
- Simple chart or trend indicator showing rainfall trend vs. risk trend for the user's zone over the past 7 days and forecast next 3–7 days.
- Must degrade gracefully offline (show last cached trend with staleness label).

### 2.6 Multilingual Support
- UI must support major NER languages at minimum: Assamese, Bengali, Manipuri (Meitei), Khasi, Mizo, Nagamese/English, and Hindi as a fallback.
- All alert text must come from pre-approved, pre-translated templates (no real-time machine translation — this avoids mistranslation risk in critical alerts).
- Language selection available in-app settings; persist selection locally.

### 2.7 Voice/IVR Compatibility
- App itself does not need to make calls, but must display an in-app prompt directing low-literacy or low-connectivity users to the IVR alert number for verbal alerts (this is handled by the backend alerting service, not the app — app just surfaces the phone number/informational card).

---

## 3. Non-Functional Requirements

- **Offline-first architecture:** All core screens (risk map, road status, forecast) must render from local cache with zero network. Use local storage (SQLite/Hive) for cached tiles and risk data.
- **Low data footprint:** Sync should use compressed/delta updates, not full re-downloads, to work on 2G/3G in remote hill areas.
- **Background sync:** Use platform-appropriate background fetch (WorkManager on Android, Background App Refresh on iOS) to opportunistically refresh cache when connectivity appears, without requiring the app to be open.
- **Battery efficiency:** Background sync frequency should be configurable server-side (e.g., every 30–60 min) to avoid excessive battery drain in low-signal areas where the radio works harder to connect.
- **No mandatory login friction:** Support anonymous/location-based zone selection as a fallback if phone-number auth is skipped; full auth only needed if push notifications require user identification.
- **Accessibility:** Large tap targets, high-contrast risk color coding (color-blind safe palette), and text-to-speech compatibility for alert banners.

---

## 4. Data Flow (App Perspective)

```
Backend API (risk scores, road status, forecasts, alerts)
        |
   Sync service (on connectivity detected)
        |
   Local cache (SQLite/Hive)
        |
   UI layers (Risk Map | Road Status | Forecast | Alerts)
```

- App is a **pure consumer** of backend APIs — no write endpoints are called by this app except push notification token registration (for FCM) and language preference.

---

## 5. API Endpoints Needed From Backend (Read-Only)

| Endpoint | Purpose |
|---|---|
| `GET /zones/{zone_id}/risk` | Current risk score + time-to-failure window |
| `GET /zones/{zone_id}/forecast` | Rainfall + risk trend, past 7 days + forecast |
| `GET /roads?zone_id=` | Road segment statuses near a zone |
| `GET /alerts/active?zone_id=` | Active alerts for a zone |
| `POST /devices/register` | Register FCM token + zone + language preference |

---

## 6. Suggested Tech Stack

- **Framework:** Flutter (single codebase for Android/iOS)
- **Local storage:** Hive or SQLite (for cached risk/road/forecast data)
- **Maps:** Mapbox GL or Leaflet (offline tile support required)
- **Push:** Firebase Cloud Messaging (FCM)
- **State management:** Riverpod or Bloc (developer team's choice, keep consistent)
- **Background sync:** WorkManager (Android) / BGTaskScheduler (iOS)

---

## 7. Open Items for Dev Team to Confirm

- Exact zone granularity (recommended: ~25 sq km grid cells, per architecture doc) — confirm with backend team for tile sizing.
- Minimum supported Android/iOS versions for target user devices in NER (likely need to support older/lower-spec Android devices).
- Confirm whether anonymous zone-based access (GPS-detected) is acceptable for MVP, or if phone-number registration is mandated by the client.
