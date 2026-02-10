// VehicleDetailsModal.jsx

import React, { useState, useMemo, useEffect, useCallback  } from "react";
import {
  X, Truck, Zap, MapPin, Wrench, Map, ParkingCircle,
  ClipboardList, BarChart3, SlidersHorizontal, Timer,
  GaugeCircle, BatteryCharging
} from "lucide-react";
import VehicleLocationMap from "./VehicleLocationMap";
import PropTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";

// --- HELPER COMPONENTS ---

const DetailItem = ({ label, value }) => (
  <div className="ds-info-grid-item">
    <span className="ds-label-text">{label}</span>
    <span className="ds-value-text">{String(value)}</span>
  </div>
);

const DurationItem = ({ label, value, icon }) => (
  <div className="ds-duration-item">
    {icon}
    <div className="ds-duration-text">
      <span className="ds-value-text">{value}</span>
      <span className="ds-label-text">{label}</span>
    </div>
  </div>
);

const InfoSection = ({ title, icon, children }) => (
  <div className="ds-section-container">
    <div className="ds-section-header">
      {icon}
      <h4>{title}</h4>
    </div>
    <div className="ds-info-card-grid">
      {children}
    </div>
  </div>
);

const TimelineIcon = ({ icon }) => {
  const icons = {
    charging: <Zap style={{ width: 20, height: 20, color: "#f59e0b" }} />,
    location: <MapPin style={{ width: 20, height: 20, color: "#3b82f6" }} />,
    idle: <ParkingCircle style={{ width: 20, height: 20, color: "#6b7280" }} />,
    maintenance: <Wrench style={{ width: 20, height: 20, color: "#6366f1" }} />,
  };
  return <div className="ds-timeline-icon-wrapper">{icons[icon] || <MapPin style={{ width: 20, height: 20 }} />}</div>;
};

// NOTE: Unit is appended to the value string for consistency with existing implementation
const TimelineDetailItem = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
    <span style={{ color: "var(--secondary-text-color)" }}>{label}:</span>
    <span style={{ fontWeight: "600", color: "var(--primary-text-color)" }}>{value}</span>
  </div>
);

// --- MAIN COMPONENT ---

