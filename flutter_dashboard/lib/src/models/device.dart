class Device {
  Device({
    required this.deviceId,
    required this.vrn,
    required this.chassisNumber,
    required this.deviceTypeName,
    required this.city,
    required this.fleet,
    required this.fleetOwner,
    required this.platform,
    required this.isConnected,
    required this.raw,
  });

  final String deviceId;
  final String? vrn;
  final String? chassisNumber;
  final String? deviceTypeName;
  final String? city;
  final String? fleet;
  final String? fleetOwner;
  final String? platform;
  final bool? isConnected;
  final Map<String, dynamic> raw;

  String get displayLabel {
    final vrnValue = vrn?.trim();
    if (vrnValue != null &&
        vrnValue.isNotEmpty &&
        vrnValue != 'N' &&
        vrnValue.toLowerCase() != 'null') {
      return vrnValue;
    }
    final chassis = chassisNumber?.trim();
    if (chassis != null && chassis.isNotEmpty) {
      return chassis;
    }
    return deviceId;
  }

  factory Device.fromJson(Map<String, dynamic> json) {
    final idValue = (json['device_id'] ?? json['imei'] ?? '').toString().trim();
    if (idValue.isEmpty) {
      throw const FormatException('Device payload missing device_id/imei');
    }
    return Device(
      deviceId: idValue,
      vrn: json['VRN']?.toString(),
      chassisNumber: json['chassis_number']?.toString(),
      deviceTypeName: json['device_type_name']?.toString(),
      city: json['city']?.toString(),
      fleet: json['fleet']?.toString(),
      fleetOwner: json['fleet_owner']?.toString(),
      platform: json['platform']?.toString(),
      isConnected: _toBool(json['is_connected']),
      raw: Map<String, dynamic>.from(json),
    );
  }

  static bool? _toBool(dynamic value) {
    if (value is bool) {
      return value;
    }
    if (value is num) {
      return value != 0;
    }
    if (value is String) {
      final parsed = value.toLowerCase();
      if (parsed == 'true' || parsed == '1') {
        return true;
      }
      if (parsed == 'false' || parsed == '0') {
        return false;
      }
    }
    return null;
  }
}
