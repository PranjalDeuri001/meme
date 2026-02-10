import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/vehicle.dart';

enum _StatusFilter {
  all,
  running,
  inactive,
  nogps,
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

  final TextEditingController _searchController = TextEditingController();
  _StatusFilter _statusFilter = _StatusFilter.all;
  String _regionFilter = 'All';
  String _cityFilter = 'All';
  String _fleetFilter = 'All';
  String _typeFilter = 'All';
  int _currentPage = 1;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rows = _buildRows(widget.controller.productionVehicles);
    final filteredRows = rows.where((row) => _matchesFilters(row)).toList();

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
    final pageRows =
        (start < filteredRows.length) ? filteredRows.sublist(start, end) : <_VehicleStatusRow>[];

    final runningCount = rows.where((r) => r.status == 'Running').length;
    final inactiveCount = rows.where((r) => r.status == 'Inactive').length;
    final noGpsCount = rows.where((r) => r.status == 'No GPS').length;
    final totalDistance = rows.fold<double>(0, (sum, row) => sum + row.odometerKm);

    final regionOptions = <String>{
      'All',
      ...rows.map((r) => r.region).where((value) => value.trim().isNotEmpty),
    }.toList()
      ..sort();
    final cityOptions = <String>{
      'All',
      ...rows.map((r) => r.city).where((value) => value.trim().isNotEmpty),
    }.toList()
      ..sort();
    final fleetOptions = <String>{
      'All',
      ...rows.map((r) => r.fleet).where((value) => value.trim().isNotEmpty),
    }.toList()
      ..sort();
    final typeOptions = <String>{
      'All',
      ...rows.map((r) => r.vehicleType).where((value) => value.trim().isNotEmpty),
    }.toList()
      ..sort();

    return RefreshIndicator(
      onRefresh: () async {
        await widget.controller.refreshDevices();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Vehicle Status',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _KpiCard(title: 'Total Fleet', value: '${rows.length}', subtitle: 'vehicles'),
              _KpiCard(
                title: 'Approx Distance',
                value: totalDistance.toStringAsFixed(1),
                subtitle: 'km',
              ),
              _KpiCard(title: 'Running', value: '$runningCount', subtitle: 'live'),
              _KpiCard(title: 'Inactive', value: '$inactiveCount', subtitle: 'live'),
              _KpiCard(title: 'No GPS', value: '$noGpsCount', subtitle: 'live'),
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
                      DropdownMenuItem(value: _StatusFilter.all, child: Text('All Status')),
                      DropdownMenuItem(value: _StatusFilter.running, child: Text('Running')),
                      DropdownMenuItem(value: _StatusFilter.inactive, child: Text('Inactive')),
                      DropdownMenuItem(value: _StatusFilter.nogps, child: Text('No GPS')),
                    ],
                  ),
                  _dropdown(
                    value: _regionFilter,
                    options: regionOptions,
                    onChanged: (value) => setState(() {
                      _regionFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _cityFilter,
                    options: cityOptions,
                    onChanged: (value) => setState(() {
                      _cityFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _fleetFilter,
                    options: fleetOptions,
                    onChanged: (value) => setState(() {
                      _fleetFilter = value;
                      _currentPage = 1;
                    }),
                  ),
                  _dropdown(
                    value: _typeFilter,
                    options: typeOptions,
                    onChanged: (value) => setState(() {
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
          if (pageRows.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No vehicles matching current criteria.'),
              ),
            )
          else
            Card(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: const <DataColumn>[
                    DataColumn(label: Text('Vehicle')),
                    DataColumn(label: Text('Status')),
                    DataColumn(label: Text('Region')),
                    DataColumn(label: Text('City')),
                    DataColumn(label: Text('Fleet')),
                    DataColumn(label: Text('Type')),
                    DataColumn(label: Text('Speed')),
                    DataColumn(label: Text('SOC')),
                    DataColumn(label: Text('Odometer')),
                  ],
                  rows: pageRows.map((row) {
                    return DataRow(
                      cells: <DataCell>[
                        DataCell(Text(row.vehicleLabel)),
                        DataCell(Text(row.status)),
                        DataCell(Text(row.region)),
                        DataCell(Text(row.city)),
                        DataCell(Text(row.fleet)),
                        DataCell(Text(row.vehicleType)),
                        DataCell(Text('${row.speedKmh.toStringAsFixed(1)} km/h')),
                        DataCell(Text(row.socText)),
                        DataCell(Text('${row.odometerKm.toStringAsFixed(1)} km')),
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
    return DropdownButton<String>(
      value: options.contains(value) ? value : options.first,
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

  List<_VehicleStatusRow> _buildRows(List<Vehicle> vehicles) {
    return vehicles.map((Vehicle vehicle) {
      final status = switch (vehicle.mode) {
        VehicleMode.active => 'Running',
        VehicleMode.nogps => 'No GPS',
        VehicleMode.inactive => 'Inactive',
        VehicleMode.pending => 'Inactive',
      };
      final region = _regionFromCoordinates(vehicle.latitude, vehicle.longitude);
      return _VehicleStatusRow(
        vehicleLabel: vehicle.displayId,
        vehicleId: vehicle.vehicleId,
        status: status,
        region: region,
        city: vehicle.city,
        fleet: vehicle.fleet,
        vehicleType: vehicle.vehicleType,
        speedKmh: vehicle.speed,
        socText: vehicle.soc?.toString() ?? 'N/A',
        odometerKm: _toDouble(vehicle.odometer),
      );
    }).toList();
  }

  bool _matchesFilters(_VehicleStatusRow row) {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isNotEmpty) {
      final target = '${row.vehicleLabel} ${row.vehicleId}'.toLowerCase();
      if (!target.contains(query)) {
        return false;
      }
    }

    if (_statusFilter == _StatusFilter.running && row.status != 'Running') {
      return false;
    }
    if (_statusFilter == _StatusFilter.inactive && row.status != 'Inactive') {
      return false;
    }
    if (_statusFilter == _StatusFilter.nogps && row.status != 'No GPS') {
      return false;
    }

    if (_regionFilter != 'All' && row.region != _regionFilter) {
      return false;
    }
    if (_cityFilter != 'All' && row.city != _cityFilter) {
      return false;
    }
    if (_fleetFilter != 'All' && row.fleet != _fleetFilter) {
      return false;
    }
    if (_typeFilter != 'All' && row.vehicleType != _typeFilter) {
      return false;
    }
    return true;
  }

  String _regionFromCoordinates(double latitude, double longitude) {
    if (!latitude.isFinite || !longitude.isFinite || (latitude == 0 && longitude == 0)) {
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

  double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }
}

class _VehicleStatusRow {
  const _VehicleStatusRow({
    required this.vehicleLabel,
    required this.vehicleId,
    required this.status,
    required this.region,
    required this.city,
    required this.fleet,
    required this.vehicleType,
    required this.speedKmh,
    required this.socText,
    required this.odometerKm,
  });

  final String vehicleLabel;
  final String vehicleId;
  final String status;
  final String region;
  final String city;
  final String fleet;
  final String vehicleType;
  final double speedKmh;
  final String socText;
  final double odometerKm;
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
      width: 180,
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
