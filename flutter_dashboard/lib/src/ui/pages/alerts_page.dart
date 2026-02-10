import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/alert_item.dart';
import '../../models/device.dart';

enum _PriorityFilter { all, high, medium }

enum _StatusFilter { all, active, resolved }

class AlertsPage extends StatefulWidget {
  const AlertsPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends State<AlertsPage> {
  _PriorityFilter _priorityFilter = _PriorityFilter.all;
  _StatusFilter _statusFilter = _StatusFilter.all;
  String _searchText = '';

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    final alerts = _applyFilters(controller);
    final allAlerts = controller.alerts;
    final highCount = allAlerts.where((AlertItem a) => a.priority == AlertPriority.high).length;
    final mediumCount =
        allAlerts.where((AlertItem a) => a.priority == AlertPriority.medium).length;

    if (controller.isAlertsLoading && allAlerts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: controller.refreshAlerts,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _CountChip(label: 'Total', value: allAlerts.length),
              _CountChip(label: 'HIGH', value: highCount),
              _CountChip(label: 'MEDIUM', value: mediumCount),
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
                  SizedBox(
                    width: 280,
                    child: TextField(
                      decoration: const InputDecoration(
                        labelText: 'Search by vehicle, type, fleet, city',
                        isDense: true,
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (String value) {
                        setState(() {
                          _searchText = value.trim().toLowerCase();
                        });
                      },
                    ),
                  ),
                  DropdownButton<_PriorityFilter>(
                    value: _priorityFilter,
                    onChanged: (_PriorityFilter? value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        _priorityFilter = value;
                      });
                    },
                    items: const <DropdownMenuItem<_PriorityFilter>>[
                      DropdownMenuItem<_PriorityFilter>(
                        value: _PriorityFilter.all,
                        child: Text('All Priorities'),
                      ),
                      DropdownMenuItem<_PriorityFilter>(
                        value: _PriorityFilter.high,
                        child: Text('HIGH'),
                      ),
                      DropdownMenuItem<_PriorityFilter>(
                        value: _PriorityFilter.medium,
                        child: Text('MEDIUM'),
                      ),
                    ],
                  ),
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
                        child: Text('All Status'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.active,
                        child: Text('Active'),
                      ),
                      DropdownMenuItem<_StatusFilter>(
                        value: _StatusFilter.resolved,
                        child: Text('Resolved'),
                      ),
                    ],
                  ),
                  if (controller.alertsError != null)
                    Text(
                      controller.alertsError!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (alerts.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No alerts for current filters.'),
              ),
            )
          else
            ...alerts.map((AlertItem alert) {
              final enrichment =
                  _resolveDeviceEnrichment(controller.allDevices, alert.imei ?? alert.vehicleId);
              return _AlertCard(
                alert: alert,
                vehicleLabel: enrichment.vehicleLabel,
                city: enrichment.city,
                fleet: enrichment.fleet,
              );
            }),
        ],
      ),
    );
  }

  List<AlertItem> _applyFilters(DashboardController controller) {
    final devices = controller.allDevices;
    return controller.alerts.where((AlertItem alert) {
      if (_priorityFilter == _PriorityFilter.high &&
          alert.priority != AlertPriority.high) {
        return false;
      }
      if (_priorityFilter == _PriorityFilter.medium &&
          alert.priority != AlertPriority.medium) {
        return false;
      }

      if (_statusFilter == _StatusFilter.active && !alert.isActive) {
        return false;
      }
      if (_statusFilter == _StatusFilter.resolved && alert.isActive) {
        return false;
      }

      if (_searchText.isEmpty) {
        return true;
      }

      final enrichment =
          _resolveDeviceEnrichment(devices, alert.imei ?? alert.vehicleId);
      final target = <String>[
        alert.type,
        alert.message,
        alert.vehicleType ?? '',
        alert.vehicleId ?? '',
        alert.imei ?? '',
        enrichment.vehicleLabel,
        enrichment.city ?? '',
        enrichment.fleet ?? '',
      ].join(' ').toLowerCase();
      return target.contains(_searchText);
    }).toList();
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({
    required this.alert,
    required this.vehicleLabel,
    required this.city,
    required this.fleet,
  });

  final AlertItem alert;
  final String vehicleLabel;
  final String? city;
  final String? fleet;

  @override
  Widget build(BuildContext context) {
    final isHigh = alert.priority == AlertPriority.high;
    final color = isHigh ? Colors.redAccent : Colors.orange;
    final activeColor = alert.isActive ? Colors.green : Colors.grey;
    final timestampText =
        alert.timestamp?.toLocal().toIso8601String().replaceFirst('T', ' ') ?? 'N/A';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(Icons.warning_rounded, color: color),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    alert.type,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    alert.priorityLabel,
                    style: TextStyle(color: color, fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: activeColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    alert.isActive ? 'ACTIVE' : 'RESOLVED',
                    style:
                        TextStyle(color: activeColor, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(alert.message),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 6,
              children: <Widget>[
                _MetaTag(label: 'Vehicle: $vehicleLabel'),
                _MetaTag(label: 'Type: ${alert.vehicleType ?? 'N/A'}'),
                if (fleet != null) _MetaTag(label: 'Fleet: $fleet'),
                if (city != null) _MetaTag(label: 'City: $city'),
                _MetaTag(label: 'Time: $timestampText'),
                if (alert.durationSeconds != null)
                  _MetaTag(label: 'Duration: ${alert.durationSeconds}s'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaTag extends StatelessWidget {
  const _MetaTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label),
    );
  }
}

class _CountChip extends StatelessWidget {
  const _CountChip({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text('$label: $value'),
      backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
    );
  }
}

class _DeviceEnrichment {
  const _DeviceEnrichment({
    required this.vehicleLabel,
    this.city,
    this.fleet,
  });

  final String vehicleLabel;
  final String? city;
  final String? fleet;
}

_DeviceEnrichment _resolveDeviceEnrichment(List<Device> devices, String? imei) {
  if (imei == null || imei.isEmpty) {
    return const _DeviceEnrichment(vehicleLabel: 'N/A');
  }
  for (final Device device in devices) {
    if (device.deviceId == imei) {
      return _DeviceEnrichment(
        vehicleLabel: device.displayLabel,
        city: device.city,
        fleet: device.fleet ?? device.fleetOwner,
      );
    }
  }
  return _DeviceEnrichment(vehicleLabel: imei);
}
