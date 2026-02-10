class UserInfo {
  UserInfo({
    required this.username,
    this.userId,
    this.name,
    this.email,
    this.avatar,
    required this.dashboardFeatures,
    required this.raw,
  });

  final int? userId;
  final String username;
  final String? name;
  final String? email;
  final String? avatar;
  final Set<String> dashboardFeatures;
  final Map<String, dynamic> raw;

  String get displayName => (name == null || name!.isEmpty) ? username : name!;

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    final subscription = json['subscription'];
    final featuresRoot = subscription is Map ? subscription['features'] : null;
    final dashboardFeatureList =
        featuresRoot is Map ? featuresRoot['EKA Dashboard'] : null;

    final features = <String>{};
    if (dashboardFeatureList is List) {
      for (final feature in dashboardFeatureList) {
        if (feature is String && feature.trim().isNotEmpty) {
          features.add(_normalizeFeatureName(feature));
        }
      }
    }

    final username = (json['username'] ?? '').toString().trim();
    if (username.isEmpty) {
      throw const FormatException('Missing username in login payload');
    }

    return UserInfo(
      userId: _tryParseInt(json['user_id']),
      username: username,
      name: json['name']?.toString(),
      email: (json['email'] ?? json['username'])?.toString(),
      avatar: json['avatar']?.toString(),
      dashboardFeatures: features,
      raw: Map<String, dynamic>.from(json),
    );
  }

  static int? _tryParseInt(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is int) {
      return value;
    }
    return int.tryParse(value.toString());
  }

  static String _normalizeFeatureName(String input) {
    return input
        .replaceAll('\u00A0', ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }
}
