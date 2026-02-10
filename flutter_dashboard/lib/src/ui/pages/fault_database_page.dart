import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/alert_item.dart';
import '../../models/device.dart';

enum _FaultPriorityFilter {
  all,
  high,
  medium,
}

class FaultDatabasePage extends StatefulWidget {
  const FaultDatabasePage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<FaultDatabasePage> createState() => _FaultDatabasePageState();
}

class _FaultDatabasePageState extends State<FaultDatabasePage> {
  _FaultPriorityFilter _priorityFilter = _FaultPriorityFilter.all;

  @override
  Widget build(BuildContext context) {
    final alerts = widget.controller.alerts;
    final filtered = alerts.where((AlertItem item) {
      if (_priorityFilter == _FaultPriorityFilter.high) {
        return item.priority == AlertPriority.high;
      }
      if (_priorityFilter == _FaultPriorityFilter.medium) {
        return item.priority == AlertPriority.medium;
      }
      return true;
    }).toList();

    final grouped = <String, List<AlertItem>>{};
    for (final AlertItem alert in filtered) {
      final key = alert.imei ?? alert.vehicleId ?? 'Unknown';
      grouped.putIfAbsent(key, () => <AlertItem>[]).add(alert);
    }
    final orderedKeys = grouped.keys.toList()
      ..sort((a, b) {
        final left = grouped[a]!.first.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
        final right = grouped[b]!.first.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
        return right.compareTo(left);
      });

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Text(
          'Fault Database',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: <Widget>[
                const Text('Priority Filter:'),
                const SizedBox(width: 10),
                DropdownButton<_FaultPriorityFilter>(
                  value: _priorityFilter,
                  onChanged: (_FaultPriorityFilter? value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _priorityFilter = value;
                    });
                  },
                  items: const <DropdownMenuItem<_FaultPriorityFilter>>[
                    DropdownMenuItem(value: _FaultPriorityFilter.all, child: Text('All')),
                    DropdownMenuItem(value: _FaultPriorityFilter.high, child: Text('High')),
                    DropdownMenuItem(value: _FaultPriorityFilter.medium, child: Text('Medium')),
                  ],
                ),
                const Spacer(),
                Text('Groups: ${orderedKeys.length}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        if (widget.controller.isAlertsLoading && alerts.isEmpty)
          const Center(child: CircularProgressIndicator()),
        if (!widget.controller.isAlertsLoading && orderedKeys.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('No fault entries available for selected filter.'),
            ),
          ),
        ...orderedKeys.map((String imei) {
          final faults = grouped[imei] ?? const <AlertItem>[];
          if (faults.isEmpty) {
            return const SizedBox.shrink();
          }
          final head = faults.first;
          final label = _vehicleDisplayLabel(widget.controller.allDevices, imei);
          final priorityColor = head.priority == AlertPriority.high ? Colors.red : Colors.orange;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Icon(Icons.warning_amber_rounded, color: priorityColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(label, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text('IMEI: $imei'),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: priorityColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          head.priorityLabel,
                          style: TextStyle(
                            color: priorityColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    head.type,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(head.message),
                  const SizedBox(height: 8),
                  Text(
                    'Latest: ${_formatDateTime(head.timestamp)} • Active: ${head.isActive ? "Yes" : "No"} • Total entries: ${faults.length}',
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton.tonalIcon(
                      onPressed: () => _showFaultDetails(context, label, imei, faults),
                      icon: const Icon(Icons.visibility),
                      label: const Text('View Details'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showFaultDetails(
    BuildContext context,
    String vehicleLabel,
    String imei,
    List<AlertItem> faults,
  ) {
    showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Fault Diagnostics • $vehicleLabel'),
          content: SizedBox(
            width: 780,
            height: 420,
            child: ListView.separated(
              itemBuilder: (BuildContext context, int index) {
                final item = faults[index];
                final color =
                    item.priority == AlertPriority.high ? Colors.red : Colors.orange;
                return Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Text(
                            item.type,
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const Spacer(),
                          Text(
                            item.priorityLabel,
                            style: TextStyle(color: color, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(item.message),
                      const SizedBox(height: 6),
                      Text('Time: ${_formatDateTime(item.timestamp)}'),
                      Text('Vehicle Type: ${item.vehicleType ?? "N/A"}'),
                      Text('Duration: ${item.durationSeconds ?? 0} sec'),
                      Text('Alert Type: ${item.alertType ?? "N/A"}'),
                      Text('Req Data points: ${item.reqData.length}'),
                    ],
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemCount: faults.length,
            ),
          ),
          actions: <Widget>[
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  String _vehicleDisplayLabel(List<Device> devices, String imei) {
    for (final Device device in devices) {
      if (device.deviceId == imei) {
        return device.displayLabel;
      }
    }
    return imei;
  }

  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) {
      return 'N/A';
    }
    final local = dateTime.toLocal();
    final yyyy = local.year.toString().padLeft(4, '0');
    final mm = local.month.toString().padLeft(2, '0');
    final dd = local.day.toString().padLeft(2, '0');
    final hh = local.hour.toString().padLeft(2, '0');
    final min = local.minute.toString().padLeft(2, '0');
    return '$yyyy-$mm-$dd $hh:$min';
  }
}
