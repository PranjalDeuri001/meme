import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

typedef SocketMessageHandler = void Function(dynamic message);
typedef SocketErrorHandler = void Function(Object error);
typedef SocketCloseHandler = void Function();

class RobustWebSocket {
  RobustWebSocket(
    this.url, {
    this.timeout = const Duration(seconds: 10),
    this.onOpenMessage,
    this.onMessage,
    this.onClose,
    this.onError,
  }) {
    connect();
  }

  final String url;
  final Duration timeout;
  final Map<String, dynamic>? onOpenMessage;
  final SocketMessageHandler? onMessage;
  final SocketCloseHandler? onClose;
  final SocketErrorHandler? onError;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _connectionTimeout;
  bool _forcedClose = false;

  void connect() {
    if (_forcedClose) {
      return;
    }

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
    } catch (error) {
      onError?.call(error);
      return;
    }

    _connectionTimeout = Timer(timeout, () {
      if (_channel != null) {
        internalClose();
      }
    });

    _subscription = _channel!.stream.listen(
      (dynamic event) {
        _connectionTimeout?.cancel();
        try {
          final decoded = (event is String) ? jsonDecode(event) : event;
          onMessage?.call(decoded);
        } catch (_) {
          // Ignore malformed payloads, matching the React behavior.
        }
      },
      onError: (Object error) {
        if (_forcedClose) {
          return;
        }
        onError?.call(error);
      },
      onDone: () {
        _connectionTimeout?.cancel();
        if (_forcedClose) {
          return;
        }
        onClose?.call();
      },
      cancelOnError: false,
    );

    if (onOpenMessage != null) {
      // web_socket_channel does not expose a direct open callback across platforms.
      // Sending in a microtask keeps behavior close to the React implementation.
      scheduleMicrotask(() {
        if (_forcedClose || _channel == null) {
          return;
        }
        try {
          _channel!.sink.add(jsonEncode(onOpenMessage));
        } catch (error) {
          onError?.call(error);
        }
      });
    }
  }

  void internalClose() {
    _subscription?.cancel();
    _subscription = null;
    _connectionTimeout?.cancel();
    _connectionTimeout = null;
    try {
      _channel?.sink.close();
    } catch (_) {
      // best effort
    } finally {
      _channel = null;
    }
  }

  void close() {
    _forcedClose = true;
    internalClose();
  }
}
