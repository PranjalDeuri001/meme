"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select";
import { ExceptionMap } from "antd/es/result";

function FleetSelector({
  fleets,
  selectedFleet,
  onFleetChange,
  customSelectStyles,
}) {
  const { t } = useTranslation();
  const selectId = "analysis-fleet-select";

  const options = fleets.map((fleet) => ({
    value: fleet,
    label: fleet,
  }));

  const handleChange = (selectedOption) => {
    onFleetChange(selectedOption ? selectedOption.value : "");
  };

  const selectedOption =
    options.find((opt) => opt.value === selectedFleet) || null;

  return (
    <label className="Analysis-Selection-Menu-card" htmlFor={selectId}>
      {/* Ensure you add "fleet": "Fleet" to your translation files, or use hard text for now */}
      <span className="Analysis-Selection-Menu-Selections-title">
        {t("vehicle.fleet", "Fleet")}
      </span>
      <Select
        inputId={selectId}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        styles={customSelectStyles}
        placeholder={t("vehicle.selectFleet", "Select Fleet...")}
        isClearable
        isSearchable
      />
    </label>
  );
}
FleetSelector.propTypes = {
  fleets: PropTypes.array.isRequired,
  selectedFleet: PropTypes.string,
  onFleetChange: PropTypes.func.isRequired,
  customSelectStyles: PropTypes.object.isRequired,
};

export default FleetSelector;
