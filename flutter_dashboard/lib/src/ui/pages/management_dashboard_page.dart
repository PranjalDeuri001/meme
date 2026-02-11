import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/fleet_metrics.dart';
import '../../models/vehicle.dart';
import '../widgets/vehicle_cluster_map.dart';

enum _MgmtView {
  fleet,
  platform,
}

enum _MgmtTimePeriod {
  cumulative,
  daily,
  weekly,
  monthly,
}

enum _MapStatusFilter {
  total,
  active,
  inactive,
}

enum _TrendChartType {
  line,
  bar,
}

class ManagementDashboardPage extends StatefulWidget {
  const ManagementDashboardPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<ManagementDashboardPage> createState() => _ManagementDashboardPageState();
}

class _ManagementDashboardPageState extends State<ManagementDashboardPage> {
  static const double _costPerKwh = 8;
  static const double _co2PerKwh = 0.82;
  static const String _allOption = 'All';
  static const Set<String> _excludedImeis = <String>{};

  static const Map<String, List<String>> _platformCategories =
      <String, List<String>>{
    'Bus': <String>['7M', '9M', '12M', '13.5M'],
    'Truck': <String>['1.5T', '55T', '5T'],
    '3W': <String>['3S', '6S'],
  };

  _MgmtView _activeView = _MgmtView.fleet;
  _MgmtTimePeriod _timePeriod = _MgmtTimePeriod.cumulative;
  _MapStatusFilter _mapStatusFilter = _MapStatusFilter.total;

  String _activeFleet = _allOption;
  String _activeCategory = _allOption;
  String _activePlatform = _allOption;

  bool _isSummaryLoading = false;
  String? _summaryError;
  final Map<_MgmtTimePeriod, List<dynamic>> _summaryCache =
      <_MgmtTimePeriod, List<dynamic>>{};
  final Set<_MgmtTimePeriod> _loadedSummaryPeriods = <_MgmtTimePeriod>{};

  Timer? _dailyPollingTimer;
  Object? _previousMetricsFilter;

  @override
  void initState() {
    super.initState();
    _previousMetricsFilter = widget.controller.selectedMetricsFilter;
    _syncMetricsFilter();
    _syncDailyPolling();
  }

