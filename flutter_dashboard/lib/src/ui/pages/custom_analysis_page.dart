import 'dart:convert';

import 'package:flutter/material.dart';

import '../../controllers/dashboard_controller.dart';
import '../../models/device.dart';

enum _CustomMode {
  fetch,
  upload,
}

class CustomAnalysisPage extends StatefulWidget {
  const CustomAnalysisPage({
    super.key,
    required this.controller,
  });

  final DashboardController controller;

  @override
  State<CustomAnalysisPage> createState() => _CustomAnalysisPageState();
}

class _CustomAnalysisPageState extends State<CustomAnalysisPage> {
  _CustomMode _mode = _CustomMode.fetch;

  String? _fetchVehicleId;
  DateTime? _fetchDate = DateTime.now();
  bool _isLoading = false;
  String? _error;
  List<dynamic> _rows = const <dynamic>[];

  final TextEditingController _uploadController = TextEditingController();

  @override
  void dispose() {
    _uploadController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final devices = List<Device>.from(widget.controller.allDevices)
      ..sort((a, b) => a.displayLabel.compareTo(b.displayLabel));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Text(
          'Custom Analysis',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: <Widget>[
            ChoiceChip(
              label: const Text('Fetch from Server'),
              selected: _mode == _CustomMode.fetch,
              onSelected: (_) => setState(() => _mode = _CustomMode.fetch),
            ),
            ChoiceChip(
              label: const Text('Upload JSON'),
              selected: _mode == _CustomMode.upload,
              onSelected: (_) => setState(() => _mode = _CustomMode.upload),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_mode == _CustomMode.fetch)
          _buildFetchMode(context, devices)
        else
          _buildUploadMode(context),
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
          _PreviewTable(rows: _rows),
        ],
      ],
    );
  }

  Widget _buildFetchMode(BuildContext context, List<Device> devices) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Wrap(
          spacing: 10,
          runSpacing: 10,
          children: <Widget>[
            DropdownButton<String>(
              value: (devices.any((d) => d.deviceId == _fetchVehicleId))
                  ? _fetchVehicleId
                  : null,
              hint: const Text('Select Vehicle'),
              items: devices
                  .map(
                    (Device device) => DropdownMenuItem<String>(
                      value: device.deviceId,
                      child: Text(device.displayLabel),
                    ),
                  )
                  .toList(),
              onChanged: (String? value) {
                setState(() {
                  _fetchVehicleId = value;
                  _rows = const <dynamic>[];
                  _error = null;
                });
              },
            ),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today),
              label: Text(
                _fetchDate == null ? 'Select Date' : _formatDate(_fetchDate!),
              ),
            ),
            FilledButton.icon(
              onPressed: (_fetchVehicleId != null && _fetchDate != null && !_isLoading)
                  ? _submitFetch
                  : null,
              icon: const Icon(Icons.cloud_download),
              label: Text(_isLoading ? 'Loading...' : 'Fetch'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadMode(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text(
              'Paste either row JSON array or columnar JSON (same as chart-view response data).',
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _uploadController,
              minLines: 10,
              maxLines: 18,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: '{ "timestamp": [...], "soc": [...] } OR [ {..}, {..} ]',
              ),
            ),
            const SizedBox(height: 10),
            FilledButton.icon(
              onPressed: _parseUpload,
              icon: const Icon(Icons.analytics),
              label: const Text('Parse & Analyze'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitFetch() async {
    final id = _fetchVehicleId;
    final date = _fetchDate;
    if (id == null || date == null) {
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final rows = await widget.controller.fetchChartViewData(
        deviceId: id,
        date: date,
      );
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

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: _fetchDate ?? now,
      firstDate: DateTime(now.year - 2),
      lastDate: now,
    );
    if (selected == null) {
      return;
    }
    setState(() {
      _fetchDate = selected;
      _rows = const <dynamic>[];
      _error = null;
    });
  }

  void _parseUpload() {
    final raw = _uploadController.text.trim();
    if (raw.isEmpty) {
      setState(() {
        _error = 'Please paste JSON content first.';
      });
      return;
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        setState(() {
          _rows = decoded.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
          _error = null;
        });
        return;
      }
      if (decoded is Map) {
        final map = Map<String, dynamic>.from(decoded as Map);
        final rows = _columnarToRows(map);
        setState(() {
          _rows = rows;
          _error = null;
        });
        return;
      }
      setState(() {
        _error = 'Unsupported JSON structure.';
      });
    } catch (error) {
      setState(() {
        _error = 'Invalid JSON: $error';
      });
    }
  }

  List<Map<String, dynamic>> _columnarToRows(Map<String, dynamic> columnar) {
    if (columnar.isEmpty) {
      return const <Map<String, dynamic>>[];
    }
    final keys = columnar.keys.toList();
    final first = columnar[keys.first];
    if (first is! List || first.isEmpty) {
      return const <Map<String, dynamic>>[];
    }

    final rowCount = first.length;
    final rows = <Map<String, dynamic>>[];
    for (var i = 0; i < rowCount; i++) {
      final row = <String, dynamic>{};
      for (final String key in keys) {
        final values = columnar[key];
        row[key] = (values is List && i < values.length) ? values[i] : null;
      }
      rows.add(row);
    }
    return rows;
  }

  String _formatDate(DateTime date) {
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '${date.year}-$m-$d';
  }
}

class _PreviewTable extends StatelessWidget {
  const _PreviewTable({
    required this.rows,
  });

  final List<dynamic> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty || rows.first is! Map) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No parsed rows to preview.'),
        ),
      );
    }
    final first = Map<String, dynamic>.from(rows.first as Map);
    final columns = first.keys.take(12).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Parsed Records: ${rows.length}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: columns.map((c) => DataColumn(label: Text(c))).toList(),
                rows: rows.take(80).whereType<Map>().map((dynamic row) {
                  final map = Map<String, dynamic>.from(row as Map);
                  return DataRow(
                    cells: columns
                        .map((String c) => DataCell(Text(map[c]?.toString() ?? '')))
                        .toList(),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
