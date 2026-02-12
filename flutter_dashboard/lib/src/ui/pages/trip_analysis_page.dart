import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/device.dart';

class TripAnalysisPage extends StatefulWidget {
  const TripAnalysisPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<TripAnalysisPage> createState() => _TripAnalysisPageState();
}

class _TripAnalysisPageState extends State<TripAnalysisPage> {
  String? _selectedFleet;
  String? _selectedType;
  String? _selectedVehicleId;
  DateTime? _selectedDate;

  bool _isLoading = false;
  String? _error;
  List<dynamic> _rows = const <dynamic>[];

  final Set<String> _selectedChartGroups = <String>{'batteryCharts'};
  String? _selectedMetricColumn;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    final devices = widget.controller.allDevices;
    final fleetOptions = _fleetOptions(devices);
    final typeOptions = _typeOptions(devices, _selectedFleet);
    final vehicleOptions = _vehicleOptions(devices, _selectedFleet, _selectedType);
    final numericColumns = _numericColumns(_rows);
    final metricColumn = (_selectedMetricColumn != null &&
            numericColumns.contains(_selectedMetricColumn))
        ? _selectedMetricColumn
        : (numericColumns.isNotEmpty ? numericColumns.first : null);
    final metricStats = _metricStats(_rows, metricColumn);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Text(
          'Trip Analysis',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                _stringDropdown(
                  label: 'Fleet',
                  value: _selectedFleet,
                  options: fleetOptions,
                  onChanged: (String? value) {
                    setState(() {
                      _selectedFleet = value;
                      _selectedType = null;
                      _selectedVehicleId = null;
                      _rows = const <dynamic>[];
                      _selectedMetricColumn = null;
                    });
                  },
                ),
                _stringDropdown(
                  label: 'Vehicle Type',
                  value: _selectedType,
                  options: typeOptions,
                  onChanged: (String? value) {
                    setState(() {
                      _selectedType = value;
                      _selectedVehicleId = null;
                      _rows = const <dynamic>[];
                      _selectedMetricColumn = null;
                    });
                  },
                ),
                _stringDropdown(
                  label: 'Vehicle',
                  value: _selectedVehicleId,
                  options: vehicleOptions.map((d) => d.deviceId).toList(),
                  displayLabel: (String value) {
                    final device = vehicleOptions.firstWhere(
                      (d) => d.deviceId == value,
                      orElse: () => vehicleOptions.first,
                    );
                    return device.displayLabel;
                  },
                  onChanged: (String? value) {
                    setState(() {
                      _selectedVehicleId = value;
                      _rows = const <dynamic>[];
                      _selectedMetricColumn = null;
                    });
                  },
                ),
                OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.calendar_today),
                  label: Text(
                    _selectedDate == null
                        ? 'Select Date'
                        : _formatDate(_selectedDate!),
                  ),
                ),
                FilledButton.icon(
                  onPressed: (_selectedVehicleId != null && _selectedDate != null && !_isLoading)
                      ? _submit
                      : null,
                  icon: const Icon(Icons.query_stats),
                  label: Text(_isLoading ? 'Loading...' : 'Submit'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                _chartChip('Battery Charts', 'batteryCharts'),
                _chartChip('Cooling Performance', 'coolingPerformanceCharts'),
                _chartChip('TCS Performance', 'tcsPerformanceCharts'),
              ],
            ),
          ),
        ),
        if (_error != null) ...<Widget>[
          const SizedBox(height: 10),
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ],
        if (_isLoading) ...const <Widget>[
          SizedBox(height: 20),
          Center(child: CircularProgressIndicator()),
        ],
        if (!_isLoading && _rows.isNotEmpty) ...<Widget>[
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _StatCard(label: 'Rows', value: '${_rows.length}'),
              _StatCard(
                label: 'Columns',
                value: _rows.first is Map
                    ? '${(Map<String, dynamic>.from(_rows.first as Map)).length}'
                    : '0',
              ),
              if (metricColumn != null) ...<Widget>[
                _StatCard(label: 'Metric', value: metricColumn),
                _StatCard(label: 'Min', value: metricStats.min.toStringAsFixed(2)),
                _StatCard(label: 'Avg', value: metricStats.avg.toStringAsFixed(2)),
                _StatCard(label: 'Max', value: metricStats.max.toStringAsFixed(2)),
              ],
            ],
          ),
          const SizedBox(height: 12),
          if (numericColumns.isNotEmpty)
            Align(
              alignment: Alignment.centerLeft,
              child: DropdownButton<String>(
                value: metricColumn,
                hint: const Text('Metric Column'),
                items: numericColumns
                    .map((String col) => DropdownMenuItem<String>(
                          value: col,
                          child: Text(col),
                        ))
                    .toList(),
                onChanged: (String? value) {
                  setState(() {
                    _selectedMetricColumn = value;
                  });
                },
              ),
            ),
          Card(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: _tableColumns(_rows),
                rows: _tableRows(_rows),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _stringDropdown({
    required String label,
    required String? value,
    required List<String> options,
    required ValueChanged<String?> onChanged,
    String Function(String value)? displayLabel,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label),
        const SizedBox(height: 4),
        DropdownButton<String>(
          value: (value != null && options.contains(value)) ? value : null,
          hint: Text('Select $label'),
          items: options
              .map((String item) => DropdownMenuItem<String>(
                    value: item,
                    child: Text(displayLabel?.call(item) ?? item),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _chartChip(String label, String key) {
    final selected = _selectedChartGroups.contains(key);
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (bool enabled) {
        setState(() {
          if (enabled) {
            _selectedChartGroups.add(key);
          } else {
            _selectedChartGroups.remove(key);
          }
        });
      },
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = _selectedDate ?? now;
    final selected = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 2),
      lastDate: now,
    );
    if (selected == null) {
      return;
    }
    setState(() {
      _selectedDate = selected;
      _rows = const <dynamic>[];
      _selectedMetricColumn = null;
    });
  }

  Future<void> _submit() async {
    final vehicleId = _selectedVehicleId;
    final date = _selectedDate;
    if (vehicleId == null || date == null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final rows = await widget.controller.fetchChartViewData(
        deviceId: vehicleId,
        date: date,
      );
      setState(() {
        _rows = rows;
        _selectedMetricColumn = _numericColumns(rows).isNotEmpty
            ? _numericColumns(rows).first
            : null;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  List<String> _fleetOptions(List<Device> devices) {
    final fleets = <String>{};
    for (final Device device in devices) {
      final fleet = device.fleet?.trim();
      if (fleet != null && fleet.isNotEmpty) {
        fleets.add(fleet);
      }
    }
    final result = fleets.toList()..sort();
    return result;
  }

  List<String> _typeOptions(List<Device> devices, String? fleet) {
    final types = <String>{};
    for (final Device device in devices) {
      if (fleet != null && fleet.isNotEmpty && device.fleet != fleet) {
        continue;
      }
      final value = device.deviceTypeName?.trim();
      if (value != null && value.isNotEmpty) {
        types.add(value);
      }
    }
    final result = types.toList()..sort();
    return result;
  }

  List<Device> _vehicleOptions(List<Device> devices, String? fleet, String? type) {
    final result = devices.where((Device device) {
      if (fleet != null && fleet.isNotEmpty && device.fleet != fleet) {
        return false;
      }
      if (type != null && type.isNotEmpty && device.deviceTypeName != type) {
        return false;
      }
      return true;
    }).toList();
    result.sort((Device a, Device b) => a.displayLabel.compareTo(b.displayLabel));
    return result;
  }

  List<String> _numericColumns(List<dynamic> rows) {
    if (rows.isEmpty || rows.first is! Map) {
      return const <String>[];
    }
    final sample = Map<String, dynamic>.from(rows.first as Map);
    final keys = <String>[];
    for (final String key in sample.keys) {
      if (_isNumericColumn(rows, key)) {
        keys.add(key);
      }
    }
    return keys;
  }

  bool _isNumericColumn(List<dynamic> rows, String key) {
    var checks = 0;
    for (final dynamic row in rows.take(25)) {
      if (row is! Map) {
        continue;
      }
      final value = (row as Map)[key];
      if (value == null) {
        continue;
      }
      checks += 1;
      if (double.tryParse(value.toString()) == null) {
        return false;
      }
    }
    return checks > 0;
  }

  _Stats _metricStats(List<dynamic> rows, String? column) {
    if (column == null) {
      return const _Stats(min: 0, avg: 0, max: 0);
    }
    final values = <double>[];
    for (final dynamic row in rows) {
      if (row is! Map) {
        continue;
      }
      final value = (row as Map)[column];
      final parsed = double.tryParse(value?.toString() ?? '');
      if (parsed != null) {
        values.add(parsed);
      }
    }
    if (values.isEmpty) {
      return const _Stats(min: 0, avg: 0, max: 0);
    }
    values.sort();
    final sum = values.fold<double>(0, (double a, double b) => a + b);
    return _Stats(
      min: values.first,
      avg: sum / values.length,
      max: values.last,
    );
  }

  List<DataColumn> _tableColumns(List<dynamic> rows) {
    if (rows.isEmpty || rows.first is! Map) {
      return const <DataColumn>[];
    }
    final first = Map<String, dynamic>.from(rows.first as Map);
    return first.keys
        .take(12)
        .map((String key) => DataColumn(label: Text(key)))
        .toList();
  }

  List<DataRow> _tableRows(List<dynamic> rows) {
    if (rows.isEmpty || rows.first is! Map) {
      return const <DataRow>[];
    }
    final columns = Map<String, dynamic>.from(rows.first as Map).keys.take(12).toList();

    return rows.take(60).whereType<Map>().map((dynamic row) {
      final map = Map<String, dynamic>.from(row as Map);
      return DataRow(
        cells: columns
            .map((String column) => DataCell(Text(map[column]?.toString() ?? '')))
            .toList(),
      );
    }).toList();
  }

  String _formatDate(DateTime date) {
    final mm = date.month.toString().padLeft(2, '0');
    final dd = date.day.toString().padLeft(2, '0');
    return '${date.year}-$mm-$dd';
  }
}

class _Stats {
  const _Stats({
    required this.min,
    required this.avg,
    required this.max,
  });

  final double min;
  final double avg;
  final double max;
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 170,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(label, style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: 6),
              Text(value, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ),
    );
  }
}
