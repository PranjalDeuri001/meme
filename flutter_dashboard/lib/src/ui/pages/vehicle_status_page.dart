import 'dart:async';

import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/device.dart';
import '../../models/vehicle.dart';

enum _StatusFilter {
  all,
  running,
  idle,
  charging,
  stopped,
}

class VehicleStatusPage extends StatefulWidget {
  const VehicleStatusPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<VehicleStatusPage> createState() => _VehicleStatusPageState();
}

class _VehicleStatusPageState extends State<VehicleStatusPage> {
  static const int _itemsPerPage = 15;
  static const Duration _pollInterval = Duration(minutes: 1);

  final TextEditingController _searchController = TextEditingController();

  _StatusFilter _statusFilter = _StatusFilter.all;
  String _regionFilter = 'All';
  String _cityFilter = 'All';
  String _fleetFilter = 'All';
  String _typeFilter = 'All';
  String _sortKey = 'id';
  bool _sortAscending = true;
  int _currentPage = 1;

  bool _isSummaryLoading = false;
  String? _summaryError;
  List<Map<String, dynamic>> _dailySummaryRows = <Map<String, dynamic>>[];
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _loadDailySummary();
    _startPolling();
  }

  @override
  void didUpdateWidget(covariant VehicleStatusPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _dailySummaryRows = <Map<String, dynamic>>[];
      _summaryError = null;
      _isSummaryLoading = false;
      _loadDailySummary();
      _startPolling();
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(_pollInterval, (_) {
      _loadDailySummary(showLoader: false);
    });
  }

  Future<void> _loadDailySummary({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() {
        _isSummaryLoading = true;
        _summaryError = null;
      });
    }
    try {
      final today = DateTime.now();
      final rows = await widget.controller.fetchDailySummaryReport(
        startDate: today,
        endDate: today,
      );
      final mappedRows = <Map<String, dynamic>>[];
      for (final dynamic raw in rows) {
        if (raw is! Map) {
          continue;
        }
        mappedRows.add(Map<String, dynamic>.from(raw as Map));
      }
      final uniqueRows = <String, Map<String, dynamic>>{};
      for (final Map<String, dynamic> row in mappedRows) {
        final uniqueKey = _firstText(
              row['imei'],
              row['chassis_number'],
              row['vrn'],
              '${row['vrn']}-${row['date']}-${row['start_odometer']}',
            ) ??
            DateTime.now().microsecondsSinceEpoch.toString();
        uniqueRows[uniqueKey] = row;
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _dailySummaryRows = uniqueRows.values.toList();
        _summaryError = null;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _summaryError = error.toString();
      });
    } finally {
      if (mounted && showLoader) {
        setState(() {
          _isSummaryLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final liveById = <String, Vehicle>{
      for (final Vehicle vehicle in widget.controller.productionVehicles)
        vehicle.vehicleId: vehicle,
    };
    final devicesById = <String, Device>{
      for (final Device device in widget.controller.allDevices)
        device.deviceId: device,
    };

    final rows = _dailySummaryRows
        .map((Map<String, dynamic> row) {
          final vehicleId = _firstText(
            row['imei'],
            row['device_id'],
            row['vehicle_id'],
          );
          final live = vehicleId == null ? null : liveById[vehicleId];
          final device = vehicleId == null ? null : devicesById[vehicleId];
          return _VehicleStatusRow.fromSources(
            raw: row,
            liveVehicle: live,
            device: device,
          );
        })
        .toList();

    final baseFilteredRows = rows.where((row) {
      if (_regionFilter != 'All' && row.region != _regionFilter) {
        return false;
      }
      if (_cityFilter != 'All' && row.city != _cityFilter) {
        return false;
      }
      if (_fleetFilter != 'All' && row.depot != _fleetFilter) {
        return false;
      }
      if (_typeFilter != 'All' && row.vehicleTypeName != _typeFilter) {
        return false;
      }
      return true;
    }).toList();

    final query = _searchController.text.trim().toLowerCase();
    final filteredRows = baseFilteredRows.where((row) {
      if (query.isNotEmpty) {
        if (!row.searchIndex.contains(query)) {
          return false;
        }
      }
      switch (_statusFilter) {
        case _StatusFilter.all:
          break;
        case _StatusFilter.running:
          if (row.status != 'Running') {
            return false;
          }
          break;
        case _StatusFilter.idle:
          if (row.status != 'Idle') {
            return false;
          }
          break;
        case _StatusFilter.charging:
          if (row.status != 'Charging') {
            return false;
          }
          break;
        case _StatusFilter.stopped:
          if (row.status != 'Stopped') {
            return false;
          }
          break;
      }
      return true;
    }).toList()
      ..sort(_compareRows);

    final totalPages =
        ((filteredRows.length / _itemsPerPage).ceil().clamp(1, 9999)) as int;
    final safePage = (_currentPage.clamp(1, totalPages)) as int;
    if (safePage != _currentPage) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _currentPage = safePage;
          });
        }
      });
    }
    final start = (safePage - 1) * _itemsPerPage;
    final end = (start + _itemsPerPage).clamp(0, filteredRows.length);
    final pageRows = start < filteredRows.length
        ? filteredRows.sublist(start, end)
        : const <_VehicleStatusRow>[];

    final runningCount = baseFilteredRows.where((r) => r.status == 'Running').length;
    final idleCount = baseFilteredRows.where((r) => r.status == 'Idle').length;
    final chargingCount = baseFilteredRows.where((r) => r.status == 'Charging').length;
    final stoppedCount = baseFilteredRows.where((r) => r.status == 'Stopped').length;
    final totalDistance = baseFilteredRows.fold<double>(
      0,
      (double sum, _VehicleStatusRow row) => sum + (row.dailyKm ?? 0),
    );

    final regionOptions = <String>{
      'All',
      ...rows.map((r) => r.region).where((String value) {
        return value.trim().isNotEmpty && value.toLowerCase() != 'n/a';
      }),
    }.toList()
      ..sort();
    final cityOptions = <String>{
      'All',
      ...rows.map((r) => r.city).where((String value) {
        return value.trim().isNotEmpty && value.toLowerCase() != 'n/a';
      }),
    }.toList()
      ..sort();
    final fleetOptions = <String>{
      'All',
      ...rows.map((r) => r.depot).where((String value) {
        return value.trim().isNotEmpty && value.toLowerCase() != 'n/a';
      }),
    }.toList()
      ..sort();
    final typeOptions = <String>{
      'All',
      ...rows.map((r) => r.vehicleTypeName).where((String value) {
        return value.trim().isNotEmpty && value.toLowerCase() != 'n/a';
      }),
    }.toList()
      ..sort();

    if (_isSummaryLoading && rows.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () async {
        await widget.controller.refreshDevices();
        await _loadDailySummary(showLoader: true);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Vehicle Status',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () {
                  _loadDailySummary(showLoader: true);
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_isSummaryLoading)
            const LinearProgressIndicator(minHeight: 2),
          if (_summaryError != null) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              _summaryError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _KpiCard(
                title: 'Total Fleet',
                value: '${baseFilteredRows.length}',
                subtitle: 'vehicles',
              ),
              _KpiCard(
                title: 'Daily Distance',
                value: totalDistance.toStringAsFixed(0),
                subtitle: 'km Today',
              ),
              _KpiCard(title: 'Running', value: '$runningCount', subtitle: 'vehicles'),
              _KpiCard(title: 'Idle', value: '$idleCount', subtitle: 'vehicles'),
              _KpiCard(title: 'Charging', value: '$chargingCount', subtitle: 'vehicles'),
              _KpiCard(title: 'Stopped', value: '$stoppedCount', subtitle: 'vehicles'),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: <Widget>[
                  SizedBox(
                    width: 280,
                    child: TextField(
                      controller: _searchController,
                      decoration: const InputDecoration(
                        labelText: 'Search VRN / Chassis / Vehicle ID',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onChanged: (_) => setState(() => _currentPage = 1),
                    ),
                  ),
                  DropdownButton<_StatusFilter>(
                    value: _statusFilter,
                    onChanged: (_StatusFilter? value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        _statusFilter = value;
                        _currentPage = 1;
                      });
                    },
                    items: const <DropdownMenuItem<_StatusFilter>>[
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.all,
                        child: Text('All Status'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.running,
                        child: Text('Running'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.idle,
                        child: Text('Idle'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.charging,
                        child: Text('Charging'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.stopped,
                        child: Text('Stopped'),
                      ),
                    ],
                  ),
                  _dropdown(
                    value: _regionFilter,
                    options: regionOptions,
                    onChanged: (String value) => setState(() {
                      _regionFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _cityFilter,
                    options: cityOptions,
                    onChanged: (String value) => setState(() {
                      _cityFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _fleetFilter,
                    options: fleetOptions,
                    onChanged: (String value) => setState(() {
                      _fleetFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _typeFilter,
                    options: typeOptions,
                    onChanged: (String value) => setState(() {
                      _typeFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _searchController.clear();
                        _statusFilter = _StatusFilter.all;
                        _regionFilter = 'All';
                        _cityFilter = 'All';
                        _fleetFilter = 'All';
                        _typeFilter = 'All';
                        _sortKey = 'id';
                        _sortAscending = true;
                        _currentPage = 1;
                      });
                    },
                    icon: const Icon(Icons.clear),
                    label: const Text('Clear Filters'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (rows.isEmpty && !_isSummaryLoading)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No vehicle summary data available for the selected period.'),
              ),
            )
          else if (pageRows.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No vehicles found matching your criteria.'),
              ),
            )
          else
            Card(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: <DataColumn>[
                    _sortableColumn('VRN / Chassis', 'vrn'),
                    _sortableColumn('Status', 'status'),
                    _sortableColumn('Date', 'date'),
                    _sortableColumn('Vehicle Type', 'vehicle_type_name'),
                    _sortableColumn('Region', 'region'),
                    _sortableColumn('City', 'city'),
                    _sortableColumn('Depot', 'depot'),
                    _sortableColumn('Start Odo (km)', 'startOdometer', numeric: true),
                    _sortableColumn('End Odo (km)', 'endOdometer', numeric: true),
                    _sortableColumn('Daily KM', 'dailyKm', numeric: true),
                    _sortableColumn('Running (min)', 'runningTime', numeric: true),
                    _sortableColumn('Idle (min)', 'idleTime', numeric: true),
                    _sortableColumn('Charging (min)', 'chargingTime', numeric: true),
                    _sortableColumn('Stoppage (min)', 'stoppageTime', numeric: true),
                    _sortableColumn('Avg Speed', 'averageSpeed', numeric: true),
                    _sortableColumn('Start SOC (%)', 'startSoc', numeric: true),
                    _sortableColumn('End SOC (%)', 'battery', numeric: true),
                    _sortableColumn('Motor EC', 'motorEc', numeric: true),
                    _sortableColumn('DC-DC EC', 'dcdcEc', numeric: true),
                    _sortableColumn('E-Comp EC', 'ecompEc', numeric: true),
                    _sortableColumn('BCS EC', 'bcsEc', numeric: true),
                    _sortableColumn('TCS EC', 'tcsEc', numeric: true),
                    _sortableColumn('Energy Consumed', 'energyConsumed', numeric: true),
                    _sortableColumn('Energy Cons./km', 'energyConsumption', numeric: true),
                    _sortableColumn('Regen Energy', 'regenEnergy', numeric: true),
                    _sortableColumn('Charging Unit', 'chargingUnit', numeric: true),
                    _sortableColumn('Batt Temp (°C)', 'batteryTemp', numeric: true),
                    _sortableColumn('Motor Temp (°C)', 'motorTemp', numeric: true),
                  ],
                  rows: pageRows.map((row) {
                    return DataRow(
                      cells: <DataCell>[
                        DataCell(Text(row.displayId)),
                        DataCell(_StatusPill(status: row.status)),
                        DataCell(Text(row.date)),
                        DataCell(Text(row.vehicleTypeName)),
                        DataCell(Text(row.region)),
                        DataCell(Text(row.city)),
                        DataCell(Text(row.depot)),
                        DataCell(Text(_formatNumber(row.startOdometer, decimals: 1))),
                        DataCell(Text(_formatNumber(row.endOdometer, decimals: 1))),
                        DataCell(Text(_formatNumber(row.dailyKm, decimals: 1))),
                        DataCell(Text(_formatNumber(row.runningTime, decimals: 0))),
                        DataCell(Text(_formatNumber(row.idleTime, decimals: 0))),
                        DataCell(Text(_formatNumber(row.chargingTime, decimals: 0))),
                        DataCell(Text(_formatNumber(row.stoppageTime, decimals: 0))),
                        DataCell(Text(_formatNumber(row.averageSpeed, decimals: 1))),
                        DataCell(Text(_formatNumber(row.startSoc, decimals: 0))),
                        DataCell(Text(_formatNumber(row.endSoc, decimals: 0))),
                        DataCell(Text(_formatNumber(row.motorEc, decimals: 2))),
                        DataCell(Text(_formatNumber(row.dcdcEc, decimals: 2))),
                        DataCell(Text(_formatNumber(row.ecompEc, decimals: 2))),
                        DataCell(Text(_formatNumber(row.bcsEc, decimals: 2))),
                        DataCell(Text(_formatNumber(row.tcsEc, decimals: 2))),
                        DataCell(Text(_formatNumber(row.energyConsumed, decimals: 2))),
                        DataCell(Text(_formatNumber(row.energyConsumption, decimals: 2))),
                        DataCell(Text(_formatNumber(row.regenEnergy, decimals: 2))),
                        DataCell(Text(_formatNumber(row.chargingUnit, decimals: 2))),
                        DataCell(Text(_formatNumber(row.batteryTemp, decimals: 1))),
                        DataCell(Text(_formatNumber(row.motorTemp, decimals: 1))),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          const SizedBox(height: 10),
          if (filteredRows.isNotEmpty)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                OutlinedButton(
                  onPressed: safePage > 1
                      ? () {
                          setState(() {
                            _currentPage -= 1;
                          });
                        }
                      : null,
                  child: const Text('Previous'),
                ),
                const SizedBox(width: 12),
                Text('Page $safePage of $totalPages'),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: safePage < totalPages
                      ? () {
                          setState(() {
                            _currentPage += 1;
                          });
                        }
                      : null,
                  child: const Text('Next'),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _dropdown({
    required String value,
    required List<String> options,
    required ValueChanged<String> onChanged,
  }) {
    final safeValue = options.contains(value) ? value : options.first;
    return DropdownButton<String>(
      value: safeValue,
      onChanged: (String? selected) {
        if (selected == null) {
          return;
        }
        onChanged(selected);
      },
      items: options
          .map((String item) => DropdownMenuItem<String>(
                value: item,
                child: Text(item),
              ))
          .toList(),
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
        onTap: () {
          setState(() {
            if (_sortKey == key) {
              _sortAscending = !_sortAscending;
            } else {
              _sortKey = key;
              _sortAscending = true;
            }
            _currentPage = 1;
          });
        },
        child: Text('$title$indicator'),
      ),
    );
  }

  int _compareRows(_VehicleStatusRow a, _VehicleStatusRow b) {
    final left = a.sortValue(_sortKey);
    final right = b.sortValue(_sortKey);

    final leftMissing = _isMissing(left);
    final rightMissing = _isMissing(right);
    if (leftMissing && !rightMissing) {
      return 1;
    }
    if (!leftMissing && rightMissing) {
      return -1;
    }
    if (leftMissing && rightMissing) {
      return 0;
    }

    final leftNum = _tryParseDouble(left);
    final rightNum = _tryParseDouble(right);
    int result;
    if (leftNum != null && rightNum != null) {
      result = leftNum.compareTo(rightNum);
    } else {
      result = left.toString().toLowerCase().compareTo(
            right.toString().toLowerCase(),
          );
    }
    return _sortAscending ? result : -result;
  }

  bool _isMissing(dynamic value) {
    if (value == null) {
      return true;
    }
    final text = value.toString().trim().toLowerCase();
    return text.isEmpty || text == '-' || text == 'n/a' || text == 'null';
  }

  double? _tryParseDouble(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value.toString().replaceAll(',', '').trim());
  }

  String _formatNumber(
    double? value, {
    int decimals = 1,
  }) {
    if (value == null) {
      return '-';
    }
    return value.toStringAsFixed(decimals);
  }
}

class _VehicleStatusRow {
  const _VehicleStatusRow({
    required this.id,
    required this.vrn,
    required this.chassisNumber,
    required this.displayId,
    required this.status,
    required this.date,
    required this.vehicleTypeName,
    required this.region,
    required this.city,
    required this.depot,
    required this.startOdometer,
    required this.endOdometer,
    required this.dailyKm,
    required this.runningTime,
    required this.idleTime,
    required this.chargingTime,
    required this.stoppageTime,
    required this.averageSpeed,
    required this.startSoc,
    required this.endSoc,
    required this.motorEc,
    required this.dcdcEc,
    required this.ecompEc,
    required this.bcsEc,
    required this.tcsEc,
    required this.energyConsumed,
    required this.energyConsumption,
    required this.regenEnergy,
    required this.chargingUnit,
    required this.batteryTemp,
    required this.motorTemp,
  });

  final String id;
  final String vrn;
  final String chassisNumber;
  final String displayId;
  final String status;
  final String date;
  final String vehicleTypeName;
  final String region;
  final String city;
  final String depot;
  final double? startOdometer;
  final double? endOdometer;
  final double? dailyKm;
  final double? runningTime;
  final double? idleTime;
  final double? chargingTime;
  final double? stoppageTime;
  final double? averageSpeed;
  final double? startSoc;
  final double? endSoc;
  final double? motorEc;
  final double? dcdcEc;
  final double? ecompEc;
  final double? bcsEc;
  final double? tcsEc;
  final double? energyConsumed;
  final double? energyConsumption;
  final double? regenEnergy;
  final double? chargingUnit;
  final double? batteryTemp;
  final double? motorTemp;

  String get searchIndex {
    return '$id $vrn $chassisNumber $displayId'.toLowerCase();
  }

  factory _VehicleStatusRow.fromSources({
    required Map<String, dynamic> raw,
    required Vehicle? liveVehicle,
    required Device? device,
  }) {
    final id = _firstText(
          raw['imei'],
          raw['device_id'],
          liveVehicle?.vehicleId,
          device?.deviceId,
        ) ??
        'N/A';
    final vrn = _firstText(
      raw['vrn'],
      raw['VRN'],
      device?.vrn,
    );
    final chassis = _firstText(
      raw['chassis_number'],
      device?.chassisNumber,
    );
    final displayId = vrn ?? chassis ?? id;

    final city = _firstText(
          raw['city'],
          device?.city,
          liveVehicle?.city,
        ) ??
        'N/A';
    final latitude = _parseDouble(
      raw['latitude'],
      fallback: liveVehicle?.latitude,
    );
    final longitude = _parseDouble(
      raw['longitude'],
      fallback: liveVehicle?.longitude,
    );
    final region = _regionFromCityOrCoords(
      city: city,
      latitude: latitude,
      longitude: longitude,
    );

    final status = _statusFromRawMode(
      raw['mode'],
      fallback: liveVehicle?.mode,
    );
    final batteryEndSoc = _parseDouble(
      raw['end_soc'],
      fallback: _parseDouble(liveVehicle?.soc),
    );

    return _VehicleStatusRow(
      id: id,
      vrn: vrn ?? '-',
      chassisNumber: chassis ?? '-',
      displayId: displayId,
      status: status,
      date: _firstText(raw['date']) ?? 'N/A',
      vehicleTypeName:
          _firstText(raw['vehicle_type_name'], device?.deviceTypeName, liveVehicle?.vehicleType) ??
              'N/A',
      region: region,
      city: city,
      depot: _firstText(raw['fleet'], device?.fleetOwner, device?.fleet, liveVehicle?.fleet) ??
          'N/A',
      startOdometer: _parseDouble(raw['start_odometer']),
      endOdometer: _parseDouble(raw['end_odometer']),
      dailyKm: _parseDouble(raw['distance']),
      runningTime: _parseDouble(raw['runtime_minutes']),
      idleTime: _parseDouble(raw['idle_minutes']),
      chargingTime: _parseDouble(raw['charging_minutes']),
      stoppageTime: _parseDouble(raw['stoppage_minutes']),
      averageSpeed: _parseDouble(
        raw['average_speed'],
        fallback: liveVehicle?.speed,
      ),
      startSoc: _parseDouble(raw['start_soc']),
      endSoc: batteryEndSoc,
      motorEc: _parseDouble(raw['motor_ec']),
      dcdcEc: _parseDouble(raw['dcdc_ec']),
      ecompEc: _parseDouble(raw['ecompressor_and_steering_ec']),
      bcsEc: _parseDouble(raw['bcs_ec']),
      tcsEc: _parseDouble(raw['tcs_ec']),
      energyConsumed: _parseDouble(raw['energy_consumed']),
      energyConsumption: _parseDouble(raw['energy_consumption']),
      regenEnergy: _parseDouble(raw['regen_energy']),
      chargingUnit: _parseDouble(raw['charging_unit']),
      batteryTemp: _parseDouble(
        raw['battery_temperature'],
        fallback: _parseDouble(liveVehicle?.cellTemperature),
      ),
      motorTemp: _parseDouble(raw['motor_temperature']),
    );
  }

  dynamic sortValue(String key) {
    return switch (key) {
      'id' => id,
      'vrn' => displayId,
      'status' => status,
      'date' => date,
      'vehicle_type_name' => vehicleTypeName,
      'region' => region,
      'city' => city,
      'depot' => depot,
      'startOdometer' => startOdometer,
      'endOdometer' => endOdometer,
      'dailyKm' => dailyKm,
      'runningTime' => runningTime,
      'idleTime' => idleTime,
      'chargingTime' => chargingTime,
      'stoppageTime' => stoppageTime,
      'averageSpeed' => averageSpeed,
      'startSoc' => startSoc,
      'battery' => endSoc,
      'motorEc' => motorEc,
      'dcdcEc' => dcdcEc,
      'ecompEc' => ecompEc,
      'bcsEc' => bcsEc,
      'tcsEc' => tcsEc,
      'energyConsumed' => energyConsumed,
      'energyConsumption' => energyConsumption,
      'regenEnergy' => regenEnergy,
      'chargingUnit' => chargingUnit,
      'batteryTemp' => batteryTemp,
      'motorTemp' => motorTemp,
      _ => id,
    };
  }

  static String _statusFromRawMode(dynamic mode, {VehicleMode? fallback}) {
    final text = mode?.toString().toLowerCase().trim() ?? '';
    if (text.contains('movement') || text.contains('running')) {
      return 'Running';
    }
    if (text.contains('idle')) {
      return 'Idle';
    }
    if (text.contains('charging')) {
      return 'Charging';
    }
    if (text.contains('stopped')) {
      return 'Stopped';
    }

    if (fallback != null) {
      return switch (fallback) {
        VehicleMode.active => 'Running',
        VehicleMode.inactive => 'Stopped',
        VehicleMode.nogps => 'Stopped',
        VehicleMode.pending => 'Stopped',
      };
    }
    return 'Stopped';
  }

  static String _regionFromCityOrCoords({
    required String city,
    required double? latitude,
    required double? longitude,
  }) {
    final cityLower = city.toLowerCase().trim();
    final state = _districtToState[cityLower];
    if (state != null) {
      return _stateToRegion[state] ?? 'Central';
    }

    if (latitude == null || longitude == null || (latitude == 0 && longitude == 0)) {
      return 'Central';
    }
    if (latitude > 28.0) {
      return 'North';
    }
    if (latitude < 18.0) {
      return 'South';
    }
    if (longitude > 88.0) {
      return 'East';
    }
    if (longitude < 75.0) {
      return 'West';
    }
    return 'Central';
  }

  static double? _parseDouble(dynamic value, {double? fallback}) {
    if (value == null) {
      return fallback;
    }
    if (value is num) {
      return value.toDouble();
    }
    final text = value.toString().trim();
    if (text.isEmpty || text == '-' || text.toLowerCase() == 'n/a' || text.toLowerCase() == 'null') {
      return fallback;
    }
    return double.tryParse(text.replaceAll(',', '')) ?? fallback;
  }

  static const Map<String, String> _stateToRegion = <String, String>{
    'jammu and kashmir': 'North',
    'ladakh': 'North',
    'himachal pradesh': 'North',
    'punjab': 'North',
    'haryana': 'North',
    'uttarakhand': 'North',
    'uttar pradesh': 'North',
    'delhi': 'North',
    'chandigarh': 'North',
    'rajasthan': 'West',
    'gujarat': 'West',
    'goa': 'West',
    'maharashtra': 'West',
    'dadra and nagar haveli and daman and diu': 'West',
    'andhra pradesh': 'South',
    'telangana': 'South',
    'karnataka': 'South',
    'kerala': 'South',
    'tamil nadu': 'South',
    'puducherry': 'South',
    'andaman and nicobar islands': 'South',
    'lakshadweep': 'South',
    'bihar': 'East',
    'jharkhand': 'East',
    'odisha': 'East',
    'west bengal': 'East',
    'sikkim': 'North East',
    'arunachal pradesh': 'North East',
    'assam': 'North East',
    'manipur': 'North East',
    'meghalaya': 'North East',
    'mizoram': 'North East',
    'nagaland': 'North East',
    'tripura': 'North East',
    'madhya pradesh': 'Central',
    'chhattisgarh': 'Central',
    'tanzania': 'East Africa',
  };

  static const Map<String, String> _districtToState = <String, String>{
    'visakhapatnam': 'andhra pradesh',
    'vijayawada': 'andhra pradesh',
    'guntur': 'andhra pradesh',
    'nellore': 'andhra pradesh',
    'kurnool': 'andhra pradesh',
    'itanagar': 'arunachal pradesh',
    'tawang': 'arunachal pradesh',
    'guwahati': 'assam',
    'dispur': 'assam',
    'dibrugarh': 'assam',
    'silchar': 'assam',
    'patna': 'bihar',
    'gaya': 'bihar',
    'muzaffarpur': 'bihar',
    'bhagalpur': 'bihar',
    'raipur': 'chhattisgarh',
    'bilaspur': 'chhattisgarh',
    'durg': 'chhattisgarh',
    'panaji': 'goa',
    'margao': 'goa',
    'ahmedabad': 'gujarat',
    'surat': 'gujarat',
    'vadodara': 'gujarat',
    'rajkot': 'gujarat',
    'gandhinagar': 'gujarat',
    'faridabad': 'haryana',
    'gurgaon': 'haryana',
    'gurugram': 'haryana',
    'panipat': 'haryana',
    'ambala': 'haryana',
    'shimla': 'himachal pradesh',
    'manali': 'himachal pradesh',
    'dharamshala': 'himachal pradesh',
    'ranchi': 'jharkhand',
    'jamshedpur': 'jharkhand',
    'dhanbad': 'jharkhand',
    'bengaluru': 'karnataka',
    'bangalore': 'karnataka',
    'mysuru': 'karnataka',
    'mysore': 'karnataka',
    'mangaluru': 'karnataka',
    'hubballi-dharwad': 'karnataka',
    'belagavi': 'karnataka',
    'thiruvananthapuram': 'kerala',
    'kochi': 'kerala',
    'kozhikode': 'kerala',
    'thrissur': 'kerala',
    'indore': 'madhya pradesh',
    'bhopal': 'madhya pradesh',
    'jabalpur': 'madhya pradesh',
    'gwalior': 'madhya pradesh',
    'mumbai': 'maharashtra',
    'pune': 'maharashtra',
    'nagpur': 'maharashtra',
    'thane': 'maharashtra',
    'nashik': 'maharashtra',
    'aurangabad': 'maharashtra',
    'solapur': 'maharashtra',
    'kolhapur': 'maharashtra',
    'imphal': 'manipur',
    'shillong': 'meghalaya',
    'aizawl': 'mizoram',
    'kohima': 'nagaland',
    'dimapur': 'nagaland',
    'delhi': 'delhi',
    'new delhi': 'delhi',
    'bhubaneswar': 'odisha',
    'cuttack': 'odisha',
    'puri': 'odisha',
    'amritsar': 'punjab',
    'ludhiana': 'punjab',
    'jalandhar': 'punjab',
    'patiala': 'punjab',
    'chandigarh': 'punjab',
    'jaipur': 'rajasthan',
    'jodhpur': 'rajasthan',
    'udaipur': 'rajasthan',
    'kota': 'rajasthan',
    'ajmer': 'rajasthan',
    'gangtok': 'sikkim',
    'chennai': 'tamil nadu',
    'coimbatore': 'tamil nadu',
    'madurai': 'tamil nadu',
    'tiruchirappalli': 'tamil nadu',
    'hyderabad': 'telangana',
    'warangal': 'telangana',
    'karimnagar': 'telangana',
    'agartala': 'tripura',
    'lucknow': 'uttar pradesh',
    'kanpur': 'uttar pradesh',
    'ghaziabad': 'uttar pradesh',
    'agra': 'uttar pradesh',
    'varanasi': 'uttar pradesh',
    'noida': 'uttar pradesh',
    'meerut': 'uttar pradesh',
    'dehradun': 'uttarakhand',
    'haridwar': 'uttarakhand',
    'nainital': 'uttarakhand',
    'kolkata': 'west bengal',
    'howrah': 'west bengal',
    'durgapur': 'west bengal',
    'siliguri': 'west bengal',
    'zanzibar': 'tanzania',
  };
}

String? _firstText(
  dynamic first, [
  dynamic second,
  dynamic third,
  dynamic fourth,
]) {
  final values = <dynamic>[first, second, third, fourth];
  for (final dynamic value in values) {
    if (value == null) {
      continue;
    }
    final text = value.toString().trim();
    if (text.isNotEmpty &&
        text != '-' &&
        text.toLowerCase() != 'n/a' &&
        text.toLowerCase() != 'null') {
      return text;
    }
  }
  return null;
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.status,
  });

  final String status;

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg) = switch (status) {
      'Running' => (Colors.green.shade100, Colors.green.shade800),
      'Idle' => (Colors.orange.shade100, Colors.orange.shade900),
      'Charging' => (Colors.indigo.shade100, Colors.indigo.shade800),
      _ => (Colors.red.shade100, Colors.red.shade800),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 190,
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
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              Text(subtitle),
            ],
          ),
        ),
      ),
    );
  }
}
