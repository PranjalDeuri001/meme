// src/store/socketManager.js

let metricsSocket = null;
let liveDataSocket = null;

// Track the currently ACTIVE socket ID (e.g., "5t", null)
let activeMetricsId = undefined; 
// Track the LATEST requested ID
let pendingMetricsId = undefined;

// Timer for debouncing (The Fix)
let connectTimer = null;

let metricsChain = Promise.resolve();
let liveDataChain = Promise.resolve();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const socketManager = {
  // -------------------------
  // LIVE DATA HANDLERS (Persistent)
  // -------------------------
  connectLiveData: (createSocketFn) => {
    liveDataChain = liveDataChain.then(async () => {
      if (liveDataSocket) return; // Keep alive
      liveDataSocket = createSocketFn();
    }).catch(err => console.error("LiveData Chain Error:", err));
  },

  closeLiveDataSocket: () => {
    liveDataChain = liveDataChain.then(async () => {
      if (liveDataSocket) {
        liveDataSocket.close();
        liveDataSocket = null;
      }
      await wait(100);
    });
  },

  // -------------------------
  // METRICS HANDLERS (Debounced)
  // -------------------------
  
  connectMetrics: (id, createSocketFn) => {
    // 1. Update the latest desired ID
    pendingMetricsId = id;

    // 2. CANCEL any pending connection that hasn't started yet.
    // This stops the "13.5m -> 12m -> 7m" rapid-fire chain.
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }

    // 3. Start a timer. We only execute if no new requests come in for 250ms.
    connectTimer = setTimeout(() => {
      
      metricsChain = metricsChain.then(async () => {
        // Double-check: Is this still the latest ID?
        if (pendingMetricsId !== id) return;

        // 4. Close existing socket (if any)
        if (metricsSocket) {
          // console.log(`[SocketManager] Closing previous socket (${activeMetricsId}) to open ${id}`);
          metricsSocket.close();
          metricsSocket = null;
          activeMetricsId = undefined;
          await wait(300); // Wait for clean disconnect
        }

        // 5. Connect (Only if we are still the latest request)
        if (pendingMetricsId === id) {
          console.log(`[SocketManager] Connecting Metrics Socket: ${id === null ? "ALL (null)" : id}`);
          activeMetricsId = id;
          metricsSocket = createSocketFn();
        }
      }).catch(err => console.error("Metrics Chain Error:", err));

    }, 250); // 250ms debounce delay
  },

  closeMetricsSocket: (id) => {
    metricsChain = metricsChain.then(async () => {
      // Only close if we are actually connected to this ID
      if (metricsSocket && activeMetricsId === id) {
        console.log(`[SocketManager] Closing Metrics Socket for ${id}.`);
        metricsSocket.close();
        metricsSocket = null;
        activeMetricsId = undefined;
      }
      await wait(100);
    });
  },

  // -------------------------
  // GLOBAL CLEANUP (Logout)
  // -------------------------
  closeAllSockets: () => {
    console.log("[SocketManager] FORCE CLOSING ALL SOCKETS.");
    
    // Clear any pending debounce timers
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }

    liveDataChain = Promise.resolve();
    metricsChain = Promise.resolve();

    if (liveDataSocket) {
      liveDataSocket.close();
      liveDataSocket = null;
    }
    if (metricsSocket) {
      metricsSocket.close();
      metricsSocket = null;
      activeMetricsId = undefined;
      pendingMetricsId = undefined;
    }
  },
};