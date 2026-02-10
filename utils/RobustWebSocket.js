// src/utils/RobustWebSocket.js

export class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.ws = null;
    this.timeout = options.timeout ?? 10000;

    // Callbacks
    this.onOpenMessage = options.onOpenMessage;
    this.onMessage = options.onMessage;
    this.onClose = options.onClose;
    this.onError = options.onError;

    this.forcedClose = false;

    this.connect();
  }

  connect() {
    if (this.forcedClose) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error("[WS] Error creating WebSocket:", err);
      return;
    }

    const connectionTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.internalClose();
      }
    }, this.timeout);

    this.ws.onopen = () => {
      clearTimeout(connectionTimeout);

      if (this.onOpenMessage && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(this.onOpenMessage));
        } catch (err) {
          console.error("[WS] Failed to send onOpenMessage:", err);
        }
      }
    };

    this.ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      if (this.forcedClose) return;
      if (this.onClose) this.onClose(event);
    };

    this.ws.onerror = (error) => {
      if (this.forcedClose) return;
      if (this.onError) this.onError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(data);
      } catch (e) {
        console.error(e);
        // ignore JSON parse errors
      }
    };
  }

  internalClose() {
    if (!this.ws) return;

    // Remove listeners to prevent noise
    this.ws.onopen = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;

    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000);
      } else {
        // If connecting, close without code to prevent browser exception
        this.ws.close();
      }
    } catch (e) {
      console.log(e);
    }

    this.ws = null;
  }

  close() {
    this.forcedClose = true;
    this.internalClose();
  }
}
