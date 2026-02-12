import 'package:flutter/material.dart';

class DashboardRoute {
  const DashboardRoute({
    required this.path,
    required this.title,
    required this.icon,
    this.featureName,
    this.alwaysVisible = false,
  });

  final String path;
  final String title;
  final IconData icon;
  final String? featureName;
  final bool alwaysVisible;
}

const List<DashboardRoute> kAllDashboardRoutes = <DashboardRoute>[
  DashboardRoute(
    path: '/home',
    title: 'Dashboard',
    icon: Icons.home_filled,
    alwaysVisible: true,
  ),
  DashboardRoute(
    path: '/management-dashboard',
    title: 'Management Dashboard',
    icon: Icons.space_dashboard,
    featureName: 'Management Dashboard',
  ),
  DashboardRoute(
    path: '/fleet-summary',
    title: 'Fleet Summary',
    icon: Icons.view_list_rounded,
    featureName: 'Fleet Summary',
  ),
  DashboardRoute(
    path: '/device-summary',
    title: 'Vehicle Status',
    icon: Icons.departure_board_outlined,
    featureName: 'Vehicle Status',
  ),
  DashboardRoute(
    path: '/custom-analysis',
    title: 'Custom Analysis',
    icon: Icons.calculate_rounded,
    featureName: 'Custom Analysis',
  ),
  DashboardRoute(
    path: '/reports',
    title: 'Reports',
    icon: Icons.file_download_rounded,
    featureName: 'Reports',
  ),
  DashboardRoute(
    path: '/faults',
    title: 'Fault Database',
    icon: Icons.warning_amber_rounded,
    featureName: 'Fault Database',
  ),
  DashboardRoute(
    path: '/alerts-notification',
    title: 'Live Alerts',
    icon: Icons.notifications_active,
    featureName: 'Live Alerts',
  ),
  DashboardRoute(
    path: '/add-vehicle',
    title: 'Add Vehicle',
    icon: Icons.add_circle,
    featureName: 'Add Vehicle',
  ),
];
