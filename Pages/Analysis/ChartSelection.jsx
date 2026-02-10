// src/Pages/Analysis/ChartSelection.jsx
"use client";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Select from "react-select";

function ChartSelection({ options, selectedCharts, setSelectedCharts, customSelectStyles }) {
  const { t } = useTranslation();
  const selectId = "chart-select";

  return (
    // ACCESSIBILITY FIX: Use <label> and htmlFor
    <label className="Analysis-Selection-Menu-card" htmlFor={selectId}>
      <span className="Analysis-Selection-Menu-Selections-title">{t("charts.selectChart")}</span>
      <Select
        inputId={selectId} // Associates label
        options={options}
        value={selectedCharts}
        onChange={setSelectedCharts}
        styles={customSelectStyles}
        placeholder={`${t("charts.selectChart")}...`}
        isMulti
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
      />
    </label>
  );
}

ChartSelection.propTypes = {
  options: PropTypes.array.isRequired,
  selectedCharts: PropTypes.array.isRequired,
  setSelectedCharts: PropTypes.func.isRequired,
  customSelectStyles: PropTypes.object.isRequired,
};

export default ChartSelection;