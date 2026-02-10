// src/Pages/AnalysisWithUpload/VehicleRegistrationSelector.jsx
"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select"; // --- FIX: Import the react-select component ---

function VehicleRegistrationSelector({ filteredVehicles, setSelectedVehicle, customSelectStyles }) {
  const { t } = useTranslation();
  const selectId = "vehicle-reg-select";

  // --- FIX: Transform vehicle data into the { value, label } format required by react-select ---
  const options = filteredVehicles.map(vehicle => ({
    value: vehicle.device_id,
    label: String(vehicle.vehicle_name).toUpperCase()
  }));

  const handleChange = (selectedOption) => {
    // Pass up either the selected value or an empty string if cleared
    setSelectedVehicle(selectedOption ? selectedOption.value : "");
  };

  return (
    <div className="ca-form-group">
      <label className="ca-form-label" htmlFor={selectId}>
        {t("vehicle.registrationNumber")}
      </label>
      {/* --- FIX: Replace the old <select> with the new searchable <Select> component --- */}
      <Select
        inputId={selectId}
        options={options}
        onChange={handleChange}
        styles={customSelectStyles}
        placeholder={t("vehicle.registrationNumber")}
        isClearable
        isSearchable
      />
    </div>
  );
}

VehicleRegistrationSelector.propTypes = {
  filteredVehicles: PropTypes.array.isRequired,
  setSelectedVehicle: PropTypes.func.isRequired,
  // --- FIX: Add prop type for the styles object ---
  customSelectStyles: PropTypes.object.isRequired, 
};  

export default VehicleRegistrationSelector;