import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";

// --- 1. COLUMN HEADER MAPPING ---
// Maps API keys to the exact display names
const KEY_MAPPING = {
  vrn: "VRN",
  chassis_number: "Chassis No",
  city: "City",
  session_count: "Session Count",
  trip_count: "Trip Count",
  charging_time: "Total Charging Time",
  charging_unit: "Total Charging Units",
  Insufficient_charge: "Insufficient Charge",
  distance: "Total Distance (km)",
  runtime: "Total Runtime (mins)",
  ideltime: "Total Idle Time (mins)",
  ec: "Energy Consumed (kWh)",
  regen: "Regeneration (kWh)",
  ecr: "ECR",
};

// Helper: Formats keys not found in the mapping (fallback)
const formatKeyName = (key) => {
  if (KEY_MAPPING[key]) return KEY_MAPPING[key];
  // Convert "some_key_name" -> "Some Key Name"
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// --- 2. DATE & TIME HELPERS ---
const formatDateForAPI = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
};

const formatTimeString = (timeString) => {
  if (!timeString || timeString.length !== 6) return timeString;
  return `${timeString.substring(0, 2)}:${timeString.substring(
    2,
    4
  )}:${timeString.substring(4, 6)}`;
};

const formatDateString = (dateString) => {
  if (!dateString || dateString.length !== 8) return dateString;
  return `${dateString.substring(0, 2)}/${dateString.substring(
    2,
    4
  )}/${dateString.substring(4, 8)}`;
};

// --- 3. API ENDPOINTS ---
export const API_ENDPOINTS = {
  "CAN Report": (url, deviceId, start, end, isExport) =>
    `${url}/devices/detail?start_time=${start}&end_time=${end}&imei=${deviceId}${isExport ? "&is_export=true" : ""
    }`,
  "Fault Report": (url, start, end, vehicleType, username, isExport = false) =>
    `${url}/devices/faults/?report=true&start_date=${start}&end_date=${end}&device_type=${vehicleType}&username=${username}${isExport ? "&is_export=true" : ""
    }`,
  "Daily Summary Report": (url, deviceId, start, end, isExport = false) =>
    `${url}/devices/daily-report/?start_date=${start}&device_id=${deviceId}&daily-report=true${isExport ? "&is_export=true" : ""
    }`,
  "Charging Report": (url, deviceId, start, end, isExport = false) =>
    `${url}/devices/calculate-report/?start_date=${start}&end_date=${end}&device_id=${deviceId}&charging_report=true${isExport ? "&is_export=true" : ""
    }`,
  "Energy Consumption Report": (url, deviceId, start, end, isExport = false) =>
    `${url}/devices/calculate-report/?start_date=${start}&end_date=${end}&device_id=${deviceId}&energy_consumption=true${isExport ? "&is_export=true" : ""
    }`,
  "Cooling Report": (url, deviceId, start, end, isExport = false) =>
    `${url}/devices/calculate-report/?start_date=${start}&end_date=${end}&device_id=${deviceId}&cooling_report=true${isExport ? "&is_export=true" : ""
    }`,
  "DOD Report": (url, deviceId, start, end, isExport = false) =>
    `${url}/devices/calculate-report/?start_date=${start}&end_date=${end}&device_id=${deviceId}&dod=true${isExport ? "&is_export=true" : ""
    }`,
  "MIS Report": (
    url,
    fleet,
    username,
    start,
    end,
    dateRange,
    isExport = false
  ) => {
    if (!dateRange || !dateRange[0] || !username) return null;
    const { startDate, endDate } = dateRange[0];
    const daysDiff =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    let misReportType = "daily";
    if (daysDiff >= 30) misReportType = "monthly";
    else if (daysDiff >= 7) misReportType = "weekly";
    return `${url}/devices/mis-report/?fleet_name=${fleet}&start_date=${start}&end_date=${end}&username=${username}&report_type=${misReportType}${isExport ? "&is_export=true" : ""
      }`;
  },
};

