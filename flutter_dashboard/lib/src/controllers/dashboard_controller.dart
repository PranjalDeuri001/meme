import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/alert_item.dart';
import '../models/device.dart';
import '../models/fleet_metrics.dart';
import '../models/vehicle.dart';
import '../services/dashboard_repository.dart';

class DashboardController extends ChangeNotifier {
  DashboardController({
    required DashboardRepository repository,
  }) : _repository = repository;

  final DashboardRepository _repository;

  String? _username;
  String? _selectedDeviceTypeName;
  Object? _selectedMetricsFilter;

  List<Device> _allDevices = <Device>[];
  List<Vehicle> _vehicles = <Vehicle>[];
  FleetMetrics _fleetMetrics = FleetMetrics.initial;
  List<AlertItem> _alerts = <AlertItem>[];

  bool _isDevicesLoading = false;
  bool _isVehiclesLoading = false;
  bool _isMetricsLoading = false;
  bool _isAlertsLoading = false;

  String? _devicesError;
  String? _vehiclesError;
  String? _metricsError;
  String? _alertsError;

  StreamSubscription<List<Vehicle>>? _vehiclesSubscription;
  StreamSubscription<FleetMetrics>? _metricsSubscription;
  Timer? _alertsPollingTimer;

  String? get username => _username;
  String? get selectedDeviceTypeName => _selectedDeviceTypeName;
  Object? get selectedMetricsFilter => _selectedMetricsFilter;

  List<Device> get allDevices => List<Device>.unmodifiable(_allDevices);
  List<Vehicle> get vehicles => List<Vehicle>.unmodifiable(_vehicles);
  FleetMetrics get fleetMetrics => _fleetMetrics;
  List<AlertItem> get alerts => List<AlertItem>.unmodifiable(_alerts);

  bool get isDevicesLoading => _isDevicesLoading;
  bool get isVehiclesLoading => _isVehiclesLoading;
  bool get isMetricsLoading => _isMetricsLoading;
  bool get isAlertsLoading => _isAlertsLoading;

  String? get devicesError => _devicesError;
  String? get vehiclesError => _vehiclesError;
  String? get metricsError => _metricsError;
  String? get alertsError => _alertsError;

  List<Vehicle> get productionVehicles {
    return _vehicles.where((Vehicle vehicle) {
      return vehicle.vehicleType.toLowerCase() != 'test';
    }).toList();
  }

  List<String> get availableDeviceTypes {
    final set = <String>{};
    for (final vehicle in productionVehicles) {
      final type = vehicle.vehicleType.trim();
      if (type.isNotEmpty && type.toLowerCase() != 'n/a') {
        set.add(type);
      }
    }
    final list = set.toList();
    list.sort();
    return list;
  }

  List<Vehicle> get filteredVehicles {
    final selectedModel = _selectedDeviceTypeName;
    if (selectedModel == null || selectedModel.isEmpty) {
      return productionVehicles;
    }
    return productionVehicles.where((Vehicle vehicle) {
      return vehicle.vehicleType == selectedModel;
    }).toList();
  }

  Future<void> initialize({
    required String username,
  }) async {
    _username = username;
    await Future.wait(<Future<void>>[
      refreshDevices(),
      refreshAlerts(),
    ]);
    _subscribeVehicles();
    _subscribeFleetMetrics();
    _startAlertsPolling();
  }

  void setSelectedDeviceTypeName(String? value) {
    final normalized = (value == null || value.trim().isEmpty) ? null : value.trim();
    _selectedDeviceTypeName = normalized;
    _selectedMetricsFilter = normalized;
    _subscribeFleetMetrics();
    notifyListeners();
  }

  void setSelectedMetricsFilter(Object? filter) {
    final normalized = _normalizeMetricsFilter(filter);
    if (_filtersEqual(_selectedMetricsFilter, normalized)) {
      return;
    }
    _selectedMetricsFilter = normalized;
    _selectedDeviceTypeName = normalized is String ? normalized : null;
    _subscribeFleetMetrics();
    notifyListeners();
  }

  Future<void> refreshDevices() async {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      _allDevices = <Device>[];
      notifyListeners();
      return;
    }
    _isDevicesLoading = true;
    _devicesError = null;
    notifyListeners();