  @override
  void didUpdateWidget(covariant ManagementDashboardPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.setSelectedMetricsFilter(_previousMetricsFilter);
      _previousMetricsFilter = widget.controller.selectedMetricsFilter;
      _syncMetricsFilter();
      _loadSummaryIfNeeded(force: true);
    }
  }

  @override
  void dispose() {
    _dailyPollingTimer?.cancel();
    widget.controller.setSelectedMetricsFilter(_previousMetricsFilter);
    super.dispose();
  }

  Future<void> _loadSummaryIfNeeded({bool force = false}) async {
    if (_timePeriod == _MgmtTimePeriod.cumulative) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSummaryLoading = false;
        _summaryError = null;
      });
      return;
    }

    if (!force && _loadedSummaryPeriods.contains(_timePeriod)) {
      return;
    }

    if (mounted) {
      setState(() {
        _isSummaryLoading = true;
        _summaryError = null;
      });
    }

    try {
      final rows = await widget.controller.fetchSummaryData(
        period: _summaryApiPeriod(_timePeriod),
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _summaryCache[_timePeriod] = rows;
        _loadedSummaryPeriods.add(_timePeriod);
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _summaryError = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSummaryLoading = false;
        });
      }
    }
  }

  String _summaryApiPeriod(_MgmtTimePeriod period) {
    return switch (period) {
      _MgmtTimePeriod.daily => 'today',
      _MgmtTimePeriod.weekly => 'week',
      _MgmtTimePeriod.monthly => 'month',
      _MgmtTimePeriod.cumulative => 'today',
    };
  }

  void _syncDailyPolling() {
    _dailyPollingTimer?.cancel();
    if (_timePeriod != _MgmtTimePeriod.daily) {
      return;
    }
    _dailyPollingTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) {
        _loadSummaryIfNeeded(force: true);
      },
    );
  }

  void _syncMetricsFilter() {
    widget.controller.setSelectedMetricsFilter(_buildKpiQueryArg());
  }

  Object? _buildKpiQueryArg() {
    if (_activeView == _MgmtView.platform) {
      if (_activePlatform != _allOption) {
        return _activePlatform;
      }
      if (_activeCategory != _allOption) {
        return <String, dynamic>{'platform': _activeCategory};
      }
      return null;
    }
    if (_activeFleet != _allOption) {
      return <String, dynamic>{'fleet': _activeFleet};
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final allVehicles = widget.controller.productionVehicles;
    final fleetOptions = _buildFleetOptions(allVehicles);
    final platformOptions = _buildPlatformOptionsForCategory(_activeCategory);
    final safeFleet = fleetOptions.contains(_activeFleet) ? _activeFleet : _allOption;
    final safePlatform =
        platformOptions.contains(_activePlatform) ? _activePlatform : _allOption;

    final scopedVehicles = _filterVehiclesByDashboardSelection(allVehicles);
    final filteredMapVehicles = _filterVehiclesForMap(scopedVehicles);
    final vehicleCounts = _computeCounts(scopedVehicles);

    final activeSummaryRows = _summaryCache[_timePeriod] ?? const <dynamic>[];
    final historicalKpis = _computeHistoricalKpis(activeSummaryRows);
    final trendData = _buildTrendData(activeSummaryRows);
    final cumulativeEntries = _buildCumulativeKpiEntries(widget.controller.fleetMetrics);
    final historicalEntries = _buildHistoricalKpiEntries(historicalKpis);
    final kpiEntries =
        _timePeriod == _MgmtTimePeriod.cumulative ? cumulativeEntries : historicalEntries;

    if (widget.controller.isVehiclesLoading && allVehicles.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (widget.controller.vehiclesError != null && allVehicles.isEmpty) {
      return _ErrorCard(
        title: 'Failed to load management dashboard data',
        message: widget.controller.vehiclesError!,
      );
    }

    final mapFilterSignature =
        '${_activeView.name}|$safeFleet|$_activeCategory|$safePlatform|${_mapStatusFilter.name}';

    return RefreshIndicator(
      onRefresh: () async {
        await widget.controller.refreshDevices();
        await widget.controller.refreshAlerts();
        await _loadSummaryIfNeeded(force: true);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          _buildHeaderCard(
            context,
            fleetOptions: fleetOptions,
            safeFleet: safeFleet,
            platformOptions: platformOptions,
            safePlatform: safePlatform,
          ),
          const SizedBox(height: 12),
          _buildKpiGrid(context, kpiEntries),
          const SizedBox(height: 16),
          _buildStatusBar(counts: vehicleCounts),
          const SizedBox(height: 8),
          Card(
            child: SizedBox(
              height: 430,
              child: filteredMapVehicles.isEmpty
                  ? const Center(
                      child: Text('No vehicles to show on map for this filter.'),
                    )
                  : VehicleClusterMap(
                      vehicles: filteredMapVehicles,
                      filterSignature: mapFilterSignature,
                    ),
            ),
          ),
          const SizedBox(height: 16),
          _buildPerformanceTrendsSection(
            context,
            trendData: trendData,
            activeSummaryRows: activeSummaryRows,
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderCard(
    BuildContext context, {
    required List<String> fleetOptions,
    required String safeFleet,
    required List<String> platformOptions,
    required String safePlatform,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Management Dashboard',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                ChoiceChip(
                  label: const Text('Fleet'),
                  selected: _activeView == _MgmtView.fleet,
                  onSelected: (_) {
                    setState(() {
                      _activeView = _MgmtView.fleet;
                      _activeCategory = _allOption;
                      _activePlatform = _allOption;
                    });
                    _syncMetricsFilter();
                  },
                ),
                ChoiceChip(
                  label: const Text('Platform'),
                  selected: _activeView == _MgmtView.platform,
                  onSelected: (_) {
                    setState(() {
                      _activeView = _MgmtView.platform;
                      _activeFleet = _allOption;
                    });
                    _syncMetricsFilter();
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_activeView == _MgmtView.fleet)
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  SizedBox(
                    width: 280,
                    child: DropdownButtonFormField<String>(
                      value: safeFleet,
                      decoration: const InputDecoration(
                        labelText: 'Fleet',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: fleetOptions.map((String fleet) {
                        return DropdownMenuItem<String>(
                          value: fleet,
                          child: Text(fleet),
                        );
                      }).toList(),
                      onChanged: (String? value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _activeFleet = value;
                        });
                        _syncMetricsFilter();
                      },
                    ),
                  ),
                ],
              )
            else
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  SizedBox(
                    width: 220,
                    child: DropdownButtonFormField<String>(
                      value: _activeCategory,
                      decoration: const InputDecoration(
                        labelText: 'Platform Category',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: <String>[
                        _allOption,
                        ..._platformCategories.keys,
                      ].map((String category) {
                        return DropdownMenuItem<String>(
                          value: category,
                          child: Text(category),
                        );
                      }).toList(),
                      onChanged: (String? value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _activeCategory = value;
                          _activePlatform = _allOption;
                        });
                        _syncMetricsFilter();
                      },
                    ),
                  ),
                  SizedBox(
                    width: 220,
                    child: DropdownButtonFormField<String>(
                      value: safePlatform,
                      decoration: const InputDecoration(
                        labelText: 'Platform Model',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: platformOptions.map((String model) {
                        return DropdownMenuItem<String>(
                          value: model,
                          child: Text(model),
                        );
                      }).toList(),
                      onChanged: _activeCategory == _allOption
                          ? null
                          : (String? value) {
                              if (value == null) {
                                return;
                              }
                              setState(() {
                                _activePlatform = value;
                              });
                              _syncMetricsFilter();
                            },
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                _periodChip(_MgmtTimePeriod.cumulative, 'Cumulative'),
                _periodChip(_MgmtTimePeriod.daily, 'Daily'),
                _periodChip(_MgmtTimePeriod.weekly, 'Weekly'),
                _periodChip(_MgmtTimePeriod.monthly, 'Monthly'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _periodChip(_MgmtTimePeriod period, String label) {
    return ChoiceChip(
      label: Text(label),
      selected: _timePeriod == period,
      onSelected: (_) {
        setState(() {
          _timePeriod = period;
        });
        _syncDailyPolling();
        _loadSummaryIfNeeded();
      },
    );
  }

  Widget _buildKpiGrid(BuildContext context, List<_KpiEntry> entries) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: entries.map((entry) {
        return SizedBox(
          width: 210,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    entry.title,
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: <Widget>[
                      Text(
                        entry.value,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      if (entry.unit.isNotEmpty) ...<Widget>[
                        const SizedBox(width: 6),
                        Text(entry.unit),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStatusBar({
    required _VehicleCounts counts,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: <Widget>[
        _statusChip(
          label: 'Total: ${counts.total}',
          selected: _mapStatusFilter == _MapStatusFilter.total,
          onTap: () => setState(() => _mapStatusFilter = _MapStatusFilter.total),
        ),
        _statusChip(
          label: 'Active: ${counts.active}',
          selected: _mapStatusFilter == _MapStatusFilter.active,
          onTap: () => setState(() => _mapStatusFilter = _MapStatusFilter.active),
        ),
        _statusChip(
          label: 'Inactive: ${counts.inactive}',
          selected: _mapStatusFilter == _MapStatusFilter.inactive,
          onTap: () => setState(() => _mapStatusFilter = _MapStatusFilter.inactive),
        ),
        Chip(label: Text('No GPS: ${counts.nogps}')),
      ],
    );
  }

  Widget _statusChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }

  Widget _buildPerformanceTrendsSection(
    BuildContext context, {
    required _TrendData trendData,
    required List<dynamic> activeSummaryRows,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Performance Trends',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            if (_timePeriod == _MgmtTimePeriod.cumulative)
              const _CumulativeOverlay()
            else if (_isSummaryLoading && activeSummaryRows.isEmpty)
              const Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              )
            else if (_summaryError != null)
              Text(
                _summaryError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              )
            else if (activeSummaryRows.isEmpty)
              const Text('No summary records available for selected period.')
            else
              LayoutBuilder(
                builder: (BuildContext context, BoxConstraints constraints) {
                  final availableWidth = constraints.maxWidth;
                  final chartWidth = availableWidth > 1100
                      ? (availableWidth - 12) / 2
                      : availableWidth;

                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: <Widget>[
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'Distance Trend (km)',
                          labels: trendData.labels,
                          primaryValues: trendData.distance,
                          primaryColor: Colors.blue,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.line,
                        ),
                      ),
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'Money Saved (INR)',
                          labels: trendData.labels,
                          primaryValues: trendData.moneySaved,
                          primaryColor: Colors.green,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.line,
                        ),
                      ),
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'CO2 Saved (kg)',
                          labels: trendData.labels,
                          primaryValues: trendData.co2Saved,
                          primaryColor: Colors.teal,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.bar,
                        ),
                      ),
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'Energy Balance (kWh)',
                          labels: trendData.labels,
                          primaryValues: trendData.energyUnits,
                          secondaryValues: trendData.regeneration,
                          primaryColor: Colors.deepPurple,
                          secondaryColor: Colors.indigo,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.line,
                        ),
                      ),
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'Runtime (hrs)',
                          labels: trendData.labels,
                          primaryValues: trendData.runtime,
                          primaryColor: Colors.orange,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.line,
                        ),
                      ),
                      SizedBox(
                        width: chartWidth,
                        child: _TrendChartCard(
                          title: 'Traction Energy (kWh)',
                          labels: trendData.labels,
                          primaryValues: trendData.traction,
                          primaryColor: Colors.redAccent,
                          timePeriod: _timePeriod,
                          chartType: _TrendChartType.line,
                        ),
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  List<_KpiEntry> _buildCumulativeKpiEntries(FleetMetrics metrics) {
    final co2 = _tryParseMetricValue(metrics.co2Saving) ?? 0;
    final treesSaved = _computeTreesSaved(co2);

    return <_KpiEntry>[
      _KpiEntry('Distance', _formatMetricText(metrics.totalDistance), 'km'),
      _KpiEntry('Money Saved', _formatMetricText(metrics.costSaved), 'INR'),
      _KpiEntry('CO2 Saved', _formatMetricText(metrics.co2Saving), 'kg'),
      _KpiEntry('Energy Units', _formatMetricText(metrics.energyConsumption), 'kWh'),
      _KpiEntry('Runtime', _formatMetricText(metrics.runTime), 'hrs'),
      _KpiEntry('Traction', _formatMetricText(metrics.tractionEnergy), 'kWh'),
      _KpiEntry('Regeneration', _formatMetricText(metrics.regenEnergy), 'kWh'),
      _KpiEntry('Trees Saved', '$treesSaved', ''),
    ];
  }

  List<_KpiEntry> _buildHistoricalKpiEntries(_HistoricalKpis historicalKpis) {
    final treesSaved = _computeTreesSaved(historicalKpis.co2Saving);
    return <_KpiEntry>[
      _KpiEntry('Distance', _formatNumber(historicalKpis.totalDistance), 'km'),
      _KpiEntry('Money Saved', _formatNumber(historicalKpis.costSaved), 'INR'),
      _KpiEntry('CO2 Saved', _formatNumber(historicalKpis.co2Saving), 'kg'),
      _KpiEntry('Energy Units', _formatNumber(historicalKpis.energyConsumption), 'kWh'),
      _KpiEntry('Runtime', _formatNumber(historicalKpis.runTime), 'hrs'),
      _KpiEntry('Traction', _formatNumber(historicalKpis.tractionEnergy), 'kWh'),
      _KpiEntry('Regeneration', _formatNumber(historicalKpis.regenEnergy), 'kWh'),
      _KpiEntry('Trees Saved', '$treesSaved', ''),
    ];
  }

  List<String> _buildFleetOptions(List<Vehicle> vehicles) {
    final fleets = <String>{};
    for (final Vehicle vehicle in vehicles) {
      final fleet = vehicle.fleet.trim();
      if (fleet.isNotEmpty && fleet.toLowerCase() != 'n/a') {
        fleets.add(fleet);
      }
    }
    final sorted = fleets.toList()..sort();
    return <String>[_allOption, ...sorted];
  }

  List<String> _buildPlatformOptionsForCategory(String category) {
    if (category == _allOption) {
      return const <String>[_allOption];
    }
    final models = _platformCategories[category] ?? const <String>[];
    return <String>[_allOption, ...models];
  }

  List<Vehicle> _filterVehiclesByDashboardSelection(List<Vehicle> vehicles) {
    if (_activeView == _MgmtView.fleet) {
      if (_activeFleet == _allOption) {
        return vehicles;
      }
      return vehicles.where((Vehicle vehicle) {
        return _normalizeText(vehicle.fleet) == _normalizeText(_activeFleet);
      }).toList();
    }

    if (_activeCategory == _allOption) {
      return vehicles;
    }

    if (_activePlatform != _allOption) {
      final activeKey = _normalizeVehicleTypeKey(_activePlatform);
      return vehicles.where((Vehicle vehicle) {
        return _normalizeVehicleTypeKey(vehicle.vehicleType) == activeKey;
      }).toList();
    }

    final keys = _categoryModelKeys(_activeCategory);
    return vehicles.where((Vehicle vehicle) {
      return keys.contains(_normalizeVehicleTypeKey(vehicle.vehicleType));
    }).toList();
  }

  List<Vehicle> _filterVehiclesForMap(List<Vehicle> vehicles) {
    switch (_mapStatusFilter) {
      case _MapStatusFilter.total:
        return vehicles;
      case _MapStatusFilter.active:
        return vehicles.where((Vehicle v) => v.mode == VehicleMode.active).toList();
      case _MapStatusFilter.inactive:
        return vehicles
            .where((Vehicle v) =>
                v.mode == VehicleMode.inactive || v.mode == VehicleMode.pending)
            .toList();
    }
  }

  _VehicleCounts _computeCounts(List<Vehicle> vehicles) {
    var active = 0;
    var inactive = 0;
    var nogps = 0;
    for (final Vehicle vehicle in vehicles) {
      switch (vehicle.mode) {
        case VehicleMode.active:
          active += 1;
          break;
        case VehicleMode.inactive:
        case VehicleMode.pending:
          inactive += 1;
          break;
        case VehicleMode.nogps:
          nogps += 1;
          break;
      }
    }
    return _VehicleCounts(
      total: vehicles.length,
      active: active,
      inactive: inactive,
      nogps: nogps,
    );
  }

  _HistoricalKpis _computeHistoricalKpis(List<dynamic> rows) {
    final filteredData = _filterDataForCalculations(rows);
    var totalDistance = 0.0;
    var energyConsumption = 0.0;
    var runTime = 0.0;
    var tractionEnergy = 0.0;
    var regenEnergy = 0.0;
    final is3WCategory =
        _activeView == _MgmtView.platform && _activeCategory == '3W';

    for (final Map<String, dynamic> row in filteredData) {
      totalDistance += _safeParseDouble(row['distance']);
      energyConsumption += _safeParseDouble(row['energy_consumed']);
      runTime += _safeParseDouble(row['runtime_minutes']) / 60;
      regenEnergy += _safeParseDouble(row['regen_energy']);
      if (!is3WCategory) {
        tractionEnergy += _safeParseDouble(row['motor_ec']);
      }
    }

    return _HistoricalKpis(
      totalDistance: totalDistance,
      energyConsumption: energyConsumption,
      runTime: runTime,
      tractionEnergy: tractionEnergy,
      regenEnergy: regenEnergy,
      costSaved: energyConsumption * _costPerKwh,
      co2Saving: energyConsumption * _co2PerKwh,
    );
  }

  _TrendData _buildTrendData(List<dynamic> rows) {
    final filteredData = _filterDataForCalculations(rows);
    if (filteredData.isEmpty) {
      return _TrendData.empty;
    }

    switch (_timePeriod) {
      case _MgmtTimePeriod.daily:
        return _buildDailyTrendData(filteredData);
      case _MgmtTimePeriod.weekly:
        return _buildWeeklyTrendData(filteredData);
      case _MgmtTimePeriod.monthly:
        return _buildMonthlyTrendData(filteredData);
      case _MgmtTimePeriod.cumulative:
        return _TrendData.empty;
    }
  }

  _TrendData _buildDailyTrendData(List<Map<String, dynamic>> data) {
    final labels = List<String>.generate(
      24,
      (int index) => '${index.toString().padLeft(2, '0')}:00',
    );
    final buckets = _createMetricBuckets(24);
    final is3WCategory =
        _activeView == _MgmtView.platform && _activeCategory == '3W';
    var sessionTotalDistance = 0.0;

    for (final Map<String, dynamic> vehicle in data) {
      final sessionsRaw = vehicle['sessions'];
      if (sessionsRaw is! List) {
        continue;
      }

      for (final dynamic sessionRaw in sessionsRaw) {
        if (sessionRaw is! Map) {
          continue;
        }
        final session = Map<String, dynamic>.from(sessionRaw as Map);
        sessionTotalDistance += _safeParseDouble(session['distance']);

        final sessionDuration = _safeParseDouble(session['duration']);
        final start = _tryParseDateTime(session['start_time_val']);
        final end = _tryParseDateTime(session['end_time_val']);
        if (start == null ||
            end == null ||
            !end.isAfter(start) ||
            sessionDuration <= 0) {
          continue;
        }

        final distancePerMinute = _safeParseDouble(session['distance']) / sessionDuration;
        final energyPerMinute =
            _safeParseDouble(session['session_ec']).abs() / sessionDuration;
        final regenPerMinute = _safeParseDouble(session['session_regen']) / sessionDuration;
        final tractionPerMinute = is3WCategory
            ? 0.0
            : math.max<double>(0, energyPerMinute - regenPerMinute);

        var currentBucket =
            DateTime(start.year, start.month, start.day, start.hour);
        while (currentBucket.isBefore(end)) {
          final nextBucket = currentBucket.add(const Duration(hours: 1));
          final chunkStart = start.isAfter(currentBucket) ? start : currentBucket;
          final chunkEnd = end.isBefore(nextBucket) ? end : nextBucket;
          final chunkMinutes =
              chunkEnd.difference(chunkStart).inMilliseconds / 60000;
          if (chunkMinutes > 0) {
            final bucketIndex = currentBucket.hour % 24;
            buckets.distance[bucketIndex] += distancePerMinute * chunkMinutes;
            buckets.energyUnits[bucketIndex] += energyPerMinute * chunkMinutes;
            buckets.regeneration[bucketIndex] += regenPerMinute * chunkMinutes;
            buckets.traction[bucketIndex] += tractionPerMinute * chunkMinutes;
            buckets.runtime[bucketIndex] += chunkMinutes;
            buckets.moneySaved[bucketIndex] +=
                (energyPerMinute * chunkMinutes) * _costPerKwh;
            buckets.co2Saved[bucketIndex] +=
                (energyPerMinute * chunkMinutes) * _co2PerKwh;
          }
          currentBucket = nextBucket;
        }
      }
    }

    final kpiTotalDistance = data.fold<double>(
      0,
      (double sum, Map<String, dynamic> row) => sum + _safeParseDouble(row['distance']),
    );
    if (kpiTotalDistance > sessionTotalDistance && sessionTotalDistance > 0) {
      final factor = kpiTotalDistance / sessionTotalDistance;
      buckets.distance = buckets.distance.map((double value) => value * factor).toList();
      buckets.energyUnits =
          buckets.energyUnits.map((double value) => value * factor).toList();
      buckets.moneySaved =
          buckets.moneySaved.map((double value) => value * factor).toList();
      buckets.co2Saved = buckets.co2Saved.map((double value) => value * factor).toList();
    }

    buckets.runtime = buckets.runtime
        .map((double value) => _roundTo(value / 60, digits: 2))
        .toList();
    buckets.distance =
        buckets.distance.map((double value) => _roundTo(value, digits: 2)).toList();
    buckets.moneySaved =
        buckets.moneySaved.map((double value) => _roundTo(value, digits: 2)).toList();
    buckets.co2Saved =
        buckets.co2Saved.map((double value) => _roundTo(value, digits: 2)).toList();
    buckets.energyUnits =
        buckets.energyUnits.map((double value) => _roundTo(value, digits: 2)).toList();
    buckets.traction =
        buckets.traction.map((double value) => _roundTo(value, digits: 2)).toList();
    buckets.regeneration =
        buckets.regeneration.map((double value) => _roundTo(value, digits: 2)).toList();

    return _TrendData(
      labels: labels,
      distance: buckets.distance,
      moneySaved: buckets.moneySaved,
      co2Saved: buckets.co2Saved,
      energyUnits: buckets.energyUnits,
      runtime: buckets.runtime,
      traction: buckets.traction,
      regeneration: buckets.regeneration,
    );
  }

  _TrendData _buildWeeklyTrendData(List<Map<String, dynamic>> data) {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final labels = List<String>.generate(7, (int index) {
      final dayDate = monday.add(Duration(days: index));
      final dayName = _weekdayShort(dayDate.weekday);
      final dd = dayDate.day.toString().padLeft(2, '0');
      final mm = dayDate.month.toString().padLeft(2, '0');
      return '$dayName $dd/$mm';
    });

    final buckets = _createMetricBuckets(7);
    for (final Map<String, dynamic> row in data) {
      final date = _tryParseDateTime(row['date']);
      if (date == null) {
        continue;
      }
      final index = date.weekday - 1;
      if (index < 0 || index >= 7) {
        continue;
      }
      final energy = _safeParseDouble(row['energy_consumed']);
      buckets.distance[index] += _safeParseDouble(row['distance']);
      buckets.energyUnits[index] += energy;
      buckets.moneySaved[index] += energy * _costPerKwh;
      buckets.co2Saved[index] += energy * _co2PerKwh;
      buckets.traction[index] += _safeParseDouble(row['motor_ec']);
      buckets.regeneration[index] += _safeParseDouble(row['regen_energy']);
      buckets.runtime[index] += _safeParseDouble(row['runtime_minutes']) / 60;
    }

    return _TrendData(
      labels: labels,
      distance: buckets.distance.map((double value) => _roundTo(value, digits: 2)).toList(),
      moneySaved:
          buckets.moneySaved.map((double value) => _roundTo(value, digits: 2)).toList(),
      co2Saved: buckets.co2Saved.map((double value) => _roundTo(value, digits: 2)).toList(),
      energyUnits:
          buckets.energyUnits.map((double value) => _roundTo(value, digits: 2)).toList(),
      runtime: buckets.runtime.map((double value) => _roundTo(value, digits: 2)).toList(),
      traction: buckets.traction.map((double value) => _roundTo(value, digits: 2)).toList(),
      regeneration:
          buckets.regeneration.map((double value) => _roundTo(value, digits: 2)).toList(),
    );
  }

  _TrendData _buildMonthlyTrendData(List<Map<String, dynamic>> data) {
    final now = DateTime.now();
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final labels =
        List<String>.generate(daysInMonth, (int index) => '${index + 1}');
    final buckets = _createMetricBuckets(daysInMonth);

    for (final Map<String, dynamic> row in data) {
      final date = _tryParseDateTime(row['date']);
      if (date == null) {
        continue;
      }
      final index = date.day - 1;
      if (index < 0 || index >= daysInMonth) {
        continue;
      }
      final energy = _safeParseDouble(row['energy_consumed']);
      buckets.distance[index] += _safeParseDouble(row['distance']);
      buckets.energyUnits[index] += energy;
      buckets.moneySaved[index] += energy * _costPerKwh;
      buckets.co2Saved[index] += energy * _co2PerKwh;
      buckets.traction[index] += _safeParseDouble(row['motor_ec']);
      buckets.regeneration[index] += _safeParseDouble(row['regen_energy']);
      buckets.runtime[index] += _safeParseDouble(row['runtime_minutes']) / 60;
    }

    return _TrendData(
      labels: labels,
      distance: buckets.distance.map((double value) => _roundTo(value, digits: 2)).toList(),
      moneySaved:
          buckets.moneySaved.map((double value) => _roundTo(value, digits: 2)).toList(),
      co2Saved: buckets.co2Saved.map((double value) => _roundTo(value, digits: 2)).toList(),
      energyUnits:
          buckets.energyUnits.map((double value) => _roundTo(value, digits: 2)).toList(),
      runtime: buckets.runtime.map((double value) => _roundTo(value, digits: 2)).toList(),
      traction: buckets.traction.map((double value) => _roundTo(value, digits: 2)).toList(),
      regeneration:
          buckets.regeneration.map((double value) => _roundTo(value, digits: 2)).toList(),
    );
  }

  _MetricBuckets _createMetricBuckets(int length) {
    return _MetricBuckets(
      distance: List<double>.filled(length, 0),
      moneySaved: List<double>.filled(length, 0),
      co2Saved: List<double>.filled(length, 0),
      energyUnits: List<double>.filled(length, 0),
      runtime: List<double>.filled(length, 0),
      traction: List<double>.filled(length, 0),
      regeneration: List<double>.filled(length, 0),
    );
  }

  List<Map<String, dynamic>> _filterDataForCalculations(List<dynamic> data) {
    final rows = <Map<String, dynamic>>[];
    for (final dynamic item in data) {
      if (item is! Map) {
        continue;
      }
      final row = Map<String, dynamic>.from(item as Map);
      final imei = (row['imei'] ?? '').toString();
      if (_excludedImeis.contains(imei)) {
        continue;
      }
      rows.add(row);
    }

    if (_activeView == _MgmtView.fleet) {
      if (_activeFleet == _allOption) {
        return rows;
      }
      return rows.where((Map<String, dynamic> row) {
        return _normalizeText(row['fleet']) == _normalizeText(_activeFleet);
      }).toList();
    }

    if (_activeCategory == _allOption) {
      return rows;
    }
    if (_activePlatform != _allOption) {
      final selected = _normalizeVehicleTypeKey(_activePlatform);
      return rows.where((Map<String, dynamic> row) {
        return _rowVehicleTypeKey(row) == selected;
      }).toList();
    }

    final categoryKeys = _categoryModelKeys(_activeCategory);
    return rows.where((Map<String, dynamic> row) {
      return categoryKeys.contains(_rowVehicleTypeKey(row));
    }).toList();
  }

  Set<String> _categoryModelKeys(String category) {
    final models = _platformCategories[category] ?? const <String>[];
    final keys = models.map(_normalizeVehicleTypeKey).toSet();
    if (category == 'Truck') {
      // Backward compatibility for backends that still report 7T.
      keys.add(_normalizeVehicleTypeKey('7T'));
    }
    return keys;
  }

  String _rowVehicleTypeKey(Map<String, dynamic> row) {
    return _normalizeVehicleTypeKey(
      row['vehicle_type_name'] ?? row['vehicleType'] ?? row['device_type_name'] ?? '',
    );
  }

  String _normalizeVehicleTypeKey(dynamic value) {
    return value.toString().toUpperCase().replaceAll(RegExp(r'\s+'), '');
  }

  String _normalizeText(dynamic value) {
    return value?.toString().trim().toLowerCase() ?? '';
  }

  DateTime? _tryParseDateTime(dynamic value) {
    if (value == null) {
      return null;
    }
    final text = value.toString().trim();
    if (text.isEmpty) {
      return null;
    }
    return DateTime.tryParse(text);
  }

  String _weekdayShort(int weekday) {
    return switch (weekday) {
      DateTime.monday => 'Mon',
      DateTime.tuesday => 'Tue',
      DateTime.wednesday => 'Wed',
      DateTime.thursday => 'Thu',
      DateTime.friday => 'Fri',
      DateTime.saturday => 'Sat',
      DateTime.sunday => 'Sun',
      _ => '',
    };
  }

  double _safeParseDouble(dynamic value, {double defaultValue = 0}) {
    if (value == null) {
      return defaultValue;
    }
    if (value is num) {
      return value.toDouble();
    }
    final text = value.toString().trim();
    if (text.isEmpty || text == '-' || text.toUpperCase() == 'N/A') {
      return defaultValue;
    }
    return double.tryParse(text.replaceAll(',', '')) ?? defaultValue;
  }

  double _roundTo(double value, {int digits = 2}) {
    final factor = math.pow(10, digits).toDouble();
    return (value * factor).round() / factor;
  }

  double? _tryParseMetricValue(String value) {
    final text = value.trim();
    if (text.isEmpty || text.toUpperCase() == 'N/A' || text == '-') {
      return null;
    }
    return double.tryParse(text.replaceAll(',', ''));
  }

  String _formatMetricText(String value) {
    final parsed = _tryParseMetricValue(value);
    if (parsed == null) {
      return '---';
    }
    return _formatNumber(parsed);
  }

  String _formatNumber(double value, {int fractionDigits = 0}) {
    if (!value.isFinite) {
      return '---';
    }
    final fixed = value.toStringAsFixed(fractionDigits);
    final parts = fixed.split('.');
    final whole = parts.first;
    final sign = whole.startsWith('-') ? '-' : '';
    final digits = sign.isEmpty ? whole : whole.substring(1);
    final grouped = digits.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
    if (parts.length == 1) {
      return '$sign$grouped';
    }
    return '$sign$grouped.${parts[1]}';
  }

  int _computeTreesSaved(double co2Saving) {
    if (co2Saving <= 0) {
      return 0;
    }
    return (co2Saving / 12.5).round();
  }
}

class _CumulativeOverlay extends StatelessWidget {
  const _CumulativeOverlay();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
      ),
      child: const Text(
        'Select Daily, Weekly, or Monthly to view Performance Trend graphs.',
      ),
    );
  }
}

class _TrendChartCard extends StatelessWidget {
  const _TrendChartCard({
    required this.title,
    required this.labels,
    required this.primaryValues,
    required this.primaryColor,
    required this.timePeriod,
    required this.chartType,
    this.secondaryValues,
    this.secondaryColor,
  });

  final String title;
  final List<String> labels;
  final List<double> primaryValues;
  final List<double>? secondaryValues;
  final Color primaryColor;
  final Color? secondaryColor;
  final _MgmtTimePeriod timePeriod;
  final _TrendChartType chartType;

  @override
  Widget build(BuildContext context) {
    final hasPrimary = primaryValues.any((double value) => value > 0);
    final hasSecondary =
        secondaryValues?.any((double value) => value > 0) ?? false;
    final hasData = hasPrimary || hasSecondary;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            if (!hasData)
              const SizedBox(
                height: 200,
                child: Center(
                  child: Text('No data available for this period.'),
                ),
              )
            else
              SizedBox(
                height: 200,
                child: _SimpleTrendChart(
                  labels: labels,
                  primaryValues: primaryValues,
                  secondaryValues: secondaryValues,
                  primaryColor: primaryColor,
                  secondaryColor: secondaryColor,
                  chartType: chartType,
                  timePeriod: timePeriod,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SimpleTrendChart extends StatelessWidget {
  const _SimpleTrendChart({
    required this.labels,
    required this.primaryValues,
    required this.primaryColor,
    required this.chartType,
    required this.timePeriod,
    this.secondaryValues,
    this.secondaryColor,
  });

  final List<String> labels;
  final List<double> primaryValues;
  final List<double>? secondaryValues;
  final Color primaryColor;
  final Color? secondaryColor;
  final _TrendChartType chartType;
  final _MgmtTimePeriod timePeriod;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final points = labels.length;
        final minWidthPerPoint = chartType == _TrendChartType.bar ? 26.0 : 22.0;
        final minChartWidth = math.max<double>(
          constraints.maxWidth,
          points * minWidthPerPoint,
        );
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: minChartWidth,
            child: CustomPaint(
              painter: _SimpleTrendPainter(
                labels: labels,
                primaryValues: primaryValues,
                secondaryValues: secondaryValues,
                primaryColor: primaryColor,
                secondaryColor: secondaryColor,
                chartType: chartType,
                xLabelInterval: _labelInterval(timePeriod),
                textColor: Theme.of(context).textTheme.bodySmall?.color ?? Colors.black54,
                gridColor: Theme.of(context).dividerColor.withOpacity(0.45),
              ),
            ),
          ),
        );
      },
    );
  }

  int _labelInterval(_MgmtTimePeriod period) {
    return switch (period) {
      _MgmtTimePeriod.daily => 3,
      _MgmtTimePeriod.monthly => 6,
      _MgmtTimePeriod.weekly => 1,
      _MgmtTimePeriod.cumulative => 1,
    };
  }
}

class _SimpleTrendPainter extends CustomPainter {
  _SimpleTrendPainter({
    required this.labels,
    required this.primaryValues,
    required this.primaryColor,
    required this.chartType,
    required this.xLabelInterval,
    required this.textColor,
    required this.gridColor,
    this.secondaryValues,
    this.secondaryColor,
  });

  final List<String> labels;
  final List<double> primaryValues;
  final List<double>? secondaryValues;
  final Color primaryColor;
  final Color? secondaryColor;
  final _TrendChartType chartType;
  final int xLabelInterval;
  final Color textColor;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (labels.isEmpty || primaryValues.isEmpty) {
      return;
    }

    const leftPadding = 40.0;
    const rightPadding = 10.0;
    const topPadding = 8.0;
    const bottomPadding = 24.0;
    final chartWidth = size.width - leftPadding - rightPadding;
    final chartHeight = size.height - topPadding - bottomPadding;
    if (chartWidth <= 0 || chartHeight <= 0) {
      return;
    }

    final yMax = _findMaxY();
    final baselineY = topPadding + chartHeight;
    final leftX = leftPadding;
    final rightX = leftPadding + chartWidth;

    final gridPaint = Paint()
      ..color = gridColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (int i = 0; i <= 4; i++) {
      final y = topPadding + (chartHeight * (i / 4));
      canvas.drawLine(Offset(leftX, y), Offset(rightX, y), gridPaint);
    }

    _drawYAxisLabel(canvas, text: _compact(yMax), x: 0, y: topPadding - 6);
    _drawYAxisLabel(canvas, text: '0', x: 0, y: baselineY - 6);

    if (chartType == _TrendChartType.bar) {
      _drawBarSeries(canvas, yMax, leftPadding, chartWidth, baselineY, chartHeight);
    } else {
      _drawLineSeries(
        canvas,
        values: primaryValues,
        color: primaryColor,
        yMax: yMax,
        leftPadding: leftPadding,
        chartWidth: chartWidth,
        baselineY: baselineY,
        chartHeight: chartHeight,
        fillArea: true,
      );
      if (secondaryValues != null &&
          secondaryValues!.isNotEmpty &&
          secondaryColor != null) {
        _drawLineSeries(
          canvas,
          values: secondaryValues!,
          color: secondaryColor!,
          yMax: yMax,
          leftPadding: leftPadding,
          chartWidth: chartWidth,
          baselineY: baselineY,
          chartHeight: chartHeight,
          fillArea: false,
        );
      }
    }

    _drawXAxisLabels(canvas, leftPadding, chartWidth, baselineY);
  }

  double _findMaxY() {
    var maxValue = 0.0;
    for (final double value in primaryValues) {
      if (value > maxValue) {
        maxValue = value;
      }
    }
    if (secondaryValues != null) {
      for (final double value in secondaryValues!) {
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }
    if (maxValue <= 0) {
      return 1;
    }
    final order = math.pow(10, (math.log(maxValue) / math.ln10).floor()).toDouble();
    final rounded = (maxValue / order).ceil() * order;
    return rounded;
  }

  void _drawBarSeries(
    Canvas canvas,
    double yMax,
    double leftPadding,
    double chartWidth,
    double baselineY,
    double chartHeight,
  ) {
    final count = primaryValues.length;
    if (count == 0) {
      return;
    }
    final step = chartWidth / count;
    final barWidth = math.max<double>(4.0, step * 0.56);
    final paint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.fill;

    for (int i = 0; i < count; i++) {
      final value = i < primaryValues.length ? primaryValues[i] : 0;
      final normalized = (value / yMax).clamp(0, 1).toDouble();
      final barHeight = chartHeight * normalized;
      final x = leftPadding + (i * step) + ((step - barWidth) / 2);
      final rect = Rect.fromLTWH(x, baselineY - barHeight, barWidth, barHeight);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(3)),
        paint,
      );
    }
  }

  void _drawLineSeries(
    Canvas canvas, {
    required List<double> values,
    required Color color,
    required double yMax,
    required double leftPadding,
    required double chartWidth,
    required double baselineY,
    required double chartHeight,
    required bool fillArea,
  }) {
    if (values.isEmpty) {
      return;
    }
    final points = <Offset>[];
    final denominator = values.length > 1 ? values.length - 1 : 1;
    for (int i = 0; i < values.length; i++) {
      final x = leftPadding + (chartWidth * (i / denominator));
      final normalized = (values[i] / yMax).clamp(0, 1).toDouble();
      final y = baselineY - (chartHeight * normalized);
      points.add(Offset(x, y));
    }

    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      linePath.lineTo(points[i].dx, points[i].dy);
    }

    if (fillArea) {
      final areaPath = Path.from(linePath)
        ..lineTo(points.last.dx, baselineY)
        ..lineTo(points.first.dx, baselineY)
        ..close();
      final areaPaint = Paint()
        ..color = color.withOpacity(0.12)
        ..style = PaintingStyle.fill;
      canvas.drawPath(areaPath, areaPaint);
    }

    final linePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(linePath, linePaint);
  }

  void _drawXAxisLabels(
    Canvas canvas,
    double leftPadding,
    double chartWidth,
    double baselineY,
  ) {
    if (labels.isEmpty) {
      return;
    }
    final denominator = labels.length > 1 ? labels.length - 1 : 1;
    for (int i = 0; i < labels.length; i++) {
      if (i != labels.length - 1 && i % math.max(1, xLabelInterval) != 0) {
        continue;
      }
      final x = leftPadding + (chartWidth * (i / denominator));
      final label = _shortLabel(labels[i]);
      final textPainter = TextPainter(
        text: TextSpan(
          text: label,
          style: TextStyle(
            color: textColor,
            fontSize: 10,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      textPainter.paint(
        canvas,
        Offset(x - (textPainter.width / 2), baselineY + 4),
      );
    }
  }

  String _shortLabel(String label) {
    if (label.contains(':') && label.length >= 2) {
      return label.substring(0, 2);
    }
    if (label.length > 7) {
      return label.substring(0, 7);
    }
    return label;
  }

  String _compact(double value) {
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}k';
    }
    return value.toStringAsFixed(0);
  }

  void _drawYAxisLabel(
    Canvas canvas, {
    required String text,
    required double x,
    required double y,
  }) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, Offset(x, y));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}

