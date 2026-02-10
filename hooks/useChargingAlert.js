import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
const ALERT_DATA_KEY = "charging_alert_data";
const IGNORE_KEY = "charging_alert_ignore_until";

// --- CONFIGURATION (MULTI-STATE SUPPORT) ---
const STATE_POLICIES = {
  // Madhya Pradesh (MPEB)
  MP: [
    { start: 6, end: 9, type: "surcharge", rate: 1.5, label: "+₹1.5/unit", adviceKey: "advice_wait_until_9am", provider: "MPEB Bill" },
    { start: 9, end: 17, type: "rebate", rate: 1.5, label: "-₹1.5/unit", adviceKey: "advice_good_time", provider: "MPEB Bill" },
    { start: 17, end: 22, type: "surcharge", rate: 1.5, label: "+₹1.5/unit", adviceKey: "advice_wait_until_10pm", provider: "MPEB Bill" },
    { start: 22, end: 24, type: "rebate", rate: 0.6, label: "-₹0.60/unit", adviceKey: "advice_good_time", provider: "MPEB Bill" },
    { start: 0, end: 6, type: "rebate", rate: 0.6, label: "-₹0.60/unit", adviceKey: "advice_good_time", provider: "MPEB Bill" },
  ],
  // Maharashtra (MSEDCL)
  MH: [
    { start: 0, end: 6, type: "normal", rate: 0, labelKey: "label_standard", adviceKey: "advice_wait_until_9am", provider: "MSEDCL Bill" },
    { start: 6, end: 9, type: "normal", rate: 0, labelKey: "label_standard", adviceKey: "advice_wait_until_9am", provider: "MSEDCL Bill" },
    { start: 9, end: 17, type: "rebate", rate: 1.3, label: "-₹1.3/unit", adviceKey: "advice_good_time", provider: "MSEDCL Bill" },
    { start: 17, end: 24, type: "surcharge", rate: 2.17, label: "+₹2.17/unit", adviceKey: "advice_stop_high_rates", provider: "MSEDCL Bill" },
  ],
  // Odisha (TPCODL/TPSODL)
  OD: [
    { start: 8, end: 16, type: "rebate", rate: 1.0, label: "-₹1.0/unit", adviceKey: "advice_solar_hours", provider: "TPCODL Bill" },
    { start: 18, end: 24, type: "surcharge", rate: 1.0, label: "+₹1.0/unit", adviceKey: "advice_evening_peak", provider: "TPCODL Bill" },
  ],
  // Karnataka (BESCOM)
  KA: [
    { start: 6, end: 10, type: "surcharge", rate: 1.0, label: "+₹1.0/unit", adviceKey: "advice_morning_peak", provider: "BESCOM Bill" },
    { start: 18, end: 22, type: "surcharge", rate: 1.0, label: "+₹1.0/unit", adviceKey: "advice_evening_peak", provider: "BESCOM Bill" },
  ],
  // Delhi (DL) - Peak 2-5PM & 10PM-1AM, Off-peak 12AM-6AM
  DL: [
    { start: 0, end: 6, type: "rebate", rate: 1.0, label: "-20%", adviceKey: "advice_off_peak", provider: "Delhi DISCOM Bill" },
    { start: 14, end: 17, type: "surcharge", rate: 1.0, label: "+20%", adviceKey: "advice_peak_hours", provider: "Delhi DISCOM Bill" },
    { start: 22, end: 24, type: "surcharge", rate: 1.0, label: "+20%", adviceKey: "advice_peak_hours", provider: "Delhi DISCOM Bill" },
  ],
};

