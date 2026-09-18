# Parvaah Mobile Application (Field Officer & Citizen Client)

**Framework:** Flutter 3.x (Dart 3.x)  
**Platforms:** Android (Priority for NER), iOS  
**Role:** Offline-First Situational Awareness & Early Warning Client for Field Personnel and Citizens.

---

## 1. Key Engineering Capabilities

* **Offline-First Architecture**:
  * Built using `sqflite` for local relational data caching.
  * During deep mountain connectivity blackouts in Meghalaya, Sikkim, and Arunachal Pradesh, the app seamlessly serves cached risk polygons, safe road corridors, and emergency advisories.
  * Synchronizes automatically in the background when 4G/satellite connectivity is restored.
* **Strict View-Only Security Model**:
  * By design decision, the mobile app does not allow photo/video uploading or citizen hazard reporting, avoiding cluttering control room channels with unverified field noise.
  * Focused on delivery: early warning alerts, evacuation orders, safe road routing, and meteorological outlooks.
* **Multilingual CAP Emergency Bulletins**:
  * Displays Common Alerting Protocol (CAP) messages localized in 6 North Eastern languages: **English**, **Hindi**, **Khasi**, **Garo**, **Assamese**, and **Bengali**.
* **Interactive Mobile GIS Maps**:
  * Powered by `flutter_map` with vector tiles and geolocated proximity detection.
  * Shows color-coded risk zones (`Low`, `Medium`, `High`, `Critical`) and road passability status.

---

## 2. Directory Architecture (`lib/`)

```
lib/
├── core/
│   ├── network/             # Dio HTTP client, interceptors, connectivity listeners
│   ├── storage/             # Secure token storage & SharedPreferences
│   └── errors/               # Custom app exceptions and failure handlers
│
├── data/
│   ├── local/               # SQLite database helper and cached tables
│   ├── models/              # Pydantic-compatible Dart data transfer objects
│   └── repositories/        # RiskRepository, RoadRepository, AlertRepository, WeatherRepository
│
└── presentation/
    ├── providers/           # State management via Provider (RiskProvider, AlertProvider, etc.)
    ├── screens/
    │   ├── shell/           # Bottom navigation shell
    │   ├── home/            # Dashboard summary, local risk cards, quick status
    │   ├── map/             # Fullscreen flutter_map GIS risk viewer
    │   ├── alerts/          # Active emergency alerts and CAP advisories
    │   ├── safety/          # Safe mountain corridor routing & evacuation guidelines
    │   ├── notifications/   # Push notification inbox
    │   └── auth/            # Optional field officer authentication
    └── widgets/             # Reusable UI widgets, risk badges, countdown chips
```

---

## 3. Getting Started & Setup

### Prerequisites
* Flutter SDK `3.x` with Dart `3.x`
* Android Studio / Android SDK (API 33+) or Xcode (for iOS)

```bash
cd apps/mobile

# 1. Install dependencies
flutter pub get

# 2. Run automated test suite (16 tests)
flutter test

# 3. Launch in development mode (connected emulator/device)
flutter run

# 4. Build release APK for field deployment
flutter build apk --release
```

---

## 4. Configuration

The API base URL is configured in `lib/core/constants.dart` or via environment flavor arguments:

* **Android Emulator (Localhost)**: `http://10.0.2.2:8000/api/v1`
* **Physical Device (LAN)**: `http://<YOUR_LOCAL_IP>:8000/api/v1`
* **Production**: Set to the designated MeghRaj / NIC API gateway URL.
