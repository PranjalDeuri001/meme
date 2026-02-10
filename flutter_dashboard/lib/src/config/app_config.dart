class AppConfig {
  const AppConfig._();

  // Pass values at runtime:
  // flutter run --dart-define=API_URL=https://api.example.com --dart-define=WS_URL=wss://ws.example.com
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8002',
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://localhost:8002',
  );

  // Used mainly for documentation/diagnostics; native platforms still require
  // the key to be configured in AndroidManifest.xml / AppDelegate / web index.
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );
}
