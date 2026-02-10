import '../models/user_info.dart';
import 'api_client.dart';

class AuthService {
  AuthService({
    required ApiClient apiClient,
  }) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<UserInfo> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.postJson(
      '/users/login/',
      payload: <String, dynamic>{
        'email': email,
        'password': password,
      },
    );

    if (response is! Map) {
      throw ApiException(message: 'Unexpected login response format');
    }
    final data = Map<String, dynamic>.from(response as Map);
    return UserInfo.fromJson(data);
  }
}
