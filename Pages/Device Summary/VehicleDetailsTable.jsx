import React from "react";
import { Eye, ArrowUp, ArrowDown } from "lucide-react";
import PaginationControls from "./PaginationControls";
import propTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";  

const StatusTag = ({ status }) => {
  const statusClass = status.toLowerCase().replace(" ", "-");
  return (
    <div className={`ds-status-tag ${statusClass}`}>
      <span className="ds-status-dot"></span>
      <span>{status}</span>
    </div>
  );
};

// UPDATED: This component is now more robust.
const BatteryIndicator = ({ percentage }) => {
  const numPercentage = parseInt(percentage, 10);
  const isValid = !isNaN(numPercentage);

  return (
    <div className="ds-battery-cell">
      <div className="ds-battery-indicator">
        <div
          className="ds-battery-indicator-fill"
          style={{ width: isValid ? `${numPercentage}%` : "0%" }}
        ></div>
      </div>
      <span className="ds-battery-percentage">{isValid ? `${numPercentage}%` : "N/A"}</span>
    </div>
  );
};

const VehicleDetailsTable = ({
  vehicles,
  onVehicleSelect,
  currentPage,
  // totalPages,
  totalItems,
  pageSize,
  onPageChange,
  requestSort,
  sortConfig,
  selectedVehicle,
}) => {

  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const __vrn = t("VehicleStatus.vrn", "VRN");
  const __status_ = t("VehicleStatus.status_", "Status");
  const __date = t("VehicleStatus.date", "Date");
  const __vehicleType = t("VehicleStatus.vehicle_type", "Vehicle Type");
  const __region = t("VehicleStatus.region", "Region");
  const __city = t("VehicleStatus.city", "City");
  const __depot = t("VehicleStatus.depot", "Depot");
  const __startOdometer = t("VehicleStatus.start_odometer", "Start Odometer");
  const __endOdometer = t("VehicleStatus.end_odometer", "End Odometer");
  const __dailyKm = t("VehicleStatus.daily_km", "Daily KM");
  const __runningTime = t("VehicleStatus.running_time", "Running Time");
  const __idleTime = t("VehicleStatus.idle_time", "Idle Time");
  const __chargingTime = t("VehicleStatus.charging_time", "Charging Time");
  const __stoppedTime = t("VehicleStatus.stopped_time", "Stoppage Time");
  const __avgSpeed = t("VehicleStatus.avg_speed", "Avg. Speed");
  const __startSoc = t("VehicleStatus.start_soc", "Start SOC");
  const __endSoc = t("VehicleStatus.end_soc", "End SOC");
  const __motorEnergy = t("VehicleStatus.motor_energy", "Motor Energy");
  const __dcEnergy = t("VehicleStatus.dc_energy", "DC-DC Energy");
  const __ecompressorEnergy = t("VehicleStatus.ecompressor_energy", "E Compressor Energy");
  const __eneryConsumption = t("VehicleStatus.energy_consumption", "Energy Consumption");
  const __bcsEnergy = t("VehicleStatus.bcs_energy", "BCS Energy");
  const __tcsEnergy = t("VehicleStatus.tcs_energy", "TCS Energy");
  const __energyConsumed = t("VehicleStatus.energy_consumed", "Energy Consumed");
  const __regenEnergy = t("VehicleStatus.regen_energy", "Regen Energy");
  const __chargingEnergy = t("VehicleStatus.charging_energy", "Charging Energy");
  const __batteryTemp = t("VehicleStatus.battery_temp", "Batt. Temp");
  const __motorTemp = t("VehicleStatus.motor_temp", "Motor Temp");
  const __actions = t("VehicleStatus.actions", "Actions");
  const __go_to = t("VehicleStatus.go_to", "Go to");
  const __page = t("VehicleStatus.page", "Page");
  // All translation variables format __variableName
  // This convention helps quickly identify multilingual text in the component.
  // ----------------------------

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <ArrowUp size={16} />
    ) : (
      <ArrowDown size={16} />
    );
  };

  const SortableHeader = ({ sortKey, title, unit }) => (
    <button onClick={() => requestSort(sortKey)} className="ds-sortable-header">
      <div>
        <span>{title}</span>
        {unit && <span className="ds-header-unit">{unit}</span>}
      </div>
      {getSortIcon(sortKey)}
    </button>
  );

  const noWrapStyle = { whiteSpace: "nowrap" };

  return (
    <>
      <div className="ds-table-container">
        <table className="ds-table">
          <thead>
            <tr>
              <th style={noWrapStyle}><SortableHeader sortKey="vrn" title= {__vrn} /></th>
              <th style={noWrapStyle}>{__status_}</th>
              <th style={noWrapStyle}><SortableHeader sortKey="date" title= {__date} /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="vehicle_type_name" title= {__vehicleType} /></th>
              <th style={noWrapStyle}>{__region}</th>
              <th style={noWrapStyle}><SortableHeader sortKey="city" title= {__city} /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="depot" title= {__depot} /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="startOdometer" title= {__startOdometer} unit="(km)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="endOdometer" title= {__endOdometer} unit="(km)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="dailyKm" title= {__dailyKm} unit="(km)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="runningTime" title= {__runningTime} unit="(min)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="idleTime" title= {__idleTime} unit="(min)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="chargingTime" title= {__chargingTime} unit="(min)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="stoppageTime" title= {__stoppedTime} unit="(min)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="averageSpeed" title= {__avgSpeed} unit="(km/h)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="startSoc" title= {__startSoc} unit="(%)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="battery" title= {__endSoc} unit="(%)" /></th>
              {/* <th style={noWrapStyle}><SortableHeader sortKey="efficiency" title="Efficiency" unit="(km/kWh)" /></th> */}
              {/* <th style={noWrapStyle}><SortableHeader sortKey="newEfficiency" title="Distance per Soc" unit="(km/soc)" /></th> */}
              <th style={noWrapStyle}><SortableHeader sortKey="motorEc" title= {__motorEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="dcdcEc" title= {__dcEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="ecompEc" title= {__ecompressorEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="bcsEc" title= {__bcsEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="tcsEc" title= {__tcsEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="energyConsumed" title= {__energyConsumed} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="energyConsumption" title= {__eneryConsumption} unit="(kWh/km)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="regenEnergy" title= {__regenEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="chargingUnit" title= {__chargingEnergy} unit="(kWh)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="batteryTemp" title= {__batteryTemp} unit="(°C)" /></th>
              <th style={noWrapStyle}><SortableHeader sortKey="motorTemp" title= {__motorTemp} unit="(°C)" /></th>
              <th style={noWrapStyle}>{__actions}</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr
                key={v.id}
                onClick={() => onVehicleSelect(v)}
                className={selectedVehicle && selectedVehicle.id === v.id ? "ds-selected-row" : ""}
              >
                <td data-label="VRN" style={noWrapStyle}>
                  {(v.vrn && v.vrn !== '-') ? v.vrn : (v.chassis_number && v.chassis_number !== '-') ? v.chassis_number : v.id}
                </td>
                <td data-label={__status_} style={noWrapStyle}><StatusTag status={v.status} /></td>
                <td data-label={__date} style={noWrapStyle}>{v.date}</td>
                <td data-label={__vehicleType} style={noWrapStyle}>{v.vehicle_type_name}</td>
                <td data-label={__region} style={noWrapStyle}>{v.region}</td>
                <td data-label={__city} style={noWrapStyle}>{v.city}</td>
                <td data-label={__depot} style={noWrapStyle}>{v.depot}</td>
                <td data-label={__startOdometer} style={noWrapStyle}>{v.startOdometer}</td>
                <td data-label={__endOdometer} style={noWrapStyle}>{v.endOdometer}</td>
                <td data-label={__dailyKm} style={noWrapStyle}>{v.dailyKm}</td>
                <td data-label={__runningTime} style={noWrapStyle}>{v.runningTime}</td>
                <td data-label={__idleTime} style={noWrapStyle}>{v.idleTime}</td>
                <td data-label={__chargingTime} style={noWrapStyle}>{v.chargingTime}</td>
                <td data-label={__stoppedTime} style={noWrapStyle}>{v.stoppageTime}</td>
                <td data-label={__avgSpeed} style={noWrapStyle}>{v.averageSpeed}</td>
                {/* UPDATED: This now uses the BatteryIndicator */}
                <td data-label={__startSoc} style={noWrapStyle}><BatteryIndicator percentage={v.startSoc} /></td>
                <td data-label={__endSoc} style={noWrapStyle}><BatteryIndicator percentage={v.battery} /></td>
                {/* <td data-label="Efficiency" style={noWrapStyle}>{v.efficiency}</td> */}
                {/* <td data-label="Distance per Soc" style={noWrapStyle}>{v.newEfficiency}</td> */}
                <td data-label={__motorEnergy} style={noWrapStyle}>{v.motorEc}</td>
                <td data-label={__dcEnergy} style={noWrapStyle}>{v.dcdcEc}</td>
                <td data-label={__ecompressorEnergy} style={noWrapStyle}>{v.ecompEc}</td>
                <td data-label={__bcsEnergy} style={noWrapStyle}>{v.bcsEc}</td>
                <td data-label={__tcsEnergy} style={noWrapStyle}>{v.tcsEc}</td>
                <td data-label={__energyConsumed} style={noWrapStyle}>{v.energyConsumed}</td>
                <td data-label={__eneryConsumption} style={noWrapStyle}>{v.energyConsumption}</td>
                <td data-label={__regenEnergy} style={noWrapStyle}>{v.regenEnergy}</td>
                <td data-label={__chargingEnergy} style={noWrapStyle}>{v.chargingUnit}</td>
                <td data-label={__batteryTemp} style={noWrapStyle}>{v.batteryTemp}</td>
                <td data-label={__motorTemp} style={noWrapStyle}>{v.motorTemp}</td>
                <td data-label={__actions} style={noWrapStyle}><Eye size={20} className="ds-action-icon" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <PaginationControls
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
};
VehicleDetailsTable.propTypes = {
  vehicles: propTypes.arrayOf(
    propTypes.shape({
      id: propTypes.string.isRequired,
      vrn: propTypes.string,
      chassis_number: propTypes.string,
      status: propTypes.string.isRequired,
      date: propTypes.string.isRequired,
      vehicle_type_name: propTypes.string.isRequired,
      region: propTypes.string.isRequired,
      city: propTypes.string.isRequired,
      depot: propTypes.string.isRequired,
      startOdometer: propTypes.number.isRequired,
      endOdometer: propTypes.number.isRequired,
      dailyKm: propTypes.number.isRequired,
      runningTime: propTypes.number.isRequired,
      idleTime: propTypes.number.isRequired,
      chargingTime: propTypes.number.isRequired,
      stoppageTime: propTypes.number.isRequired,
      averageSpeed: propTypes.number.isRequired,
      startSoc: propTypes.string.isRequired,
      battery: propTypes.string.isRequired,
      motorEc: propTypes.number.isRequired,
      dcdcEc: propTypes.number.isRequired,
      ecompEc: propTypes.number.isRequired,
      bcsEc: propTypes.number.isRequired,
      tcsEc: propTypes.number.isRequired,
      energyConsumed: propTypes.number.isRequired,
      energyConsumption: propTypes.number.isRequired,
      regenEnergy: propTypes.number.isRequired,
      chargingUnit: propTypes.number.isRequired,
      batteryTemp: propTypes.number.isRequired,
      motorTemp: propTypes.number.isRequired,
      totalItems: propTypes.number.isRequired,
      pageSize: propTypes.number.isRequired,
    })
  ).isRequired,
  onVehicleSelect: propTypes.func.isRequired,
  currentPage: propTypes.number.isRequired,
  totalPages: propTypes.number.isRequired,
  onPageChange: propTypes.func.isRequired,
  requestSort: propTypes.func.isRequired,
  sortConfig: propTypes.shape({
    key: propTypes.string,
    direction: propTypes.oneOf(["ascending", "descending"]),
  }),
  selectedVehicle: propTypes.shape({
    id: propTypes.string,
  }),
};


export default VehicleDetailsTable;