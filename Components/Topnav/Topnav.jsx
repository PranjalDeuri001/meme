import React, { useState, useEffect, useMemo } from "react";
import "./Topnav.css";
import { Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import LogoLight from "../../Assets/LOGO'S/EkaConnectLogo.png";
import LogoDark from "../../Assets/LOGO'S/EkaConnectLogo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

// Icons
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

// Hooks & Components
import NotificationDropdown from "./NotificationDropdown";
import { useChargingContext } from "../../context/ChargingContext";
import { useGetAllDevicesQuery, useGetAlertsQuery } from "../../store/apiSlice";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";

const backendUrl = import.meta.env.VITE_API_URL_3;

const languages = [
  { code: "ja", label: "Japanese" },
  { code: "nl", label: "Dutch" },
  { code: "mr", label: "Marathi" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "as", label: "Assamese" },
  { code: "bn", label: "Bengali" },
  { code: "or", label: "Oriya" },
  { code: "pa", label: "Punjabi" },
  { code: "kn", label: "Kannada" },
  { code: "gu", label: "Gujarati" },
  { code: "en", label: "English" },
];

function Topnav({ onLogout, userInfo, onToggle }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Get current user for RTK Query
  const currentUser = useSelector(selectCurrentUser);

  // --- ALERTS DATA FROM RTK QUERY (Same as Live Alerts page) ---
  const {
    data: fetchedAlerts = [],
    isLoading: alertsLoading,
  } = useGetAlertsQuery(
    { username: currentUser?.username || userInfo?.username },
    { skip: !currentUser?.username && !userInfo?.username, pollingInterval: 60000 }
  );

  // Fetch all devices for IMEI -> VRN lookup
  const { data: allDevices = [] } = useGetAllDevicesQuery();

  // Theme & Time State
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  );

  // --- CHARGING ALERT INTEGRATION ---
  const {
    alertData: chargingAlertData,
    toasts,
    dismissToast,
    ignoreToast, // <--- MUST BE DESTRUCTURED HERE to avoid "not a function" error
  } = useChargingContext();

  // --- Enrich alerts with device data ---
  const notifications = useMemo(() => {
    if (!fetchedAlerts || fetchedAlerts.length === 0) return [];

    // Create device lookup
    const deviceLookup = {};
    allDevices.forEach(device => {
      const imei = device.device_id || device.imei;
      if (imei) {
        deviceLookup[imei] = {
          vrn: device.VRN,
          chassisNumber: device.chassis_number,
          fleet: device.fleet || device.fleet_owner || 'N/A',
          city: device.city || 'N/A',
        };
      }
    });

    // Include ALL alerts (both active and resolved) to provide better user insights
    // Active alerts will show as unread (blue styling), resolved alerts as read (normal styling)
    return fetchedAlerts.map(alert => {
      const deviceInfo = deviceLookup[alert.imei] || {};

      // Get display name: VRN > Chassis > IMEI
      let displayVehicle = alert.imei || 'N/A';
      if (deviceInfo.vrn && deviceInfo.vrn !== 'null' && deviceInfo.vrn !== 'N') {
        displayVehicle = deviceInfo.vrn;
      } else if (deviceInfo.chassisNumber && deviceInfo.chassisNumber.trim() !== '') {
        displayVehicle = deviceInfo.chassisNumber;
      }

      return {
        ...alert,
        is_seen: !alert.isActive, // Active alerts = unread (false), Resolved alerts = read (true)
        created_at: alert.timestamp || alert.start_time,
        device: {
          vrn: displayVehicle,
          fleet: deviceInfo.fleet,
          city: deviceInfo.city,
        },
        vehicleId: displayVehicle,
      };
    });
  }, [fetchedAlerts, allDevices]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_seen).length;
  }, [notifications]);

  // Loading state
  const loading = alertsLoading;

  // Time update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    );
  }, [i18n.language]);

  // Handlers
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleSettingsClick = () => navigate("/settings");

  const handleChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    window.location.reload();
  };

  return (
    <div className="topnav">
      {/* --- TOAST STACK CONTAINER --- */}
      <div className="charging-toast-container">
        {toasts.map((toast) => {
          // Determine Theme Class
          const isSuccess = toast.severity === "success";
          const themeClass = isSuccess ? "success" : "error";

          return (
            <div
              key={toast.id}
              className={`charging-toast-alert ${themeClass}`}
            >
              {/* --- HEADER --- */}
              <div className={`toast-header-custom ${themeClass}`}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {isSuccess ? <CheckCircleIcon /> : <WarningIcon />}
                  <strong style={{ fontSize: "14px" }}>
                    {isSuccess ? t("chargingToast.rebate_active", "Rebate Active 🌿") : t("chargingToast.high_cost_alert", "High Cost Alert ⚠️")}
                  </strong>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="toast-close-btn"
                  aria-label="Close"
                >
                  <CloseIcon style={{ fontSize: "18px" }} />
                </button>
              </div>

              {/* --- BODY --- */}
              <div className="toast-body-custom">
                <p>
                  <strong className={`toast-body-strong ${themeClass}`}>
                    {isSuccess ? t("chargingToast.you_are_saving", "You are Saving Money!") : t("chargingToast.avoid_high_charges", "Avoid High Charges")}
                  </strong>
                  <br />
                  <span className="toast-message">
                    {toast.message}
                  </span>
                </p>

                {toast.chargingDevices?.length > 0 && (
                  <div className={`toast-device-count ${themeClass}`}>
                    {t("chargingToast.affected_vehicles", "Affected Vehicles")}: {toast.chargingDevices.length}
                  </div>
                )}

                {/* --- BUTTONS ROW --- */}
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "2px" }}
                >
                  {/* View Details Button */}
                  <button
                    className={`toast-action-btn ${themeClass}`}
                    style={{ flex: 1 }}
                    onClick={() => {
                      dismissToast(toast.id);
                      navigate("/alerts-notification?focus=charging");
                    }}
                  >
                    {t("chargingToast.view_details", "View Details")}
                  </button>

                  {/* Ignore Button */}
                  <button
                    className={`toast-ignore-btn ${themeClass}`}
                    style={{ flex: 1 }}
                    onClick={() => ignoreToast(4)} // <--- Calls the new function (4 hours snooze)
                    title="Ignore notifications for 4 hours"
                  >
                    {t("chargingToast.ignore_4h", "Ignore (4h)")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- LEFT SIDE --- */}
      <div className="topnav-left">
        <button
          className="topnav-toggle-btn"
          onClick={onToggle}
          aria-label={t("ariaLabels.toggleSidebar")}
        >
          <i className="bi bi-list"></i>
        </button>
        <Link to="/">
          <img
            src={theme === "light" ? LogoLight : LogoDark}
            alt="EKA Connect Logo"
            className="topnav-logo"
          />
        </Link>
      </div>

      {/* --- RIGHT SIDE --- */}
      <div className="topnav-right">
        <div className="topnav-info">
          <div className="topnav-date">{currentDate}</div>
          <div className="topnav-time">{time}</div>
        </div>

        <div className="topnav-theme-toggle">
          <input
            type="checkbox"
            id="theme-checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
            aria-label={t("ariaLabels.toggleTheme")}
          />
          <label htmlFor="theme-checkbox" className="toggle-label">
            <i className="bi bi-sun-fill"></i>
            <i className="bi bi-moon-fill"></i>
            <span className="toggle-ball"></span>
          </label>
        </div>

        {/* Enhanced Notification Dropdown */}
        <NotificationDropdown
          notifications={notifications}
          chargingData={chargingAlertData}
          loading={loading}
        />

        <div className="topnav-user">
          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="user-dropdown-toggle">
              <div className="user-avatar">
                {userInfo && userInfo.avatar ? (
                  <img src={userInfo.avatar} alt={t("ariaLabels.userAvatar")} />
                ) : (
                  <AccountCircleIcon className="user-icon-placeholder" />
                )}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item disabled className="user-info-header">
                <div className="user-profile-img">
                  {userInfo && userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={t("ariaLabels.userProfile")}
                    />
                  ) : (
                    <AccountCircleIcon className="user-icon-placeholder" />
                  )}
                </div>
                <div className="user-details">
                  <strong>{userInfo.name}</strong>
                  <small>{userInfo.email}</small>
                </div>
              </Dropdown.Item>

              <Dropdown.Item
                as={Link}
                to="/settings/security"
                className="user-menu-item"
              >
                <i className="bi bi-key-fill"></i>{" "}
                {t("userManagement.changePassword")}
              </Dropdown.Item>

              <Dropdown.Item
                onClick={handleSettingsClick}
                className="user-menu-item"
              >
                <i className="bi bi-gear-fill"></i>{" "}
                {t("userManagement.settings")}
              </Dropdown.Item>

              <Dropdown.Item
                as={Link}
                to="/help-center"
                className="user-menu-item"
              >
                <i className="bi bi-question-circle-fill"></i>{" "}
                {t("userManagement.helpCenter")}
              </Dropdown.Item>

              <Dropdown.Item onClick={onLogout} className="user-menu-item">
                <i className="bi bi-box-arrow-right"></i> {t("buttons.logout")}
              </Dropdown.Item>

              <Dropdown.Divider className="mobile-only-divider" />

              <Dropdown.Item className="mobile-only-item" onClick={toggleTheme}>
                <i
                  className={`bi ${theme === "light" ? "bi-moon-fill" : "bi-sun-fill"
                    }`}
                ></i>
                {t("systemUtility.toggleTheme")}
              </Dropdown.Item>

              <div className="p-2 user-menu-item">
                <i className="bi bi-globe"></i>
                <select
                  value={i18n.language}
                  onChange={handleChange}
                  className="language-select"
                  aria-label={t("ariaLabels.languageSelector")}
                >
                  {languages.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

Topnav.propTypes = {
  onLogout: PropTypes.func.isRequired,
  userInfo: PropTypes.shape({
    username: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default Topnav;
