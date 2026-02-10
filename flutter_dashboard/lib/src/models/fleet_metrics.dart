class FleetMetrics {
  const FleetMetrics({
    required this.totalDistance,
    required this.co2Saving,
    required this.energyConsumption,
    required this.runTime,
    required this.tractionEnergy,
    required this.regenEnergy,
    required this.idleTime,
    required this.chargingUnit,
    required this.costSaved,
  });

  final String totalDistance;
  final String co2Saving;
  final String energyConsumption;
  final String runTime;
  final String tractionEnergy;
  final String regenEnergy;
  final String idleTime;
  final String chargingUnit;
  final String costSaved;

  static const FleetMetrics initial = FleetMetrics(
    totalDistance: 'N/A',
    co2Saving: 'N/A',
    energyConsumption: 'N/A',
    runTime: 'N/A',
    tractionEnergy: 'N/A',
    regenEnergy: 'N/A',
    idleTime: 'N/A',
    chargingUnit: 'N/A',
    costSaved: 'N/A',
  );

  factory FleetMetrics.fromJson(Map<String, dynamic> json) {
    String normalize(dynamic value) {
      if (value == null) {
        return 'N/A';
      }
      final text = value.toString().trim();
      return text.isEmpty ? 'N/A' : text;
    }

    return FleetMetrics(
      totalDistance: normalize(json['total_distance']),
      co2Saving: normalize(json['co2_saving']),
      energyConsumption: normalize(json['energy_consumption']),
      runTime: normalize(json['run_time']),
      tractionEnergy: normalize(json['traction_energy']),
      regenEnergy: normalize(json['regen_energy']),
      idleTime: normalize(json['idle_time']),
      chargingUnit: normalize(json['charging_unit']),
      costSaved: normalize(json['cost_saved']),
    );
  }
}
