# Flutter Dashboard Port

This folder contains a Flutter implementation of the React dashboard in this repository.

## What is already ported

- Login flow (`/users/login/`)
- Feature-based navigation (same route/feature matrix as `routesConfig.jsx`)
- Live vehicles flow (REST bootstrap + websocket live updates)
- Fleet metrics flow (websocket `total_data` stream with debounced socket switching)
- Alerts flow (`/devices/alerts`) with the same priority derivation and data transformation used in `apiSlice.js`
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

`Home` and `Live Alerts` are implemented with live data.  
Remaining pages are scaffolded placeholders ready for widget-level porting.

## Run

1. Install Flutter SDK.
2. From this folder:

```bash
flutter create . --platforms=web,android,ios,macos,linux,windows
flutter pub get
flutter run -d chrome --dart-define=API_URL=https://<your-api> --dart-define=WS_URL=wss://<your-ws-host>
```

If you omit `dart-define` values, defaults are:

- `API_URL = http://localhost:8002`
- `WS_URL = ws://localhost:8002`

## Notes

- The websocket and socket-manager behavior mirrors the React implementation, including:
  - live data socket singleton
  - metrics socket debounce/switch logic
  - mode derivation (`active`, `inactive`, `nogps`, `pending`)
- Alerts priority logic mirrors the React code exactly (temperature/brake/thermal/etc -> HIGH, else MEDIUM).
