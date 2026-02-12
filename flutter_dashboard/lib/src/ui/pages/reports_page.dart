import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/device.dart';

enum ReportType {
  canReport,
  faultReport,
  dailySummaryReport,
  chargingReport,
  energyConsumptionReport,
  vehicleStatusReport,
  misReport,
  coolingReport,
  dodReport,
  alertReport,
}

const Set<ReportType> _multiSelectReports = <ReportType>{
  ReportType.dailySummaryReport,
  ReportType.chargingReport,
  ReportType.energyConsumptionReport,
  ReportType.vehicleStatusReport,
  ReportType.alertReport,
  ReportType.faultReport,
};

class ReportsPage extends StatefulWidget {
  const ReportsPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  ReportType _reportType = ReportType.dailySummaryReport;
  List<String> _selectedFleets = <String>[];
  String _selectedVehicleType = '';
  String _selectedVrnChassis = '';
  List<String> _multiVehicles = <String>[];
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  TimeOfDay _startTime = const TimeOfDay(hour: 0, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 23, minute: 59);

  bool _submitted = false;
  bool _isLoading = false;
  String? _error;
  List<dynamic> _rows = const <dynamic>[];

  bool get _isMultiSelect => _multiSelectReports.contains(_reportType);

  List<String> get _fleetOptions {
    final devices = widget.controller.allDevices;
    final fleets = <String>{};
    for (final d in devices) {
      if (d.fleet != null && d.fleet!.trim().isNotEmpty) {
        fleets.add(d.fleet!);
      }
    }
    final list = fleets.toList()..sort();
    return list;
  }

  List<Device> get _devicesInFleet {
    if (_selectedFleets.isEmpty) return <Device>[];
    return widget.controller.allDevices
        .where((d) => d.fleet != null && _selectedFleets.contains(d.fleet))
        .toList();
  }

  List<String> get _vehicleTypeOptions {
    final types = <String>{};
    for (final d in _devicesInFleet) {
      if (d.deviceTypeName != null && d.deviceTypeName!.trim().isNotEmpty) {
        types.add(d.deviceTypeName!);
      }
    }
    final list = types.toList()..sort();
    return list;
  }

  List<Device> get _availableDevices {
    if (_selectedVehicleType.isEmpty) return <Device>[];
    return _devicesInFleet
        .where((d) => d.deviceTypeName == _selectedVehicleType)
        .toList();
  }

