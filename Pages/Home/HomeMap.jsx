import React, {useMemo } from "react";
import { useTranslation } from "react-i18next";
import propTypes from "prop-types";
// --- MODIFIED: Import the new SVG components from the file you just created ---
import {
  DistanceIcon,
  CO2Icon,
  ChargingUnitIcon,
  RuntimeIcon,
  TractionIcon,
  RegenerationIcon,
  CostSavingIcon,
  TreesSavedIcon,
} from "../../Components/Icons/Icons.jsx"; // Make sure this path is correct

const HomeMap = ({ fleetMetrics, isLoading }) => {
  const { t } = useTranslation();
  
  const format = (value, suffix = "", fallback = "N/A") => {
    if (value === "N/A" || value == null || isNaN(Number(value))) {
      return fallback;
    }
    return `${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value)}${suffix}`;
  };

  const treesSaved = useMemo(() => {
    const co2 = parseFloat(fleetMetrics?.co2_saving);
    if (isNaN(co2) || co2 <= 0) return 0;
    return Math.round(co2 / 12.5);
  }, [fleetMetrics?.co2_saving]);
  
  const renderValue = (value, suffix = "") => {
    return isLoading ? "..." : format(value, suffix);
  };
  
  // --- MODIFIED: A single class name will be used for styling all icons ---
  const iconClassName = "home-kpi-icon";

  return (
    <div id="Home-sec-cont-2">
      <div className="Home-DCC">
        <DistanceIcon className={iconClassName} />
        <p>{renderValue(fleetMetrics?.total_distance, " km")}</p>
        <p>{t("calculations.totalDistance")}</p>
      </div>

      <div className="Home-DCC">
        <CO2Icon className={iconClassName} />
        <p>{renderValue(Math.abs(fleetMetrics?.co2_saving), " kg")}</p>
        <p>{t("calculations.co2Savings")}</p>
      </div>

      <div className="Home-DCC">
        <ChargingUnitIcon className={iconClassName} />
        <p>{renderValue(fleetMetrics?.charging_unit, " kWh")}</p>
        <p>{t("calculations.chargingUnits")}</p>
      </div>

      <div className="Home-DCC">
        <RuntimeIcon className={iconClassName} />
        <p>{renderValue(fleetMetrics?.run_time, " hrs")}</p>
        <p>{t("calculations.runTime")}</p>
      </div>

      <div className="Home-DCC">
        <TractionIcon className={iconClassName} />
        <p style={{ marginTop: "18px" }}>
          {renderValue(fleetMetrics?.traction_energy, " kWh")}
        </p>
        <p>{t("calculations.tractionEnergy")}</p>
      </div>

      <div className="Home-DCC">
        <RegenerationIcon className={iconClassName} />
        <p style={{ marginTop: "20px" }}>
          {renderValue(fleetMetrics?.regen_energy, " kWh")}
        </p>
        <p>{t("calculations.regenerationEnergy")}</p>
      </div>

      <div className="Home-DCC">
        <CostSavingIcon className={iconClassName} />
        <p style={{ marginTop: "20px" }}>
          ₹ {renderValue(fleetMetrics?.cost_saved)}
        </p>
        <p>{t("calculations.costSavings")}</p>
      </div>

      <div className="Home-DCC">
        <TreesSavedIcon className={iconClassName} />
        <p style={{ marginTop: "20px" }}>
          {renderValue(treesSaved)}
        </p>
        <p>{t("calculations.treesSaved")}</p>
      </div>
    </div>
  );
};
HomeMap.propTypes = {
  fleetMetrics: propTypes.shape({
    total_distance: propTypes.number,
    co2_saving: propTypes.string,
    charging_unit: propTypes.string,
    run_time: propTypes.string,
    traction_energy: propTypes.string,
    regen_energy: propTypes.string,
    cost_saved: propTypes.string,
  }),
  isLoading: propTypes.bool,
};
HomeMap.defaultProps = {
  fleetMetrics: {
    total_distance: 0,  
    co2_saving: "0",
    charging_unit: "0",
    run_time: "0",
    traction_energy: "0",
    regen_energy: "0",
    cost_saved: "0",
  },
  isLoading: false,
};


export default React.memo(HomeMap);