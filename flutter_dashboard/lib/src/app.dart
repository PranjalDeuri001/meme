import 'package:flutter/material.dart';

import 'config/app_config.dart';
import 'controllers/app_controller.dart';
import 'controllers/dashboard_controller.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/dashboard_repository.dart';
import 'ui/dashboard_shell.dart';
import 'ui/pages/login_page.dart';

class EkaDashboardFlutterApp extends StatefulWidget {
  const EkaDashboardFlutterApp({super.key});

  @override
  State<EkaDashboardFlutterApp> createState() => _EkaDashboardFlutterAppState();
}

class _EkaDashboardFlutterAppState extends State<EkaDashboardFlutterApp> {
  late final ApiClient _apiClient;
  late final DashboardRepository _dashboardRepository;
  late final AuthService _authService;
  late final AppController _appController;
  late final DashboardController _dashboardController;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient(baseUrl: AppConfig.apiUrl);
    _dashboardRepository = DashboardRepository(
      backendUrl: AppConfig.apiUrl,
      webSocketUrl: AppConfig.wsUrl,
      apiClient: _apiClient,
    );
    _authService = AuthService(apiClient: _apiClient);
    _appController = AppController();
    _dashboardController = DashboardController(repository: _dashboardRepository);
  }

  @override
  void dispose() {
    _dashboardController.dispose();
    _appController.dispose();
    _dashboardRepository.close();
    super.dispose();
  }

  Future<void> _handleLogin({
    required String email,
    required String password,
  }) async {
    final userInfo = await _authService.login(
      email: email,
      password: password,
    );
    _appController.login(userInfo);
    await _dashboardController.initialize(username: userInfo.username);
  }

  Future<void> _handleLogout() async {
    await _dashboardController.stop();
    _appController.logout();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _appController,
      builder: (BuildContext context, _) {
        return MaterialApp(
          title: 'EKA Dashboard (Flutter)',
          debugShowCheckedModeBanner: false,
          themeMode: _appController.themeMode,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.deepPurple,
              brightness: Brightness.dark,
            ),
            useMaterial3: true,
          ),
          home: _appController.isAuthenticated
              ? DashboardShell(
                  appController: _appController,
                  dashboardController: _dashboardController,
                  onLogout: _handleLogout,
                )
              : LoginPage(onSubmit: _handleLogin),
        );
      },
    );
  }
}
