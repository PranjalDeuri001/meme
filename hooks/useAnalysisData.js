// src/hooks/useAnalysisData.js
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// Import the worker using Vite's special syntax
import AnalysisWorker from "../utils/analysis.worker.js?worker";

// Define the empty state for charts
const EMPTY_CHART_DATA = {
  batteryCharts: {
    batteryCellVoltage: [],
    batteryTemperature: [],
    batteryPackCurrent: [],
    batteryPackVoltage: [],
  },
  coolingPerformanceCharts: [],
  tcsPerformanceCharts: [],
  hvData: [],
};

const backendUrl = import.meta.env.VITE_API_URL_3;

export function useAnalysisData() {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);

  // Setup Web Worker on hook mount
  useEffect(() => {
    const worker = new AnalysisWorker();
    workerRef.current = worker;

    // Handle messages from the worker
    worker.onmessage = (e) => {
      if (e.data.success) {
        setChartData(e.data.data);
      } else {
        console.error("Worker error:", e.data.error);
        toast.error(t("userAlerts.fetchErrorTryLater"));
      }
      setLoading(false); // Stop loading when worker is done
    };

    // Handle errors from the worker
    worker.onerror = (e) => {
      console.error("Worker error:", e);
      toast.error("An error occurred processing data. Please try again.");
      setLoading(false); // Stop loading on error
    };

    // Cleanup worker on unmount
    return () => {
      worker.terminate();
    };
  }, [t]);

  /**
   * Clears the current chart data.
   */
  const clearData = useCallback(() => {
    setChartData(EMPTY_CHART_DATA);
  }, []);

  /**
   * Fetches and processes data for the selected vehicle and date.
   */
  const fetchData = useCallback(
    async (selectedVehicle, selectedDate, vehicleData) => {
      if (!selectedVehicle || !selectedDate) {
        toast.error(t("userAlerts.selectVehicleAndDate"));
        return;
      }
      setLoading(true);
      clearData(); // Clear previous data

      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;
        const startTimeString = `${dateString}T00:00:00.000Z`;
        const endTimeString = `${dateString}T23:59:59.999Z`;
        const url = `${backendUrl}/devices/chart-view/?device_id=${selectedVehicle}&start_datetime=${startTimeString}&end_datetime=${endTimeString}`;

        const response = await fetch(url);

        if (!response.ok) {
          console.error(`API Error: ${response.status} ${response.statusText}`);
          toast.error(`API Error: ${response.status}. Please try again.`);
          throw new Error(`API request failed with status ${response.status}`);
        }

        const tripData = await response.json();
        
        // =================================================================
        // ✅ THE FIX IS HERE
        // Checks for tripData.data, but falls back to tripData
        // =================================================================
        const chartValues = tripData.data || tripData;

        if (!chartValues || !chartValues.timestamp || chartValues.timestamp.length === 0) {
          toast.info(t("userAlerts.noDataForVehicleAndDate"));
          setLoading(false); // Stop loading
          return;
        }

        const selectedVehicleInfo = vehicleData[selectedVehicle];

        // Send data to worker instead of processing here
        workerRef.current.postMessage({
          chartValues,
          vehicleType: selectedVehicleInfo?.type,
        });
        // setLoading(false) will be called by the worker's onmessage/onerror
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        if (!String(error).includes("API request failed")) {
          toast.error(t("userAlerts.fetchErrorTryLater"));
        }
        setLoading(false); // Ensure loading stops on fetch error
      }
    },
    [t, clearData]
  );

  return { chartData, loading, fetchData, clearData };
}