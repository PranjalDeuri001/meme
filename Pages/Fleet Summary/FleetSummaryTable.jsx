import React from "react";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import propTypes from "prop-types";

const VEHICLES_PER_PAGE = 10;

const formatNumber = (num, decimals = 2, suffix = "", zeroAsDash = true) => {
  if (num == null) return "-";
  if (zeroAsDash && num === 0) return "-";
  return `${Number(num).toFixed(decimals)}${suffix}`;
};

function FleetSummaryTable({
  groupedData,
  expandedFleets,
  toggleFleetExpansion,
  handleSort,
  sortConfig,
  vehicleCurrentPage,
  handleVehiclePageChange,
  isAnyFleetExpanded,
}) {
  const { t } = useTranslation();

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? " ▲" : " ▼";
  };

  const getAriaSort = (key) => {
    if (sortConfig.key !== key) return "none";
    return sortConfig.direction;
  };

  const fleetKeys = Object.keys(groupedData);

  return (
    <table className="fs-table">
      <thead>
        <tr>
          <th className="fs-sortable" onClick={() => handleSort("displayId")} aria-sort={getAriaSort("displayId")}>{t("vehicle.vrnChassisNumber")}{getSortIndicator("displayId")}</th>
          
          {isAnyFleetExpanded && <th>{t("vehicle.model")}</th>}

          <th className="fs-sortable" onClick={() => handleSort("odometer")} aria-sort={getAriaSort("odometer")}>{t("calculations.odometer")} (km){getSortIndicator("odometer")}</th>
          <th className="fs-sortable" onClick={() => handleSort("energyConsumption")} aria-sort={getAriaSort("energyConsumption")}>{t("calculations.energyConsumption")} (kWh){getSortIndicator("energyConsumption")}</th>
          <th className="fs-sortable" onClick={() => handleSort("traction")} aria-sort={getAriaSort("traction")}>{t("calculations.traction")} (kWh){getSortIndicator("traction")}</th>
          <th className="fs-sortable" onClick={() => handleSort("regeneration")} aria-sort={getAriaSort("regeneration")}>{t("calculations.regeneration")} (kWh){getSortIndicator("regeneration")}</th>
          <th className="fs-sortable" onClick={() => handleSort("carbon_saved")} aria-sort={getAriaSort("carbon_saved")}>{t("calculations.co2Savings")} (kg){getSortIndicator("carbon_saved")}</th>
          <th className="fs-sortable" onClick={() => handleSort("run_time")} aria-sort={getAriaSort("run_time")}>{t("calculations.runTime")} (h){getSortIndicator("run_time")}</th>
          <th className="fs-sortable" onClick={() => handleSort("idle_time")} aria-sort={getAriaSort("idle_time")}>{t("reports.idleTime")} (h){getSortIndicator("idle_time")}</th>
          <th className="fs-sortable" onClick={() => handleSort("charging_unit")} aria-sort={getAriaSort("charging_unit")}>{t("calculations.chargingUnits")} (kWh){getSortIndicator("charging_unit")}</th>
          <th className="fs-sortable" onClick={() => handleSort("cost_saved")} aria-sort={getAriaSort("cost_saved")}>{t("calculations.costSavings")}{getSortIndicator("cost_saved")}</th>
        </tr>
      </thead>
      {fleetKeys.map((fleetName) => {
        const isExpanded = expandedFleets[fleetName];
        const fleet = groupedData[fleetName];
        const vehicles = fleet.vehicles;
        const currentPage = vehicleCurrentPage[fleetName] || 1;
        const totalVehiclePages = Math.ceil(vehicles.length / VEHICLES_PER_PAGE);
        const indexOfLastVehicle = currentPage * VEHICLES_PER_PAGE;
        const indexOfFirstVehicle = indexOfLastVehicle - VEHICLES_PER_PAGE;
        const currentVehicles = vehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
        
        return (
          <React.Fragment key={fleetName}>
            <tbody className="fs-fleet-group">
              <tr className="fs-fleet-row">
                <td colSpan={isAnyFleetExpanded ? 2 : 1}>
                  <button className="fs-fleet-name-button" onClick={() => toggleFleetExpansion(fleetName)} aria-expanded={isExpanded}>
                    <span className={`fs-expand-icon ${isExpanded ? "fs-expanded" : ""}`} aria-hidden="true">▶</span>
                    <span className="fs-fleet-name-text">{fleetName}</span>
                    <span className="fs-vehicle-count">({vehicles.length})</span>
                  </button>
                </td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalOdometer, 0, " km", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalEnergy, 0, " kWh", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalTraction, 0, " kWh", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalRegeneration, 0, " kWh", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalCo2Saved, 0, " kg", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalRunTime, 1, " h", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalIdleTime, 1, " h", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalChargingUnit, 0, " kWh", false)}</td>
                <td className="fs-fleet-aggregate-value">{formatNumber(fleet.totalCostSaved, 2, "", false)}</td>
              </tr>
              {isExpanded && currentVehicles.map((entry) => (
                <tr key={entry.deviceId} className="fs-vehicle-row">
                  <td data-label={t("vehicle.vrnChassisNumber")}>{entry.displayId}</td>
                  <td data-label={t("vehicle.model")}>{entry.model}</td>
                  <td data-label={`${t("calculations.odometer")} (km)`}>{formatNumber(entry.odometer)}</td>
                  <td data-label={`${t("calculations.energyConsumption")} (kWh)`}>{formatNumber(entry.energyConsumption)}</td>
                  <td data-label={`${t("calculations.traction")} (kWh)`}>{formatNumber(entry.traction)}</td>
                  <td data-label={`${t("calculations.regeneration")} (kWh)`}>{formatNumber(entry.regeneration)}</td>
                  <td data-label={`${t("calculations.co2Savings")} (kg)`}>{formatNumber(entry.carbon_saved)}</td>
                  <td data-label={`${t("calculations.runTime")} (h)`}>{formatNumber(entry.run_time, 1)}</td>
                  <td data-label={`${t("reports.idleTime")} (h)`}>{formatNumber(entry.idle_time, 1)}</td>
                  <td data-label={`${t("calculations.chargingUnits")} (kWh)`}>{formatNumber(entry.charging_unit)}</td>
                  <td data-label={t("calculations.costSavings")}>{formatNumber(entry.cost_saved)}</td>
                </tr>
              ))}
              {isExpanded && totalVehiclePages > 1 && (
                <tr className="fs-vehicle-pagination-row">
                  <td colSpan={isAnyFleetExpanded ? 11 : 10}>
                    {currentPage > 1 && <Button variant="outlined" className="fs-theme-btn fs-theme-btn-outlined" onClick={() => handleVehiclePageChange(fleetName, currentPage - 1)}>{t("buttons.previous")}</Button>}
                    <span className="fs-vehicle-pagination-text">{t("reports.page")} {currentPage} {t("reports.of")} {totalVehiclePages}</span>
                    {currentPage < totalVehiclePages && <Button variant="outlined" className="fs-theme-btn fs-theme-btn-outlined" onClick={() => handleVehiclePageChange(fleetName, currentPage + 1)}>{t("buttons.next")}</Button>}
                  </td>
                </tr>
              )}
            </tbody>
          </React.Fragment>
        );
      })}
    </table>
  );
}
FleetSummaryTable.propTypes = {
  groupedData: propTypes.object.isRequired,
  expandedFleets: propTypes.object.isRequired,
  toggleFleetExpansion: propTypes.func.isRequired,
  handleSort: propTypes.func.isRequired,
  sortConfig: propTypes.object.isRequired,
  vehicleCurrentPage: propTypes.object.isRequired,
  handleVehiclePageChange: propTypes.func.isRequired,
  isAnyFleetExpanded: propTypes.bool.isRequired,
};
 

export default React.memo(FleetSummaryTable);