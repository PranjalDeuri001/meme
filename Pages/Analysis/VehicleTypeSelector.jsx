// src/Pages/Analysis/VehicleTypeSelector.jsx
"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select";

// Added selectedType prop
function VehicleTypeSelector({
  filterVehicles,
  types,
  customSelectStyles,
  selectedType,
}) {
  const { t } = useTranslation();
  const selectId = "analysis-vehicle-type-select";

  const options = types.map((type) => ({
    value: type.toLowerCase(),
    label: type,
  }));

  const handleChange = (selectedOption) => {
    filterVehicles(selectedOption ? selectedOption.value : "");
  };

  // Find the selected option object so React-Select knows what to display
  // This ensures it clears when the parent state (selectedType) is cleared
  const valueOption = options.find((opt) => opt.value === selectedType) || null;

  return (
    <label className="Analysis-Selection-Menu-card" htmlFor={selectId}>
      <span className="Analysis-Selection-Menu-Selections-title">
        {t("vehicle.vehicleType")}
      </span>
      <Select
        inputId={selectId}
        options={options}
        onChange={handleChange}
        value={valueOption} // <--- CONTROLLED VALUE
        styles={customSelectStyles}
        placeholder={t("vehicle.vehicleType")}
        isClearable
        isSearchable
      />
    </label>
  );
}

VehicleTypeSelector.propTypes = {
  filterVehicles: PropTypes.func.isRequired,
  types: PropTypes.array.isRequired,
  customSelectStyles: PropTypes.object.isRequired,
  selectedType: PropTypes.string, // <--- Added Prop Type
};

export default VehicleTypeSelector;
