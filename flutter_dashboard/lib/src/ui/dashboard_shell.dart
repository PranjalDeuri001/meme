import 'dart:async';

import 'package:flutter/material.dart';

import '../controllers/app_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../models/dashboard_route.dart';
import '../models/user_info.dart';
import 'pages/alerts_page.dart';
import 'pages/custom_analysis_page.dart';
import 'pages/feature_placeholder_page.dart';
import 'pages/fault_database_page.dart';
import 'pages/fleet_summary_page.dart';
import 'pages/home_page.dart';
import 'pages/management_dashboard_page.dart';
import 'pages/reports_page.dart';
import 'pages/vehicle_status_page.dart';

class DashboardShell extends StatefulWidget {
  const DashboardShell({
    super.key,
    required this.appController,
    required this.dashboardController,
    required this.onLogout,
  });

  final AppController appController;
  final DashboardController dashboardController;
  final Future<void> Function() onLogout;

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  DateTime _now = DateTime.now();
  Timer? _clockTimer;

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) {
        setState(() {
          _now = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge(<Listenable>[
        widget.appController,
        widget.dashboardController,
      ]),
      builder: (BuildContext context, _) {
        final user = widget.appController.user;
        if (user == null) {
          return const SizedBox.shrink();
        }

        final routes = widget.appController.visibleRoutes;
        if (routes.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('EKA Dashboard')),
            body: const Center(
              child: Text('No features are enabled for this user.'),
            ),
          );
        }

        final selectedPath = _resolveSelectedPath(routes);
        final activeAlerts = widget.dashboardController.alerts
            .where((alert) => alert.isActive)
            .length;

        return Scaffold(
          appBar: AppBar(
            title: const Text('EKA Dashboard'),
            actions: <Widget>[
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    _formatDateTime(_now),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ),
              IconButton(
                onPressed: widget.appController.toggleTheme,
                icon: Icon(
                  Theme.of(context).brightness == Brightness.dark
                      ? Icons.light_mode
                      : Icons.dark_mode,
                ),
                tooltip: 'Toggle theme',
              ),
              Stack(
                children: <Widget>[
                  IconButton(
                    onPressed: () => widget.appController.setSelectedPath('/alerts-notification'),
                    icon: const Icon(Icons.notifications_active),
                    tooltip: 'Live alerts',
                  ),
                  if (activeAlerts > 0)
                    Positioned(
                      right: 7,
                      top: 7,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          activeAlerts > 99 ? '99+' : '$activeAlerts',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              PopupMenuButton<String>(
                tooltip: user.displayName,
                icon: CircleAvatar(
                  child: Text(
                    user.displayName.isEmpty
                        ? '?'
                        : user.displayName.substring(0, 1).toUpperCase(),
                  ),
                ),
                onSelected: (String value) async {
                  if (value == 'logout') {
                    await widget.onLogout();
                  }
                },
                itemBuilder: (BuildContext context) {
                  return <PopupMenuEntry<String>>[
                    PopupMenuItem<String>(
                      enabled: false,
                      child: _UserInfoRow(user: user),
                    ),
                    const PopupMenuDivider(),
                    const PopupMenuItem<String>(
                      value: 'logout',
                      child: Text('Logout'),
                    ),
                  ];
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          drawer: Drawer(
            child: SafeArea(
              child: Column(
                children: <Widget>[
                  ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(user.displayName),
                    subtitle: Text(user.email ?? user.username),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: ListView(
                      children: routes.map((DashboardRoute route) {
                        final selected = route.path == selectedPath;
                        return ListTile(
                          selected: selected,
                          leading: Icon(route.icon),
                          title: Text(route.title),
                          onTap: () {
                            widget.appController.setSelectedPath(route.path);
                            Navigator.of(context).pop();
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          body: _buildPageForPath(selectedPath),
        );
      },
    );
  }

  String _resolveSelectedPath(List<DashboardRoute> routes) {
    final selected = widget.appController.selectedPath;
    final found = routes.any((DashboardRoute route) => route.path == selected);
    if (found) {
      return selected;
    }
    final fallback = routes.first.path;
    widget.appController.setSelectedPath(fallback);
    return fallback;
  }

  Widget _buildPageForPath(String path) {
    switch (path) {
      case '/home':
        return HomePage(controller: widget.dashboardController);
      case '/alerts-notification':
        return AlertsPage(controller: widget.dashboardController);
      case '/management-dashboard':
        return ManagementDashboardPage(
          controller: widget.dashboardController,
        );
      case '/fleet-summary':
        return FleetSummaryPage(
          controller: widget.dashboardController,
        );
      case '/device-summary':
        return VehicleStatusPage(
          controller: widget.dashboardController,
        );
      case '/custom-analysis':
        return CustomAnalysisPage(
          controller: widget.dashboardController,
        );
      case '/reports':
        return ReportsPage(
          controller: widget.dashboardController,
        );
      case '/faults':
        return FaultDatabasePage(
          controller: widget.dashboardController,
        );
      case '/add-vehicle':
        return const FeaturePlaceholderPage(
          title: 'Add Vehicle',
          description:
              'Implement vehicle onboarding form and server mutation endpoint integration.',
        );
      default:
        return FeaturePlaceholderPage(
          title: 'Unknown Route',
          description: 'No page mapped for path: $path',
        );
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final month = dateTime.month.toString().padLeft(2, '0');
    final day = dateTime.day.toString().padLeft(2, '0');
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '${dateTime.year}-$month-$day $hour:$minute';
  }
}

class _UserInfoRow extends StatelessWidget {
  const _UserInfoRow({
    required this.user,
  });

  final UserInfo user;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          user.displayName,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          user.email ?? user.username,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
