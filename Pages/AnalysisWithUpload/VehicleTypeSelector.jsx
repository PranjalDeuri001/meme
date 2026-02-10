// src/Pages/AnalysisWithUpload/VehicleTypeSelector.jsx
"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select"; // Import the react-select component

function VehicleTypeSelector({ filterVehicles, types, customSelectStyles }) {
  const { t } = useTranslation();
  const selectId = "vehicle-type-select";

  // Transform the types array into the { value, label } format
  const options = types.map(type => ({
    value: type.toLowerCase(),
    label: type
  }));

  const handleChange = (selectedOption) => {
    // Call the filter function with the selected value or an empty string if cleared
    filterVehicles(selectedOption ? selectedOption.value : "");
  };

  return (
    <div className="ca-form-group">
      <label className="ca-form-label" htmlFor={selectId}>
        {t("vehicle.vehicleType")}
      </label>
      <Select
        inputId={selectId}
        options={options}
        onChange={handleChange}
        styles={customSelectStyles}
        placeholder={t("vehicle.vehicleType")}
        isClearable
        isSearchable
      />
    </div>
  );
}

VehicleTypeSelector.propTypes = {
  filterVehicles: PropTypes.func.isRequired,
  types: PropTypes.array.isRequired,
  // Add prop type for the styles object
  customSelectStyles: PropTypes.object.isRequired,
};

export default VehicleTypeSelector;