const useChargingAlert = (deviceLookup = {}, apiUrl, username, pollingInterval = 300000) => {
  const { t } = useTranslation();
  const [alertData, setAlertData] = useState({
    chargingDevices: [],
    message: "",
    severity: "info",
    showToast: false,
  });
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- FIX: Lazy Initialization to prevent "flash" of alert on load ---
  const [isIgnored, setIsIgnored] = useState(() => {
    const ignoreUntil = localStorage.getItem(IGNORE_KEY);
    return ignoreUntil && Date.now() < parseInt(ignoreUntil, 10);
  });

  // Use Ref instead of State for prevDeviceCount to avoid recreating callbacks
  const prevDeviceCountRef = useRef(0);

  // --- REF: Stable reference for lookup to avoid dependency cycles ---
  const deviceLookupRef = useRef(deviceLookup);
  useEffect(() => {
    deviceLookupRef.current = deviceLookup;
  }, [deviceLookup]);

  const pollingRef = useRef(null);

  const cacheAlertData = useCallback((data) => {
    try {
      localStorage.setItem(
        ALERT_DATA_KEY,
        JSON.stringify({ ...data, cachedAt: new Date().toISOString() })
      );
    } catch (e) {
      console.error("Failed to cache alert data:", e);
    }
  }, []);

  const ignoreToast = useCallback((hours = 4) => {
    const expiryTime = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(IGNORE_KEY, expiryTime.toString());
    setIsIgnored(true);
    setToasts([]);
  }, []);

  // --- HELPER: Detect State per VRN ---
  const getStateForVehicle = (vrn) => {
    if (!vrn) return "MH";
    const prefix = vrn.substring(0, 2).toUpperCase();
    return STATE_POLICIES[prefix] ? prefix : "MH";
  };

  // --- HELPER: Get Status for One Vehicle ---
  const getVehicleStatus = (state, currentHour) => {
    const zones = STATE_POLICIES[state] || STATE_POLICIES.MH;
    const activeZone = zones.find(
      (z) => currentHour >= z.start && currentHour < z.end
    );

    if (!activeZone)
      return { type: "normal", rate: 0, labelKey: "label_standard", adviceKey: "" };
    return activeZone;
  };

  // --- HELPER: Translate adviceKey and labelKey to actual strings ---
  const translateStatus = (status) => {
    return {
      ...status,
      label: status.labelKey ? t(`chargingAlert.${status.labelKey}`) : status.label,
      advice: status.adviceKey ? t(`chargingAlert.${status.adviceKey}`) : status.advice || ""
    };
  };

  // --- HELPER: Get Best Savings Advice (Re-adding lost helper) ---
  const getBestTimeAdvice = (state) => {
    const zones = STATE_POLICIES[state] || STATE_POLICIES.MH;
    const rebateZone = zones.find(z => z.type === 'rebate');
    if (rebateZone) {
      const startStr = rebateZone.start > 12 ? `${rebateZone.start - 12} PM` : `${rebateZone.start} AM`;
      const endStr = rebateZone.end > 12 ? `${rebateZone.end - 12} PM` : `${rebateZone.end} AM`;
      const savings = rebateZone.label.replace('-', ''); // e.g. "₹1.3/unit"
      return t('chargingAlert.fallback_off_peak');
    }
    return t('chargingAlert.fallback_off_peak');
  };

  const processAlertData = useCallback(
    (data) => {
      const rawDevices = data.charging_devices || [];

      // 1. Get Current Hour
      const now = new Date();
      const timeParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).formatToParts(now);
      const currentHour = parseInt(
        timeParts.find((p) => p.type === "hour").value,
        10
      );

      // 2. Normalize & Analyze Each Device
      let surchargeCount = 0;
      let rebateCount = 0;
      // eslint-disable-next-line no-unused-vars
      let normalCount = 0;
      const affectedStates = new Set();
      const rebateStates = new Set();
      const distinctAdvice = new Set();

      const devices = rawDevices.map((d) => {
        // Extract data
        let imei, soc, vrn;
        if (typeof d === "object" && d !== null && !Array.isArray(d)) {
          imei = d.imei || d.id || "Unknown";
          soc = d.soc ?? null;
          // Added d.VRN and d.Vrn to ensure we capture the vehicle number correctly
          vrn = d.vrn || d.VRN || d.Vrn || d.vehicle_number || d.id || "";
        } else if (Array.isArray(d)) {
          imei = d[1] || d[0];
          soc = null;
          vrn = d[2] || d[0] || ""; // Assuming index 2 might be VRN
        } else {
          imei = d;
          soc = null;
          vrn = d;
        }

        // --- Use Ref for Lookup ---
        const lookup = deviceLookupRef.current || {};
        if ((!vrn || vrn === imei) && lookup[imei]) {
          vrn = lookup[imei].vrn || vrn;
        }

        // Determine State & Status for THIS vehicle
        const state = getStateForVehicle(vrn);

        const rawStatus = getVehicleStatus(state, currentHour);
        const status = translateStatus(rawStatus); // Translate adviceKey and labelKey

        // Count stats & Collect States
        if (status.type === "surcharge") {
          surchargeCount++;
          affectedStates.add(state);
          // if (status.advice) distinctAdvice.add(status.advice); // Advice is now dynamic
        } else if (status.type === "rebate") {
          rebateCount++;
          rebateStates.add(state);
          affectedStates.add(state); // Enable Detailed Message for Green Banner too
        } else {
          normalCount++;
        }

        return { imei, soc, vrn, state, status };
      });

      // 3. Determine Overall Severity & Message
      let severity = "info";
      let message = "";

      // Logic to construct the detailed message
      const statesArr = Array.from(affectedStates);

      if (statesArr.length > 0) {
        // 1. Group states by Timing Window to handle differences (e.g. OD is 8-4, MH is 9-5)
        const timingGroups = {};

        statesArr.forEach(stateCode => {
          const zones = STATE_POLICIES[stateCode] || STATE_POLICIES.MH;
          const rebateZone = zones.find(z => z.type === 'rebate');

          const start = rebateZone ? rebateZone.start : 9;
          const end = rebateZone ? rebateZone.end : 17;
          const rate = rebateZone ? rebateZone.rate : 0;
          const provider = (rebateZone && rebateZone.provider) ? rebateZone.provider : "Provider";

          const startStr = start > 12 ? `${start - 12}.00 PM` : `${start}.00 AM`;
          const endStr = end > 12 ? `${end - 12}.00 PM` : `${end}.00 AM`;
          const timingKey = `${startStr} - ${endStr}`;

          if (!timingGroups[timingKey]) {
            timingGroups[timingKey] = [];
          }
          timingGroups[timingKey].push(`₹${rate} (As per ${provider})`);
        });

        // 2. Build Message Segments
        const segments = Object.entries(timingGroups).map(([timing, rates]) => {
          const ratesString = rates.join(" or ");
          return `if you charge your vehicle between ${timing}, you will get a rebate of ${ratesString} per unit`;
        });

        // 3. Join Segments
        if (segments.length === 1) {
          message = t('chargingAlert.charging_rebate_message', {
            timing: Object.keys(timingGroups)[0],
            rates: Object.values(timingGroups)[0].join(" or ")
          });
        } else {
          // Complex mix with different timings (e.g. MH + OD)
          message = `Dear user, ${segments.join(". Also, ")} of the electricity consumed.`;
        }
      } else {
        // Default fallback if no vehicles
        message = t('chargingAlert.fallback_check_rebate');
      }

      if (surchargeCount > 0) {
        severity = "error";
      } else if (rebateCount > 0) {
        severity = "success";
      } else {
        severity = "info";
      }

      // 4. Smart Visibility Logic
      const prevCount = prevDeviceCountRef.current;
      const countIncreased = devices.length > prevCount;
      const showToast = devices.length > 0 && (!isIgnored || countIncreased);

      if (devices.length !== prevCount) {
        prevDeviceCountRef.current = devices.length;
      }

      return {
        chargingDevices: devices,
        message,
        severity,
        showToast,
        timestamp: Date.now(),
      };
    },
    [isIgnored]
  );

  const fetchChargingAlert = useCallback(
    async (url, user) => {
      // Logic from `startPolling` callback integrated here or kept separate

      // Check ignore again just in case (though state handles it)
      const ignoreUntil = localStorage.getItem(IGNORE_KEY);
      if (ignoreUntil && Date.now() > parseInt(ignoreUntil, 10)) {
        setIsIgnored(false);
        localStorage.removeItem(IGNORE_KEY);
      }

      if (!user || !url) return;

      setIsLoading(true);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const processed = processAlertData(data); // Uses stable processAlertData

        setAlertData(processed);
        cacheAlertData(processed);

        if (processed.showToast) {
          setToasts((prev) => {
            const existing = prev[0];
            const isSameType = existing && existing.severity === processed.severity;
            const newToast = {
              ...processed,
              id: isSameType ? existing.id : `charging-alert-${Date.now()}`,
            };
            return [newToast];
          });
        } else {
          setToasts([]);
        }
      } catch (e) {
        console.error("Failed to fetch charging alert:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [processAlertData, cacheAlertData]
  );

  // --- INTERNAL EFFECT: Manage Polling Lifecycle ---
  useEffect(() => {
    // Clean up previous interval immediately
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!apiUrl || !username) return;

    // 1. Immediate Call
    fetchChargingAlert(apiUrl, username);

    // 2. Set Interval
    pollingRef.current = setInterval(() => {
      fetchChargingAlert(apiUrl, username);
    }, pollingInterval);

    // 3. Cleanup on Unmount or Arg Change
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [apiUrl, username, pollingInterval, fetchChargingAlert]);


  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    alertData,
    toasts,
    dismissToast,
    ignoreToast,
    isLoading,
  };
};

export default useChargingAlert;
