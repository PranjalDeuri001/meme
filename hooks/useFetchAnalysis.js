// src/hooks/useFetchAnalysis.js
import { useState, useEffect, useCallback } from 'react';
import { fetchDeviceData } from '../services/api'; // Import our updated service file

export const useFetchAnalysis = () => {
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signalOptions, setSignalOptions] = useState([]);
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [signalsToPlot, setSignalsToPlot] = useState([]);
  const [isChartPlotted, setIsChartPlotted] = useState(false);

  // Effect to derive signal options from new data
  useEffect(() => {
    if (data && data.length > 0) {
      const keys = Object.keys(data[0] || {});
      const options = keys
        .filter(key => !['timestamp', 'time', 'date', 'index'].includes(key.toLowerCase()))
        .map(s => ({ label: s, value: s }));
      setSignalOptions(options);
    } else {
      setSignalOptions([]);
    }
  }, [data]);

  // A single function to clear all data-related state
  const clearDataState = useCallback(() => {
    setData(null);
    setSelectedSignals([]);
    setSignalsToPlot([]);
    setIsChartPlotted(false);
  }, []);

  const handleVehicleSelect = useCallback((vehicleId) => {
    setSelectedVehicle(vehicleId);
    clearDataState();
  }, [clearDataState]);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    clearDataState();
  }, [clearDataState]);

  const executeFetch = useCallback(
  async (signal, onComplete) => {
    try {
      setIsLoading(true);
      clearDataState();

      const result = await fetchDeviceData(
        selectedVehicle,
        selectedDate,
        signal
      );

      setData(result);
    } finally {
      setIsLoading(false);

      // 🔥 IMPORTANT — notify FetchMode to reset cancel button
      if (onComplete) onComplete();
    }
  },
  [selectedVehicle, selectedDate, clearDataState]
);



  return {
    // State
    selectedVehicle,
    selectedDate,
    data,
    isLoading,
    signalOptions,
    selectedSignals,
    signalsToPlot,
    isChartPlotted,
    
    // State Setters & Logic
    handleVehicleSelect,
    handleDateChange,
    setSelectedSignals,
    setSignalsToPlot,
    setIsChartPlotted,
    executeFetch,
  };
};