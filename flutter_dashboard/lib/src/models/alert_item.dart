enum AlertPriority {
  high,
  medium,
}

class AlertItem {
  AlertItem({
    required this.id,
    required this.priority,
    required this.type,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.durationSeconds,
    required this.isActive,
    required this.vehicleId,
    required this.imei,
    required this.vehicleType,
    required this.location,
    required this.reqData,
    required this.startTime,
    required this.endTime,
    required this.alertType,
    required this.details,
    required this.raw,
  });

  final String id;
  final AlertPriority priority;
  final String type;
  final String title;
  final String message;
  final DateTime? timestamp;
  final int? durationSeconds;
  final bool isActive;
  final String? vehicleId;
  final String? imei;
  final String? vehicleType;
  final String location;
  final List<dynamic> reqData;
  final DateTime? startTime;
  final DateTime? endTime;
  final String? alertType;
  final Map<String, dynamic> details;
  final Map<String, dynamic> raw;

  static AlertPriority derivePriority(String? alertName) {
    if (alertName == null || alertName.trim().isEmpty) {
      return AlertPriority.medium;
    }
    final name = alertName.toLowerCase();
    if (name.contains('temperature') ||
        name.contains('temp') ||
        name.contains('brake') ||
        name.contains('cell imbalance') ||
        name.contains('thermal') ||
        name.contains('fire') ||
        name.contains('smoke') ||
        name.contains('collision') ||
        name.contains('overvoltage') ||
        name.contains('undervoltage') ||
        name.contains('overcurrent')) {
      return AlertPriority.high;
    }
    return AlertPriority.medium;
  }

  static AlertItem fromApiMap(Map<String, dynamic> alert) {
    final cleanType = _normalizeAlertName(alert['name']?.toString());
    final cleanMessage = _normalizeMessage(alert['value']?.toString(), cleanType);

    final id = (alert['id'] ?? '').toString();
    final timestampRaw = alert['start_time']?.toString();
    final startRaw = alert['start_time']?.toString();
    final endRaw = alert['end_time']?.toString();

    return AlertItem(
      id: id.isEmpty ? 'unknown' : id,
      priority: derivePriority(alert['name']?.toString()),
      type: cleanType,
      title: cleanType,
      message: cleanMessage,
      timestamp: _parseDateTime(timestampRaw),
      durationSeconds: _tryParseInt(alert['duration_seconds']),
      isActive: _toBool(alert['is_active']) ?? false,
      vehicleId: alert['imei']?.toString(),
      imei: alert['imei']?.toString(),
      vehicleType: alert['device_type_name']?.toString(),
      location: 'N/A',
      reqData: alert['req_data'] is List ? List<dynamic>.from(alert['req_data']) : const <dynamic>[],
      startTime: _parseDateTime(startRaw),
      endTime: _parseDateTime(endRaw),
      alertType: alert['alert_type']?.toString(),
      details: <String, dynamic>{
        'description': cleanMessage,
        'startTime': startRaw,
        'endTime': endRaw,
      },
      raw: Map<String, dynamic>.from(alert),
    );
  }

  String get priorityLabel => priority == AlertPriority.high ? 'HIGH' : 'MEDIUM';

  static String _normalizeAlertName(String? input) {
    final value = (input == null || input.isEmpty) ? 'Alert' : input;
    final replaced = value.replaceAll('_', ' ');
    final socIndex = replaced.toLowerCase().indexOf('soc');
    if (socIndex < 0) {
      return replaced;
    }

    final before = replaced.substring(0, socIndex);
    final after = replaced.substring(socIndex + 3);
    return '${before}SoC$after';
  }

  static String _normalizeMessage(String? value, String fallback) {
    if (value == null || value.trim().isEmpty) {
      return fallback;
    }
    var result = value.trim();
    if (result.startsWith("'") && result.endsWith("'") && result.length > 1) {
      result = result.substring(1, result.length - 1);
    }
    if (result.startsWith('"') && result.endsWith('"') && result.length > 1) {
      result = result.substring(1, result.length - 1);
    }
    return result;
  }

  static DateTime? _parseDateTime(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }
    return DateTime.tryParse(value);
  }

  static int? _tryParseInt(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return int.tryParse(value.toString());
  }

  static bool? _toBool(dynamic value) {
    if (value is bool) {
      return value;
    }
    if (value is num) {
      return value != 0;
    }
    if (value is String) {
      final normalized = value.toLowerCase();
      if (normalized == 'true' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == '0') {
        return false;
      }
    }
    return null;
  }
}
