# Flutter Dashboard Port

This folder contains a Flutter implementation of the React dashboard in this repository.

## What is already ported

- Login flow (`/users/login/`)
- Feature-based navigation (same route/feature matrix as `routesConfig.jsx`)
- Live vehicles flow (REST bootstrap + websocket live updates)
- Fleet metrics flow (websocket `total_data` stream with debounced socket switching)
- Alerts flow (`/devices/alerts`) with the same priority derivation and data transformation used in `apiSlice.js`
- Google Maps integration in Home + Management views with live **vehicle clustering by lat/long**
- Summary/report fetch helpers:
  - `/devices/daily-summary-report/`
  - `/devices/summary-data/`
  - `/devices/chart-view/` (columnar -> row transform)

## Route mapping

All React sidebar routes are represented in Flutter:

- `/home`
- `/management-dashboard`
- `/fleet-summary`
- `/device-summary`
- `/analysis`
- `/custom-analysis`
- `/trails`
- `/reports`
- `/faults`
- `/alerts-notification`
- `/maintenance-service`
- `/add-vehicle`
- `/settings`

Implemented pages:

- Home (live map clustering + status/model filters + fleet metrics)
- Management Dashboard
- Fleet Summary
- Vehicle Status
- Trip Analysis
- Custom Analysis (fetch mode + upload JSON mode)
- Reports
- Fault Database
- Live Alerts

## Run

1. Install Flutter SDK.
2. From this folder:

```bash
flutter create . --platforms=web,android,ios,macos,linux,windows
flutter pub get
flutter run -d chrome \
  --dart-define=API_URL=https://<your-api> \
  --dart-define=WS_URL=wss://<your-ws-host> \
  --dart-define=GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

If you omit `dart-define` values, defaults are:

- `API_URL = http://localhost:8002`
- `WS_URL = ws://localhost:8002`
- `GOOGLE_MAPS_API_KEY = ""`

## Notes

- The websocket and socket-manager behavior mirrors the React implementation, including:
  - live data socket singleton
  - metrics socket debounce/switch logic
  - mode derivation (`active`, `inactive`, `nogps`, `pending`)
- Alerts priority logic mirrors the React code exactly (temperature/brake/thermal/etc -> HIGH, else MEDIUM).
- For Google Maps, set platform keys after `flutter create .`:
  - Android: `android/app/src/main/AndroidManifest.xml`
  - iOS: `ios/Runner/AppDelegate.swift` (or `AppDelegate.m`)
  - Web: `web/index.html` script tag key
