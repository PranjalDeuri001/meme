// FleetInfo.jsx

import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { normalizeModelName } from "../../utils/vehicleUtils";
import { FleetInfoSkeletonInternal } from "./HomeSkeleton";
// --- THIS IS THE FIX (1/3): Import the correct low-res map ---
import { VEHICLE_HOME_IMAGE_MAP } from "../../Data/data2.jsx";

const FleetInfo = ({
  vehicles,
  selectedModel,
  onModelSelect,
  onShowAllVehicles,
  isLoading,
  statusFilter,
  onStatusFilterChange,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fleetGridRef = useRef(null);

  // TEMPORARILY DISABLED - Testing if this blocks clicks
  // Enable drag-to-scroll
  // useDragToScroll(fleetGridRef);

  const summaryData = useMemo(() => {
    if (isLoading || !Array.isArray(vehicles) || vehicles.length === 0) {
      return null;
    }

    const productionVehicles = vehicles;
    const modelCounts = {};
    let activeCount = 0;
    let inactiveCount = 0;
    let nogpsCount = 0;

    productionVehicles.forEach((vehicle) => {
      const modelName = normalizeModelName(vehicle.vehicleType);
      const mode = vehicle.mode?.toLowerCase() || "inactive";

      if (!modelCounts[modelName]) {
        modelCounts[modelName] = { total: 0, active: 0, inactive: 0, nogps: 0 };
      }
      modelCounts[modelName].total++;

      switch (mode) {
        case "active":
          modelCounts[modelName].active++;
          activeCount++;
          break;
        case "nogps":
          modelCounts[modelName].nogps++;
          nogpsCount++;
          break;
        case "inactive":
        default:
          modelCounts[modelName].inactive++;
          inactiveCount++;
          break;
      }
    });

    const totalCount = productionVehicles.length;

    return {
      total_device: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      nogps: nogpsCount,
      modelCounts,
    };
  }, [vehicles, isLoading]);


  const handleModelClick = (model) => onModelSelect(model);
  const handleShowAllClick = () => onShowAllVehicles();

  // --- THIS IS THE FIX (2/3): Added "7.5t" to the sort order ---
  const modelOrder = ["13.5m", "12m", "9m", "7m", "55t", "7.5t", "6s", "3s", "5t"];

  return (
    <>
      <h2>{t("status.overview")}</h2>

      {isLoading && <FleetInfoSkeletonInternal />}

      {!isLoading && !summaryData && (
        <div className="fleet-info-loading">
          <p>{t("status.noVehicles", "No vehicle data found.")}</p>
        </div>
      )}

      {summaryData && (
        <>
          <span id="Home-VStaus-Total">
            <p
              id="Home-TFS"
              onClick={() => onStatusFilterChange('all')}
              className={`status-overview-card ${statusFilter === 'all' ? 'active-status-filter' : ''}`}
              style={{ cursor: "pointer" }}
              title="Show all vehicles"
            >
              {t("status.fleetSize")}{" "}
              <span className="text-sm md:text-xl font-semibold">
                {summaryData.total_device}
              </span>
            </p>
            <p
              id="Home-Active"
              onClick={() => onStatusFilterChange(statusFilter === 'active' ? 'all' : 'active')}
              className={`status-overview-card ${statusFilter === 'active' ? 'active-status-filter' : ''}`}
              style={{ cursor: "pointer" }}
              title="Filter active vehicles"
            >
              {t("status.active")}{" "}
              <span className="text-sm md:text-xl font-semibold">
                {summaryData.active}
              </span>
            </p>
            <p
              id="Home-Inactive"
              onClick={() => onStatusFilterChange(statusFilter === 'inactive' ? 'all' : 'inactive')}
              className={`status-overview-card ${statusFilter === 'inactive' ? 'active-status-filter' : ''}`}
              style={{ cursor: "pointer" }}
              title="Filter inactive vehicles"
            >
              {t("status.inactive")}{" "}
              <span className="text-sm md:text-xl font-semibold">
                {summaryData.inactive}
              </span>
            </p>
            <p
              id="Home-NoGps"
              onClick={() => onStatusFilterChange(statusFilter === 'nogps' ? 'all' : 'nogps')}
              className={`status-overview-card ${statusFilter === 'nogps' ? 'active-status-filter' : ''}`}
              style={{ cursor: "pointer" }}
              title="Filter vehicles without GPS"
            >
              {t("status.noGps", "No GPS")}{" "}
              <span className="text-sm md:text-xl font-semibold">
                {summaryData.nogps}
              </span>
            </p>
          </span>

          <div id="Home-fleet-info" className="fleet-card-grid" ref={fleetGridRef}>
            {Object.entries(summaryData.modelCounts)
              .sort(([a], [b]) => {
                const indexA = modelOrder.indexOf(a);
                const indexB = modelOrder.indexOf(b);
                return (
                  (indexA === -1 ? Infinity : indexA) -
                  (indexB === -1 ? Infinity : indexB)
                );
              })
              .map(([model, counts]) => {
                // --- THIS IS THE FIX (3/3): Use the low-res home image map ---
                const bgImage = VEHICLE_HOME_IMAGE_MAP[model];
                const isComingSoon = model === '5t' || model === '7.5t';

                return (
                  <button
                    key={model}
                    type="button"
                    data-model={model}
                    className={`fleet-card ${selectedModel === model ? "active" : ""
                      } ${isComingSoon ? "is-coming-soon" : ""}`}
                    onClick={() => handleModelClick(model)}
                    onDoubleClick={() =>
                      navigate(
                        `/vehicle_selection/${encodeURIComponent(model)}`,
                        { state: { from: "home" } }
                      )
                    }
                    title={isComingSoon ? "Coming Soon" : "Click for details. Double-click to view the fleet."}
                  >

                    <p className="fleet-card-title">
                      {isComingSoon && <span className="coming-soon-badge">Coming Soon</span>}
                      {String(model).toUpperCase()}
                    </p>

                    {bgImage && (
                      <img
                        src={bgImage}
                        alt={model}
                        className="fleet-card-image"
                      />
                    )}

                    <div className="fleet-card-body">
                      <span className="fleet-card-total">{counts.total}</span>
                      <span className="fleet-card-total-label">{t("homepage.total", "Total")}</span>
                    </div>

                    <div className="fleet-card-footer">
                      <div className="fleet-card-status">
                        <span className="fleet-card-status-label">{t("homepage.active", "Active")}</span>
                        <span className="fleet-card-status-value active">
                          {counts.active}
                        </span>
                      </div>
                      <div className="fleet-card-status">
                        <span className="fleet-card-status-label">{t("homepage.inactive", "Inactive")}</span>
                        <span className="fleet-card-status-value inactive">
                          {counts.inactive}
                        </span>
                      </div>
                      <div className="fleet-card-status">
                        <span className="fleet-card-status-label">No GPS</span>
                        {/* --- Typo Fix: Was className_Name --- */}
                        <span className="fleet-card-status-value nogps">
                          {counts.nogps}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </>
  );
};

FleetInfo.propTypes = {
  vehicles: PropTypes.array.isRequired,
  selectedModel: PropTypes.string,
  onModelSelect: PropTypes.func.isRequired,
  onShowAllVehicles: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  statusFilter: PropTypes.string,
  onStatusFilterChange: PropTypes.func,
};
FleetInfo.defaultProps = {
  selectedModel: "",
  isLoading: false,
  statusFilter: "all",
  onStatusFilterChange: () => { },
};

export default React.memo(FleetInfo);