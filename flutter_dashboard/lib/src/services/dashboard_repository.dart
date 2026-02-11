import 'dart:async';

import '../models/alert_item.dart';
import '../models/device.dart';
import '../models/fleet_metrics.dart';
import '../models/vehicle.dart';
import 'api_client.dart';
import 'robust_web_socket.dart';
import 'socket_manager.dart';

class DashboardRepository {
  DashboardRepository({
    required String backendUrl,
    required String webSocketUrl,
    ApiClient? apiClient,
    SocketManager? socketManager,
  })  : _webSocketUrl = webSocketUrl,
        _apiClient = apiClient ?? ApiClient(baseUrl: backendUrl),
        _socketManager = socketManager ?? SocketManager();

  final String _webSocketUrl;
  final ApiClient _apiClient;
  final SocketManager _socketManager;

  Future<List<Device>> getAllDevices({
    required String username,
  }) async {
    if (username.trim().isEmpty) {
      return const <Device>[];
    }
    final response = await _apiClient.getJson(
      '/devices/',
      queryParameters: <String, String>{
        'username': username,
      },
    );
    final list = _extractList(response);
    return list
        .whereType<Map>()
        .map((dynamic item) => Device.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<List<Vehicle>> getVehiclesBootstrap({
    required String username,
  }) async {
    final devices = await getAllDevices(username: username);
    return devices.map((Device device) {
      return Vehicle(
        vehicleId: device.deviceId,
        displayId: device.displayLabel,
        vehicleType: _normalizeText(device.deviceTypeName),
        city: _normalizeText(device.city),
        fleet: _normalizeText(device.fleet),
        mode: VehicleMode.pending,
        canData: false,
        timestamp: null,
        soc: null,
        cellTemperature: null,
        dte: null,
        latitude: 0,
        longitude: 0,
        heading: 0,
        speed: 0,
        odometer: null,
        socketData: null,
      );
    }).toList();
  }

  Stream<List<Vehicle>> watchVehicles({
    required String username,
  }) {
    late final StreamController<List<Vehicle>> controller;
    final Set<String> receivedUpdates = <String>{};
    var initialUpdateDone = false;
    List<Vehicle> vehicles = <Vehicle>[];

    void emit() {
      if (!controller.isClosed) {
        controller.add(List<Vehicle>.unmodifiable(vehicles));
      }
    }

    Future<void> init() async {
      try {
        vehicles = await getVehiclesBootstrap(username: username);
        emit();

        _socketManager.connectLiveData(() {
          return RobustWebSocket(
            '${_cleanWsUrl(_webSocketUrl)}/ws/live-data/',
            onOpenMessage: <String, dynamic>{'username': username},
            onMessage: (dynamic updates) {
              if (updates is! List) {
                return;
              }
              if (!initialUpdateDone) {
                initialUpdateDone = true;
              }

              for (final dynamic raw in updates) {
                if (raw is! Map) {
                  continue;
                }
                final data = Map<String, dynamic>.from(raw as Map);
                final deviceId = (data['imei'] ?? data['device_id'])?.toString();
                if (deviceId == null || deviceId.trim().isEmpty) {
                  continue;
                }

                receivedUpdates.add(deviceId);
                final index =
                    vehicles.indexWhere((Vehicle vehicle) => vehicle.vehicleId == deviceId);
                if (index < 0) {
                  continue;
                }

                final current = vehicles[index];
                final parsedLat = _parseDouble(data['latitude']);
                final parsedLng = _parseDouble(data['longitude']);
                final speedValue = _parseDouble(data['speed']);

                final socValue = _firstNotNull(
                  data['SOC'],
                  data['soc'],
                  data['A_SOC_Value'],
                );
                final cellTemperature = _firstNotNull(
                  data['ts'],
                  data['TS'],
                  data['cell_temp'],
                );
                final timestampRaw = _firstNotNull(data['last_timestamp'], data['timestamp']);

                VehicleMode mode;
                if ((parsedLat ?? current.latitude) == 0 ||
                    (parsedLng ?? current.longitude) == 0) {
                  mode = VehicleMode.nogps;
                } else if (_toBool(data['is_connected']) == true) {
                  mode = VehicleMode.active;
                } else {
                  mode = VehicleMode.inactive;
                }

                vehicles[index] = current.copyWith(
                  socketData: data,
                  latitude: parsedLat ?? current.latitude,
                  longitude: parsedLng ?? current.longitude,
                  speed: speedValue ?? 0,
                  heading: _parseDouble(data['heading']) ?? 0,
                  mode: mode,
                  timestamp: _tryParseDateTime(timestampRaw?.toString()),
                  soc: socValue,
                  cellTemperature: cellTemperature ?? 'N/A',
                  dte: _firstNotNull(data['DTE'], data['dte']),
                  odometer: data['odometer'],
                  canData: !_isSignalInvalid(socValue),
                );
              }

              if (initialUpdateDone) {
                vehicles = vehicles.map((Vehicle vehicle) {
                  if (!receivedUpdates.contains(vehicle.vehicleId) ||
                      vehicle.mode == VehicleMode.pending) {
                    return vehicle.copyWith(mode: VehicleMode.nogps);
                  }
                  return vehicle;
                }).toList();
              }

              emit();
            },
          );
        });
      } catch (error, stackTrace) {
        if (!controller.isClosed) {
          controller.addError(error, stackTrace);
        }
      }
    }

    controller = StreamController<List<Vehicle>>(
      onListen: init,
      onCancel: () {
        _socketManager.closeLiveDataSocket();
      },
    );

    return controller.stream;
  }

  Stream<FleetMetrics> watchFleetMetrics({
    required String username,
    Object? deviceTypeName,
  }) {
    late final StreamController<FleetMetrics> controller;

    Future<void> init() async {
      if (!controller.isClosed) {
        controller.add(FleetMetrics.initial);
      }

      _socketManager.connectMetrics(deviceTypeName, () {
        final onOpenMessage = <String, dynamic>{
          'username': username,
        };
        if (deviceTypeName is Map<String, dynamic>) {
          onOpenMessage.addAll(deviceTypeName);
        } else {
          onOpenMessage['device_type_name'] = deviceTypeName;
        }

        return RobustWebSocket(
          '${_cleanWsUrl(_webSocketUrl)}/ws/total_data/',
          onOpenMessage: onOpenMessage,
          onMessage: (dynamic parsedData) {
            if (parsedData is! Map) {
              return;
            }
            final fleetData = parsedData['data'];
            if (fleetData is Map && !controller.isClosed) {
              controller.add(FleetMetrics.fromJson(Map<String, dynamic>.from(fleetData)));
            }
          },
        );
      });
    }

    controller = StreamController<FleetMetrics>(
      onListen: init,
      onCancel: () {
        _socketManager.closeMetricsSocket(deviceTypeName);
      },
    );
    return controller.stream;
  }

  Future<List<dynamic>> getDailySummaryReport({
    required DateTime startDate,
    required DateTime endDate,
    required String username,
  }) async {
    final response = await _apiClient.getJson(
      '/devices/daily-summary-report/',
      queryParameters: <String, String>{
        'start_date': _toDateOnly(startDate),
        'end_date': _toDateOnly(endDate),
        'username': username,
      },
    );
    return _extractList(response);
  }

  Future<List<dynamic>> getSummaryData({
    required String period,
    required String username,
  }) async {
    final response = await _apiClient.getJson(
      '/devices/summary-data/',
      queryParameters: <String, String>{
        'period': period,
        'username': username,
      },
    );
    if (response is Map && response['reports'] is List) {
      return List<dynamic>.from(response['reports'] as List);
    }
    return const <dynamic>[];
  }

  Future<List<dynamic>> getAllDataReport({
    required String username,
  }) async {
    final response = await _apiClient.getJson(
      '/devices/all-data-report/',
      queryParameters: <String, String>{
        'username': username,
      },
    );
    return _extractList(response);
  }

  Future<List<AlertItem>> getAlerts({
    required String username,
  }) async {
    final response = await _apiClient.getJson(
      '/devices/alerts',
      queryParameters: <String, String>{
        'username': username,
      },
    );

    final list = _extractList(response);
    final mapped = list
        .whereType<Map>()
        .map((dynamic alert) => AlertItem.fromApiMap(Map<String, dynamic>.from(alert as Map)))
        .toList();

    mapped.sort((AlertItem a, AlertItem b) {
      final left = a.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
      final right = b.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
      return right.compareTo(left);
    });
    return mapped;
  }

  Future<List<dynamic>> getChartViewData({
    required String deviceId,
    required DateTime date,
  }) async {
    final startTime = DateTime.utc(date.year, date.month, date.day, 0, 0, 0);
    final endTime = DateTime.utc(date.year, date.month, date.day, 23, 59, 59, 999);
    final response = await _apiClient.getJson(
      '/devices/chart-view/',
      queryParameters: <String, String>{
        'device_id': deviceId,
        'start_datetime': startTime.toIso8601String(),
        'end_datetime': endTime.toIso8601String(),
      },
    );
    if (response is Map && response['data'] is Map) {
      return _transformColumnarToRows(Map<String, dynamic>.from(response['data'] as Map));
    }
    if (response is Map) {
      return _transformColumnarToRows(Map<String, dynamic>.from(response));
    }
    return const <dynamic>[];
  }

  void close() {
    _socketManager.closeAllSockets();
    _apiClient.close();
  }

  List<dynamic> _extractList(dynamic response) {
    if (response is List) {
      return List<dynamic>.from(response);
    }
    if (response is Map && response['data'] is List) {
      return List<dynamic>.from(response['data'] as List);
    }
    if (response is Map && response['results'] is List) {
      return List<dynamic>.from(response['results'] as List);
    }
    return const <dynamic>[];
  }

  String _normalizeText(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'N/A';
    }
    return value;
  }

  String _toDateOnly(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _cleanWsUrl(String value) {
    if (value.endsWith('/')) {
      return value.substring(0, value.length - 1);
    }
    return value;
  }

  bool _isSignalInvalid(dynamic value) {
    return value == null || value == 'N' || value == 0;
  }

  dynamic _firstNotNull(dynamic a, [dynamic b, dynamic c]) {
    if (a != null) {
      return a;
    }
    if (b != null) {
      return b;
    }
    if (c != null) {
      return c;
    }
    return null;
  }

  bool? _toBool(dynamic value) {
    if (value is bool) {
      return value;
    }
    if (value is num) {
      return value != 0;
    }
    if (value is String) {
      final normalized = value.toLowerCase();
      if (normalized == 'true' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == '0') {
        return false;
      }
    }
    return null;
  }

  double? _parseDouble(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is double) {
      return value;
    }
    if (value is int) {
      return value.toDouble();
    }
    return double.tryParse(value.toString());
  }

  DateTime? _tryParseDateTime(String? raw) {
    if (raw == null || raw.trim().isEmpty) {
      return null;
    }
    return DateTime.tryParse(raw);
  }

  List<dynamic> _transformColumnarToRows(Map<String, dynamic> columnarData) {
    if (columnarData.isEmpty) {
      return const <dynamic>[];
    }
    final headers = columnarData.keys.toList();
    if (headers.isEmpty) {
      return const <dynamic>[];
    }
    final firstColumn = columnarData[headers.first];
    if (firstColumn is! List || firstColumn.isEmpty) {
      return const <dynamic>[];
    }

    final rowCount = firstColumn.length;
    final hasTimestamp = headers.any((String header) {
      final normalized = header.toLowerCase();
      return normalized == 'timestamp' || normalized == 'time';
    });

    final rows = <Map<String, dynamic>>[];
    for (var i = 0; i < rowCount; i++) {
      final row = <String, dynamic>{};
      for (final header in headers) {
        final values = columnarData[header];
        final rawValue = (values is List && i < values.length) ? values[i] : null;
        row[header.trim()] = _normalizeNumeric(rawValue);
      }
      if (!hasTimestamp) {
        row['index'] = i;
      }
      rows.add(row);
    }
    return rows;
  }

  dynamic _normalizeNumeric(dynamic value) {
    if (value is num) {
      return value;
    }
    if (value is String) {
      final parsed = double.tryParse(value);
      if (parsed != null) {
        return parsed;
      }
    }
    return value;
  }
}
