import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException({
    required this.message,
    this.statusCode,
    this.body,
  });

  final String message;
  final int? statusCode;
  final String? body;

  @override
  String toString() {
    final code = statusCode == null ? '' : ' (status: $statusCode)';
    return 'ApiException$code: $message';
  }
}

class ApiClient {
  ApiClient({
    required this.baseUrl,
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;

  Uri _buildUri(
    String path, {
    Map<String, String>? queryParameters,
  }) {
    final normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    final source = '$normalizedBase/$normalizedPath';
    final uri = Uri.parse(source);
    if (queryParameters == null || queryParameters.isEmpty) {
      return uri;
    }
    return uri.replace(queryParameters: <String, String>{
      ...uri.queryParameters,
      ...queryParameters,
    });
  }

  Future<dynamic> getJson(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final response = await _httpClient.get(
      _buildUri(path, queryParameters: queryParameters),
      headers: headers,
    );
    return _decodeResponse(response);
  }

  Future<dynamic> postJson(
    String path, {
    required Map<String, dynamic> payload,
    Map<String, String>? headers,
  }) async {
    final response = await _httpClient.post(
      _buildUri(path),
      headers: <String, String>{
        'Content-Type': 'application/json',
        ...?headers,
      },
      body: jsonEncode(payload),
    );
    return _decodeResponse(response);
  }

  dynamic _decodeResponse(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      var message = 'Request failed';
      final body = response.body;
      if (body.isNotEmpty) {
        try {
          final parsed = jsonDecode(body);
          if (parsed is Map && parsed['detail'] != null) {
            message = parsed['detail'].toString();
          } else if (parsed is Map && parsed['message'] != null) {
            message = parsed['message'].toString();
          }
        } catch (_) {
          message = body;
        }
      }
      throw ApiException(
        message: message,
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    if (response.body.isEmpty) {
      return null;
    }
    try {
      return jsonDecode(response.body);
    } catch (_) {
      return response.body;
    }
  }

  void close() {
    _httpClient.close();
  }
}
