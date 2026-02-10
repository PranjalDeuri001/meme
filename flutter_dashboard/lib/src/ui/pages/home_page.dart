import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/vehicle.dart';
import '../widgets/vehicle_cluster_map.dart';

enum _StatusFilter {
  all,
  active,
  inactive,
  nogps,
}

class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  _StatusFilter _statusFilter = _StatusFilter.all;

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    final vehicles = controller.filteredVehicles.where((Vehicle vehicle) {
      switch (_statusFilter) {
        case _StatusFilter.all:
          return true;
        case _StatusFilter.active:
          return vehicle.mode == VehicleMode.active;
        case _StatusFilter.inactive:
          return vehicle.mode == VehicleMode.inactive;
        case _StatusFilter.nogps:
          return vehicle.mode == VehicleMode.nogps;
      }
    }).toList();

    final allVehicles = controller.productionVehicles;
    final activeCount =
        allVehicles.where((Vehicle v) => v.mode == VehicleMode.active).length;
    final inactiveCount =
        allVehicles.where((Vehicle v) => v.mode == VehicleMode.inactive).length;
    final noGpsCount =
        allVehicles.where((Vehicle v) => v.mode == VehicleMode.nogps).length;

    if (controller.isVehiclesLoading && controller.vehicles.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (controller.vehiclesError != null && controller.vehicles.isEmpty) {
      return _ErrorCard(
        title: 'Failed to load live vehicle data',
        message: controller.vehiclesError!,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await controller.refreshDevices();
        await controller.refreshAlerts();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          _buildModelFilterSection(controller),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _CountCard(title: 'Total Vehicles', value: '${allVehicles.length}'),
              _CountCard(title: 'Active', value: '$activeCount'),
              _CountCard(title: 'Inactive', value: '$inactiveCount'),
              _CountCard(title: 'No GPS', value: '$noGpsCount'),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Live Vehicle Map (Clustered)',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 420,
                    child: vehicles.isEmpty
                        ? const Center(
                            child: Text(
                              'No vehicle GPS points available for current filter.',
                            ),
                          )
                        : VehicleClusterMap(vehicles: vehicles),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildMetricsCard(context),
          const SizedBox(height: 16),
          _buildStatusFilter(),
          const SizedBox(height: 12),
          if (vehicles.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No vehicles found for current filters.'),
              ),
            )
          else
            ...vehicles.map(_VehicleTile.new),
        ],
      ),
    );
  }

  Widget _buildModelFilterSection(DashboardController controller) {
    final selectedModel = controller.selectedDeviceTypeName;
    final models = controller.availableDeviceTypes;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Vehicle Model Filter',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                ChoiceChip(
                  label: const Text('All'),
                  selected: selectedModel == null,
                  onSelected: (_) => controller.setSelectedDeviceTypeName(null),
                ),
                ...models.map(
                  (String model) => ChoiceChip(
                    label: Text(model),
                    selected: selectedModel == model,
                    onSelected: (_) {
                      if (selectedModel == model) {
                        controller.setSelectedDeviceTypeName(null);
                      } else {
                        controller.setSelectedDeviceTypeName(model);
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsCard(BuildContext context) {
    final metrics = widget.controller.fleetMetrics;
    final entries = <MapEntry<String, String>>[
      MapEntry<String, String>('Distance', metrics.totalDistance),
      MapEntry<String, String>('CO2 Saving', metrics.co2Saving),
      MapEntry<String, String>('Energy', metrics.energyConsumption),
      MapEntry<String, String>('Run Time', metrics.runTime),
      MapEntry<String, String>('Traction', metrics.tractionEnergy),
      MapEntry<String, String>('Regen', metrics.regenEnergy),
      MapEntry<String, String>('Idle', metrics.idleTime),
      MapEntry<String, String>('Charging Unit', metrics.chargingUnit),
      MapEntry<String, String>('Cost Saved', metrics.costSaved),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Text(
                  'Fleet Metrics',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(width: 12),
                if (widget.controller.isMetricsLoading)
                  const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: entries.map((MapEntry<String, String> entry) {
                return Container(
                  constraints: const BoxConstraints(minWidth: 140, maxWidth: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        entry.key,
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.value,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            if (widget.controller.metricsError != null) ...<Widget>[
              const SizedBox(height: 10),
              Text(
                widget.controller.metricsError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilter() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: <Widget>[
            const Text('Status Filter:'),
            const SizedBox(width: 10),
            DropdownButton<_StatusFilter>(
              value: _statusFilter,
              onChanged: (_StatusFilter? value) {
                if (value == null) {
                  return;
                }
                setState(() {
                  _statusFilter = value;
                });
              },
              items: const <DropdownMenuItem<_StatusFilter>>[
                DropdownMenuItem<_StatusFilter>(
                  value: _StatusFilter.all,
                  child: Text('All'),
                ),
                DropdownMenuItem<_StatusFilter>(
                  value: _StatusFilter.active,
                  child: Text('Active'),
                ),
                DropdownMenuItem<_StatusFilter>(
                  value: _StatusFilter.inactive,
                  child: Text('Inactive'),
                ),
                DropdownMenuItem<_StatusFilter>(
                  value: _StatusFilter.nogps,
                  child: Text('No GPS'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleTile extends StatelessWidget {
  const _VehicleTile(this.vehicle);

  final Vehicle vehicle;

  @override
  Widget build(BuildContext context) {
    final modeColor = switch (vehicle.mode) {
      VehicleMode.active => Colors.green,
      VehicleMode.inactive => Colors.orange,
      VehicleMode.nogps => Colors.redAccent,
      VehicleMode.pending => Colors.blueGrey,
    };

    final modeLabel = switch (vehicle.mode) {
      VehicleMode.active => 'ACTIVE',
      VehicleMode.inactive => 'INACTIVE',
      VehicleMode.nogps => 'NO GPS',
      VehicleMode.pending => 'PENDING',
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: modeColor.withOpacity(0.15),
          child: Icon(Icons.directions_bus, color: modeColor),
        ),
        title: Text(vehicle.displayId),
        subtitle: Text(
          '${vehicle.vehicleType} • ${vehicle.city} • Speed ${vehicle.speed.toStringAsFixed(1)}',
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: modeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                modeLabel,
                style: TextStyle(
                  color: modeColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text('SOC: ${vehicle.soc ?? 'N/A'}'),
          ],
        ),
      ),
    );
  }
}

class _CountCard extends StatelessWidget {
  const _CountCard({
    required this.title,
    required this.value,
  });

  final String title;
  final String value;

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
