import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';

enum _ReportType {
  canReport,
  coolingReport,
  energyConsumptionReport,
  chargingReport,
  dailySummaryReport,
  faultReport,
  alertReport,
  vehicleStatusReport,
  misReport,
  dodReport,
  summaryData,
}

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
  _ReportType _reportType = _ReportType.dailySummaryReport;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  String _period = 'today';

  bool _isLoading = false;
  String? _error;
  List<dynamic> _rows = const <dynamic>[];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Text(
          'Reports',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                DropdownButton<_ReportType>(
                  value: _reportType,
                  isExpanded: true,
                  items: const <DropdownMenuItem<_ReportType>>[
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.canReport,
                      child: Text('CAN Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.faultReport,
                      child: Text('Fault Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.dailySummaryReport,
                      child: Text('Daily Summary Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.chargingReport,
                      child: Text('Charging Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.energyConsumptionReport,
                      child: Text('Energy Consumption Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.vehicleStatusReport,
                      child: Text('Vehicle Status Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.misReport,
                      child: Text('MIS Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.coolingReport,
                      child: Text('Cooling Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.dodReport,
                      child: Text('DOD Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.alertReport,
                      child: Text('Alert Report'),
                    ),
                    DropdownMenuItem<_ReportType>(
                      value: _ReportType.summaryData,
                      child: Text('Summary Data Report'),
                    ),
                  ],
                  onChanged: (_ReportType? value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _reportType = value;
                      _rows = const <dynamic>[];
                      _error = null;
                    });
                  },
                ),
                if (_reportType != _ReportType.summaryData) ...<Widget>[
                  OutlinedButton.icon(
                    onPressed: () => _pickDate(isStart: true),
                    icon: const Icon(Icons.calendar_today),
                    label: Text('Start: ${_formatDate(_startDate)}'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _pickDate(isStart: false),
                    icon: const Icon(Icons.calendar_today),
                    label: Text('End: ${_formatDate(_endDate)}'),
                  ),
                ] else
                  DropdownButton<String>(
                    value: _period,
                    items: const <DropdownMenuItem<String>>[
                      DropdownMenuItem<String>(value: 'today', child: Text('Today')),
                      DropdownMenuItem<String>(value: 'week', child: Text('Week')),
                      DropdownMenuItem<String>(value: 'month', child: Text('Month')),
                    ],
                    onChanged: (String? value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        _period = value;
                        _rows = const <dynamic>[];
                        _error = null;
                      });
                    },
                  ),
                FilledButton.icon(
                  onPressed: _isLoading ? null : _submit,
                  icon: const Icon(Icons.download_for_offline),
                  label: Text(_isLoading ? 'Loading...' : 'Generate'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: const <Widget>[
            _ReportHintCard(
              title: 'CAN Report',
              subtitle: 'WheelSpeed, Pack_Voltage, Pack_Current, MCU_Power, DCDC_Voltage.',
            ),
            _ReportHintCard(
              title: 'Cooling Report',
              subtitle: 'MotorTemp, MCUTemp, DCDC_Temp, Sink_Temp, PumpSpeed.',
            ),
            _ReportHintCard(
              title: 'Energy Consumption Report',
              subtitle: 'Trip_Num, Net_Energy, Traction, Regeneration, Distance, Consumption_Rate.',
            ),
            _ReportHintCard(
              title: 'Charging Report',
              subtitle: 'Cycle, Start_Time, End_Time, Unit, Duration, Location, Insufficiency.',
            ),
            _ReportHintCard(
              title: 'Daily Summary Report',
              subtitle: 'Trip_Id, SOC_Start, SOC_End, RunTime, IdleTime, Max_Speed, Avg_Speed.',
            ),
            _ReportHintCard(
              title: 'Fault Report',
              subtitle: 'Operational incident logs by severity and device.',
            ),
            _ReportHintCard(
              title: 'Alert Report',
              subtitle: 'Date, Alert_Type, Start_Time, End_Time, VRN, Severity.',
            ),
            _ReportHintCard(
              title: 'Vehicle Status Report',
              subtitle: 'Trip and session status by vehicle.',
            ),
            _ReportHintCard(
              title: 'MIS Report',
              subtitle: 'Maintenance and service reports by fleet.',
            ),
            _ReportHintCard(
              title: 'DOD Report',
              subtitle: 'Depth of discharge analysis and battery metrics.',
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_error != null)
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
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
                  Text(
                    'Records: ${_rows.length}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
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
        if (!_isLoading && _rows.isEmpty && _error == null)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('Run a report to view data.'),
            ),
          ),
      ],
    );
  }

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _rows = const <dynamic>[];
    });

    try {
      late final List<dynamic> rows;
      if (_reportType == _ReportType.dailySummaryReport) {
        rows = await widget.controller.fetchDailySummaryReport(
          startDate: _startDate,
          endDate: _endDate,
        );
      } else if (_reportType == _ReportType.summaryData) {
        rows = await widget.controller.fetchSummaryData(period: _period);
      } else {
        // CAN, Fault, Charging, Energy, Cooling, DOD, Alert, Vehicle Status, MIS
        // require fleet/vehicle selection - use Daily Summary as placeholder
        // until full API integration is added
        rows = await widget.controller.fetchDailySummaryReport(
          startDate: _startDate,
          endDate: _endDate,
        );
      }
      setState(() {
        _rows = rows;
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

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : _endDate;
    final selected = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(DateTime.now().year - 2),
      lastDate: DateTime.now(),
    );
    if (selected == null) {
      return;
    }
    setState(() {
      if (isStart) {
        _startDate = selected;
      } else {
        _endDate = selected;
      }
    });
  }

  List<DataColumn> _columns(List<dynamic> rows) {
    if (rows.isEmpty || rows.first is! Map) {
      return const <DataColumn>[
        DataColumn(label: Text('Record')),
      ];
    }
    final first = Map<String, dynamic>.from(rows.first as Map);
    return first.keys.take(14).map((String key) => DataColumn(label: Text(key))).toList();
  }

  List<DataRow> _tableRows(List<dynamic> rows) {
    if (rows.isEmpty) {
      return const <DataRow>[];
    }
    if (rows.first is! Map) {
      return rows.take(80).map((dynamic value) {
        return DataRow(cells: <DataCell>[DataCell(Text(value.toString()))]);
      }).toList();
    }
    final keys =
        Map<String, dynamic>.from(rows.first as Map).keys.take(14).toList();
    return rows.take(80).whereType<Map>().map((dynamic row) {
      final map = Map<String, dynamic>.from(row as Map);
      return DataRow(
        cells: keys.map((String key) => DataCell(Text('${map[key] ?? ''}'))).toList(),
      );
    }).toList();
  }

  String _formatDate(DateTime date) {
    final mm = date.month.toString().padLeft(2, '0');
    final dd = date.day.toString().padLeft(2, '0');
    return '${date.year}-$mm-$dd';
  }
}

class _ReportHintCard extends StatelessWidget {
  const _ReportHintCard({
    required this.title,
    required this.subtitle,
  });

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
              Text(subtitle),
            ],
          ),
        ),
      ),
    );
  }
}
