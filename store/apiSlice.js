// store/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RobustWebSocket } from "../utils/RobustWebSocket";
import { socketManager } from "./socketManager";

const backendUrl = import.meta.env.VITE_API_URL_3 || "http://localhost:8002";
const webSocketUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8002";

const isSignalInvalid = (value) =>
  value === undefined || value === null || value === "N" || value === 0;

const createInitialMetricsState = () => ({
  total_distance: "N/A",
  co2_saving: "N/A",
  energy_consumption: "N/A",
  run_time: "N/A",
  traction_energy: "N/A",
  regen_energy: "N/A",
  idle_time: "N/A",
  charging_unit: "N/A",
  cost_saved: "N/A",
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: backendUrl }),
  tagTypes: ["Vehicles", "FleetMetrics", "Summary"],
  endpoints: (builder) => ({
    // --- BASIC METADATA ---
    getAllDevices: builder.query({
      queryFn: async (_arg, { getState }) => {
        const { auth } = getState();
        const username =
          auth.userInfo?.username || localStorage.getItem("username");
        if (!username) return { data: [] };
        try {
          const response = await fetch(
            `${backendUrl}/devices/?username=${username}`
          );
          if (!response.ok) throw new Error("Failed");
          return { data: await response.json() };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: error.message } };
        }
      },
      keepUnusedDataFor: 3600,
    }),

    // --- LIVE DATA (With WebSocket) ---
    getVehicles: builder.query({
      queryFn: async (_arg, { getState }) => {
        try {
          const { auth } = getState();
          const username =
            auth.userInfo?.username || localStorage.getItem("username");
          if (!username) return { data: [] };

          const res = await fetch(
            `${backendUrl}/devices/?username=${username}`
          );
          if (!res.ok) throw new Error("Failed");
          let allDevices = await res.json();
          if (!allDevices) return { data: [] };

          const merged = allDevices.map((device) => {
            return {
              vehicle_id: device.device_id,
              displayId: device.VRN || device.chassis_number || "N/A",
              vehicleType: device.device_type_name || "N/A",
              city: device.city || "N/A",
              fleet: device.fleet || "N/A",
              mode: "pending",
              canData: false,
              timestamp: null,
              SOC: null,
              cellTemperature: null,
              DTE: null,
              latitude: 0,
              longitude: 0,
              heading: 0,
              speed: 0,
              odometer: null,
              socketData: null, // Initialize field for raw data
            };
          });
          return { data: merged };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: error.message } };
        }
      },
      keepUnusedDataFor: 3600,

      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const { auth } = getState();
        const username =
          auth.userInfo?.username || localStorage.getItem("username");
        if (!username) return;

        try {
          await cacheDataLoaded;

          const receivedUpdates = new Set();
          let initialUpdateDone = false;

          socketManager.connectLiveData(() => {
            return new RobustWebSocket(`${webSocketUrl}/ws/live-data/`, {
              onOpenMessage: { username },
              onMessage: (updates) => {
                if (Array.isArray(updates)) {
                  updateCachedData((draft) => {
                    if (!initialUpdateDone) initialUpdateDone = true;

                    updates.forEach((data) => {
                      const deviceId = data.imei || data.device_id;
                      if (!deviceId) return;

                      receivedUpdates.add(deviceId);

                      const vehicle = draft.find(
                        (v) => v.vehicle_id === deviceId
                      );
                      if (vehicle) {
                        // --- VITAL CHANGE HERE ---
                        // Store the FULL raw data object so we can access specific fields later
                        vehicle.socketData = data;
                        // -------------------------

                        const parsedLat = parseFloat(data.latitude);
                        const parsedLng = parseFloat(data.longitude);
                        const speedValue = parseFloat(data.speed);

                        vehicle.latitude = !isNaN(parsedLat)
                          ? parsedLat
                          : vehicle.latitude;
                        vehicle.longitude = !isNaN(parsedLng)
                          ? parsedLng
                          : vehicle.longitude;
                        vehicle.speed = !isNaN(speedValue) ? speedValue : 0;
                        vehicle.heading = parseFloat(data.heading) || 0;

                        if (parsedLat === 0 || parsedLng === 0) {
                          vehicle.mode = "nogps";
                        } else if (data.is_connected === true) {
                          vehicle.mode = "active";
                        } else {
                          vehicle.mode = "inactive";
                        }

                        vehicle.timestamp =
                          data.last_timestamp || data.timestamp;
                        // Handle both standard 'soc' and specific 'A_SOC_Value' if needed for the card view
                        vehicle.SOC = data.SOC || data.soc || data.A_SOC_Value;
                        // Handle temperature from different platforms
                        // 3W platform (3S, 6S) uses 'ts' field, others use 'cell_temp'
                        vehicle.cellTemperature =
                          data.ts ?? data.TS ?? data.cell_temp ?? "N/A";
                        vehicle.DTE = data.DTE || data.dte;
                        vehicle.odometer = data.odometer;
                        vehicle.canData = !isSignalInvalid(
                          data.SOC || data.soc || data.A_SOC_Value
                        );
                      }
                    });

                    if (initialUpdateDone) {
                      draft.forEach((v) => {
                        if (
                          !receivedUpdates.has(v.vehicle_id) ||
                          v.mode === "pending"
                        ) {
                          v.mode = "nogps";
                        }
                      });
                    }
                  });
                }
              },
            });
          });
        } catch (e) {
          console.error(e);
        }

        await cacheEntryRemoved;
        socketManager.closeLiveDataSocket();
      },
    }),

    // ... (Keep getFleetMetrics, getDailySummaryReport, getSummaryData exactly as they were) ...
    getFleetMetrics: builder.query({
      queryFn: () => ({ data: createInitialMetricsState() }),
      keepUnusedDataFor: 1,
      async onCacheEntryAdded(
        deviceTypeName,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const { auth } = getState();
        const username =
          auth.userInfo?.username || localStorage.getItem("username");
        if (!username) return;

        try {
          await cacheDataLoaded;
          socketManager.connectMetrics(deviceTypeName, () => {
            let onOpenMessage = { username };
            if (deviceTypeName && typeof deviceTypeName === "object") {
              onOpenMessage = { ...onOpenMessage, ...deviceTypeName };
            } else {
              onOpenMessage.device_type_name = deviceTypeName;
            }

            return new RobustWebSocket(`${webSocketUrl}/ws/total_data/`, {
              onOpenMessage: onOpenMessage,
              onMessage: (parsedData) => {
                const fleetData = parsedData.data;
                if (fleetData && typeof fleetData === "object") {
                  updateCachedData(() => fleetData);
                }
              },
            });
          });
        } catch (e) {
          console.error("Error with Fleet Metrics WS:", e);
        }
        await cacheEntryRemoved;
        socketManager.closeMetricsSocket(deviceTypeName);
      },
    }),

    getDailySummaryReport: builder.query({
      query: ({ startDate, endDate, username }) =>
        `devices/daily-summary-report/?start_date=${startDate}&end_date=${endDate}&username=${username}`,
      providesTags: ["Summary"],
    }),

    getSummaryData: builder.query({
      query: ({ period, username }) =>
        `devices/summary-data/?period=${period}&username=${username}`,
      transformResponse: (res) => res.reports || [],
      providesTags: ["Summary"],
    }),

    // --- ALERTS ---
    getAlerts: builder.query({
      query: ({ username }) =>
        `/devices/alerts?username=${username}`,
      transformResponse: (response) => {
        // Ensure response is an array
        const alerts = Array.isArray(response) ? response : (response.results || []);

        // Priority logic based on alert type
        const derivePriority = (alertName) => {
          if (!alertName) return 'MEDIUM';
          const name = alertName.toLowerCase();

          // HIGH priority - Safety critical alerts
          if (name.includes('temperature') ||
            name.includes('temp') ||
            name.includes('brake') ||
            name.includes('cell imbalance') ||
            name.includes('thermal') ||
            name.includes('fire') ||
            name.includes('smoke') ||
            name.includes('collision') ||
            name.includes('overvoltage') ||
            name.includes('undervoltage') ||
            name.includes('overcurrent')) {
            return 'HIGH';
          }

          // MEDIUM priority - Operational alerts
          // (Low SoC, Ecompressor, Door alerts, GPS, etc.)
          return 'MEDIUM';
        };

        // Map to UI format
        return alerts.map(alert => {
          let cleanName = (alert.name || "Alert").replace(/_/g, " ");
          // Capitalize SoC properly
          cleanName = cleanName.replace(/soc/i, "SoC");

          const cleanMessage = alert.value ? alert.value.replace(/^'|'$/g, "").replace(/^"|"$/g, "") : cleanName;

          return {
            id: alert.id,
            priority: derivePriority(alert.name), // Smart priority based on alert type
            type: cleanName, // Main title for Alert Card
            title: cleanName, // Main title for Notification Dropdown
            // Clean up quotes from message
            message: cleanMessage,
            timestamp: alert.start_time, // Keep ISO for robust parsing
            duration: alert.duration_seconds,
            duration_seconds: alert.duration_seconds, // Preserve original field
            isActive: alert.is_active,
            is_active: alert.is_active, // Preserve original field
            vehicleId: alert.imei,
            imei: alert.imei, // Preserve original field
            vehicleType: alert.device_type_name,
            device_type_name: alert.device_type_name, // Preserve original field
            location: "N/A", // No location in API currently
            // CRITICAL: Preserve telemetry data for analytics modal
            req_data: alert.req_data || [],
            start_time: alert.start_time,
            end_time: alert.end_time,
            alert_type: alert.alert_type,
            details: {
              description: cleanMessage,
              startTime: alert.start_time,
              endTime: alert.end_time
            }
          };
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      },
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetAllDevicesQuery,
  useGetFleetMetricsQuery,
  useGetDailySummaryReportQuery,
  useGetSummaryDataQuery,
  useGetAlertsQuery,
} = apiSlice;
