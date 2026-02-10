// src/Pages/Analysis/VehicleRegistrationSelector.jsx
"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select";

function VehicleRegistrationSelector({ filteredVehicles, onVehicleChange, selectedVehicleValue, customSelectStyles }) {
  const { t } = useTranslation();
  const selectId = "analysis-vehicle-reg-select";

  const options = filteredVehicles.map(vehicle => ({
    value: vehicle.device_id,
    label: String(vehicle.vehicle_name).toUpperCase()
  }));

  const handleChange = (selectedOption) => {
    onVehicleChange(selectedOption ? selectedOption.value : "");
  };

  // Find the selected option object to control the component value
  const selectedOption = options.find(opt => opt.value === selectedVehicleValue) || null;

  return (
    // ACCESSIBILITY FIX: Use <label> and htmlFor
    <label className="Analysis-Selection-Menu-card" htmlFor={selectId}>
      <span className="Analysis-Selection-Menu-Selections-title">{t("vehicle.registrationNumber")}</span>
      <Select
        inputId={selectId} // Associates label
        options={options}
        value={selectedOption} // Control the selected value
        onChange={handleChange}
        styles={customSelectStyles}
        placeholder={t("vehicle.registrationNumber")}
        isClearable
        isSearchable
      />
    </label>
  );
}

VehicleRegistrationSelector.propTypes = {
  filteredVehicles: PropTypes.array.isRequired,
  onVehicleChange: PropTypes.func.isRequired, // Renamed prop
  selectedVehicleValue: PropTypes.string.isRequired, // Add prop for controlled value
  customSelectStyles: PropTypes.object.isRequired,
};

export default VehicleRegistrationSelector;