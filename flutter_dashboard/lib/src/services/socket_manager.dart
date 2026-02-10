import 'dart:async';
import 'dart:convert';

import 'robust_web_socket.dart';

class SocketManager {
  RobustWebSocket? _metricsSocket;
  RobustWebSocket? _liveDataSocket;

  String? _activeMetricsIdKey;
  String? _pendingMetricsIdKey;

  Timer? _connectTimer;

  Future<void> _metricsChain = Future<void>.value();
  Future<void> _liveDataChain = Future<void>.value();

  Future<void> _wait(int milliseconds) {
    return Future<void>.delayed(Duration(milliseconds: milliseconds));
  }

  String _toIdKey(Object? id) {
    try {
      return jsonEncode(id);
    } catch (_) {
      return id.toString();
    }
  }

  void connectLiveData(RobustWebSocket Function() createSocketFn) {
    _liveDataChain = _liveDataChain.then((_) async {
      if (_liveDataSocket != null) {
        return;
      }
      _liveDataSocket = createSocketFn();
    }).catchError((_) {
      // keep chain alive
    });
  }

  void closeLiveDataSocket() {
    _liveDataChain = _liveDataChain.then((_) async {
      _liveDataSocket?.close();
      _liveDataSocket = null;
      await _wait(100);
    }).catchError((_) {
      // keep chain alive
    });
  }

  void connectMetrics(
    Object? id,
    RobustWebSocket Function() createSocketFn,
  ) {
    _pendingMetricsIdKey = _toIdKey(id);

    _connectTimer?.cancel();
    _connectTimer = Timer(const Duration(milliseconds: 250), () {
      final requestKey = _toIdKey(id);
      _metricsChain = _metricsChain.then((_) async {
        if (_pendingMetricsIdKey != requestKey) {
          return;
        }

        if (_metricsSocket != null) {
          _metricsSocket!.close();
          _metricsSocket = null;
          _activeMetricsIdKey = null;
          await _wait(300);
        }

        if (_pendingMetricsIdKey == requestKey) {
          _activeMetricsIdKey = requestKey;
          _metricsSocket = createSocketFn();
        }
      }).catchError((_) {
        // keep chain alive
      });
    });
  }

  void closeMetricsSocket(Object? id) {
    final idKey = _toIdKey(id);
    _metricsChain = _metricsChain.then((_) async {
      if (_metricsSocket != null && _activeMetricsIdKey == idKey) {
        _metricsSocket!.close();
        _metricsSocket = null;
        _activeMetricsIdKey = null;
      }
      await _wait(100);
    }).catchError((_) {
      // keep chain alive
    });
  }

  void closeAllSockets() {
    _connectTimer?.cancel();
    _connectTimer = null;

    _liveDataChain = Future<void>.value();
    _metricsChain = Future<void>.value();

    _liveDataSocket?.close();
    _liveDataSocket = null;

    _metricsSocket?.close();
    _metricsSocket = null;
    _activeMetricsIdKey = null;
    _pendingMetricsIdKey = null;
  }
}