  List<Map<String, String>> get _vrnChassisOptions {
    return _availableDevices.map((d) {
      final label = (d.vrn != null && d.vrn!.trim().isNotEmpty && d.vrn != 'N')
          ? d.vrn!
          : (d.chassisNumber ?? d.deviceId);
      return <String, String>{'value': d.deviceId, 'label': label};
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Text(
          'Reports',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        // Filters card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                // Report Type
                _filterLabel('Report Type'),
                const SizedBox(height: 4),
                DropdownButtonFormField<ReportType>(
                  value: _reportType,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: ReportType.values.map((ReportType rt) {
                    return DropdownMenuItem<ReportType>(
                      value: rt,
                      child: Text(_reportTypeLabel(rt)),
                    );
                  }).toList(),
                  onChanged: (ReportType? v) {
                    if (v == null) return;
                    setState(() {
                      _reportType = v;
                      _selectedVehicleType = '';
                      _selectedVrnChassis = '';
                      _multiVehicles = <String>[];
                      _rows = const <dynamic>[];
                      _submitted = false;
                      _error = null;
                    });
                  },
                ),
                const SizedBox(height: 12),
                // Fleet
                _filterLabel('Fleet'),
                const SizedBox(height: 4),
                _FleetChipSelect(
                  options: _fleetOptions,
                  selected: _selectedFleets,
                  onChanged: (List<String> v) {
                    setState(() {
                      _selectedFleets = v;
                      _selectedVehicleType = '';
                      _selectedVrnChassis = '';
                      _multiVehicles = <String>[];
                      _rows = const <dynamic>[];
                      _error = null;
                    });
                  },
                  singleSelect: _reportType == ReportType.misReport || _reportType == ReportType.canReport,
                ),
                if (_reportType != ReportType.misReport) ...<Widget>[
                  const SizedBox(height: 12),
                  _filterLabel('Vehicle Type'),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    value: _selectedVehicleType.isEmpty ? null : _selectedVehicleType,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    hint: const Text('Select Vehicle Type'),
                    items: _vehicleTypeOptions.map((String t) {
                      return DropdownMenuItem<String>(value: t, child: Text(t));
                    }).toList(),
                    onChanged: (String? v) {
                      setState(() {
                        _selectedVehicleType = v ?? '';
                        _selectedVrnChassis = '';
                        _multiVehicles = <String>[];
                        _rows = const <dynamic>[];
                        _error = null;
                      });
                    },
                  ),
                ],
                if (_reportType != ReportType.misReport &&
                    _selectedVehicleType.isNotEmpty &&
                    (_reportType != ReportType.faultReport || _isMultiSelect)) ...<Widget>[
                  const SizedBox(height: 12),
                  _filterLabel(_isMultiSelect ? 'VRN / Chassis (multi)' : 'VRN / Chassis'),
                  const SizedBox(height: 4),
                  _isMultiSelect
                      ? _MultiVehicleSelect(
                          options: _vrnChassisOptions,
                          selected: _multiVehicles,
                          onChanged: (List<String> v) {
                            setState(() {
                              _multiVehicles = v;
                              _rows = const <dynamic>[];
                              _error = null;
                            });
                          },
                        )
                      : DropdownButtonFormField<String>(
                          value: _selectedVrnChassis.isEmpty ? null : _selectedVrnChassis,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          hint: const Text('Select VRN / Chassis'),
                          items: _vrnChassisOptions.map((m) {
                            return DropdownMenuItem<String>(
                              value: m['value'],
                              child: Text(m['label'] ?? m['value']!),
                            );
                          }).toList(),
                          onChanged: (String? v) {
                            setState(() {
                              _selectedVrnChassis = v ?? '';
                              _rows = const <dynamic>[];
                              _error = null;
                            });
                          },
                        ),
                ],
                const SizedBox(height: 12),
                _filterLabel('Date Range'),
                const SizedBox(height: 4),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickDate(isStart: true),
                        icon: const Icon(Icons.calendar_today, size: 18),
                        label: Text(_formatDate(_startDate)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickDate(isStart: false),
                        icon: const Icon(Icons.calendar_today, size: 18),
                        label: Text(_formatDate(_endDate)),
                      ),
                    ),
                  ],
                ),
                if (_reportType == ReportType.canReport || _reportType == ReportType.faultReport) ...<Widget>[
                  const SizedBox(height: 8),
                  _filterLabel('Time Range'),
                  const SizedBox(height: 4),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _pickTime(isStart: true),
                          child: Text(_formatTime(_startTime)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _pickTime(isStart: false),
                          child: Text(_formatTime(_endTime)),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _canSubmit && !_isLoading ? _submit : null,
                  icon: Icon(_isLoading ? Icons.cancel : Icons.search),
                  label: Text(_isLoading ? 'Cancel' : 'Submit'),
                  style: FilledButton.styleFrom(
                    backgroundColor: _isLoading ? Theme.of(context).colorScheme.error : null,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Report hint cards (same as main branch)
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: const <Widget>[
            _ReportHintCard(title: 'CAN Report', subtitle: 'WheelSpeed, Pack_Voltage, Pack_Current, MCU_Power, DCDC_Voltage.'),
            _ReportHintCard(title: 'Cooling Report', subtitle: 'MotorTemp, MCUTemp, DCDC_Temp, Sink_Temp, PumpSpeed.'),
            _ReportHintCard(title: 'Energy Consumption Report', subtitle: 'Trip_Num, Net_Energy, Traction, Regeneration, Distance, Consumption_Rate.'),
            _ReportHintCard(title: 'Charging Report', subtitle: 'Cycle, Start_Time, End_Time, Unit, Duration, Location, Insufficiency.'),
            _ReportHintCard(title: 'Daily Summary Report', subtitle: 'Trip_Id, SOC_Start, SOC_End, RunTime, IdleTime, Max_Speed, Avg_Speed.'),
            _ReportHintCard(title: 'Fault Report', subtitle: 'Operational incident logs by severity and device.'),
            _ReportHintCard(title: 'Alert Report', subtitle: 'Date, Alert_Type, Start_Time, End_Time, VRN, Severity.'),
            _ReportHintCard(title: 'Vehicle Status Report', subtitle: 'Trip and session status by vehicle.'),
            _ReportHintCard(title: 'MIS Report', subtitle: 'Maintenance and service reports by fleet.'),
            _ReportHintCard(title: 'DOD Report', subtitle: 'Depth of discharge analysis and battery metrics.'),
          ],
        ),
        const SizedBox(height: 16),
        if (_error != null)
          Card(
            color: Theme.of(context).colorScheme.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
            ),
          ),
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.only(top: 20),
            child: Center(child: CircularProgressIndicator()),
          ),
        if (!_isLoading && _rows.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Records: ${_rows.length}', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: _columns(_rows),
                      rows: _tableRows(_rows),
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (!_isLoading && _submitted && _rows.isEmpty && _error == null)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No results found.')),
            ),
          ),
      ],
    );
  }

  bool get _canSubmit {
    if (_selectedFleets.isEmpty) return false;
    if (_reportType == ReportType.misReport) return true;
    if (_reportType == ReportType.faultReport) return _selectedVehicleType.isNotEmpty;
    if (_isMultiSelect) return _multiVehicles.isNotEmpty;
    return _selectedVrnChassis.isNotEmpty;
  }

  Widget _filterLabel(String text) {
    return Text(text, style: Theme.of(context).textTheme.labelLarge);
  }

  String _reportTypeLabel(ReportType rt) {
    switch (rt) {
      case ReportType.canReport: return 'CAN Report';
      case ReportType.faultReport: return 'Fault Report';
      case ReportType.dailySummaryReport: return 'Daily Summary Report';
      case ReportType.chargingReport: return 'Charging Report';
      case ReportType.energyConsumptionReport: return 'Energy Consumption Report';
      case ReportType.vehicleStatusReport: return 'Vehicle Status Report';
      case ReportType.misReport: return 'MIS Report';
      case ReportType.coolingReport: return 'Cooling Report';
      case ReportType.dodReport: return 'DOD Report';
      case ReportType.alertReport: return 'Alert Report';
    }
  }

  String _toReportTypeApi(ReportType rt) {
    switch (rt) {
      case ReportType.canReport: return 'can_report';
      case ReportType.faultReport: return 'fault_report';
      case ReportType.dailySummaryReport: return 'daily_summary_report';
      case ReportType.chargingReport: return 'charging_report';
      case ReportType.energyConsumptionReport: return 'energy_consumption_report';
      case ReportType.vehicleStatusReport: return 'vehicle_status_report';
      case ReportType.misReport: return 'mis_report';
      case ReportType.coolingReport: return 'cooling_report';
      case ReportType.dodReport: return 'dod_report';
      case ReportType.alertReport: return 'alert_report';
    }
  }

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _rows = const <dynamic>[];
      _submitted = true;
    });

    try {
      List<String> deviceIds;
      if (_reportType == ReportType.misReport) {
        deviceIds = <String>[];
      } else if (_isMultiSelect) {
        deviceIds = List<String>.from(_multiVehicles);
      } else {
        deviceIds = _selectedVrnChassis.isEmpty ? <String>[] : <String>[_selectedVrnChassis];
      }

      final startStr = _formatDateApi(_startDate);
      var endStr = _formatDateApi(_endDate);
      if (!_isMultiSelect && _reportType != ReportType.faultReport && _reportType != ReportType.misReport) {
        final end = DateTime(_endDate.year, _endDate.month, _endDate.day + 1);
        endStr = _formatDateApi(end);
      }

      String? startDt;
      String? endDt;
      if (_reportType == ReportType.canReport) {
        startDt = _toDateTimeIso(_startDate, _startTime);
        endDt = _toDateTimeIso(_endDate, _endTime);
      }

      final rows = await widget.controller.fetchReport(
        reportType: _toReportTypeApi(_reportType),
        deviceIds: deviceIds,
        startDate: startStr,
        endDate: endStr,
        vehicleType: _selectedVehicleType,
        fleetNames: _reportType == ReportType.misReport || _reportType == ReportType.faultReport
            ? _selectedFleets
            : null,
        startDateTime: startDt,
        endDateTime: endDt,
      );

      if (mounted) {
        setState(() => _rows = rows);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _formatDate(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  String _formatDateApi(DateTime d) => _formatDate(d);

  String _formatTime(TimeOfDay t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  String _toDateTimeIso(DateTime d, TimeOfDay t) {
    final dt = DateTime(d.year, d.month, d.day, t.hour, t.minute);
    return dt.toIso8601String();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : _endDate;
    final selected = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(DateTime.now().year - 2),
      lastDate: DateTime.now(),
    );
    if (selected == null) return;
    setState(() {
      if (isStart) {
        _startDate = selected;
      } else {
        _endDate = selected;
      }
    });
  }

  Future<void> _pickTime({required bool isStart}) async {
    final initial = isStart ? _startTime : _endTime;
    final selected = await showTimePicker(context: context, initialTime: initial);
    if (selected == null) return;
    setState(() {
      if (isStart) {
        _startTime = selected;
      } else {
        _endTime = selected;
      }
    });
  }

  List<DataColumn> _columns(List<dynamic> rows) {
    if (rows.isEmpty || rows.first is! Map) {
      return const <DataColumn>[DataColumn(label: Text('Record'))];
    }
    final first = Map<String, dynamic>.from(rows.first as Map);
    return first.keys.take(14).map((String k) => DataColumn(label: Text(k))).toList();
  }

  List<DataRow> _tableRows(List<dynamic> rows) {
    if (rows.isEmpty) return const <DataRow>[];
    if (rows.first is! Map) {
      return rows.take(80).map((dynamic v) => DataRow(cells: <DataCell>[DataCell(Text(v.toString()))])).toList();
    }
    final keys = Map<String, dynamic>.from(rows.first as Map).keys.take(14).toList();
    return rows.take(80).whereType<Map>().map((dynamic row) {
      final map = Map<String, dynamic>.from(row as Map);
      return DataRow(cells: keys.map((String k) => DataCell(Text('${map[k] ?? ''}'))).toList());
    }).toList();
  }
}

class _FleetChipSelect extends StatelessWidget {
  const _FleetChipSelect({
    required this.options,
    required this.selected,
    required this.onChanged,
    this.singleSelect = false,
  });

  final List<String> options;
  final List<String> selected;
  final void Function(List<String>) onChanged;
  final bool singleSelect;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: options.map((String opt) {
        final isSelected = selected.contains(opt);
        return FilterChip(
          label: Text(opt),
          selected: isSelected,
          onSelected: (bool v) {
            if (singleSelect) {
              onChanged(v ? <String>[opt] : <String>[]);
            } else {
              final next = List<String>.from(selected);
              if (v) {
                next.add(opt);
              } else {
                next.remove(opt);
              }
              onChanged(next);
            }
          },
        );
      }).toList(),
    );
  }
}

class _MultiVehicleSelect extends StatelessWidget {
  const _MultiVehicleSelect({
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  final List<Map<String, String>> options;
  final List<String> selected;
  final void Function(List<String>) onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: options.map((m) {
        final value = m['value']!;
        final label = m['label'] ?? value;
        final isSelected = selected.contains(value);
        return FilterChip(
          label: Text(label),
          selected: isSelected,
          onSelected: (bool v) {
            final next = List<String>.from(selected);
            if (v) {
              next.add(value);
            } else {
              next.remove(value);
            }
            onChanged(next);
          },
        );
      }).toList(),
    );
  }
}

class _ReportHintCard extends StatelessWidget {
  const _ReportHintCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 250,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
