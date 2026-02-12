enum VehicleMode {
  pending,
  active,
  inactive,
  nogps,
}

class Vehicle {
  Vehicle({
    required this.vehicleId,
    required this.displayId,
    required this.vehicleType,
    required this.city,
    required this.fleet,
    required this.mode,
    required this.canData,
    required this.timestamp,
    required this.soc,
    required this.cellTemperature,
    required this.dte,
    required this.latitude,
    required this.longitude,
    required this.heading,
    required this.speed,
    required this.odometer,
    required this.socketData,
  });

  final String vehicleId;
  final String displayId;
  final String vehicleType;
  final String city;
  final String fleet;
  final VehicleMode mode;
  final bool canData;
  final DateTime? timestamp;
  final dynamic soc;
  final dynamic cellTemperature;
  final dynamic dte;
  final double latitude;
  final double longitude;
  final double heading;
  final double speed;
  final dynamic odometer;
  final Map<String, dynamic>? socketData;

  Vehicle copyWith({
    String? vehicleId,
    String? displayId,
    String? vehicleType,
    String? city,
    String? fleet,
    VehicleMode? mode,
    bool? canData,
    DateTime? timestamp,
    bool clearTimestamp = false,
    dynamic soc = _sentinel,
    dynamic cellTemperature = _sentinel,
    dynamic dte = _sentinel,
    double? latitude,
    double? longitude,
    double? heading,
    double? speed,
    dynamic odometer = _sentinel,
    Map<String, dynamic>? socketData,
  }) {
    return Vehicle(
      vehicleId: vehicleId ?? this.vehicleId,
      displayId: displayId ?? this.displayId,
      vehicleType: vehicleType ?? this.vehicleType,
      city: city ?? this.city,
      fleet: fleet ?? this.fleet,
      mode: mode ?? this.mode,
      canData: canData ?? this.canData,
      timestamp: clearTimestamp ? null : (timestamp ?? this.timestamp),
      soc: identical(soc, _sentinel) ? this.soc : soc,
      cellTemperature: identical(cellTemperature, _sentinel)
          ? this.cellTemperature
          : cellTemperature,
      dte: identical(dte, _sentinel) ? this.dte : dte,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      heading: heading ?? this.heading,
      speed: speed ?? this.speed,
      odometer: identical(odometer, _sentinel) ? this.odometer : odometer,
      socketData: socketData ?? this.socketData,
    );
  }

  static const Object _sentinel = Object();
}
