  // src/Pages/Analysis/Analysis.jsx

"use client";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { DatePickerInput } from "@mantine/dates";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

// Local Imports
import FleetSelector from "./FleetSelector";
import VehicleTypeSelector from "./VehicleTypeSelector";
import VehicleRegistrationSelector from "./VehicleRegistrationSelector";
import ChartSelection from "./ChartSelection";
import ChartsDisplay from "./ChartsDisplay";
import Button from "../../Components/common/Button";
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import { selectCurrentUser } from "../../store/authSlice";
import { useThemeDetector } from "../../hooks/useThemeDetector";
import { useCustomSelectStyles } from "../../hooks/useCustomSelectStyles";
import { useAnalysisData } from "../../hooks/useAnalysisData";

import "./Analysis.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

function Analysis() {
  const { t } = useTranslation();
  const theme = useThemeDetector();
  const analysisSelectStyles = useCustomSelectStyles(theme);

  // --- GET USER INFO ---
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;

  const {
    data: devices = [],
    isLoading: isDeviceListLoading,
    isError: isDeviceListError,
  } = useGetAllDevicesQuery(undefined, { 
    skip: !username, 
    refetchOnMountOrArgChange: true, 
  });

  const { chartData, loading, fetchData, clearData } = useAnalysisData();

  // --- STATE MANAGEMENT ---
  const [selectedFleet, setSelectedFleet] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCharts, setSelectedCharts] = useState([
    { label: t("charts.batteryChart"), value: "batteryCharts" },
  ]);

  // --- 1. DERIVE FLEET OPTIONS ---
  const fleetOptions = useMemo(() => {
    if (!devices) return [];
    const fleets = devices.map((d) => d.fleet).filter(Boolean);
    return [...new Set(fleets)].sort((a, b) => (a || "").localeCompare(b || ""));
  }, [devices]);

  // --- 2. DERIVE TYPE OPTIONS ---
  const availableTypes = useMemo(() => {
    if (!devices) return [];
    let filtered = devices;
    if (selectedFleet) {
      filtered = filtered.filter((d) => d.fleet === selectedFleet);
    }
    const types = filtered.map((d) => d.device_type_name).filter(Boolean);
    return [...new Set(types)].sort((a, b) => (a || "").localeCompare(b || ""));
  }, [devices, selectedFleet]);

  // --- 3. DERIVE VEHICLE OPTIONS (FIXED: Added null-checks for localeCompare) ---
  const filteredVehicles = useMemo(() => {
    if (!devices) return [];

    return devices
      .filter((vehicle) => {
        const matchesFleet = selectedFleet ? vehicle.fleet === selectedFleet : true;
        const matchesType = selectedType
          ? vehicle.device_type_name?.toLowerCase().includes(selectedType.toLowerCase())
          : true;
        return matchesFleet && matchesType;
      })
      .map((vehicle) => ({
        device_id: vehicle.device_id,
        // Ensure vehicle_name is at least an empty string to avoid .localeCompare crash
        vehicle_name: vehicle.VRN || vehicle.chassis_number || "Unknown",
      }))
      .sort((a, b) => a.vehicle_name.localeCompare(b.vehicle_name));
  }, [devices, selectedFleet, selectedType]);

  // --- 4. DATA LOOKUP HELPERS ---
  const vehicleData = useMemo(() => {
    if (!devices) return {};
    return devices.reduce((acc, vehicle) => {
      acc[vehicle.device_id] = {
        type: vehicle.device_type_name || "",
        name: vehicle.VRN || vehicle.chassis_number || "Unknown",
      };
      return acc;
    }, {});
  }, [devices]);

  const chartOptions = useMemo(() => {
    const baseOptions = [{ label: t("charts.batteryChart"), value: "batteryCharts" }];
    const selectedVehicleInfo = vehicleData[selectedVehicle];

    if (selectedVehicleInfo && !selectedVehicleInfo.type?.toLowerCase().includes("6s")) {
      return [
        ...baseOptions,
        { label: t("reports.coolingReport"), value: "coolingPerformanceCharts" },
        { label: t("charts.tcsPerformance"), value: "tcsPerformanceCharts" },
      ];
    }
    return baseOptions;
  }, [selectedVehicle, vehicleData, t]);

  // --- HANDLERS ---
  const handleFleetChange = (newFleet) => {
    setSelectedFleet(newFleet);
    setSelectedType(""); 
    setSelectedVehicle(""); 
    clearData();
  };

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    setSelectedVehicle(""); 
    clearData();
  };

  const handleVehicleChange = (vehicleId) => {
    setSelectedVehicle(vehicleId || "");
    clearData();
  };

  const handleDateChange = (dateValue) => {
    setSelectedDate(dateValue ? new Date(dateValue) : null);
    clearData();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData(selectedVehicle, selectedDate, vehicleData);
  };

  if (!username) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <ToastContainer />
      <form className="Analysis-Selection-Menu" onSubmit={handleSubmit}>
        <div className="Analysis-header">
          <h2>{t("charts.TripAnalysis", "Trip Analysis")}</h2>
        </div>
        <div className="Analysis-Selection-Menu-buttons">
          <FleetSelector
            fleets={fleetOptions}
            selectedFleet={selectedFleet}
            onFleetChange={handleFleetChange}
            customSelectStyles={analysisSelectStyles}
          />

          <VehicleTypeSelector
            types={availableTypes}
            filterVehicles={handleTypeChange}
            customSelectStyles={analysisSelectStyles}
            selectedType={selectedType}
          />

          <VehicleRegistrationSelector
            filteredVehicles={filteredVehicles}
            onVehicleChange={handleVehicleChange}
            selectedVehicleValue={selectedVehicle}
            customSelectStyles={analysisSelectStyles}
          />

          <label className="Analysis-Selection-Menu-card" htmlFor="analysis-date-picker">
            <span className="Analysis-Selection-Menu-Selections-title">
              {t("systemUtility.date")}
            </span>
            <DatePickerInput
              id="analysis-date-picker"
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="YYYY-MM-DD"
              maxDate={new Date()}
              hideOutsideDates
              allowDeselect
              valueFormat="YYYY-MM-DD"
              className="Analysis-Selection-Menu-Selections"
              variant="filled"
              w="100%"
              styles={{
                input: {
                  height: "40px",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#fff",
                  backgroundColor: "#0b5297",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  cursor: "pointer",
                },
              }}
            />
          </label>

          <ChartSelection
            options={chartOptions}
            selectedCharts={selectedCharts}
            setSelectedCharts={setSelectedCharts}
            customSelectStyles={analysisSelectStyles}
          />

          <span className="Analysis-Selection-Menu-card">
            <p className="Analysis-Selection-Menu-Selections-title">&nbsp;</p>
            <Button
              type="submit"
              variant="success"
              disabled={loading || !selectedVehicle || !selectedDate}
            >
              {t("buttons.submit")}
            </Button>
          </span>
        </div>
      </form>

      {(loading || isDeviceListLoading) && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}

      {isDeviceListError && (
        <div style={{ padding: "20px", color: "red" }}>
          Error: Failed to load vehicle list.
        </div>
      )}

      {!(loading || isDeviceListLoading) && !isDeviceListError && (
        <ChartsDisplay
          selectedCharts={selectedCharts}
          chartData={chartData}
          selectedVehicle={vehicleData[selectedVehicle]}
        />
      )}
    </div>
  );
}

export default Analysis;