// RegionCard.jsx

import React from "react";
// MODIFICATION: Switched to lucide-react for icon consistency
import { Map } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";  

// UPDATED: Added 'isActive' to the props
const RegionCard = ({ 
  region, 
  total, 
  running, 
  distance, 
  faults, 
  onRegionClick, 
  isActive 
}) => {
  
  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const region_ = t("VehicleStatus.region", "Region");
  const total_ = t("VehicleStatus.total", "Total");
  const running_ = t("VehicleStatus.running", "Running");
  const distance_ = t("VehicleStatus.distance", "Distance");
  const faults_ = t("VehicleStatus.faults", "Faults");
  // All translation variables ends with a trailing underscore (e.g., totalLabel_)
  // This convention helps quickly identify multilingual text in the component.

  return (
    <div
      // UPDATED: Conditionally add 'ds-region-card-active'
      className={`ds-card ds-region-card ds-interactive-card ${isActive ? "ds-region-card-active" : ""}`}
      onClick={() => onRegionClick(region)}
    >
      <div className="ds-region-card-header">
        <span>{region} {region_}</span>
        <Map style={{ width: "1.2rem", height: "1.2rem" }} />
      </div>
      <div className="ds-region-card-grid">
        <div>
          <p>{total_}</p>
          <p className="ds-value-text">{total.toLocaleString()}</p>
        </div>
        <div>
          <p>{running_}</p>
          <p className="ds-value-text running">{running.toLocaleString()}</p>
        </div>
        <div>
          <p>{distance_}</p>
          <p className="ds-value-text">{distance.toLocaleString()} km</p>
        </div>
        <div>
          <p>{faults_}</p>
          <p className="ds-value-text faults">{faults}</p>
        </div>
      </div>
    </div>
  );
};

RegionCard.propTypes = {
  region: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  running: PropTypes.number.isRequired,
  distance: PropTypes.number.isRequired,
  faults: PropTypes.number.isRequired,
  onRegionClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool, 
};

RegionCard.defaultProps = {
  total: 0,
  running: 0,
  distance: 0,
  faults: 0,
  onRegionClick: () => {},
  isActive: false, 
};

export default RegionCard;