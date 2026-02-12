import 'package:flutter/material.dart';

import '../models/dashboard_route.dart';
import '../models/user_info.dart';

class AppController extends ChangeNotifier {
  UserInfo? _user;
  ThemeMode _themeMode = ThemeMode.light;
  String _selectedPath = '/home';

  UserInfo? get user => _user;
  bool get isAuthenticated => _user != null;
  ThemeMode get themeMode => _themeMode;
  String get selectedPath => _selectedPath;

  List<DashboardRoute> get visibleRoutes {
    final currentUser = _user;
    if (currentUser == null) {
      return const <DashboardRoute>[];
    }
    return kAllDashboardRoutes.where((DashboardRoute route) {
      if (route.alwaysVisible) {
        return true;
      }
      return route.featureName != null &&
          currentUser.dashboardFeatures.contains(route.featureName);
    }).toList();
  }

  bool canAccessRoute(String path) {
    final route = kAllDashboardRoutes.where((DashboardRoute item) => item.path == path);
    if (route.isEmpty) {
      return false;
    }
    final item = route.first;
    if (item.alwaysVisible) {
      return true;
    }
    final currentUser = _user;
    if (currentUser == null || item.featureName == null) {
      return false;
    }
    return currentUser.dashboardFeatures.contains(item.featureName);
  }

  void login(UserInfo userInfo) {
    _user = userInfo;

    if (!canAccessRoute(_selectedPath)) {
      _selectedPath = '/home';
    }
    notifyListeners();
  }

  void logout() {
    _user = null;
    _selectedPath = '/home';
    notifyListeners();
  }

  void setSelectedPath(String path) {
    if (!canAccessRoute(path)) {
      return;
    }
    _selectedPath = path;
    notifyListeners();
  }

  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}
