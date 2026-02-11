import 'dart:async';

import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/device.dart';
import '../../models/vehicle.dart';

class FleetSummaryPage extends StatefulWidget {
  const FleetSummaryPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<FleetSummaryPage> createState() => _FleetSummaryPageState();
}

class _FleetSummaryPageState extends State<FleetSummaryPage> {
  static const int _fleetsPerPage = 12;
  static const int _vehiclesPerPage = 10;
  static const Duration _reportPollingInterval = Duration(minutes: 5);

  String _selectedModel = 'All';
  String _vrnQuery = '';

  String _sortKey = 'displayId';
  bool _sortAscending = true;

  int _currentFleetPage = 1;
  final Map<String, bool> _expandedFleets = <String, bool>{};
  final Map<String, int> _vehicleCurrentPage = <String, int>{};

  bool _isReportLoading = false;
  String? _reportError;
  Map<String, Map<String, dynamic>> _reportByDeviceId = <String, Map<String, dynamic>>{};
  Timer? _reportPollingTimer;

  @override
  void initState() {
    super.initState();
    _loadAllDataReport();
    _startReportPolling();
  }

  @override
  void didUpdateWidget(covariant FleetSummaryPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _reportByDeviceId = <String, Map<String, dynamic>>{};
      _reportError = null;
      _isReportLoading = false;
      _loadAllDataReport();
      _startReportPolling();
    }
  }

  @override
  void dispose() {
    _reportPollingTimer?.cancel();
    super.dispose();
  }

  void _startReportPolling() {
    _reportPollingTimer?.cancel();
    _reportPollingTimer = Timer.periodic(_reportPollingInterval, (_) {
      _loadAllDataReport(showLoader: false);
    });
  }

  Future<void> _loadAllDataReport({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() {
        _isReportLoading = true;
        _reportError = null;
      });
    }
    try {
      final rows = await widget.controller.fetchAllDataReport();
      final nextMap = <String, Map<String, dynamic>>{};
      for (final dynamic raw in rows) {
        if (raw is! Map) {
          continue;
        }
        final row = Map<String, dynamic>.from(raw as Map);
        final deviceId = (row['device_id'] ?? row['imei'] ?? '').toString().trim();
        if (deviceId.isEmpty) {
          continue;
        }
        nextMap[deviceId] = row;
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _reportByDeviceId = nextMap;
        _reportError = null;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _reportError = error.toString();
      });
    } finally {
      if (mounted && showLoader) {
        setState(() {
          _isReportLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = widget.controller.productionVehicles;
    final devicesById = <String, Device>{
      for (final Device device in widget.controller.allDevices) device.deviceId: device,
    };

    final entries = vehicles
        .map((Vehicle vehicle) {
          final report = _reportByDeviceId[vehicle.vehicleId];
          final device = devicesById[vehicle.vehicleId];
          return _FleetSummaryEntry.fromSources(
            vehicle: vehicle,
            device: device,
            report: report,
          );
        })
        .toList();

    final modelOptions = <String>{
      'All',
      ...entries
          .map((entry) => entry.model)
          .where((String model) => model.trim().isNotEmpty && model.toLowerCase() != 'n/a'),
    }.toList()
      ..sort((String a, String b) {
        if (a == 'All') {
          return -1;
        }
        if (b == 'All') {
          return 1;
        }
        return a.compareTo(b);
      });

    final effectiveModel = modelOptions.contains(_selectedModel) ? _selectedModel : 'All';

    final modelFiltered = entries.where((entry) {
      if (effectiveModel == 'All') {
        return true;
      }
      return _normalize(entry.model) == _normalize(effectiveModel);
    }).toList();

    final availableVrns = <String>{
      ...modelFiltered
          .map((entry) => entry.displayId)
          .where((String id) => id.trim().isNotEmpty && id.toLowerCase() != 'n/a'),
    }.toList()
      ..sort();

    final vrnQuery = _vrnQuery.trim().toLowerCase();
    final filteredEntries = modelFiltered.where((entry) {
      if (vrnQuery.isEmpty) {
        return true;
      }
      return entry.displayId.toLowerCase().contains(vrnQuery);
    }).toList();

    final groupedByFleet = <String, List<_FleetSummaryEntry>>{};
    for (final _FleetSummaryEntry entry in filteredEntries) {
      groupedByFleet.putIfAbsent(entry.fleetName, () => <_FleetSummaryEntry>[]).add(entry);
    }
    for (final String key in groupedByFleet.keys) {
      groupedByFleet[key]!
        ..sort(_entryComparator);
    }

    final sortedFleetNames = groupedByFleet.keys.toList()..sort();
    final totalFleetPages = sortedFleetNames.isEmpty
        ? 1
        : (sortedFleetNames.length / _fleetsPerPage).ceil();
    final safeFleetPage = _currentFleetPage.clamp(1, totalFleetPages) as int;
    final fleetStart = (safeFleetPage - 1) * _fleetsPerPage;
    final visibleFleetNames = sortedFleetNames
        .skip(fleetStart)
        .take(_fleetsPerPage)
        .toList();

    final totalVehicles = filteredEntries.length;
    final totalDistance =
        filteredEntries.fold<double>(0, (sum, entry) => sum + entry.odometer);
    final totalCo2 =
        filteredEntries.fold<double>(0, (sum, entry) => sum + entry.co2Saved);
    final totalRunTime =
        filteredEntries.fold<double>(0, (sum, entry) => sum + entry.runTime);

    if (widget.controller.isVehiclesLoading && vehicles.isEmpty && _isReportLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (widget.controller.vehiclesError != null && vehicles.isEmpty) {
      return _ErrorCard(
        title: 'Failed to load fleet data',
        message: widget.controller.vehiclesError!,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await widget.controller.refreshDevices();
        await _loadAllDataReport(showLoader: true);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Fleet Summary',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          if (_isReportLoading)
            const LinearProgressIndicator(minHeight: 2),
          if (_reportError != null) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              _reportError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _SummaryCard(
                title: 'Total Vehicles',
                value: '$totalVehicles',
              ),
              _SummaryCard(
                title: 'Total Distance',
                value: _formatNumber(totalDistance, decimals: 0, zeroAsDash: false),
                unit: 'km',
              ),
              _SummaryCard(
                title: 'CO2 Saved',
                value: _formatNumber(totalCo2, decimals: 0, zeroAsDash: false),
                unit: 'kg',
              ),
              _SummaryCard(
                title: 'Total Run Time',
                value: _formatNumber(totalRunTime, decimals: 1, zeroAsDash: false),
                unit: 'hrs',
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFiltersCard(
            modelOptions: modelOptions,
            effectiveModel: effectiveModel,
            availableVrns: availableVrns,
          ),
          const SizedBox(height: 12),
          if (entries.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No fleet data available.'),
              ),
            )
          else if (filteredEntries.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No vehicle found matching current filters.'),
              ),
            )
          else
            ...visibleFleetNames.map((String fleetName) {
              final fleetEntries = groupedByFleet[fleetName] ?? const <_FleetSummaryEntry>[];
              final totals = _FleetTotals.fromEntries(fleetEntries);
              final isExpanded = _expandedFleets[fleetName] ?? false;

              final totalVehiclePages = fleetEntries.isEmpty
                  ? 1
                  : (fleetEntries.length / _vehiclesPerPage).ceil();
              final currentVehiclePage =
                  (_vehicleCurrentPage[fleetName] ?? 1).clamp(1, totalVehiclePages) as int;
              final vehicleStart = (currentVehiclePage - 1) * _vehiclesPerPage;
              final currentEntries = fleetEntries
                  .skip(vehicleStart)
                  .take(_vehiclesPerPage)
                  .toList();

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ExpansionTile(
                  initiallyExpanded: isExpanded,
                  onExpansionChanged: (bool value) {
                    setState(() {
                      _expandedFleets[fleetName] = value;
                    });
                  },
                  title: Text('$fleetName (${fleetEntries.length})'),
                  subtitle: Text(
                    'Distance ${_formatNumber(totals.odometer, decimals: 0, zeroAsDash: false)} km'
                    ' • Energy ${_formatNumber(totals.energyConsumption, decimals: 0, zeroAsDash: false)} kWh'
                    ' • Runtime ${_formatNumber(totals.runTime, decimals: 1, zeroAsDash: false)} h',
                  ),
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: <Widget>[
                          Chip(
                            label: Text(
                              'Traction ${_formatNumber(totals.traction, decimals: 0, zeroAsDash: false)} kWh',
                            ),
                          ),
                          Chip(
                            label: Text(
                              'Regen ${_formatNumber(totals.regeneration, decimals: 0, zeroAsDash: false)} kWh',
                            ),
                          ),
                          Chip(
                            label: Text(
                              'CO2 ${_formatNumber(totals.co2Saved, decimals: 0, zeroAsDash: false)} kg',
                            ),
                          ),
                          Chip(
                            label: Text(
                              'Idle ${_formatNumber(totals.idleTime, decimals: 1, zeroAsDash: false)} h',
                            ),
                          ),
                          Chip(
                            label: Text(
                              'Charging ${_formatNumber(totals.chargingUnit, decimals: 0, zeroAsDash: false)} kWh',
                            ),
                          ),
                          Chip(
                            label: Text(
                              'Cost ${_formatNumber(totals.costSaved, decimals: 2, zeroAsDash: false)}',
                            ),
                          ),
                        ],
                      ),
                    ),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: DataTable(
                        columns: <DataColumn>[
                          _sortableColumn('VRN / Chassis', 'displayId'),
                          _sortableColumn('Model', 'model'),
                          _sortableColumn('Status', 'status'),
                          _sortableColumn('SOC', 'soc', numeric: true),
                          _sortableColumn('Speed (km/h)', 'speed', numeric: true),
                          _sortableColumn('DTE', 'dte', numeric: true),
                          _sortableColumn('Cell Temp', 'cellTemperature', numeric: true),
                          _sortableColumn('Odometer (km)', 'odometer', numeric: true),
                          _sortableColumn('Energy (kWh)', 'energyConsumption', numeric: true),
                          _sortableColumn('Traction (kWh)', 'traction', numeric: true),
                          _sortableColumn('Regen (kWh)', 'regeneration', numeric: true),
                          _sortableColumn('CO2 Saved (kg)', 'co2Saved', numeric: true),
                          _sortableColumn('Run Time (h)', 'runTime', numeric: true),
                          _sortableColumn('Idle Time (h)', 'idleTime', numeric: true),
                          _sortableColumn('Charging Unit (kWh)', 'chargingUnit', numeric: true),
                          _sortableColumn('Cost Saved', 'costSaved', numeric: true),
                        ],
                        rows: currentEntries.map((entry) {
                          return DataRow(
                            cells: <DataCell>[
                              DataCell(Text(entry.displayId)),
                              DataCell(Text(entry.model)),
                              DataCell(Text(entry.modeLabel)),
                              DataCell(Text(_formatOptional(entry.soc, suffix: '%'))),
                              DataCell(Text(_formatNumber(entry.speed, decimals: 1))),
                              DataCell(Text(_formatOptional(entry.dte))),
                              DataCell(Text(_formatOptional(entry.cellTemperature))),
                              DataCell(Text(_formatNumber(entry.odometer))),
                              DataCell(Text(_formatNumber(entry.energyConsumption))),
                              DataCell(Text(_formatNumber(entry.traction))),
                              DataCell(Text(_formatNumber(entry.regeneration))),
                              DataCell(Text(_formatNumber(entry.co2Saved))),
                              DataCell(Text(_formatNumber(entry.runTime, decimals: 1))),
                              DataCell(Text(_formatNumber(entry.idleTime, decimals: 1))),
                              DataCell(Text(_formatNumber(entry.chargingUnit))),
                              DataCell(Text(_formatNumber(entry.costSaved, decimals: 2))),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                    if (totalVehiclePages > 1)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: <Widget>[
                            OutlinedButton(
                              onPressed: currentVehiclePage > 1
                                  ? () {
                                      setState(() {
                                        _vehicleCurrentPage[fleetName] =
                                            currentVehiclePage - 1;
                                      });
                                    }
                                  : null,
                              child: const Text('Previous'),
                            ),
                            const SizedBox(width: 10),
                            Text('Page $currentVehiclePage of $totalVehiclePages'),
                            const SizedBox(width: 10),
                            OutlinedButton(
                              onPressed: currentVehiclePage < totalVehiclePages
                                  ? () {
                                      setState(() {
                                        _vehicleCurrentPage[fleetName] =
                                            currentVehiclePage + 1;
                                      });
                                    }
                                  : null,
                              child: const Text('Next'),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              );
            }),
          if (sortedFleetNames.isNotEmpty && totalFleetPages > 1)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  ElevatedButton(
                    onPressed: safeFleetPage > 1
                        ? () {
                            setState(() {
                              _currentFleetPage = safeFleetPage - 1;
                            });
                          }
                        : null,
                    child: const Text('Previous'),
                  ),
                  const SizedBox(width: 10),
                  Text('Page $safeFleetPage of $totalFleetPages'),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: safeFleetPage < totalFleetPages
                        ? () {
                            setState(() {
                              _currentFleetPage = safeFleetPage + 1;
                            });
                          }
                        : null,
                    child: const Text('Next'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFiltersCard({
    required List<String> modelOptions,
    required String effectiveModel,
    required List<String> availableVrns,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Wrap(
          spacing: 12,
          runSpacing: 12,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: <Widget>[
            SizedBox(
              width: 220,
              child: DropdownButtonFormField<String>(
                value: effectiveModel,
                decoration: const InputDecoration(
                  labelText: 'Vehicle Type',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                items: modelOptions.map((String model) {
                  return DropdownMenuItem<String>(
                    value: model,
                    child: Text(model),
                  );
                }).toList(),
                onChanged: (String? value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _selectedModel = value;
                    _vrnQuery = '';
                    _currentFleetPage = 1;
                    _vehicleCurrentPage.clear();
                  });
                },
              ),
            ),
            SizedBox(
              width: 320,
              child: Autocomplete<String>(
                key: ValueKey<String>('vrn-$effectiveModel-$_vrnQuery'),
                initialValue: TextEditingValue(text: _vrnQuery),
                optionsBuilder: (TextEditingValue textEditingValue) {
                  final query = textEditingValue.text.trim().toLowerCase();
                  if (availableVrns.isEmpty) {
                    return const Iterable<String>.empty();
                  }
                  if (query.isEmpty) {
                    return availableVrns;
                  }
                  return availableVrns.where((String option) {
                    return option.toLowerCase().contains(query);
                  });
                },
                onSelected: (String value) {
                  setState(() {
                    _vrnQuery = value;
                    _currentFleetPage = 1;
                  });
                },
                fieldViewBuilder: (
                  BuildContext context,
                  TextEditingController textEditingController,
                  FocusNode focusNode,
                  VoidCallback onFieldSubmitted,
                ) {
                  return TextField(
                    controller: textEditingController,
                    focusNode: focusNode,
                    decoration: const InputDecoration(
                      labelText: 'Search VRN / Chassis',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onChanged: (String value) {
                      setState(() {
                        _vrnQuery = value;
                        _currentFleetPage = 1;
                      });
                    },
                  );
                },
              ),
            ),
            OutlinedButton.icon(
              onPressed: () {
                setState(() {
                  _selectedModel = 'All';
                  _vrnQuery = '';
                  _currentFleetPage = 1;
                  _expandedFleets.clear();
                  _vehicleCurrentPage.clear();
                });
              },
              icon: const Icon(Icons.clear),
              label: const Text('Clear'),
            ),
          ],
        ),
      ),
    );
  }

  DataColumn _sortableColumn(
    String title,
    String key, {
    bool numeric = false,
  }) {
    final isActive = _sortKey == key;
    final indicator = isActive ? (_sortAscending ? ' ▲' : ' ▼') : '';
    return DataColumn(
      numeric: numeric,
      label: InkWell(
        onTap: () => _onSort(key),
        child: Text('$title$indicator'),
      ),
    );
  }

  void _onSort(String key) {
    setState(() {
      if (_sortKey == key) {
        _sortAscending = !_sortAscending;
      } else {
        _sortKey = key;
        _sortAscending = true;
      }
      _currentFleetPage = 1;
      _vehicleCurrentPage.clear();
    });
  }

  int _entryComparator(_FleetSummaryEntry left, _FleetSummaryEntry right) {
    final result = switch (_sortKey) {
      'displayId' => left.displayId.toLowerCase().compareTo(right.displayId.toLowerCase()),
      'model' => left.model.toLowerCase().compareTo(right.model.toLowerCase()),
      'status' => left.modeLabel.compareTo(right.modeLabel),
      'soc' => left.socNumeric.compareTo(right.socNumeric),
      'speed' => left.speed.compareTo(right.speed),
      'dte' => left.dteNumeric.compareTo(right.dteNumeric),
      'cellTemperature' => left.cellTemperatureNumeric.compareTo(right.cellTemperatureNumeric),
      'odometer' => left.odometer.compareTo(right.odometer),
      'energyConsumption' => left.energyConsumption.compareTo(right.energyConsumption),
      'traction' => left.traction.compareTo(right.traction),
      'regeneration' => left.regeneration.compareTo(right.regeneration),
      'co2Saved' => left.co2Saved.compareTo(right.co2Saved),
      'runTime' => left.runTime.compareTo(right.runTime),
      'idleTime' => left.idleTime.compareTo(right.idleTime),
      'chargingUnit' => left.chargingUnit.compareTo(right.chargingUnit),
      'costSaved' => left.costSaved.compareTo(right.costSaved),
      _ => 0,
    };
    return _sortAscending ? result : -result;
  }

  String _normalize(String value) {
    return value.trim().toLowerCase();
  }

  String _formatNumber(
    double value, {
    int decimals = 2,
    String suffix = '',
    bool zeroAsDash = true,
  }) {
    if (zeroAsDash && value == 0) {
      return '-';
    }
    return '${value.toStringAsFixed(decimals)}$suffix';
  }

  String _formatOptional(dynamic value, {String suffix = ''}) {
    if (value == null) {
      return 'N/A';
    }
    if (value is num) {
      return '${value.toStringAsFixed(1)}$suffix';
    }
    final parsed = double.tryParse(value.toString().replaceAll(',', '').trim());
    if (parsed != null) {
      return '${parsed.toStringAsFixed(1)}$suffix';
    }
    final text = value.toString().trim();
    if (text.isEmpty ||
        text == '-' ||
        text.toLowerCase() == 'null' ||
        text.toLowerCase() == 'n/a') {
      return 'N/A';
    }
    return text;
  }
}

class _FleetSummaryEntry {
  const _FleetSummaryEntry({
    required this.deviceId,
    required this.displayId,
    required this.model,
    required this.fleetName,
    required this.mode,
    required this.soc,
    required this.speed,
    required this.dte,
    required this.cellTemperature,
    required this.odometer,
    required this.energyConsumption,
    required this.traction,
    required this.regeneration,
    required this.co2Saved,
    required this.runTime,
    required this.idleTime,
    required this.chargingUnit,
    required this.costSaved,
  });

  final String deviceId;
  final String displayId;
  final String model;
  final String fleetName;
  final VehicleMode mode;
  final dynamic soc;
  final double speed;
  final dynamic dte;
  final dynamic cellTemperature;
  final double odometer;
  final double energyConsumption;
  final double traction;
  final double regeneration;
  final double co2Saved;
  final double runTime;
  final double idleTime;
  final double chargingUnit;
  final double costSaved;

  String get modeLabel {
    return switch (mode) {
      VehicleMode.active => 'Active',
      VehicleMode.inactive => 'Inactive',
      VehicleMode.nogps => 'No GPS',
      VehicleMode.pending => 'Pending',
    };
  }

  double get socNumeric => _parseDoubleValue(soc);
  double get dteNumeric => _parseDoubleValue(dte);
  double get cellTemperatureNumeric => _parseDoubleValue(cellTemperature);

  factory _FleetSummaryEntry.fromSources({
    required Vehicle vehicle,
    required Device? device,
    required Map<String, dynamic>? report,
  }) {
    final displayId = vehicle.displayId.trim().isNotEmpty
        ? vehicle.displayId
        : vehicle.vehicleId;
    final model = _pickText(
      vehicle.vehicleType,
      device?.deviceTypeName,
    );
    final fleetName = _pickText(
      device?.fleetOwner,
      device?.fleet,
      vehicle.fleet,
    );

    return _FleetSummaryEntry(
      deviceId: vehicle.vehicleId,
      displayId: displayId,
      model: model,
      fleetName: fleetName,
      mode: vehicle.mode,
      soc: vehicle.soc,
      speed: vehicle.speed,
      dte: vehicle.dte,
      cellTemperature: vehicle.cellTemperature,
      odometer: _metric(
        report,
        <String>['total_distance', 'distance', 'odometer'],
        fallback: _parseDoubleValue(vehicle.odometer),
      ),
      energyConsumption: _metric(
        report,
        <String>['energy_consumption', 'energy', 'energy_consumed'],
      ),
      traction: _metric(
        report,
        <String>['traction_energy', 'motor_ec'],
      ),
      regeneration: _metric(
        report,
        <String>['regen_energy'],
      ),
      co2Saved: _metric(
        report,
        <String>['co2_saving', 'co2_saved'],
      ),
      runTime: _metric(
        report,
        <String>['run_time', 'runtime'],
      ),
      idleTime: _metric(
        report,
        <String>['idle_time'],
      ),
      chargingUnit: _metric(
        report,
        <String>['charging_unit'],
      ),
      costSaved: _metric(
        report,
        <String>['cost_saved'],
      ),
    );
  }

  static String _pickText(dynamic first, [dynamic second, dynamic third]) {
    final candidates = <dynamic>[first, second, third];
    for (final dynamic item in candidates) {
      if (item == null) {
        continue;
      }
      final text = item.toString().trim();
      if (text.isNotEmpty && text.toLowerCase() != 'n/a' && text.toLowerCase() != 'null') {
        return text;
      }
    }
    return 'N/A';
  }

  static double _metric(
    Map<String, dynamic>? report,
    List<String> keys, {
    double fallback = 0,
  }) {
    if (report != null) {
      for (final String key in keys) {
        if (!report.containsKey(key)) {
          continue;
        }
        final raw = report[key];
        if (raw == null) {
          continue;
        }
        if (raw is String) {
          final normalized = raw.trim().toLowerCase();
          if (normalized.isEmpty || normalized == '-' || normalized == 'n/a') {
            continue;
          }
        }
        final parsed = _parseDoubleValue(raw);
        return parsed;
      }
    }
    return fallback;
  }

  static double _parseDoubleValue(dynamic value) {
    if (value == null) {
      return 0;
    }
    if (value is num) {
      return value.toDouble();
    }
    final text = value.toString().trim();
    if (text.isEmpty || text == '-' || text.toLowerCase() == 'n/a') {
      return 0;
    }
    return double.tryParse(text.replaceAll(',', '')) ?? 0;
  }
}

class _FleetTotals {
  const _FleetTotals({
    required this.odometer,
    required this.energyConsumption,
    required this.traction,
    required this.regeneration,
    required this.co2Saved,
    required this.runTime,
    required this.idleTime,
    required this.chargingUnit,
    required this.costSaved,
  });

  final double odometer;
  final double energyConsumption;
  final double traction;
  final double regeneration;
  final double co2Saved;
  final double runTime;
  final double idleTime;
  final double chargingUnit;
  final double costSaved;

  factory _FleetTotals.fromEntries(List<_FleetSummaryEntry> entries) {
    var odometer = 0.0;
    var energy = 0.0;
    var traction = 0.0;
    var regeneration = 0.0;
    var co2 = 0.0;
    var runTime = 0.0;
    var idleTime = 0.0;
    var chargingUnit = 0.0;
    var cost = 0.0;

    for (final _FleetSummaryEntry entry in entries) {
      odometer += entry.odometer;
      energy += entry.energyConsumption;
      traction += entry.traction;
      regeneration += entry.regeneration;
      co2 += entry.co2Saved;
      runTime += entry.runTime;
      idleTime += entry.idleTime;
      chargingUnit += entry.chargingUnit;
      cost += entry.costSaved;
    }

    return _FleetTotals(
      odometer: odometer,
      energyConsumption: energy,
      traction: traction,
      regeneration: regeneration,
      co2Saved: co2,
      runTime: runTime,
      idleTime: idleTime,
      chargingUnit: chargingUnit,
      costSaved: cost,
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    this.unit = '',
  });

  final String title;
  final String value;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 210,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                title,
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  Text(
                    value,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  if (unit.isNotEmpty) ...<Widget>[
                    const SizedBox(width: 6),
                    Text(unit),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 700),
        child: Card(
          margin: const EdgeInsets.all(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                Text(message),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