const VehicleDetailsPanel = ({ vehicle, onClose, isDarkMode }) => {
  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const notAvailable_ = t("VehicleStatus.not_available", "Content not available for this tab.");
  const errorLoadingContent_ = t("VehicleStatus.error_loading_content", "Error loading content.");
  const vehicleDetail_ = t("VehicleStatus.vehicle_detail", "Vehicle Details");
  const vrn_ = t("VehicleStatus.vrn", "VRN");
  const batteryLevel_ = t("VehicleStatus.battery_level", "Battery Level");
  const technicalDetails_ = t("VehicleStatus.technical_details", "Technical Details");
  const tripTimeline_ = t("VehicleStatus.trip_timeline", "Trip Timeline");
  const idle_ = t("VehicleStatus.idle", "Idle");
  const charging_ = t("VehicleStatus.charging", "Charging");
  const movement_ = t("VehicleStatus.movement", "Movement");
  const vehicleid_ = t("VehicleStatus.vehicleid", "Vehicle Identification");
  const imei_ = t("VehicleStatus.imei", "IMEI");
  const chassisNumber_ = t("VehicleStatus.chassis_number", "Chassis Number");
  const vehicle_type = t("VehicleStatus.vehicle_type", "Vehicle Type");
  const region = t("VehicleStatus.region", "Region");
  const depotFleet_ = t("VehicleStatus.depot_fleet", "Depot/Fleet");
  const reportDate_ = t("VehicleStatus.report_date", "Report Date");
  const operationalParameter_ = t("VehicleStatus.operational_parameter", "Operational Parameters");
  const startOdo_ = t("VehicleStatus.start_odo", "Start Odometer (km)");
  const endOdo_ = t("VehicleStatus.end_odo", "End Odometer (km)");
  const batteryTemperature_ = t("VehicleStatus.battery_temperature", "Battery Temperature (°C)");
  const endSoc_ = t("VehicleStatus.end_soc_", "End SOC (%)");
  const startSoc_ = t("VehicleStatus.start_soc_", "Start SOC (%)");
  const motorTemperature_ = t("VehicleStatus.motor_temperature", "Motor Temperature (°C)");
  const energyBreakdown_ = t("VehicleStatus.energy_breakdown", "Energy Breakdown");
  const energyConsumedKwh_ = t("VehicleStatus.energy_consumed_kwh", "Energy Consumed (kWh)");
  const energyConsumptionKwhKm_ = t("VehicleStatus.energy_consumption_kwh", "Energy Consumption (kWh/km)");
  const regenEnergyKwh_ = t("VehicleStatus.regen_energy_kwh", "Regen Energy (kWh)");
  const chargingEnergyKwh_ = t("VehicleStatus.charging_energy_kWh", "Charging Energy (kWh)");
  const motorEnergyKwh_ = t("VehicleStatus.motor_energy_kWh", "Motor Energy (kWh)");
  const dcEnergyKwh_ = t("VehicleStatus.dc_energy_kWh", "DC-DC Energy (kWh)");
  const ecompressorEnergykwh_ = t("VehicleStatus.ecompressor_energy_kWh", "E-Compressor Energy (kWh)");
  const bcsEnergykwh_ = t("VehicleStatus.bcs_energy_kWh", "BCS Energy (kWh)");
  const tcsEnergykwh_ = t("VehicleStatus.tcs_energy_kWh", "TCS Energy (kWh)");
  const deepDischarge_ = t("VehicleStatus.deep_discharge", "Deep Discharge");
  const insufficientCharge_ = t("VehicleStatus.insufficient_charge", "Insufficient Charge");
  const date_ = t("VehicleStatus.date", "Date");
  const dailyDistance_ = t("VehicleStatus.daily_distance", "Daily Distance");
  const avgSpeed_ = t("VehicleStatus.avg_speed", "Avg. Speed");
  const lastTimestamp = t("VehicleStatus.last_timestamp", "Last Timestamp");
  const running_ = t("VehicleStatus.running", "Running");
  const stopped_ = t("VehicleStatus.stopped", "Stopped");
  const dayStart_ = t("VehicleStatus.day_start", "Day Start");

  // --- NEW HELPER FUNCTION ---
  const formatBooleanValue = (value) => {
    // Handles 0, 1, true, false, "0", "1", null, undefined
    const truthy = value === 1 || value === true || String(value).toLowerCase() === "1" || String(value).toLowerCase() === "yes";
    return truthy ? "Yes" : "No";
  };

  // --- SessionList moved inside ---
  const SessionList = ({ sessions, formatTime, getIconForSession, formatDuration, hideLabelText = false, translateSessionLabel }) => {
    const session_timeline_ = t("VehicleStatus.session_timeline", "No sessions available.");
    // Updated translation key for energy consumed to match general EC display in table
    const energyConsumed_ = t("VehicleStatus.session_ec", "Energy Consumed");
    // NEW: Distinct label for Net Energy Consumed (session_ec)
    const netEnergyConsumed_ = t("VehicleStatus.session_net_ec", "Energy Consumed");
    const Traction_ = t("VehicleStatus.traction", "Traction");
    const duration_ = t("VehicleStatus.duration", "Duration");
    const soc_ = t("VehicleStatus.soc", "SOC");
    const odometer_ = t("VehicleStatus.odometer", "Odometer");
    const regen_ = t("VehicleStatus.regen", "Regen");
    const distance_ = t("VehicleStatus.distance", "Distance");

    // NEW TRANSLATION STRINGS FOR SESSION DETAILS
    const maxSpeed_ = t("VehicleStatus.max_speed", "Max Speed");
    const ecRate_ = t("VehicleStatus.session_ecr", "EC Rate");
    const chargingUnits_ = t("VehicleStatus.charging_units", "Charging Units");
    const sessionBattTemp_ = t("VehicleStatus.session_batt_temp", "Batt. Temp");


    if (!sessions || sessions.length === 0) {
      return <div className="ds-info-message" style={{ padding: "2rem 0" }}>{session_timeline_}</div>;
    }
    return (
      <div className="ds-timeline">
        <div className="ds-timeline-line"></div>
        {sessions.map((session, index) => {
          const labelLower = session.label?.toLowerCase();
          const isMovementSession = labelLower?.includes("movement");
          const isChargingSession = labelLower?.includes("charging");
          const isIdleSession = labelLower?.includes("idle");

          // Determine the appropriate energy label based on session type
          const primaryEnergyLabel = isMovementSession ? Traction_ : energyConsumed_;

          // Logic updated to strictly use session_traction for Traction display
          const movementEnergyValue = session.session_traction;

          return (
            <div key={index} className="ds-timeline-item">
              <TimelineIcon icon={getIconForSession(session.label)} />
              <div className="ds-timeline-content">
                <p className="ds-timeline-event">
                  {hideLabelText
                    ? formatTime(session.start_time_val)
                    : `${formatTime(session.start_time_val)} - ${translateSessionLabel(session.label)}`}
                </p>
                <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "var(--row-background-odd)", borderRadius: "6px", border: "1px solid var(--border-color-medium)" }}>

                  {/* Common Details */}
                  {session.duration != null && <TimelineDetailItem label={duration_} value={formatDuration(session.duration)} />}
                  {session.start_soc_val != null && session.end_soc_val != null && (
                    <TimelineDetailItem label={soc_} value={`${Math.round(session.start_soc_val)}% → ${Math.round(session.end_soc_val)}%`} />
                  )}
                  {session.start_odo_val != null && session.end_odo_val != null && (
                    <TimelineDetailItem label={odometer_} value={`${session.start_odo_val} → ${session.end_odo_val} km`} />
                  )}

                  {/* MOVEMENT Session Details */}
                  {isMovementSession && (
                    <>
                      {session.distance != null && session.distance > 0 && <TimelineDetailItem label={distance_} value={`${session.distance.toFixed(1)} km`} />}

                      {/* Display Net Energy Consumed (session_ec) */}
                      {session.session_ec != null && <TimelineDetailItem label={netEnergyConsumed_} value={`${Math.abs(session.session_ec).toFixed(3)} kWh`} />}

                      {/* Displaying session_ecr (Energy Consumption Rate) - Moved up */}
                      {session.session_ecr != null && session.session_ecr !== 0 && <TimelineDetailItem label={ecRate_} value={`${session.session_ecr.toFixed(3)} kWh/km`} />}

                      {/* Display Traction (strictly from session_traction) */}
                      {movementEnergyValue != null && <TimelineDetailItem label={primaryEnergyLabel} value={`${Math.abs(movementEnergyValue).toFixed(3)} kWh`} />}

                      {session.session_regen != null && session.session_regen > 0 && <TimelineDetailItem label={regen_} value={`${session.session_regen.toFixed(3)} kWh`} />}
                      {session.max_speed != null && session.max_speed !== 0 && <TimelineDetailItem label={maxSpeed_} value={`${session.max_speed} km/h`} />}

                    </>
                  )}

                  {/* IDLE Session Details (Also applicable to movement if session_ec is provided for idle) */}
                  {isIdleSession && session.session_ec != null && <TimelineDetailItem label={primaryEnergyLabel} value={`${Math.abs(session.session_ec).toFixed(3)} kWh`} />}

                  {/* IDLE/MOVEMENT Session Details */}
                  {(isIdleSession || isMovementSession) && (
                    <>
                      {session.battery_temperature != null && session.battery_temperature !== 0 && <TimelineDetailItem label={sessionBattTemp_} value={`${session.battery_temperature} °C`} />}
                      {session.deep_discharge != null && <TimelineDetailItem label={deepDischarge_} value={formatBooleanValue(session.deep_discharge)} />}
                    </>
                  )}

                  {/* CHARGING Session Details */}
                  {isChargingSession && (
                    <>
                      {session.charging_units != null && <TimelineDetailItem label={chargingUnits_} value={`${session.charging_units.toFixed(3)} kWh`} />}
                      {session.battery_temperature != null && session.battery_temperature !== 0 && <TimelineDetailItem label={sessionBattTemp_} value={`${session.battery_temperature} °C`} />}
                      {session.insufficient_charge != null && <TimelineDetailItem label={insufficientCharge_} value={formatBooleanValue(session.insufficient_charge)} />}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const [activeTab, setActiveTab] = useState(technicalDetails_);
  const [showMap, setShowMap] = useState(false);

  const TABS = useMemo(() => [
    technicalDetails_,
    tripTimeline_,
    movement_,
    idle_,
    charging_
  ], [technicalDetails_, tripTimeline_, movement_, idle_, charging_]);

  useEffect(() => {
    setActiveTab(technicalDetails_);
    setShowMap(false);
  }, [vehicle?.id, technicalDetails_]);

  // Close right sidebar on Escape key press
  // useEffect(() => {
  //   const handleEsc = (event) => {
  //     if (event.key === "Escape") onClose();
  //   };
  //   window.addEventListener("keydown", handleEsc);
  //   return () => window.removeEventListener("keydown", handleEsc);
  // }, [onClose]);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  // Trigger open animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // --- Handle smooth closing ---
  const handleSmoothClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") handleSmoothClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleSmoothClose]);

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getIconForSession = (label) => {
    const labelLower = (label || "").toLowerCase();
    if (labelLower.includes("movement")) return "location";
    if (labelLower.includes("charging")) return "charging";
    if (labelLower.includes("idle")) return "idle";
    return "default";
  };

  const translateSessionLabel = (label) => {
    if (!label) return "";
    const labelLower = label.toLowerCase();
    if (labelLower.includes("movement")) return movement_;
    if (labelLower.includes("idle")) return idle_;
    if (labelLower.includes("charging")) return charging_;
    if (labelLower.includes("stopped")) return stopped_;
    return label;
  };

  const formatDuration = (minutes) => {
    if (minutes == null || isNaN(minutes)) return "N/A";
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
  };

  const getDisplayStatus = () => {
    switch (vehicle.status) {
      case "Running":
        return running_;
      case "Idle":
        return idle_;
      case "Charging":
        return charging_;
      case "Stopped":
        return stopped_;
      default:
        return stopped_;
    }
  };

  const sessionHelpers = { formatTime, getIconForSession, formatDuration, translateSessionLabel };

  const renderTabContent = () => {
    try {
      const sessions = vehicle.sessions || [];
      switch (activeTab) {
        case tripTimeline_:
          // Filter out 'Stopped' sessions for a cleaner timeline view
          return <SessionList sessions={sessions.filter(s => s.label?.toLowerCase() !== 'stopped')} {...sessionHelpers} />;
        case movement_:
          return <SessionList sessions={sessions.filter(s => s.label?.toLowerCase().includes("movement"))} {...sessionHelpers} />;
        case idle_:
          return <SessionList sessions={sessions.filter(s => s.label?.toLowerCase().includes("idle"))} {...sessionHelpers} />;
        case charging_:
          return <SessionList sessions={sessions.filter(s => s.label?.toLowerCase().includes("charging"))} {...sessionHelpers} hideLabelText={true} />;
        case technicalDetails_:
          return (
            <div>
              <InfoSection title={vehicleid_} icon={<ClipboardList size={20} />}>
                <DetailItem label={imei_} value={vehicle.imei || "N/A"} />
                <DetailItem label={chassisNumber_} value={vehicle.chassis_number || "N/A"} />
                <DetailItem label={vehicle_type} value={vehicle.vehicle_type_name || "N/A"} />
                <DetailItem label={region} value={vehicle.region || "N/A"} />
                <DetailItem label={depotFleet_} value={vehicle.depot || "N/A"} />
                <DetailItem label={reportDate_} value={vehicle.date || "N/A"} />
              </InfoSection>

              <InfoSection title={operationalParameter_} icon={<SlidersHorizontal size={20} />}>
                <DetailItem label={startOdo_} value={vehicle.startOdometer || "N/A"} />
                <DetailItem label={endOdo_} value={vehicle.endOdometer || "N/A"} />
                <DetailItem label={startSoc_} value={vehicle.startSoc || "N/A"} />
                <DetailItem label={endSoc_} value={vehicle.battery || "N/A"} />
                <DetailItem label={batteryTemperature_} value={vehicle.batteryTemp || "N/A"} />
                <DetailItem label={motorTemperature_} value={vehicle.motorTemp || "N/A"} />
              </InfoSection>

              <InfoSection title={energyBreakdown_} icon={<BarChart3 size={20} />}>
                <DetailItem label={energyConsumedKwh_} value={vehicle.energyConsumed || "0.0"} />
                <DetailItem label={energyConsumptionKwhKm_} value={vehicle.energyConsumption || "0.0"} />
                <DetailItem label={regenEnergyKwh_} value={vehicle.regenEnergy || "N/A"} />
                <DetailItem label={chargingEnergyKwh_} value={vehicle.chargingUnit || "0"} />
                <DetailItem label={motorEnergyKwh_} value={vehicle.motorEc || "N/A"} />
                <DetailItem label={dcEnergyKwh_} value={vehicle.dcdcEc || "N/A"} />
                <DetailItem label={ecompressorEnergykwh_} value={vehicle.ecompEc || "N/A"} />
                <DetailItem label={bcsEnergykwh_} value={vehicle.bcsEc || "N/A"} />
                <DetailItem label={tcsEnergykwh_} value={vehicle.tcsEc || "N/A"} />
                <DetailItem label={deepDischarge_} value={vehicle.depth_of_discharge ===true ? "Yes" : "No"} />
                <DetailItem label={insufficientCharge_} value={vehicle.insufficient_charge=== true ? "Yes" : "No"} />
              </InfoSection>
            </div>
          );

        default:
          return <div className="ds-info-message" style={{ padding: "2rem 0" }}>{notAvailable_}</div>;
      }
    } catch (error) {
      console.error("Error rendering tab content:", error);
      return <div className="ds-error-message" style={{ padding: "2rem 0" }}>{errorLoadingContent_}</div>;
    }
  };

  return (
    <div className="ds-details-panel-wrapper" onClick={handleSmoothClose}>
      <div className="ds-details-panel" onClick={(e) => e.stopPropagation()}
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out"
        }}>
        <header className="ds-panel-header">
          <div className="ds-panel-header-title-group">
            <h2 className="ds-panel-title">{vehicleDetail_} - {vehicle.vrn && vehicle.vrn !== '-' ? vehicle.vrn : vehicle.id}</h2>
          </div>
          <div className="ds-panel-header-actions">
            {vehicle.latitude && vehicle.longitude && (
              <button className="ds-theme-btn ds-theme-btn-icon ds-theme-btn-outlined" title="View on Map" onClick={() => setShowMap(true)}>
                <Map size={18} />
              </button>
            )}
          </div>
          <button onClick={handleSmoothClose} className="ds-theme-btn ds-theme-btn-icon ds-theme-btn-outlined">
            <X size={20} />
          </button>
        </header>

        <div className="ds-panel-body">
          {showMap && vehicle.latitude && vehicle.longitude ? (
            <VehicleLocationMap
              apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
              vehicle={vehicle}
              onBack={() => setShowMap(false)}
              isDarkMode={isDarkMode} // <-- PASS isDarkMode
            />
          ) : (
            <>
              <div className="ds-summary-card">
                <div className="ds-summary-header">
                  <Truck className="ds-summary-icon" />
                  <div>
                    <p className="ds-summary-title">{vrn_} : {vehicle.vrn && vehicle.vrn !== '-' ? vehicle.vrn : vehicle.id}</p>
                    <p className="ds-summary-status">{getDisplayStatus()}</p>
                  </div>
                </div>
                <div className="ds-summary-kpi-grid">
                  <DetailItem label={date_} value={vehicle.date || "N/A"} />
                  <DetailItem label={dayStart_} value={vehicle.dayStart || "N/A"} />
                  <DetailItem label={depotFleet_} value={vehicle.depot || "N/A"} />
                  <DetailItem label={dailyDistance_} value={`${vehicle.dailyKm || "0.0"} km`} />
                  <DetailItem label={avgSpeed_} value={`${vehicle.averageSpeed || "0.0"} km/h`} />
                  <DetailItem label={lastTimestamp} value={`${vehicle.dayEnd || "N/A"}`} />
                </div>
                <div className="ds-duration-grid">
                  <DurationItem label={running_} value={formatDuration(vehicle.runningTime)} icon={<GaugeCircle size={18} />} />
                  <DurationItem label={idle_} value={formatDuration(vehicle.idleTime)} icon={<ParkingCircle size={18} />} />
                  <DurationItem label={charging_} value={formatDuration(vehicle.chargingTime)} icon={<BatteryCharging size={18} />} />
                  <DurationItem label={stopped_} value={formatDuration(vehicle.stoppageTime)} icon={<Timer size={18} />} />
                </div>
                <div className="ds-battery-indicator-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p className="ds-label-text">{batteryLevel_}</p>
                    <p className="ds-value-text" style={{ fontSize: '1rem' }}>{vehicle.battery != null ? `${vehicle.battery}%` : "N/A"}</p>
                  </div>
                  <div className="ds-battery-indicator">
                    <div className="ds-battery-indicator-fill" style={{ width: `${vehicle.battery || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="ds-tabs-container">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`ds-tab-button ${activeTab === tab ? 'active' : ''}`} >
                    {tab}
                  </button>
                ))}
              </div>

              <div key={activeTab} className="ds-tab-content">
                {renderTabContent()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
VehicleDetailsPanel.propTypes = {
  vehicle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    vrn: PropTypes.string,
    imei: PropTypes.string,
    chassis_number: PropTypes.string,
    vehicle_type_name: PropTypes.string,
    region: PropTypes.string,
    depot: PropTypes.string,
    date: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    status: PropTypes.string,
    startOdometer: PropTypes.number,
    endOdometer: PropTypes.number,
    startSoc: PropTypes.number,
    battery: PropTypes.number,
    energyConsumed: PropTypes.number,
    energyConsumption: PropTypes.number,
    regenEnergy: PropTypes.number,
    chargingUnit: PropTypes.number,
    motorEc: PropTypes.number,
    dcdcEc: PropTypes.number,
    ecompEc: PropTypes.number,
    bcsEc: PropTypes.number,
    tcsEc: PropTypes.number,
    depth_of_discharge: PropTypes.string,
    insufficient_charge: PropTypes.string,
    runningTime: PropTypes.number,
    idleTime: PropTypes.number,
    chargingTime: PropTypes.number,
    stoppageTime: PropTypes.number,
    dailyKm: PropTypes.number,
    averageSpeed: PropTypes.number,
    dayStart: PropTypes.string,
    batteryTemp: PropTypes.number,
    motorTemp: PropTypes.number,
    displayId: PropTypes.string,
    fleet: PropTypes.string,
    speed: PropTypes.number,
    city: PropTypes.string,
    sessions: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      start_time_val: PropTypes.string,
      end_time_val: PropTypes.string,
      start_soc_val: PropTypes.number,
      end_soc_val: PropTypes.number,
      start_odo_val: PropTypes.number,
      end_odo_val: PropTypes.number,
      session_ec: PropTypes.number,
      session_regen: PropTypes.number,
      distance: PropTypes.number,
      duration: PropTypes.number,
      max_speed: PropTypes.number, 
      session_ecr: PropTypes.number, 
      charging_units: PropTypes.number, 
      battery_temperature: PropTypes.number, 
      deep_discharge: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]), 
      insufficient_charge: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]), 
    })),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
};

VehicleDetailsPanel.defaultProps = {
  isDarkMode: false,
};


export default VehicleDetailsPanel;