    try {
      _allDevices = await _repository.getAllDevices(username: user);
    } catch (error) {
      _devicesError = error.toString();
    } finally {
      _isDevicesLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAlerts() async {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      _alerts = <AlertItem>[];
      notifyListeners();
      return;
    }
    _isAlertsLoading = true;
    _alertsError = null;
    notifyListeners();
    try {
      _alerts = await _repository.getAlerts(username: user);
    } catch (error) {
      _alertsError = error.toString();
    } finally {
      _isAlertsLoading = false;
      notifyListeners();
    }
  }

  Future<List<dynamic>> fetchDailySummaryReport({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      return const <dynamic>[];
    }
    return _repository.getDailySummaryReport(
      startDate: startDate,
      endDate: endDate,
      username: user,
    );
  }

  Future<List<dynamic>> fetchSummaryData({
    required String period,
  }) async {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      return const <dynamic>[];
    }
    return _repository.getSummaryData(
      period: period,
      username: user,
    );
  }

  Future<List<dynamic>> fetchAllDataReport() async {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      return const <dynamic>[];
    }
    return _repository.getAllDataReport(
      username: user,
    );
  }

  Future<List<dynamic>> fetchChartViewData({
    required String deviceId,
    required DateTime date,
  }) async {
    return _repository.getChartViewData(
      deviceId: deviceId,
      date: date,
    );
  }

  void _subscribeVehicles() {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      return;
    }

    _isVehiclesLoading = true;
    _vehiclesError = null;
    _vehiclesSubscription?.cancel();
    notifyListeners();

    _vehiclesSubscription = _repository.watchVehicles(username: user).listen(
      (List<Vehicle> data) {
        _vehicles = data;
        _isVehiclesLoading = false;
        _vehiclesError = null;
        notifyListeners();
      },
      onError: (Object error) {
        _isVehiclesLoading = false;
        _vehiclesError = error.toString();
        notifyListeners();
      },
    );
  }

  void _subscribeFleetMetrics() {
    final user = _username;
    if (user == null || user.trim().isEmpty) {
      return;
    }

    _isMetricsLoading = true;
    _metricsError = null;
    _metricsSubscription?.cancel();
    notifyListeners();

    _metricsSubscription = _repository
        .watchFleetMetrics(
          username: user,
          deviceTypeName: _selectedMetricsFilter,
        )
        .listen(
      (FleetMetrics metrics) {
        _fleetMetrics = metrics;
        _isMetricsLoading = false;
        _metricsError = null;
        notifyListeners();
      },
      onError: (Object error) {
        _isMetricsLoading = false;
        _metricsError = error.toString();
        notifyListeners();
      },
    );
  }

  void _startAlertsPolling() {
    _alertsPollingTimer?.cancel();
    _alertsPollingTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) {
        refreshAlerts();
      },
    );
  }

  Future<void> stop() async {
    _alertsPollingTimer?.cancel();
    _alertsPollingTimer = null;
    await _vehiclesSubscription?.cancel();
    await _metricsSubscription?.cancel();
    _vehiclesSubscription = null;
    _metricsSubscription = null;
    _username = null;
    _selectedDeviceTypeName = null;
    _selectedMetricsFilter = null;
    _allDevices = <Device>[];
    _vehicles = <Vehicle>[];
    _alerts = <AlertItem>[];
    _fleetMetrics = FleetMetrics.initial;
    _isDevicesLoading = false;
    _isVehiclesLoading = false;
    _isMetricsLoading = false;
    _isAlertsLoading = false;
    _devicesError = null;
    _vehiclesError = null;
    _metricsError = null;
    _alertsError = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _alertsPollingTimer?.cancel();
    _vehiclesSubscription?.cancel();
    _metricsSubscription?.cancel();
    super.dispose();
  }

  Object? _normalizeMetricsFilter(Object? value) {
    if (value == null) {
      return null;
    }
    if (value is String) {
      final trimmed = value.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(
        value.map(
          (dynamic key, dynamic itemValue) => MapEntry<String, dynamic>(
            key.toString(),
            itemValue,
          ),
        ),
      );
    }
    return value;
  }

  bool _filtersEqual(Object? left, Object? right) {
    if (left is Map && right is Map) {
      final leftMap = Map<String, dynamic>.from(
        left.map(
          (dynamic key, dynamic value) =>
              MapEntry<String, dynamic>(key.toString(), value),
        ),
      );
      final rightMap = Map<String, dynamic>.from(
        right.map(
          (dynamic key, dynamic value) =>
              MapEntry<String, dynamic>(key.toString(), value),
        ),
      );
      return mapEquals(leftMap, rightMap);
    }
    return left == right;
  }
}
