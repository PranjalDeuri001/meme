import React from "react";
import { useTranslation } from "react-i18next";

const VehicleHeader = ({ searchTerm, onSearchChange, onAddClick }) => {
  const { t } = useTranslation(); 
  const __vehicleManagement = t("AddVehicle.vehicle_management", "Vehicle Management");
  const __searchBy = t("AddVehicle.search_by", "Search by Device ID, VRN, Chassis...");
  const __addNewVehicle = t("AddVehicle.add_new_vehicle_", "+ Add New Vehicle");

  return (
    <div className="vm-header">
      <h2 id="vm-title"> {__vehicleManagement} </h2>
      <div className="vm-controls">
        <input
          type="text"
          placeholder= {__searchBy}
          className="vm-search-input"
          value={searchTerm}
          onChange={onSearchChange}
        />
        <button className="theme-btn theme-btn-contained" onClick={onAddClick}>
          {__addNewVehicle}
        </button>
      </div>
    </div>
  );
};

export default VehicleHeader;
