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
  _MgmtView _activeView = _MgmtView.fleet;
  _MgmtTimePeriod _timePeriod = _MgmtTimePeriod.cumulative;
  _MapStatusFilter _mapStatusFilter = _MapStatusFilter.total;

  bool _isSummaryLoading = false;
  String? _summaryError;
  List<dynamic> _summaryRows = const <dynamic>[];

  @override
  void initState() {
    super.initState();
    _loadSummaryIfNeeded();
  }

  @override
  void didUpdateWidget(covariant ManagementDashboardPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _loadSummaryIfNeeded();
    }
  }

  Future<void> _loadSummaryIfNeeded() async {
    if (_timePeriod == _MgmtTimePeriod.cumulative) {
      setState(() {
        _summaryRows = const <dynamic>[];
        _summaryError = null;
        _isSummaryLoading = false;
      });
      return;
    }

    setState(() {
      _isSummaryLoading = true;
      _summaryError = null;
    });

    try {
      final period = switch (_timePeriod) {
        _MgmtTimePeriod.daily => 'today',
        _MgmtTimePeriod.weekly => 'week',
        _MgmtTimePeriod.monthly => 'month',
        _MgmtTimePeriod.cumulative => 'today',
      };
      final rows = await widget.controller.fetchSummaryData(period: period);
      setState(() {
        _summaryRows = rows;
      });
    } catch (error) {
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

  @override
  Widget build(BuildContext context) {
    final vehicles = widget.controller.productionVehicles;
    final filteredMapVehicles = _filterVehiclesForMap(vehicles);
    final vehicleCounts = _computeCounts(vehicles);
    final metrics = widget.controller.fleetMetrics;

    final treesSaved = _computeTreesSaved(metrics);

    return RefreshIndicator(
      onRefresh: () async {
        await widget.controller.refreshDevices();
        await widget.controller.refreshAlerts();
        await _loadSummaryIfNeeded();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          _buildHeader(context),
          const SizedBox(height: 12),
          _buildKpiGrid(
            context,
            metrics: metrics,
            treesSaved: treesSaved,
          ),
          const SizedBox(height: 16),
          _buildStatusBar(
            counts: vehicleCounts,
          ),
          const SizedBox(height: 8),
          Card(
            child: SizedBox(
              height: 430,
              child: filteredMapVehicles.isEmpty
                  ? const Center(
                      child: Text('No vehicles to show on map for this filter.'),
                    )
                  : VehicleClusterMap(vehicles: filteredMapVehicles),
            ),
          ),
          const SizedBox(height: 16),
          _buildSummarySection(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
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
                    });
                  },
                ),
                ChoiceChip(
                  label: const Text('Platform'),
                  selected: _activeView == _MgmtView.platform,
                  onSelected: (_) {
                    setState(() {
                      _activeView = _MgmtView.platform;
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
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
        _loadSummaryIfNeeded();
      },
    );
  }

  Widget _buildKpiGrid(
    BuildContext context, {
    required FleetMetrics metrics,
    required int treesSaved,
  }) {
    final entries = <_KpiEntry>[
      _KpiEntry('Distance', metrics.totalDistance, 'km'),
      _KpiEntry('Money Saved', metrics.costSaved, 'INR'),
      _KpiEntry('CO2 Saved', metrics.co2Saving, 'kg'),
      _KpiEntry('Energy Units', metrics.energyConsumption, 'kWh'),
      _KpiEntry('Runtime', metrics.runTime, 'hrs'),
      _KpiEntry('Traction', metrics.tractionEnergy, 'kWh'),
      _KpiEntry('Regeneration', metrics.regenEnergy, 'kWh'),
      _KpiEntry('Trees Saved', '$treesSaved', ''),
    ];

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

  Widget _buildSummarySection(BuildContext context) {
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
              const Text(
                'Switch to Daily / Weekly / Monthly to view summary trend data.',
              )
            else if (_isSummaryLoading)
              const Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              )
            else if (_summaryError != null)
              Text(
                _summaryError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              )
            else if (_summaryRows.isEmpty)
              const Text('No summary records available for selected period.')
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _buildSummaryAggregates(_summaryRows)
                        .map(
                          (_KpiEntry item) => Chip(
                            label: Text('${item.title}: ${item.value}${item.unit}'),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const <DataColumn>[
                        DataColumn(label: Text('#')),
                        DataColumn(label: Text('Record')),
                      ],
                      rows: _summaryRows.take(25).toList().asMap().entries.map((entry) {
                        final index = entry.key;
                        final value = entry.value;
                        return DataRow(
                          cells: <DataCell>[
                            DataCell(Text('${index + 1}')),
                            DataCell(
                              SizedBox(
                                width: 600,
                                child: Text(
                                  value is Map
                                      ? value.entries
                                          .map((e) => '${e.key}: ${e.value}')
                                          .join(' | ')
                                      : value.toString(),
                                ),
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  List<_KpiEntry> _buildSummaryAggregates(List<dynamic> rows) {
    double sumForKeys(List<String> keys) {
      var sum = 0.0;
      for (final dynamic row in rows) {
        if (row is! Map) {
          continue;
        }
        final map = Map<String, dynamic>.from(row as Map);
        for (final String key in keys) {
          final value = map[key];
          if (value != null) {
            sum += _asDouble(value);
            break;
          }
        }
      }
      return sum;
    }

    final distance = sumForKeys(<String>['total_distance', 'distance']);
    final co2 = sumForKeys(<String>['co2_saving', 'co2_saved']);
    final energy = sumForKeys(<String>['energy_consumption', 'energy']);
    final runTime = sumForKeys(<String>['run_time', 'runtime']);

    return <_KpiEntry>[
      _KpiEntry('Distance', distance.toStringAsFixed(1), ' km'),
      _KpiEntry('CO2', co2.toStringAsFixed(1), ' kg'),
      _KpiEntry('Energy', energy.toStringAsFixed(1), ' kWh'),
      _KpiEntry('Run Time', runTime.toStringAsFixed(1), ' hrs'),
    ];
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

  int _computeTreesSaved(FleetMetrics metrics) {
    final value = _asDouble(metrics.co2Saving);
    if (value <= 0) {
      return 0;
    }
    return (value / 12.5).round();
  }

  double _asDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value.toString()) ?? 0;
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
