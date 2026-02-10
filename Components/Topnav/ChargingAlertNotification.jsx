import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import "./ChargingAlertStyles.css";

// Material UI Icons
import BoltIcon from "@mui/icons-material/Bolt";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SavingsIcon from "@mui/icons-material/Savings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

/**
 * Charging Alert Dropdown Component
 * Modified to handle object arrays correctly
 */
const ChargingAlertDropdown = ({
  chargingDevices = [],
  message = "",
  onDeviceClick,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const dropdownRef = useRef(null);
  const btnRef = useRef(null);
  const vehicleCount = chargingDevices.length;
  const hasAlert = vehicleCount > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        btnRef.current &&
        !btnRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Parse rebate info from message
  const getRebateInfo = () => {
    if (!message) return { msedcl: "1.3", mpeb: "1.5" };
    const msedclMatch = message.match(/₹([\d.]+)\s*\(As per MSEDCL/);
    const mpebMatch = message.match(/₹([\d.]+)\s*\(As per MPEB/);
    return {
      msedcl: msedclMatch ? msedclMatch[1] : "1.3",
      mpeb: mpebMatch ? mpebMatch[1] : "1.5",
    };
  };

  const rebate = getRebateInfo();
  const displayedDevices = showAllDevices
    ? chargingDevices
    : chargingDevices.slice(0, 5);

  const handleDeviceClick = (device) => {
    // Pass the correct ID (imei or vrn) to the parent handler
    const id = device.imei || device.vrn || device;
    if (onDeviceClick) {
      onDeviceClick(id);
    }
    setIsOpen(false);
  };

  return (
    <div className="topnav-charging">
      {/* Charging Icon Button */}
      <button
        ref={btnRef}
        className={`topnav-icon-btn charging-icon-btn ${hasAlert ? "has-alert" : ""
          }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Charging Alerts: ${vehicleCount} vehicles`}
        title="Charging Alerts"
      >
        <BoltIcon className="charging-bolt-icon" />
        {hasAlert && <span className="charging-badge">{vehicleCount}</span>}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef} className="charging-dropdown">
          {/* Header */}
          <div className="charging-dropdown-header">
            <h4 className="charging-dropdown-title">{t('chargingAlert.title')}</h4>
            {hasAlert && (
              <span className="charging-count-badge">
                {vehicleCount} {t('chargingAlert.vehicles')}
              </span>
            )}
          </div>

          {hasAlert ? (
            <>
              {/* Rebate Message */}
              <div className="charging-rebate-section">
                <div className="rebate-icon-wrapper">
                  <SavingsIcon className="rebate-section-icon" />
                </div>
                <div className="rebate-info">
                  <div className="rebate-amount">
                    {t('chargingAlert.save_per_unit', { msedcl: rebate.msedcl, mpeb: rebate.mpeb })}
                  </div>
                  <div className="rebate-time">
                    {t('chargingAlert.charge_between_time')}
                  </div>
                </div>
              </div>

              {/* Vehicle List */}
              <div className="charging-vehicles-section">
                <div className="vehicles-section-header">
                  <DirectionsCarIcon className="vehicles-header-icon" />
                  <span>{t('chargingAlert.vehicles_currently_charging')}</span>
                </div>
                <ul className="charging-vehicles-list">
                  {/* FIX IS APPLIED HERE: */}
                  {displayedDevices.map((device, index) => {
                    // Safety check: Determine what to display based on object structure
                    // The error log showed keys: {imei, soc}
                    const displayId = device.vrn || device.imei || "Unknown ID";
                    const keyId = device.imei || index;

                    return (
                      <li
                        key={keyId}
                        className="charging-vehicle-item"
                        onClick={() => handleDeviceClick(device)}
                      >
                        <span className="vehicle-index">{index + 1}</span>
                        {/* Render the specific string property, not the object */}
                        <span className="vehicle-id">{displayId}</span>
                        <BoltIcon className="vehicle-charging-icon" />
                      </li>
                    );
                  })}
                </ul>

                {/* Show More/Less Button */}
                {chargingDevices.length > 5 && (
                  <button
                    className="charging-show-more-btn"
                    onClick={() => setShowAllDevices(!showAllDevices)}
                  >
                    {showAllDevices ? (
                      <>
                        <ExpandLessIcon fontSize="small" />
                        {t('chargingAlert.show_less')}
                      </>
                    ) : (
                      <>
                        <ExpandMoreIcon fontSize="small" />
                        {t('chargingAlert.show_all_more', { count: chargingDevices.length - 5 })}
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="charging-empty">
              <BoltIcon className="empty-icon" />
              <p>{t('chargingAlert.no_vehicles_charging')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ChargingAlertDropdown.propTypes = {
  // Updated PropTypes to accept array of objects OR strings
  chargingDevices: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  ),
  message: PropTypes.string,
  onDeviceClick: PropTypes.func,
};

export default ChargingAlertDropdown;