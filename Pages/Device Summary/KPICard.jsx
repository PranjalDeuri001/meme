// KPICard.jsx

import React from "react";
import PropTypes from "prop-types";

const KPICard = ({
  // icon: Icon, // Removed unused Icon prop
  title,
  value,
  subText,
  onKpiClick,
  isActive,
  keyName, // 1. Accept the new keyName prop
}) => {
  const filterableKpis = [
    "Running",
    "Idle",
    "Charging",
    "Stopped",
    "Total Fleet",
    "Daily Distance",
  ];

  // 2. Use keyName for logic, not title
  const isClickable = filterableKpis.includes(keyName) && onKpiClick;

  return (
    <div
      className={`ds-kpi-card ${isClickable ? "ds-interactive-card" : ""} ${
        isActive ? "ds-kpi-card-active" : ""
      }`}
      // 3. Pass keyName back on click, not title
      onClick={isClickable ? () => onKpiClick(keyName) : undefined}
    >
      <div className="ds-kpi-header">
        {/* Removed Icon usage */}
        <div className="ds-kpi-title">{title}</div>
      </div>
      <div className="ds-kpi-value">
        {value.toLocaleString()}
        {subText && <span className="ds-kpi-subtext">{subText}</span>}
      </div>
    </div>
  );
};

KPICard.propTypes = {
  // icon: PropTypes.elementType.isRequired, // Removed unused icon propType
  keyName: PropTypes.string.isRequired, // 4. Add keyName to propTypes
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  subText: PropTypes.string,
  onKpiClick: PropTypes.func,
  isActive: PropTypes.bool,
};

KPICard.defaultProps = {
  subText: "",
  onKpiClick: null,
  isActive: false,
  // icon: undefined, // Removed unused icon defaultProp
};

export default KPICard;