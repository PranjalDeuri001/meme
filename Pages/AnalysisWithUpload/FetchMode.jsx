// src/Pages/AnalysisWithUpload/FetchMode.jsx
import { useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// Local Imports
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import { useFetchAnalysis } from "../../hooks/useFetchAnalysis";
import { useThemeDetector } from "../../hooks/useThemeDetector";
import VehicleTypeSelector from "./VehicleTypeSelector";
import VehicleRegistrationSelector from "./VehicleRegistrationSelector";
import ChartRenderer from "./ChartRenderer";

const FetchMode = () => {
  const { t } = useTranslation();
  const theme = useThemeDetector();
  const { data: devices = [], isError: isDeviceListError } = useGetAllDevicesQuery();
  const {
    data,
    isLoading,
    isChartPlotted,
    selectedDate,
    selectedSignals,
    signalOptions,
    signalsToPlot,
    handleDateChange,
    handleVehicleSelect,
    setSelectedSignals,
    setSignalsToPlot,
    setIsChartPlotted,
    executeFetch,
  } = useFetchAnalysis();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [abortController, setAbortController] = useState(null);

  const vehicleTypes = useMemo( () =>
    [...new Set(devices.map((v) => v.device_type_name))].sort((a, b) =>
      a.localeCompare(b) ),
    [devices]
  );
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  const handleVehicleSelection = (vehicleId) => {
    setSelectedVehicle(vehicleId);
    handleVehicleSelect(vehicleId);
  };

  const filterVehicles = (type) => {
    handleVehicleSelection("");
    if (!type) {
      setFilteredVehicles([]);
      return;
    }
    const vehicles = devices
      .filter((v) =>
        v.device_type_name.toLowerCase().includes(type.toLowerCase())
      )
      .map((v) => ({
        device_id: v.device_id,
        vehicle_name: v.VRN || v.chassis_number,
      }))
      .sort((a, b) => a.vehicle_name.localeCompare(b.vehicle_name));

    setFilteredVehicles(vehicles);
  };

  const handlePlotChart = () => {
    if (!selectedSignals || selectedSignals.length === 0) {
      return toast.info("Please select at least one signal to plot.");
    }
    setSignalsToPlot(selectedSignals);
    setIsChartPlotted(true);
  };

  const customSelectStyles = {
    control: (p) => ({
      ...p,
      backgroundColor: "var(--primary-color)",
      color: "#fff",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      minHeight: "40px",
      height: "40px",
      fontFamily: '"Exo 2"',
      boxShadow: "none",
    }),
    valueContainer: (p) => ({ ...p, height: "40px", padding: "0 8px" }),
    input: (p) => ({ ...p, color: "#fff" }),
    placeholder: (p) => ({ ...p, color: "rgba(255, 255, 255, 0.8)" }),
    singleValue: (p) => ({ ...p, color: "#fff" }),
    indicatorsContainer: (p) => ({ ...p, height: "40px" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (p) => ({ ...p, color: "#fff" }),
    multiValue: (p) => ({ ...p, backgroundColor: "rgba(255, 255, 255, 0.2)" }),
    multiValueLabel: (p) => ({ ...p, color: "#fff" }),
    multiValueRemove: (p) => ({
      ...p,
      color: "#fff",
      ":hover": { backgroundColor: "#EF4444", color: "white" },
    }),
    menu: (p) => ({
      ...p,
      zIndex: 10,
      backgroundColor: "var(--primary-color)",
      border: "1px solid var(--primary-color-dark-hover)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
    }),
    option: (s, { isFocused, isSelected }) => ({
      ...s,
      backgroundColor: isSelected
        ? "var(--primary-color-dark-hover)"
        : isFocused
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent",
      color: "#fff",
      borderRadius: "4px",
      margin: "2px 4px",
      width: "calc(100% - 8px)",
    }),
  };

  // const isSubmitDisabled = !selectedVehicle || !selectedDate || isLoading && !abortController;

  return (
    <>
      <div className="controls-container fetch-mode-controls">
        <VehicleTypeSelector
          filterVehicles={filterVehicles}
          types={vehicleTypes}
          customSelectStyles={customSelectStyles}
        />
        <VehicleRegistrationSelector
          filteredVehicles={filteredVehicles}
          setSelectedVehicle={handleVehicleSelection}
          customSelectStyles={customSelectStyles}
        />
        <div className="ca-form-group">
          <label className="ca-form-label" htmlFor="date-picker">
            {t("systemUtility.date")}
          </label>
          <DatePicker
            id="date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="theme-control"
            placeholderText="YYYY-MM-DD"
            maxDate={new Date()}
          />
        </div>
        <div className="ca-form-group">
          <p className="ca-form-label" style={{ visibility: "hidden" }}>
            Submit
          </p>
          <button
            type="button"
            className={`theme-control theme-btn-submit ${abortController ? "is-cancel" : ""}`}
            onClick={() => {
              if (abortController) {
                abortController.abort();
                setAbortController(null);
                setIsChartPlotted(false);
                return;
              }
              const controller = new AbortController();
              setAbortController(controller);
              executeFetch(controller.signal, () => {
                setAbortController(null);    
              });
            }}
            disabled={isLoading && !abortController || !selectedVehicle || !selectedDate}
          >
            {abortController ? "Cancel" : isLoading ? "Loading..." : t("buttons.submit")}
          </button>
        </div>
      </div>

      {isDeviceListError && (
        <div className="info-message">
          {t("userAlerts.failedToLoadVehicleData")}
        </div>
      )}

      {data && (
        <div className="controls-container signal-selector-controls">
          <div className="ca-form-group ca-select-wrapper">
            <label className="ca-form-label" htmlFor="server-signal-select">
              {t("excel.selectSignalsToPlot")}
            </label>
            <Select
              inputId="server-signal-select"
              options={signalOptions}
              value={selectedSignals}
              onChange={setSelectedSignals}
              isMulti
              styles={customSelectStyles}
              placeholder={t("excel.selectSignalsToPlot")}
            />
          </div>
          <div className="ca-form-group">
            <p className="ca-form-label" style={{ visibility: "hidden" }}>
              Plot
            </p>
            <button
              type="button"
              className="theme-control theme-btn-action"
              onClick={handlePlotChart}
            >
              {t("buttons.plotChart")}
            </button>
          </div>
        </div>
      )}

      <div className="ca-card-container">
        {isLoading && <div className="skeleton-chart"></div>}
        {!isLoading && !data && (
          <div className="chart-placeholder-text">
            {t("CustomAnalysis.Pleaseselect", "Please select a vehicle and date, then click Submit.")}
          </div>
        )}
        {!isLoading && data && !isChartPlotted && (
          <div className="chart-placeholder-text">
            Select signals and click "Plot Chart" to visualize data.
          </div>
        )}
        {!isLoading && isChartPlotted && (
          <ChartRenderer
            rawData={data}
            selectedSignals={signalsToPlot}
            chartId="server-chart"
            title="Server Data Analysis"
            subtitle={
              devices.find((d) => d.device_id === selectedVehicle)?.VRN || ""
            }
            theme={theme}
            singleYAxis={true} // --- MODIFICATION: Added this prop ---
          />
        )}
      </div>
    </>
  );
};

export default FetchMode;
