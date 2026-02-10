import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../config/app_config.dart';
import '../../models/vehicle.dart';

class VehicleClusterMap extends StatefulWidget {
  const VehicleClusterMap({
    super.key,
    required this.vehicles,
    this.initialZoom = 5,
  });

  final List<Vehicle> vehicles;
  final double initialZoom;

  @override
  State<VehicleClusterMap> createState() => _VehicleClusterMapState();
}

class _VehicleClusterMapState extends State<VehicleClusterMap> {
  static const LatLng _indiaCenter = LatLng(20.5937, 78.9629);

  GoogleMapController? _mapController;
  Set<Marker> _markers = <Marker>{};
  double _zoom = 5;
  bool _trafficEnabled = false;
  MapType _mapType = MapType.normal;
  bool _didAutoCenter = false;

  @override
  void initState() {
    super.initState();
    _zoom = widget.initialZoom;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _rebuildClusters();
    });
  }

  @override
  void didUpdateWidget(covariant VehicleClusterMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.vehicles != widget.vehicles) {
      _rebuildClusters();
      if (!_didAutoCenter) {
        _centerMapToVehicles();
      }
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_iosMapGuardEnabled()) {
      return _buildIosConfigurationHint(context);
    }

    final validVehicles = _validVehicles(widget.vehicles);
    final initialTarget = _centroidOfVehicles(validVehicles) ?? _indiaCenter;

    return Stack(
      children: <Widget>[
        GoogleMap(
          initialCameraPosition: CameraPosition(
            target: initialTarget,
            zoom: widget.initialZoom,
          ),
          mapType: _mapType,
          trafficEnabled: _trafficEnabled,
          markers: _markers,
          compassEnabled: true,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: true,
          onMapCreated: (GoogleMapController controller) {
            _mapController = controller;
            _centerMapToVehicles();
            _rebuildClusters();
          },
          onCameraMove: (CameraPosition position) {
            _zoom = position.zoom;
          },
          onCameraIdle: _rebuildClusters,
        ),
        Positioned(
          top: 12,
          right: 12,
          child: Card(
            elevation: 4,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  DropdownButton<MapType>(
                    value: _mapType,
                    underline: const SizedBox.shrink(),
                    iconSize: 18,
                    onChanged: (MapType? value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        _mapType = value;
                      });
                    },
                    items: const <DropdownMenuItem<MapType>>[
                      DropdownMenuItem<MapType>(
                        value: MapType.normal,
                        child: Text('Map'),
                      ),
                      DropdownMenuItem<MapType>(
                        value: MapType.satellite,
                        child: Text('Satellite'),
                      ),
                      DropdownMenuItem<MapType>(
                        value: MapType.terrain,
                        child: Text('Terrain'),
                      ),
                      DropdownMenuItem<MapType>(
                        value: MapType.hybrid,
                        child: Text('Hybrid'),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: 'Toggle traffic',
                    iconSize: 20,
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      setState(() {
                        _trafficEnabled = !_trafficEnabled;
                      });
                    },
                    icon: Icon(
                      Icons.traffic,
                      color: _trafficEnabled ? Colors.blueAccent : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _centerMapToVehicles() {
    final controller = _mapController;
    if (controller == null) {
      return;
    }
    final vehicles = _validVehicles(widget.vehicles);
    if (vehicles.isEmpty) {
      return;
    }

    _didAutoCenter = true;

    if (vehicles.length == 1) {
      controller.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(vehicles.first.latitude, vehicles.first.longitude),
          14,
        ),
      );
      return;
    }

    final bounds = _computeBounds(vehicles);
    controller
        .animateCamera(CameraUpdate.newLatLngBounds(bounds, 60))
        .catchError((_) {
      // On first frame some map implementations can reject bounds animation.
      final center = _centroidOfVehicles(vehicles);
      if (center != null) {
        controller.animateCamera(
          CameraUpdate.newLatLngZoom(center, 8),
        );
      }
    });
  }

  List<Vehicle> _validVehicles(List<Vehicle> vehicles) {
    return vehicles.where((Vehicle vehicle) {
      final lat = vehicle.latitude;
      final lng = vehicle.longitude;
      return lat.isFinite &&
          lng.isFinite &&
          !(lat == 0 && lng == 0) &&
          lat.abs() <= 90 &&
          lng.abs() <= 180;
    }).toList();
  }

  LatLngBounds _computeBounds(List<Vehicle> vehicles) {
    var minLat = double.infinity;
    var maxLat = -double.infinity;
    var minLng = double.infinity;
    var maxLng = -double.infinity;

    for (final Vehicle vehicle in vehicles) {
      minLat = math.min(minLat, vehicle.latitude);
      maxLat = math.max(maxLat, vehicle.latitude);
      minLng = math.min(minLng, vehicle.longitude);
      maxLng = math.max(maxLng, vehicle.longitude);
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  LatLng? _centroidOfVehicles(List<Vehicle> vehicles) {
    if (vehicles.isEmpty) {
      return null;
    }
    var latSum = 0.0;
    var lngSum = 0.0;
    for (final Vehicle vehicle in vehicles) {
      latSum += vehicle.latitude;
      lngSum += vehicle.longitude;
    }
    return LatLng(latSum / vehicles.length, lngSum / vehicles.length);
  }

  double _gridSizeForZoom(double zoom) {
    final size = 20 / math.pow(2, zoom - 3);
    final result = size.toDouble();
    if (result < 0.002) {
      return 0.002;
    }
    if (result > 25) {
      return 25;
    }
    return result;
  }

  void _rebuildClusters() {
    final vehicles = _validVehicles(widget.vehicles);
    if (!mounted) {
      return;
    }

    final gridSize = _gridSizeForZoom(_zoom);
    final clusters = <String, List<Vehicle>>{};

    for (final Vehicle vehicle in vehicles) {
      final row = (vehicle.latitude / gridSize).floor();
      final col = (vehicle.longitude / gridSize).floor();
      final key = '$row:$col';
      clusters.putIfAbsent(key, () => <Vehicle>[]).add(vehicle);
    }

    final markers = <Marker>{};
    for (final MapEntry<String, List<Vehicle>> entry in clusters.entries) {
      final items = entry.value;
      if (items.isEmpty) {
        continue;
      }
      if (items.length == 1) {
        markers.add(_buildSingleVehicleMarker(items.first));
      } else {
        markers.add(_buildClusterMarker(items, entry.key));
      }
    }

    setState(() {
      _markers = markers;
    });
  }

  Marker _buildSingleVehicleMarker(Vehicle vehicle) {
    final hue = switch (vehicle.mode) {
      VehicleMode.active => BitmapDescriptor.hueGreen,
      VehicleMode.inactive => BitmapDescriptor.hueOrange,
      VehicleMode.nogps => BitmapDescriptor.hueRed,
      VehicleMode.pending => BitmapDescriptor.hueViolet,
    };
    final socText = vehicle.soc?.toString() ?? 'N/A';
    return Marker(
      markerId: MarkerId('vehicle_${vehicle.vehicleId}'),
      position: LatLng(vehicle.latitude, vehicle.longitude),
      icon: BitmapDescriptor.defaultMarkerWithHue(hue),
      infoWindow: InfoWindow(
        title: vehicle.displayId,
        snippet:
            '${vehicle.vehicleType} • ${vehicle.city}\nSpeed ${vehicle.speed.toStringAsFixed(1)} km/h • SoC $socText',
      ),
    );
  }

  bool _iosMapGuardEnabled() {
    return !kIsWeb &&
        defaultTargetPlatform == TargetPlatform.iOS &&
        !AppConfig.enableIosGoogleMaps;
  }

  Widget _buildIosConfigurationHint(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const <Widget>[
                  Text(
                    'Google Maps is disabled on iOS by safety guard.',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Complete iOS native map setup first (AppDelegate + API key), then run with '
                    '--dart-define=ENABLE_IOS_GOOGLE_MAPS=true.',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Marker _buildClusterMarker(List<Vehicle> vehicles, String key) {
    final center = _centroidOfVehicles(vehicles) ?? _indiaCenter;
    return Marker(
      markerId: MarkerId('cluster_$key'),
      position: center,
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      infoWindow: InfoWindow(
        title: '${vehicles.length} vehicles',
        snippet: 'Tap to zoom in',
      ),
      onTap: () {
        final controller = _mapController;
        if (controller == null) {
          return;
        }
        final nextZoom = (_zoom + 2).clamp(3, 20).toDouble();
        controller.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(target: center, zoom: nextZoom),
          ),
        );
      },
    );
  }
}