// --- 4. GET REQUEST TRANSFORMERS (Legacy/Single Device) ---
const getAddressFromCoordinates = async (lat, lon, apiKey) => {
  if (!lat || !lon) return "N/A";
  if (!apiKey) return "API key missing";
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
    );
    if (!response.ok) throw new Error("Google API Error");
    const data = await response.json();
    if (data.status === "OK" && data.results?.length > 0)
      return data.results[0].formatted_address;
    return `${lat}, ${lon}`;
  } catch {
    return `${lat}, ${lon}`;
  }
};

export const flattenCanReportData = (results) => {
  if (!Array.isArray(results)) return [];
  return results.map((record) => {
    const flatRecord = {
      date: formatDateString(record.date),
      time: formatTimeString(record.time),
    };
    if (record.can_data) Object.assign(flatRecord, record.can_data);
    return flatRecord;
  });
};

const flattenFaultReportData = (results) => {
  if (!Array.isArray(results)) return [];
  return results.map((record) => {
    const flatRecord = { ...record };
    if (flatRecord.details && typeof flatRecord.details === "string") {
      try {
        Object.assign(
          flatRecord,
          JSON.parse(flatRecord.details.replace(/'/g, '"'))
        );
      } catch (e) {
        flatRecord.details_raw = flatRecord.details;
      }
    }
    delete flatRecord.details;
    if (flatRecord.created_at)
      flatRecord.created_at = formatDateTime(flatRecord.created_at);
    return flatRecord;
  });
};

const transformDailySummaryData = async (
  apiResponse,
  googleApiKey,
  vehicleType
) => {
  if (!Array.isArray(apiResponse)) return [];
  const tripDataOnly = apiResponse.filter((item) =>
    item.hasOwnProperty("Trip id")
  );
  return Promise.all(
    tripDataOnly.map(async (trip) => {
      const [startLat, startLon] = trip["Start Address"] || [];
      const [endLat, endLon] = trip["End Address"] || [];
      const [startAddress, endAddress] = await Promise.all([
        getAddressFromCoordinates(startLat, startLon, googleApiKey),
        getAddressFromCoordinates(endLat, endLon, googleApiKey),
      ]);
      return {
        "Trip ID": trip["Trip id"],
        "Start SOC": trip["Start SOC"],
        "End SOC": trip["End SOC"],
        "Start Time": formatDateTime(trip["Start Time"]),
        "End Time": formatDateTime(trip["End Time"]),
        "Start Address": startAddress,
        "End Address": endAddress,
        "Distance (km)":
          (trip["Distance (km)"] || trip["Distance"])?.toFixed(2) || "0.00",
        "Run Time": trip["Run Time (HH:MM)"] || trip["Run Time"] || "00:00:00",
        "Idle Time":
          trip["Idle Time (HH:MM)"] || trip["Idle Time"] || "00:00:00",
        "Max Speed (kmph)": trip["Max Speed (kmph)"] || trip["Max Speed"] || 0,
        "Avg Speed (kmph)":
          (trip["Average Speed (kmph)"] || trip["Average Speed"])?.toFixed(2) ||
          "0.00",
        "Deep Discharge": trip.hasOwnProperty("Deep Discharge")
          ? trip["Deep Discharge"]
            ? "Yes"
            : "No"
          : "N/A",
        ...(vehicleType === "6s"
          ? {
            "Max Battery Temp (°C)": trip["Max Battery Temp"] || "N/A",
            "Max Motor Temp (°C)": trip["Max Motor Temp "] || "N/A",
          }
          : {
            "Avg Battery Temp (°C)": trip["Average Battery Temp (°C)"]
              ? trip["Average Battery Temp (°C)"].toFixed(2)
              : "N/A",
          }),
      };
    })
  );
};

const transformEnergyConsumptionData = async (apiResponse, googleApiKey) => {
  if (!Array.isArray(apiResponse)) return [];
  const tripDataOnly = apiResponse.filter((item) =>
    item.hasOwnProperty("Trip id")
  );
  return Promise.all(
    tripDataOnly.map(async (item) => {
      const [startLat, startLon] = item["Start Address"] || [];
      const [endLat, endLon] = item["End Address"] || [];
      const [startAddress, endAddress] = await Promise.all([
        getAddressFromCoordinates(startLat, startLon, googleApiKey),
        getAddressFromCoordinates(endLat, endLon, googleApiKey),
      ]);
      return {
        ...item,
        "Start Address": startAddress,
        "End Address": endAddress,
      };
    })
  );
};

// --- 5. POST REQUEST TRANSFORMER (NESTED) ---
const processNestedPostResponseHierarchical = (apiData, config) => {
  const processed = [];

  // Iterate Date Keys: e.g., "2025-11-24": [...]
  Object.entries(apiData).forEach(([date, vehicles]) => {
    if (Array.isArray(vehicles)) {
      vehicles.forEach((vehicle) => {
        // 1. CREATE PARENT ROW (Dynamic Signals)
        const parentRow = { Date: date };

        // Dynamically grab ALL keys from vehicle object
        Object.keys(vehicle).forEach((key) => {
          // Skip the nested array (sessions/trips)
          if (key !== config.arrayKey) {
            const val = vehicle[key];
            const displayKey = formatKeyName(key); 

            // --- ADD THIS BLOCK ---
            if (key === "start_time_of_day" || key === "stop_time_of_day") {
               parentRow[displayKey] = formatDateTime(val);
            } 
            // ----------------------
            else if (typeof val === "boolean") {
              parentRow[displayKey] = val ? "Yes" : "No";
            } else if (typeof val === "number" && !Number.isInteger(val)) {
              parentRow[displayKey] = val.toFixed(2);
            } else {
              parentRow[displayKey] = val ?? "N/A";
            }
          }
        });

        // 2. PROCESS NESTED ROWS (Sessions/Trips)
        const rawChildren = vehicle[config.arrayKey];
        const subRows = [];

        if (rawChildren && Array.isArray(rawChildren)) {
          rawChildren.forEach((record) => {
            const childRow = {};
            Object.keys(record).forEach((key) => {
              const val = record[key];
              const displayKey = formatKeyName(key);

              // Specific formatting for time keys
              if (key === config.startKey) {
                childRow["Start Time"] = formatDateTime(val);
              } else if (key === config.endKey) {
                childRow["End Time"] = formatDateTime(val);
              } else {
                if (typeof val === "number" && !Number.isInteger(val)) {
                  childRow[displayKey] = val.toFixed(2);
                } else if (typeof val === "boolean") {
                  childRow[displayKey] = val ? "Yes" : "No";
                } else {
                  childRow[displayKey] = val;
                }
              }
            });
            subRows.push(childRow);
          });
        }

        // Attach nested data if exists
        if (subRows.length > 0) {
          parentRow["_subRows"] = subRows;
        }

        processed.push(parentRow);
      });
    }
  });
  return processed;
};

// --- NEW: ALERT REPORT TRANSFORMER ---
const processAlertPostResponse = (apiData) => {
  const processed = [];

  // apiData shape: { "2026-01-08": [ { alert objects... }, ... ], ... }
  Object.entries(apiData).forEach(([date, alerts]) => {
    if (!Array.isArray(alerts)) return;
    alerts.forEach((alert) => {
      const row = { Date: date };
      Object.keys(alert).forEach((key) => {
        // Skip req_data field entirely for Alert Report
        if (key === "req_data") return;
        const displayKey = formatKeyName(key);
        let val = alert[key];

        // Format times
        if (key === "start_time" || key === "end_time") {
          row[displayKey] = formatDateTime(val);
          return;
        }

        // Booleans -> Yes/No
        if (typeof val === "boolean") {
          row[displayKey] = val ? "Yes" : "No";
          return;
        }

        // Numbers: keep integers, format floats
        if (typeof val === "number") {
          row[displayKey] = Number.isInteger(val) ? val : val.toFixed(2);
          return;
        }

        // Arrays/objects: stringify
        if (val && typeof val === "object") {
          try {
            row[displayKey] = JSON.stringify(val);
          } catch {
            row[displayKey] = String(val);
          }
          return;
        }

        // Strings: strip surrounding single-quotes if present
        if (typeof val === "string") {
          const stripped = val.replace(/^'(.*)'$/, "$1");
          row[displayKey] = stripped;
          return;
        }

        // Fallback
        row[displayKey] = val ?? "N/A";
      });
      processed.push(row);
    });
  });

  return processed;
};

// --- 7. FAULT REPORT TRANSFORMER ---
const processFaultPostResponse = (apiData) => {
  const processed = [];
  const rawData = apiData.results || apiData; // Handle "results" wrapper if present

  // Helper to process individual fault object
  const processSingleFault = (fault, dateKey) => {
    // Determine date: use key if provided, else fallback to fault fields
    let date = dateKey;
    if (!date) {
      if (fault.date) date = fault.date;
      else if (fault.timestamp) date = fault.timestamp.split("T")[0];
      else date = "N/A";
    }

    const row = { Date: date };

    // Extract special fields
    const { details, data_snapshot, ...rest } = fault;

    // Process basic fields
    Object.keys(rest).forEach((key) => {
      const displayKey = formatKeyName(key);
      if (key === "start_time" || key === "end_time") {
        row[displayKey] = formatDateTime(rest[key]);
      } else if (typeof rest[key] === "boolean") {
        row[displayKey] = rest[key] ? "Yes" : "No";
      } else if (typeof rest[key] === "number" && !Number.isInteger(rest[key])) {
        row[displayKey] = rest[key].toFixed(2);
      } else {
        row[displayKey] = rest[key];
      }
    });

    // Flatten details
    if (details && typeof details === "object") {
      Object.keys(details).forEach((k) => {
        row[formatKeyName(k)] = details[k];
      });
    }

    // Handle data_snapshot as sub-row
    // if (data_snapshot && typeof data_snapshot === "object") {
    //   row["_subRows"] = [data_snapshot];
    // }
    return row;
  };

  // Logic to handle Grouped (Object) vs Flat (Array) response
  if (Array.isArray(rawData)) {
    // Case 1: Flat Array (Common in Pagination)
    rawData.forEach((fault) => {
      processed.push(processSingleFault(fault, null));
    });
  } else if (typeof rawData === "object" && rawData !== null) {
    // Case 2: Grouped by Date (Object)
    Object.entries(rawData).forEach(([date, faults]) => {
      if (Array.isArray(faults)) {
        faults.forEach((fault) => {
          processed.push(processSingleFault(fault, date));
        });
      }
    });
  }

  return processed;
};

// --- 6. MAIN HOOK ---
export const useReportData = (
  submitted,
  reportType,
  deviceId,
  startDate,
  endDate,
  backendUrl,
  dateRange,
  vehicleType,
  fleet
) => {
  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;
  const abortControllerRef = useRef(null);
  const [lastFetchOptions, setLastFetchOptions] = useState({});
  const [baseUrl, setBaseUrl] = useState(null);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const fetchPage = useCallback(
    async (url, options = {}) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);

      try {
        // Store options for pagination usage (unless this IS a pagination call which passes them)
        if (options.body) {
          setLastFetchOptions(options);
        }

        const fetchOptions = { ...options, signal };
        const response = await fetch(url, fetchOptions);
        if (!response.ok) throw new Error("Network response was not ok");
        const apiData = await response.json();

        let transformedData = [];
        let itemsPerPage = 100;

        if (reportType === "MIS Report") {
          transformedData = processNestedPostResponseHierarchical(
            apiData && typeof apiData === "object" ? apiData : {},
            { arrayKey: "trips", startKey: "start_time", endKey: "end_time" }
          );
          if (Array.isArray(apiData)) transformedData = apiData;
          else if (apiData?.results) transformedData = Array.isArray(apiData.results) ? apiData.results : transformedData;
        } else {
          const POST_REPORTS = [
            "Daily Summary Report",
            "Charging Report",
            "Energy Consumption Report",
            "Vehicle Status Report",
            "Alert Report",
            "Fault Report",
          ];

          // Check if this is a POST report response (Nested Object structure)
          if (
            POST_REPORTS.includes(reportType) &&
            !Array.isArray(apiData) &&
            typeof apiData === "object"
          ) {
            // Alert Report has a different flat structure (date -> [alerts])
            if (reportType === "Alert Report") {
              transformedData = processAlertPostResponse(apiData);
              itemsPerPage =
                transformedData.length > 0 ? transformedData.length : 1;
            } else if (reportType === "Fault Report") {
              transformedData = processFaultPostResponse(apiData);
              itemsPerPage =
                transformedData.length > 0 ? transformedData.length : 1;
            } else {
              let config = {
                arrayKey: "trips",
                startKey: "start_time",
                endKey: "end_time",
              }; // Default

              if (
                reportType === "Charging Report" ||
                reportType === "Vehicle Status Report"
              ) {
                config = {
                  arrayKey: "sessions",
                  startKey: "start_time_val",
                  endKey: "end_time_val",
                };
              }

              transformedData = processNestedPostResponseHierarchical(
                apiData,
                config
              );
              itemsPerPage =
                transformedData.length > 0 ? transformedData.length : 1;
            }
          } else {
            // Standard GET Report Logic
            const rawData = Array.isArray(apiData.results)
              ? apiData.results
              : apiData;
            switch (reportType) {
              case "CAN Report":
                transformedData = flattenCanReportData(rawData);
                break;
              case "Fault Report":
                transformedData = flattenFaultReportData(rawData);
                break;
              case "Daily Summary Report":
                transformedData = await transformDailySummaryData(
                  rawData,
                  googleApiKey,
                  vehicleType
                );
                break;
              case "Energy Consumption Report":
                transformedData = await transformEnergyConsumptionData(
                  rawData,
                  googleApiKey
                );
                break;
              case "Charging Report":
                if (rawData?.charging_report) {
                  /* ... legacy logic ... */
                } else transformedData = [];
                break;
              default:
                transformedData = [];
            }
            itemsPerPage = transformedData.length || 1;
          }
        }

        setData(transformedData);

        // --- PAGINATION METADATA EXTRACTION ---
        if (apiData.next) setNextPageUrl(apiData.next);
        else setNextPageUrl(null);

        if (apiData.previous) setPreviousPageUrl(apiData.previous);
        else setPreviousPageUrl(null);

        if (apiData.count) {
          setTotalPages(Math.ceil(apiData.count / itemsPerPage));
        } else {
          // Fallback if count is missing but we have pages
          setTotalPages(apiData.next ? currentPage + 1 : currentPage);
        }

      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
          toast.error(t("userAlerts.failedToFetchData"));
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [reportType, t, googleApiKey, vehicleType]
  );

  // New effect to handle reset when submitted becomes false
  useEffect(() => {
    if (!submitted) {
      setData([]);
    }
  }, [submitted]);

  useEffect(() => {
    if (!submitted) return;

    if (reportType === "MIS Report" && !username) return;

    const baseUrlNormalized = typeof backendUrl === "string" ? backendUrl.replace(/\/$/, "") : "";
    if (!baseUrlNormalized && reportType !== "MIS Report") {
      toast.error(t("userAlerts.failedToFetchData"));
      setIsLoading(false);
      return;
    }

    setData([]);
    setCurrentPage(1);

    const POST_REPORTS = [
      "Daily Summary Report",
      "Charging Report",
      "Energy Consumption Report",
      "Vehicle Status Report",
      "Alert Report",
      "Fault Report",
    ];

    if (POST_REPORTS.includes(reportType)) {
      const deviceList = Array.isArray(deviceId) ? deviceId : (deviceId ? [deviceId] : []);
      const validDevices = deviceList.filter((d) => d != null && String(d).trim() !== "");
      if (validDevices.length === 0 && reportType !== "Fault Report") {
        toast.error(t("userAlerts.pleaseSelectValidVrnChassisNumebr"));
        setIsLoading(false);
        return;
      }
      const url = `${baseUrlNormalized}/devices/reports/`;
      setBaseUrl(url);
      const reportTypeMapping = {
        "Daily Summary Report": "daily_summary_report",
        "Charging Report": "charging_report",
        "Energy Consumption Report": "energy_consumption_report",
        "Vehicle Status Report": "vehicle_status_report",
        "Alert Report": "alert_report",
        "Fault Report": "fault_report",
      };
      const payload = {
        devices: validDevices.length > 0 ? validDevices : [""],
        start_date: startDate,
        end_date: endDate,
        vehicle_type: vehicleType || "",
        report_type: reportTypeMapping[reportType],
        ...(username && { username }),
      };

      if (reportType === "Fault Report" && fleet) {
        payload.fleet_name = Array.isArray(fleet) ? fleet : [fleet];
      }

      fetchPage(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return;
    }

    const apiUrlGenerator = API_ENDPOINTS[reportType];
    if (!apiUrlGenerator) {
      if (reportType) toast.error(t("userAlerts.invalidReportType"));
      setIsLoading(false);
      return;
    }

    let initialApiUrl;
    if (reportType === "MIS Report") {
      const fleetParam = Array.isArray(deviceId) ? (deviceId[0] ?? "") : (deviceId ?? "");
      if (!fleetParam || !username) {
        setIsLoading(false);
        return;
      }
      initialApiUrl = apiUrlGenerator(
        baseUrlNormalized,
        fleetParam,
        username,
        startDate,
        endDate,
        dateRange
      );
    } else if (reportType === "Fault Report") {
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);
      initialApiUrl = apiUrlGenerator(
        baseUrlNormalized,
        formattedStartDate,
        formattedEndDate,
        vehicleType,
        username
      );
    } else {
      initialApiUrl = apiUrlGenerator(baseUrlNormalized, deviceId, startDate, endDate);
    }

    if (initialApiUrl) {
      setBaseUrl(initialApiUrl);
      fetchPage(initialApiUrl);
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [
    submitted,
    reportType,
    deviceId,
    startDate,
    endDate,
    backendUrl,
    fetchPage,
    t,
    dateRange,
    vehicleType,
    fleet,
    username,
  ]);

  return {
    data,
    isLoading,
    error,
    nextPageUrl,
    previousPageUrl,
    currentPage,
    totalPages,
    totalPages,
    handleNextPage: () => {
      if (nextPageUrl) {
        setCurrentPage((prev) => prev + 1);
        const POST_REPORTS = [
          "Daily Summary Report",
          "Charging Report",
          "Energy Consumption Report",
          "Vehicle Status Report",
          "Alert Report",
          "Fault Report",
        ];
        if (POST_REPORTS.includes(reportType) && baseUrl) {
          // Extract page from nextPageUrl
          const urlObj = new URL(nextPageUrl);
          const page = urlObj.searchParams.get('page') || 2;
          fetchPage(`${baseUrl}?page=${page}`, lastFetchOptions);
        } else {
          fetchPage(nextPageUrl, lastFetchOptions);
        }
      }
    },
    handlePreviousPage: () => {
      if (previousPageUrl) {
        setCurrentPage((prev) => prev - 1);
        const POST_REPORTS = [
          "Daily Summary Report",
          "Charging Report",
          "Energy Consumption Report",
          "Vehicle Status Report",
          "Alert Report",
          "Fault Report",
        ];
        if (POST_REPORTS.includes(reportType) && baseUrl) {
          // Extract page from previousPageUrl
          const urlObj = new URL(previousPageUrl);
          const page = urlObj.searchParams.get('page') || 1;
          fetchPage(`${baseUrl}?page=${page}`, lastFetchOptions);
        } else {
          fetchPage(previousPageUrl, lastFetchOptions);
        }
      }
    },
    cancelRequest,
  };
};

// Add this inside useReportData.js or as a separate export
export const exportPostReport = async (url, payload) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, is_export: true }), // Add is_export to body
  });

  if (!response.ok) throw new Error("Export failed");
  return await response.blob();
};
