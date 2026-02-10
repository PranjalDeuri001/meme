import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
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
  String _selectedModel = 'All';
  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    final allVehicles = widget.controller.productionVehicles;
    final availableModels = <String>{
      'All',
      ...allVehicles
          .map((Vehicle v) => v.vehicleType)
          .where((String value) => value.trim().isNotEmpty && value != 'N/A'),
    }.toList()
      ..sort();

    final filteredVehicles = allVehicles.where((Vehicle vehicle) {
      final modelMatch = _selectedModel == 'All' || vehicle.vehicleType == _selectedModel;
      if (!modelMatch) {
        return false;
      }
      if (_searchText.isEmpty) {
        return true;
      }
      final target = '${vehicle.displayId} ${vehicle.vehicleId} ${vehicle.fleet}'
          .toLowerCase();
      return target.contains(_searchText);
    }).toList();

    final grouped = <String, List<Vehicle>>{};
    for (final Vehicle vehicle in filteredVehicles) {
      final fleetName = vehicle.fleet.trim().isEmpty ? 'N/A' : vehicle.fleet;
      grouped.putIfAbsent(fleetName, () => <Vehicle>[]).add(vehicle);
    }
    final sortedFleetNames = grouped.keys.toList()..sort();

    final totalDistance = filteredVehicles.fold<double>(0, (double sum, Vehicle item) {
      return sum + _toDouble(item.odometer);
    });
    final activeCount = filteredVehicles.where((Vehicle v) => v.mode == VehicleMode.active).length;

    return RefreshIndicator(
      onRefresh: widget.controller.refreshDevices,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Fleet Summary',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _SummaryCard(title: 'Total Vehicles', value: '${filteredVehicles.length}'),
              _SummaryCard(title: 'Active Vehicles', value: '$activeCount'),
              _SummaryCard(
                title: 'Approx Distance',
                value: totalDistance.toStringAsFixed(1),
                unit: 'km',
              ),
              _SummaryCard(title: 'Fleets', value: '${sortedFleetNames.length}'),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: <Widget>[
                  DropdownButton<String>(
                    value: _selectedModel,
                    onChanged: (String? value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        _selectedModel = value;
                      });
                    },
                    items: availableModels
                        .map(
                          (String model) => DropdownMenuItem<String>(
                            value: model,
                            child: Text(model),
                          ),
                        )
                        .toList(),
                  ),
                  SizedBox(
                    width: 280,
                    child: TextField(
                      decoration: const InputDecoration(
                        labelText: 'Search VRN / Chassis / Fleet',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onChanged: (String value) {
                        setState(() {
                          _searchText = value.trim().toLowerCase();
                        });
                      },
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _selectedModel = 'All';
                        _searchText = '';
                      });
                    },
                    icon: const Icon(Icons.clear),
                    label: const Text('Clear'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (sortedFleetNames.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No fleets found for selected filters.'),
              ),
            )
          else
            ...sortedFleetNames.map((String fleetName) {
              final fleetVehicles = grouped[fleetName] ?? const <Vehicle>[];
              final fleetActive = fleetVehicles
                  .where((Vehicle v) => v.mode == VehicleMode.active)
                  .length;
              final fleetDistance = fleetVehicles.fold<double>(
                0,
                (double sum, Vehicle v) => sum + _toDouble(v.odometer),
              );
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ExpansionTile(
                  title: Text(fleetName),
                  subtitle: Text(
                    '${fleetVehicles.length} vehicles • Active $fleetActive • Distance ${fleetDistance.toStringAsFixed(1)} km',
                  ),
                  children: <Widget>[
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: DataTable(
                        columns: const <DataColumn>[
                          DataColumn(label: Text('Vehicle')),
                          DataColumn(label: Text('Type')),
                          DataColumn(label: Text('Mode')),
                          DataColumn(label: Text('City')),
                          DataColumn(label: Text('Speed')),
                          DataColumn(label: Text('SOC')),
                        ],
                        rows: fleetVehicles.take(80).map((Vehicle vehicle) {
                          final mode = switch (vehicle.mode) {
                            VehicleMode.active => 'Active',
                            VehicleMode.inactive => 'Inactive',
                            VehicleMode.nogps => 'No GPS',
                            VehicleMode.pending => 'Pending',
                          };
                          return DataRow(
                            cells: <DataCell>[
                              DataCell(Text(vehicle.displayId)),
                              DataCell(Text(vehicle.vehicleType)),
                              DataCell(Text(mode)),
                              DataCell(Text(vehicle.city)),
                              DataCell(Text('${vehicle.speed.toStringAsFixed(1)} km/h')),
                              DataCell(Text(vehicle.soc?.toString() ?? 'N/A')),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '') ?? 0;
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