class _VehicleCounts {
  const _VehicleCounts({
    required this.total,
    required this.active,
    required this.inactive,
    required this.nogps,
  });

  final int total;
  final int active;
  final int inactive;
  final int nogps;
}

class _KpiEntry {
  const _KpiEntry(this.title, this.value, this.unit);

  final String title;
  final String value;
  final String unit;
}

class _MetricBuckets {
  _MetricBuckets({
    required this.distance,
    required this.moneySaved,
    required this.co2Saved,
    required this.energyUnits,
    required this.runtime,
    required this.traction,
    required this.regeneration,
  });

  List<double> distance;
  List<double> moneySaved;
  List<double> co2Saved;
  List<double> energyUnits;
  List<double> runtime;
  List<double> traction;
  List<double> regeneration;
}

class _HistoricalKpis {
  const _HistoricalKpis({
    required this.totalDistance,
    required this.energyConsumption,
    required this.runTime,
    required this.tractionEnergy,
    required this.regenEnergy,
    required this.costSaved,
    required this.co2Saving,
  });

  final double totalDistance;
  final double energyConsumption;
  final double runTime;
  final double tractionEnergy;
  final double regenEnergy;
  final double costSaved;
  final double co2Saving;
}

class _TrendData {
  const _TrendData({
    required this.labels,
    required this.distance,
    required this.moneySaved,
    required this.co2Saved,
    required this.energyUnits,
    required this.runtime,
    required this.traction,
    required this.regeneration,
  });

  static const _TrendData empty = _TrendData(
    labels: <String>[],
    distance: <double>[],
    moneySaved: <double>[],
    co2Saved: <double>[],
    energyUnits: <double>[],
    runtime: <double>[],
    traction: <double>[],
    regeneration: <double>[],
  );

  final List<String> labels;
  final List<double> distance;
  final List<double> moneySaved;
  final List<double> co2Saved;
  final List<double> energyUnits;
  final List<double> runtime;
  final List<double> traction;
  final List<double> regeneration;
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
