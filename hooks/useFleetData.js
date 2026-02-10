// src/hooks/useFleetData.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";
import { useGetAllDevicesQuery } from "../store/apiSlice"; // Import the existing hook

const backendUrl = import.meta.env.VITE_API_URL_3;
const DATA_REPORT_URL = `${backendUrl}/devices/all-data-report/`;
const POLLING_INTERVAL = 300000; // 5 minutes

export function useFleetData(t) {
  // 1. Get User from Redux
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;

  // 2. Fetch Devices List from Store (Replaces the first Axios call)
  // This uses the cached data from apiSlice
  const {
    data: devices = [],
    isLoading: loadingDevices,
    error: deviceError,
  } = useGetAllDevicesQuery(username, { skip: !username });

  // 3. Local State for Report Data (Polled manually via Axios)
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const intervalRef = useRef(null);

  // 4. Polling Logic for Report Data (Kept local as requested)
  useEffect(() => {
    if (!username) return;

    const fetchReport = async () => {
      try {
        const url = `${DATA_REPORT_URL}?username=${encodeURIComponent(
          username
        )}`;
        const response = await axios.get(url);
        setReportData(response.data || []);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoadingReport(false);
      }
    };

    // Initial Fetch
    fetchReport();

    // Start Polling
    intervalRef.current = setInterval(fetchReport, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [username]);

  // 5. Merge Data: Combine Redux Devices + Local Report Data
  // We format the data here exactly as your UI expects it
  const vehicles = devices.map((device) => {
    // Find matching report data
    const match =
      reportData.find((r) => r.device_id === device.device_id) || {};

    return {
      deviceId: device.device_id,
      displayId: device.VRN || device.chassis_number,
      model: device.device_type_name,
      fleet: device.fleet_owner || "N/A",

      // Merge report stats (or default to 0)
      odometer: match.total_distance ?? 0,
      energyConsumption: match.energy_consumption ?? 0,
      traction: match.traction_energy ?? 0,
      regeneration: match.regen_energy ?? 0,
      carbon_saved: match.co2_saving ?? 0,
      run_time: match.run_time ?? 0,
      idle_time: match.idle_time ?? 0,
      charging_unit: match.charging_unit ?? 0,
      cost_saved: match.cost_saved ?? 0,
    };
  });

  // Calculate composite loading/error states
  const loading =
    loadingDevices ||
    (loadingReport && devices.length > 0 && reportData.length === 0);
  const error = deviceError ? t("userAlerts.failedToLoadFleetData") : null;

  return { vehicles, loading, error };
}
