import React, { useState, useMemo} from "react";
import FleetSummaryTable from "./FleetSummaryTable";
import FleetAnalyticsCharts from "./FleetAnalyticsCharts";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FleetSummary.css";
import { Button } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";
import { useFleetData } from "../../hooks/useFleetData";
import FleetSummarySkeleton from "./FleetSummarySkeleton";
import propTypes from "prop-types";
import { TotalVehiclesIcon, DistanceIcon, CO2SavedIcon, RuntimeIcon } from "./FleetIcons";

const ITEMS_PER_PAGE = 12;

const KpiCard = ({ title, value, unit, icon }) => (
  <div className="fs-kpi-card">
    <div className="fs-kpi-header">
      {icon}
      <div className="fs-kpi-title">{title}</div>
    </div>
    <div className="fs-kpi-value">
      {value}
      <span className="fs-kpi-unit">{unit}</span>
    </div>
  </div>
);

function FleetSummary() {
  const { t } = useTranslation();
  const { vehicles, loading, error: hasError } = useFleetData(t);

  const [expandedFleets, setExpandedFleets] = useState({});
  const [vehicleCurrentPage, setVehicleCurrentPage] = useState({});
  const [selectedModelFilter, setSelectedModelFilter] = useState("All");
  const [selectedVrn, setSelectedVrn] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "displayId",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // MODIFICATION: This now creates a list of UNIQUE IDs to prevent duplicates.
  const availableVrns = useMemo(() => {
    const listToFilter = selectedModelFilter === "All"
      ? vehicles
      : vehicles.filter(
          (v) =>
            v.model &&
            v.model.toLowerCase().includes(selectedModelFilter.toLowerCase())
        );
    
    // 1. Get all display IDs
    const allIds = listToFilter.map((v) => v.displayId);
    // 2. Create a new Set from the list to automatically remove duplicates,
    //    then convert it back to an array and sort it.
    return [...new Set(allIds)].sort();
  }, [vehicles, selectedModelFilter]);

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(
        (entry) =>
          selectedModelFilter === "All" ||
          (entry.model &&
            entry.model
              .toLowerCase()
              .includes(selectedModelFilter.toLowerCase()))
      )
      .filter(
        (entry) =>
          !selectedVrn ||
          (entry.displayId && entry.displayId === selectedVrn)
      );
  }, [vehicles, selectedModelFilter, selectedVrn]);

  const platformKpis = useMemo(() => {
    return filteredVehicles.reduce(
      (acc, vehicle) => {
        acc.totalDistance += vehicle.odometer || 0;
        acc.totalCo2Saved += vehicle.carbon_saved || 0;
        acc.totalRunTime += vehicle.run_time || 0;
        return acc;
      },
      { totalDistance: 0, totalCo2Saved: 0, totalRunTime: 0 }
    );
  }, [filteredVehicles]);

  const paginatedFleets = useMemo(() => {
    const filteredGroups = filteredVehicles.reduce((acc, vehicle) => {
      const fleetName = vehicle.fleet;
      if (!acc[fleetName]) {
        acc[fleetName] = {
          vehicles: [], totalOdometer: 0, totalEnergy: 0, totalTraction: 0,
          totalRegeneration: 0, totalCo2Saved: 0, totalRunTime: 0,
          totalIdleTime: 0, totalChargingUnit: 0, totalCostSaved: 0,
        };
      }
      acc[fleetName].vehicles.push(vehicle);
      return acc;
    }, {});

    Object.keys(filteredGroups).forEach((fleetName) => {
      const fleet = filteredGroups[fleetName];
      fleet.vehicles.forEach((vehicle) => {
        fleet.totalOdometer += vehicle.odometer;
        fleet.totalEnergy += vehicle.energyConsumption;
        fleet.totalTraction += vehicle.traction;
        fleet.totalRegeneration += vehicle.regeneration;
        fleet.totalCo2Saved += vehicle.carbon_saved;
        fleet.totalRunTime += vehicle.run_time;
        fleet.totalIdleTime += vehicle.idle_time;
        fleet.totalChargingUnit += vehicle.charging_unit;
        fleet.totalCostSaved += vehicle.cost_saved;
      });
      fleet.vehicles.sort((a, b) => {
        if (sortConfig.key) {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    });

    const fleetKeys = Object.keys(filteredGroups);
    const totalPages = Math.ceil(fleetKeys.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentFleetKeys = fleetKeys.slice(indexOfFirstItem, indexOfLastItem);
    const paginatedResult = currentFleetKeys.reduce((acc, key) => {
      acc[key] = filteredGroups[key];
      return acc;
    }, {});
    return { data: paginatedResult, totalPages };
  }, [filteredVehicles, sortConfig, currentPage]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleModelChange = (event) => {
    setSelectedModelFilter(event.target.value);
    setSelectedVrn(null);
    setCurrentPage(1);
    setVehicleCurrentPage({});
  };

  const toggleFleetExpansion = (fleetName) =>
    setExpandedFleets((prev) => ({ ...prev, [fleetName]: !prev[fleetName] }));
  const handleVehiclePageChange = (fleetName, newPage) =>
    setVehicleCurrentPage((prev) => ({ ...prev, [fleetName]: newPage }));

  const clearFilters = () => {
    setSelectedModelFilter("All");
    setSelectedVrn(null);
    setCurrentPage(1);
    setVehicleCurrentPage({});
  };

  const isAnyFleetExpanded = Object.values(expandedFleets).some(status => status === true);
  
  return (
    <div className="fs-page">
      <ToastContainer position="top-right" autoClose={4000} />
      <h2 id="fs-title">{t("fleetSummary.fleetPlatformSummary")}</h2>

      {loading ? (
        <FleetSummarySkeleton />
      ) : (
        <>
          {!hasError && vehicles.length > 0 && (
             <div className="fs-kpi-container">
              <KpiCard title={t("calculations.totalVehicles", "Total Vehicles")} value={filteredVehicles.length} icon={<TotalVehiclesIcon className="fs-kpi-icon-svg" />} />
              <KpiCard title={t("calculations.totalDistance", "Total Distance")} value={platformKpis.totalDistance.toFixed(0)} unit="km" icon={<DistanceIcon className="fs-kpi-icon-svg" />} />
              <KpiCard title={t("calculations.co2Saved", "CO2 Saved")} value={platformKpis.totalCo2Saved.toFixed(0)} unit="kg" icon={<CO2SavedIcon className="fs-kpi-icon-svg" />} />
              <KpiCard title={t("calculations.runTime", "Total Run Time")} value={platformKpis.totalRunTime.toFixed(1)} unit="hrs" icon={<RuntimeIcon className="fs-kpi-icon-svg" />} />
            </div>
          )}

          <div className="fs-controls-container">
            <select
              className="fs-filter-dropdown"
              value={selectedModelFilter}
              onChange={handleModelChange}
            >
              <option value="All">{t("fleetSummary.allVehicleTypes")}</option>
              <option value="6s">6S</option>
              <option value="7m">7M</option>
              <option value="9m">9M</option>
              <option value="12m">12M</option>
              <option value="eka_1.5t">EKA 1.5T</option>
            </select>

            <Autocomplete
              className="fs-autocomplete-filter"
              disableClearable
              options={availableVrns}
              value={selectedVrn}
              onChange={(event, newValue) => {
                setSelectedVrn(newValue);
                setCurrentPage(1);
              }}
              getOptionLabel={(option) => option || ""}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("fleetSummary.searchDeviceByVrnChassis", "Search VRN/Chassis")}
                  variant="outlined"
                  size="small"
                />
              )}
            />

            <Button
              variant="contained"
              className="fs-theme-btn fs-theme-btn-contained"
              onClick={clearFilters}
            >
              {t("buttons.clear")}
            </Button>
          </div>

          <div className="fs-content-container">
            {!hasError && vehicles.length > 0 && (
              <FleetAnalyticsCharts apiData={filteredVehicles} />
            )}
            {!hasError && (
              <>
                {vehicles.length === 0 && <div className="fs-info-message">{t("loadingMessages.noFleetDataAvailable")}</div>}
                {vehicles.length > 0 && Object.keys(paginatedFleets.data).length === 0 && (
                  <div className="fs-info-message">{t("loadingMessages.noVehicleFoundMatchingCriteria")}</div>
                )}
                {Object.keys(paginatedFleets.data).length > 0 && (
                  <>
                    <FleetSummaryTable
                      groupedData={paginatedFleets.data}
                      expandedFleets={expandedFleets}
                      toggleFleetExpansion={toggleFleetExpansion}
                      handleSort={handleSort}
                      sortConfig={sortConfig}
                      vehicleCurrentPage={vehicleCurrentPage}
                      handleVehiclePageChange={handleVehiclePageChange}
                      isAnyFleetExpanded={isAnyFleetExpanded} 
                    />
                    {paginatedFleets.totalPages > 1 && (
                      <div className="fs-pagination-buttons" style={{ marginTop: "10px" }}>
                        <Button
                          variant="contained" className="fs-theme-btn fs-theme-btn-contained"
                          onClick={() => setCurrentPage((prev) => prev - 1)}
                          disabled={currentPage === 1}
                        >
                          {t("buttons.previous")}
                        </Button>
                        <span className="fs-pagination-text">
                          {t("reports.page")} {currentPage} {t("reports.of")}{" "}
                          {paginatedFleets.totalPages}
                        </span>
                        <Button
                          variant="contained" className="fs-theme-btn fs-theme-btn-contained"
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={currentPage >= paginatedFleets.totalPages}
                        >
                          {t("buttons.next")}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {hasError && <div className="fs-info-message">{t("loadingMessages.failedToLoadData")}</div>}
          </div>
        </>
      )}
    </div>
  );
}
KpiCard.propTypes = {
  title: propTypes.string.isRequired,
  value: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
  unit: propTypes.string,
  icon: propTypes.node.isRequired,
};
KpiCard.defaultProps = {
  unit: "",
};



export default FleetSummary;