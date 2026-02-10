import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { selectCurrentUser } from "../../store/authSlice";
import { useGetAllDevicesQuery, useGetAlertsQuery } from "../../store/apiSlice";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiMapPin,
  FiClock,
  FiTruck,
  FiShield,
  FiX,
  FiActivity,
  FiBatteryCharging,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiInfo,
  FiArrowRight,
  FiRefreshCw,
  FiCheckSquare,
} from "react-icons/fi";
import {
  TbBolt,
  TbAlertOctagon,
  TbAlertTriangle,
  TbInfoCircle,
} from "react-icons/tb"; // Updated icons
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  getAlertIcon,
  getAlertSeverity,
  getAlertCategory,
  getSeverityInfo,
  CATEGORY_CONFIG as ALERT_CATEGORY_CONFIG,
  SEVERITY_LEVELS,
} from "../../utils/alertIcons";
import { motion, AnimatePresence } from "framer-motion";
import "./Alerts.css";
import "./ChargingSection.css";
import "./ActiveAlertsList.css";
import "./AlertsResponsive.css"; // Responsive styles
import AlertsSkeleton from "./AlertsSkeleton";
import propTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";
import { useChargingContext } from "../../context/ChargingContext";
import AlertAnalyticsModal from "./AlertAnalyticsModal";

/**
 * Helper function to get vehicle display label
 * Uses VRN if valid, otherwise chassis_number, otherwise IMEI
 */
const getVehicleDisplayLabel = (vrn, chassisNumber, imei) => {
  // Check if VRN is valid (not null, 'null', 'N', 'NULL', or empty)
  if (
    vrn &&
    vrn !== "null" &&
    vrn !== "N" &&
    vrn !== "NULL" &&
    vrn.trim() !== ""
  ) {
    return vrn;
  }
  // Fallback to chassis number
  if (chassisNumber && chassisNumber.trim() !== "") {
    return chassisNumber;
  }
  // Last resort: use IMEI
  return imei || "Unknown";
};

/**
 * Format timestamp to human readable format (DD MMM YYYY, hh:mm A)
 */
const formatTimestamp = (isoString) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
};

/**
 * Translate alert type or message from API to user's language
 * Normalizes the text to a translation key format and looks it up
 * Falls back to original English text if no translation exists
 */
const getTranslatedAlert = (alertText, t) => {
  if (!alertText) return "";

  // Normalize to translation key format (lowercase, underscores, no special chars)
  const key = alertText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Try to get translation from alertTypes namespace, fallback to original
  const translated = t(`alertTypes.${key}`, alertText);
  return translated;
};

// --- API & HELPER FUNCTIONS ---

// Use environment variable for the backend URL - (Unused definition removed)

// Get the Google Maps API Key from environment variables

// --- HELPER: GROUP BY DATE ---

const AlertDetailModal = ({ alert, onClose }) => {
  const { t } = useTranslation();

  if (!alert) return null;

  const fullDetails = alert.fullDetails || {}; // Safe default

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div
        className="detail-modal-receipt"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Header */}
        <div className="receipt-header">
          <div className="receipt-logo">
            {alert.icon || <FiAlertTriangle size={32} color="#f59e0b" />}
          </div>
          <h2 className="receipt-title">
            {t("liveAlerts.alert_details", "Incident Report")}
          </h2>
          <p className="receipt-subtitle">{alert.type || "Alert Details"}</p>
          <button className="close-btn-receipt" onClick={onClose}>
            <FiX size={22} />
          </button>
        </div>

        {/* Receipt Divider */}
        <div className="receipt-divider"></div>

        {/* Vehicle & Alert Info Section */}
        <div className="receipt-section">
          <h3 className="receipt-section-title">
            <FiTruck size={16} />
            {t("liveAlerts.vehicle_info", "Vehicle Information")}
          </h3>
          <div className="receipt-row">
            <span className="receipt-label">
              <FiTruck size={14} />
              Vehicle ID
            </span>
            <span className="receipt-value">
              {alert.vehicle || alert.vehicleId || "N/A"}
            </span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">
              <FiActivity size={14} />
              Fleet Owner
            </span>
            <span className="receipt-value">{alert.fleetName || "N/A"}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">
              <FiClock size={14} />
              Event Time
            </span>
            <span className="receipt-value">
              {formatDate(alert.timestamp) || formatDate(alert.start_time)}
            </span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">
              <FiMapPin size={14} />
              City
            </span>
            <span className="receipt-value">
              {alert.city || alert.location || "N/A"}
            </span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">
              <FiShield size={14} />
              Priority
            </span>
            <span
              className={`receipt-status ${alert.priority?.toLowerCase() === "high" ? "active" : "resolved"}`}
            >
              {alert.priority?.toUpperCase() || "MEDIUM"}
            </span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Fault Diagnosis Section */}
        <div className="receipt-section">
          <h3 className="receipt-section-title">
            <FiAlertTriangle size={16} />
            {t("liveAlerts.fault_analysis", "Fault Diagnosis & Mitigation")}
          </h3>

          {/* Description Box */}
          <div className="detail-diagnosis-box">
            <div className="diagnosis-label">
              <FiInfo size={14} />
              Description / Operational Impact
            </div>
            <p className="diagnosis-content">
              {fullDetails.description ||
                t(
                  "liveAlerts.not_available",
                  "Detailed description not available for this alert type. Please contact support for more information.",
                )}
            </p>
          </div>

          {/* Cause & Remedy Grid */}
          <div className="diagnosis-grid">
            <div className="diagnosis-card">
              <div className="diagnosis-card-header">
                <span className="diagnosis-card-icon cause">⚠</span>
                <span className="diagnosis-card-title">Cause Analysis</span>
              </div>
              <p className="diagnosis-card-content">
                {fullDetails.potentialCauses ||
                  t(
                    "liveAlerts.not_available",
                    "Root cause analysis pending investigation.",
                  )}
              </p>
            </div>
            <div className="diagnosis-card">
              <div className="diagnosis-card-header">
                <span className="diagnosis-card-icon remedy">✓</span>
                <span className="diagnosis-card-title">Protocol / Remedy</span>
              </div>
              <p className="diagnosis-card-content">
                {fullDetails.remedy ||
                  t(
                    "liveAlerts.not_available",
                    "Follow standard operating procedures. Contact service center if issue persists.",
                  )}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="receipt-footer">
          <p>────────────────</p>
          <p className="receipt-footer-text">End of Incident Report</p>
          <p className="receipt-footer-text">Alert ID: #{alert.id}</p>
        </div>
      </div>
    </div>
  );
};

const KpiUnit = ({ title, count, icon, type }) => (
  <div className={`kpi-unit ${type}`}>
    <div className={`kpi-icon-box ${type}`}>{icon}</div>
    <div className="kpi-info">
      <div className="kpi-count">{count}</div>
      <div className="kpi-label">{title}</div>
    </div>
  </div>
);

// Helper to safely format time
const formatAlertTime = (timestamp) => {
  if (!timestamp) return "Just now";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp; // Return original string if valid parse fails
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

const AlertCardPremium = ({ alert, onViewDetails, isHighlighted }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      id={`alert-item-${alert.id}`}
      className={`alert-card-premium ${isHighlighted ? "highlighted" : ""} ${alert.priority.toLowerCase()}-border`}
    >
      {/* Section 1: Vehicle Identity (Primary) */}
      <div className="alert-vehicle-section">
        <h3 className="alert-vehicle-id">
          {alert.vehicle || alert.vehicleId || "N/A"}
        </h3>
        {alert.vehicleType && (
          <span className="alert-vehicle-type">{alert.vehicleType}</span>
        )}
      </div>

      {/* Section 2: Alert Details (The Issue) */}
      <div className="alert-details-section">
        <div className="alert-details-header">
          <div className={`alert-icon-wrapper ${alert.priority.toLowerCase()}`}>
            {alert.icon}
          </div>
          <h4 className={`alert-type-name ${alert.priority.toLowerCase()}`}>
            {alert.type}
          </h4>
          <span className={`priority-tag-mini ${alert.priority.toLowerCase()}`}>
            {t(`liveAlerts.${alert.priority.toLowerCase()}`, alert.priority)}
          </span>
        </div>
        {alert.message && <p className="alert-message-text">{alert.message}</p>}
      </div>

      {/* Section 3: Timing */}
      <div className="alert-timing-section">
        <span className="timing-created">
          <FiClock size={13} />
          {formatAlertTime(alert.timestamp)}
        </span>
        {alert.expiresWithin && (
          <span className="timing-expires">
            {t("liveAlerts.expires", "Expires")}: {alert.expiresWithin}
          </span>
        )}
      </div>

      {/* Section 4: Actions (Text Link Style) */}
      <div className="alert-actions-section">
        <button
          className="btn-view-details-link"
          onClick={() => onViewDetails(alert)}
        >
          {t("liveAlerts.view_details", "View Details")} →
        </button>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ error }) => {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">
        <FiShield className="empty-state-icon" />
      </div>
      <p className="empty-state-message">
        {error
          ? `${t("liveAlerts.failed_to_load", "Operational link down:")} ${error}`
          : t(
              "liveAlerts.no_active_alerts",
              "Fleet status normal. No active alerts.",
            )}
      </p>
      <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
        {t(
          "liveAlerts.monitoring_active",
          "Continuous real-time monitoring active",
        )}
      </p>
    </div>
  );
};

// --- MAIN COMPONENT ---
function Alerts() {
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // New Status Filter: All | Active | Resolved
  const [alertsSearchQuery, setAlertsSearchQuery] = useState("");
  const [chargingSearchQuery, setChargingSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [highlightedAlertId, setHighlightedAlertId] = useState(null);
  const [analyticsAlert, setAnalyticsAlert] = useState(null); // New: For analytics modal

  // State for Nested Expansion
  const [expandedVehicleIds, setExpandedVehicleIds] = useState(new Set()); // Replacement for Modal

  // Toggle vehicle group nesting
  const handleToggleGroup = (vehicleId) => {
    setExpandedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) {
        next.delete(vehicleId);
      } else {
        next.add(vehicleId);
      }
      return next;
    });
  };

  const userInfo = useSelector(selectCurrentUser);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    data: allDevices = [],
    isLoading: isDevicesLoading,
    refetch: refetchDevices,
  } = useGetAllDevicesQuery();
  useEffect(() => {
    refetchDevices();
  }, [refetchDevices]);
  const deviceLookup = useMemo(() => {
    const lookup = {};
    allDevices.forEach((device) => {
      const imei = device.device_id || device.imei;
      if (imei) {
        lookup[imei] = {
          vrn: device.VRN,
          chassisNumber: device.chassis_number,
          fleet: device.fleet || device.fleet_owner || "N/A",
          fleetOwner: device.fleet_owner || "N/A",
          city: device.city || "N/A",
          deviceTypeName: device.device_type_name || "N/A",
          platform: device.platform || "Vehicle",
          isConnected: device.is_connected,
        };
      }
    });
    return lookup;
  }, [allDevices]);

  // Use Context instead of hooking directly (avoids duplicate API calls)
  const { alertData } = useChargingContext();

  const { t } = useTranslation();

  // --- ALERTS QUERY using RTK Query ---
  // Auto-refresh pauses when viewing historical data
  const {
    data: fetchedAlerts = [],
    isLoading: loading,
    error: apiError,
  } = useGetAlertsQuery(
    { username: userInfo?.username },
    {
      skip: !userInfo?.username,
      pollingInterval: 60000, // Auto-refresh every 60 seconds
    },
  );

  // Normalize error to string if necessary
  const error = apiError
    ? apiError.data?.detail || apiError.message || "Failed to load alerts"
    : null;

  // Derive Alerts Data with Device Enrichment
  const alerts = useMemo(() => {
    const sourceData = fetchedAlerts;
    if (!sourceData) return [];

    const enriched = sourceData.map((alert) => {
      // Get device info using IMEI as the key
      const imei = alert.imei || alert.vehicleId;
      const deviceInfo = deviceLookup[imei] || {};

      // Determine display name: VRN > Chassis Number > IMEI
      let displayVehicle = "N/A";
      if (
        deviceInfo.vrn &&
        deviceInfo.vrn !== "null" &&
        deviceInfo.vrn !== "N" &&
        deviceInfo.vrn !== "NULL"
      ) {
        displayVehicle = deviceInfo.vrn;
      } else if (
        deviceInfo.chassisNumber &&
        deviceInfo.chassisNumber.trim() !== ""
      ) {
        displayVehicle = deviceInfo.chassisNumber;
      } else if (imei) {
        displayVehicle = imei;
      }

      // Format duration for display
      const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return null;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
      };

      return {
        ...alert,
        icon: getAlertIcon(alert.type),
        // Enriched fields from devices endpoint
        vehicle: displayVehicle,
        vehicleId: imei,
        fleetName: deviceInfo.fleet || "N/A",
        city: deviceInfo.city || "N/A",
        deviceType:
          deviceInfo.deviceTypeName || alert.device_type_name || "N/A",
        // Formatted duration
        duration: formatDuration(alert.duration_seconds),
        isActive: alert.isActive,
        // Keep original fields
        status: alert.isActive
          ? t("liveAlerts.active", "Active")
          : t("liveAlerts.resolved", "Resolved"),
      };
    });

    return enriched;
  }, [fetchedAlerts, deviceLookup, t]);

  useEffect(() => {
    const alertIdFromUrl = searchParams.get("alert_id");
    const shouldOpenModal = searchParams.get("open_modal") === "true";

    if (alertIdFromUrl && alerts.length > 0) {
      const alertToHighlight = alerts.find(
        (alert) => alert.id.toString() === alertIdFromUrl,
      );

      if (alertToHighlight) {
        // Auto-expand the vehicle group if alert is nested
        const vehicleId =
          alertToHighlight.vehicle || alertToHighlight.vehicleId;
        if (vehicleId) {
          setExpandedVehicleIds((prev) => {
            const next = new Set(prev);
            next.add(vehicleId);
            return next;
          });
        }

        setHighlightedAlertId(alertToHighlight.id);

        // Delay scroll slightly to allow group expansion animation
        setTimeout(() => {
          const element = document.getElementById(
            `alert-item-${alertToHighlight.id}`,
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);

        // If open_modal flag is set, auto-open the analytics modal
        if (
          shouldOpenModal &&
          alertToHighlight.req_data &&
          alertToHighlight.req_data.length > 0
        ) {
          setAnalyticsAlert(alertToHighlight);
        }

        navigate("/alerts-notification", { replace: true });
      }
    }
  }, [alerts, searchParams, navigate]);

  // Apply all filters: Priority, Status, Search, and Date Range
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Use severity-based filtering with the new 4-tier system
      const alertSeverity = getAlertSeverity(alert.type, alert.priority);
      const matchesFilter = filter === "All" || alertSeverity === filter;

      // Enhanced search: VRN, Chassis, Device Type (9M, 12M, 3S, etc.), Alert Type, Fleet, City
      const searchLower = alertsSearchQuery.toLowerCase();
      const matchesSearch =
        !alertsSearchQuery ||
        alert.type?.toLowerCase().includes(searchLower) ||
        alert.vehicle?.toLowerCase().includes(searchLower) ||
        alert.vehicleId?.toLowerCase().includes(searchLower) ||
        alert.fleetName?.toLowerCase().includes(searchLower) ||
        alert.city?.toLowerCase().includes(searchLower) ||
        alert.deviceType?.toLowerCase().includes(searchLower); // 9M, 12M, 3S, 6S, 55T, etc.

      // Status Filter Logic (Active vs Resolved)
      if (statusFilter === "Active" && !alert.isActive) return false;
      if (statusFilter === "Resolved" && alert.isActive) return false;

      return matchesFilter && matchesSearch;
    });
  }, [alerts, filter, statusFilter, alertsSearchQuery]);

  // Group alerts by vehicle for edge case handling (multiple alerts from same vehicle)
  const groupedByVehicle = useMemo(() => {
    const groups = {};
    filteredAlerts.forEach((alert) => {
      const key = alert.vehicle || alert.vehicleId || "Unknown";
      if (!groups[key]) {
        groups[key] = {
          vehicle: key,
          deviceType: alert.deviceType || "N/A",
          fleetName: alert.fleetName,
          city: alert.city,
          alerts: [],
          highestPriority: "low",
          latestTimestamp: alert.timestamp,
        };
      }
      groups[key].alerts.push(alert);
      // Track highest priority for color coding
      const alertPriority = getAlertSeverity(alert.type, alert.priority);
      if (alertPriority === "critical" || alertPriority === "high") {
        groups[key].highestPriority = "high";
      } else if (
        alertPriority === "medium" &&
        groups[key].highestPriority !== "high"
      ) {
        groups[key].highestPriority = "medium";
      }
      // Track latest timestamp
      if (new Date(alert.timestamp) > new Date(groups[key].latestTimestamp)) {
        groups[key].latestTimestamp = alert.timestamp;
      }
    });
    // Return as array sorted by latest timestamp (most recent first)
    return Object.values(groups).sort(
      (a, b) => new Date(b.latestTimestamp) - new Date(a.latestTimestamp),
    );
  }, [filteredAlerts]);

  const kpiData = useMemo(() => {
    return {
      active: alerts.length,
      high: alerts.filter((a) => a.priority.toUpperCase() === "HIGH").length,
      medium: alerts.filter((a) => a.priority.toUpperCase() === "MEDIUM")
        .length,
      resolved: 0,
    };
  }, [alerts]);

  const handleCloseModal = () => setSelectedAlert(null);
  const handleViewAnalytics = (alert) => {
    setAnalyticsAlert(alert);
  }; // New: Analytics handler

  // Wait for both Alerts AND Devices to load before rendering
  if (loading || isDevicesLoading) return <AlertsSkeleton />;

  return (
    <div className="alerts-page">
      <AlertDetailModal alert={selectedAlert} onClose={handleCloseModal} />
      <AlertAnalyticsModal
        alert={analyticsAlert}
        onClose={() => setAnalyticsAlert(null)}
      />

      {/* 1. SIDEBAR FILTERS */}
      <aside className="alerts-sidebar">
        <div className="sidebar-group">
          <div className="sidebar-title">
            <FiFilter /> {t("liveAlerts.filter_by_priority", "Priority")}
          </div>
          <div className="filter-pills">
            {["All", "Critical", "High", "Medium", "Low"].map((p) => {
              const filterKey = p === "All" ? "All" : p.toLowerCase();
              const count =
                p === "All"
                  ? alerts.length
                  : alerts.filter((a) => {
                      const severity = getAlertSeverity(a.type, a.priority);
                      return severity === filterKey;
                    }).length;

              return (
                <button
                  key={p}
                  className={`filter-pill ${p.toLowerCase()} ${filter === filterKey ? "active" : ""}`}
                  onClick={() => setFilter(filterKey)}
                >
                  <span>{t(`liveAlerts.${p.toLowerCase()}`, p)}</span>
                  <span className="filter-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-title">
            <FiCalendar /> {t("liveAlerts.quick_links", "Operational Links")}
          </div>
          <div className="filter-pills">
            <button className="filter-pill" onClick={() => navigate("/home")}>
              {t("common.dashboard", "Dashboard")}
            </button>
            <button
              className="filter-pill"
              onClick={() => navigate("/device-summary")}
            >
              {t("common.vehicle_status", "Vehicle Status")}
            </button>
            <button
              className="filter-pill"
              onClick={() => navigate("/settings")}
            >
              {t("common.user_settings", "User Settings")}
            </button>
            <button className="filter-pill" onClick={() => navigate("/trails")}>
              {t("common.daily_trails", "Daily Trails")}
            </button>
            <button
              className="filter-pill"
              onClick={() => navigate("/reports")}
            >
              {t("common.reports", "Reports")}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. PAGE HEADER (Now Direct Sibling for Grid placement) */}
      <header className="alerts-top-bar">
        <div className="alerts-title-area">
          <h1 className="alerts-title">
            {t("liveAlerts.live_Alerts", "Live Alerts")}
          </h1>
          <span className="alerts-subtitle">
            {kpiData.active}{" "}
            {t(
              "liveAlerts.alerts_monitored",
              "active incidents monitored in real-time",
            )}
          </span>
        </div>

        <div className="alerts-actions">
          <div className="theme-btn theme-btn-contained">
            <FiActivity size={16} />{" "}
            {t("liveAlerts.live_status", "Live Status")}
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT FEED (KPIs + Tables) */}
      <div className="alerts-feed">
        {/* KPI Strip */}

        {/* Charging Fleet Table (Scrollable) */}
        {alertData?.chargingDevices?.length > 0 && (
          <section className="charging-dashboard">
            {/* Clean Alert Banner (Time-Sensitive Only) */}
            {alertData.severity && (
              <div
                className={`charging-alert-clean alert-${alertData.severity}`}
              >
                <div className="alert-content">
                  {alertData.severity === "error" ? (
                    <>
                      <FiAlertTriangle size={20} className="alert-icon" />
                      <div>
                        <span
                          className="alert-main"
                          style={{ display: "block", marginBottom: "2px" }}
                        >
                          {t("liveAlerts.high_cost_alert", "High Cost Alert")}
                        </span>
                        <span
                          className="alert-detail"
                          style={{ lineHeight: "1.4" }}
                        >
                          {alertData.message ||
                            t(
                              "liveAlerts.high_rates_active",
                              "High rates active.",
                            )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={20} className="alert-icon" />
                      <div>
                        <span
                          className="alert-main"
                          style={{ display: "block", marginBottom: "2px" }}
                        >
                          {t(
                            "liveAlerts.good_time_to_charge",
                            "Good Time to Charge",
                          )}
                        </span>
                        <span
                          className="alert-detail"
                          style={{ lineHeight: "1.4" }}
                        >
                          {alertData.message ||
                            t(
                              "liveAlerts.low_rates_active",
                              "Low rates active.",
                            )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="charging-header-section">
              <div className="header-left">
                <FiBatteryCharging
                  size={18}
                  style={{ color: "var(--al-text-sub)" }}
                />
                <h3 className="alerts-list-title">
                  {t(
                    "liveAlerts.charging_fleet_status",
                    "Charging Fleet Status",
                  )}{" "}
                  (
                  {
                    alertData.chargingDevices.filter((device) => {
                      const imei = device.imei || device.id;
                      const deviceInfo = deviceLookup[imei] || {};
                      const displayName = getVehicleDisplayLabel(
                        deviceInfo.vrn,
                        deviceInfo.chassisNumber,
                        imei,
                      );
                      return (
                        displayName
                          .toLowerCase()
                          .includes(chargingSearchQuery.toLowerCase()) ||
                        (deviceInfo.fleet || "")
                          .toLowerCase()
                          .includes(chargingSearchQuery.toLowerCase()) ||
                        (deviceInfo.city || "")
                          .toLowerCase()
                          .includes(chargingSearchQuery.toLowerCase())
                      );
                    }).length
                  }
                  )
                </h3>
              </div>
              <div className="charging-search-wrapper">
                <FiSearch className="search-icon" size={14} />
                <input
                  type="text"
                  placeholder={t(
                    "liveAlerts.search_vehicle_fleet",
                    "Search vehicle, fleet, city...",
                  )}
                  className="charging-search-input"
                  value={chargingSearchQuery}
                  onChange={(e) => setChargingSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="charging-table-wrapper">
              <table className="charging-table">
                <thead>
                  <tr>
                    <th>{t("liveAlerts.vehicle_id", "Vehicle ID")}</th>
                    <th>{t("liveAlerts.fleet", "Fleet")}</th>
                    <th>{t("liveAlerts.type", "Type")}</th>
                    <th>{t("liveAlerts.city", "City")}</th>
                    <th>{t("liveAlerts.cost_impact", "Cost Impact")}</th>
                    <th>{t("vehicle.soc", "SOC")}</th>
                  </tr>
                </thead>
                <tbody>
                  {alertData.chargingDevices
                    .filter((device) => {
                      const imei = device.imei || device.id;
                      const deviceInfo = deviceLookup[imei] || {};
                      const displayName = getVehicleDisplayLabel(
                        deviceInfo.vrn,
                        deviceInfo.chassisNumber,
                        imei,
                      );
                      const searchLower = chargingSearchQuery.toLowerCase();
                      return (
                        displayName.toLowerCase().includes(searchLower) ||
                        (deviceInfo.fleet || "")
                          .toLowerCase()
                          .includes(searchLower) ||
                        (deviceInfo.city || "")
                          .toLowerCase()
                          .includes(searchLower)
                      );
                    })
                    .map((device, idx) => {
                      const imei = device.imei || device.id;
                      const deviceInfo = deviceLookup[imei] || {};
                      const socValue =
                        typeof device.soc === "number"
                          ? device.soc
                          : parseFloat(device.soc) || 0;
                      const displayName = getVehicleDisplayLabel(
                        deviceInfo.vrn,
                        deviceInfo.chassisNumber,
                        imei,
                      );

                      return (
                        <tr key={idx}>
                          <td className="vehicle-id-cell">
                            <span className="vehicle-badge">{displayName}</span>
                          </td>
                          <td>{deviceInfo.fleet || "N/A"}</td>
                          <td>{deviceInfo.deviceTypeName || "N/A"}</td>
                          <td className="city-cell">
                            <FiMapPin
                              size={12}
                              style={{ marginRight: "4px" }}
                            />
                            {deviceInfo.city || "N/A"}
                          </td>
                          <td className="cost-cell">
                            <span
                              className={`cost-badge ${device.status?.type === "surcharge" ? "cost-high" : "cost-low"}`}
                            >
                              {device.status?.label || "₹0.60/unit"}
                            </span>
                          </td>
                          <td className="soc-cell">
                            <div className="soc-container">
                              <span className="soc-text">
                                {socValue.toFixed(0)}%
                              </span>
                              <div className="soc-progress-bar">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${socValue}%` }}
                                  className="soc-progress-fill"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Active Alerts List */}
        <section className="alerts-list-section">
          <div className="alerts-list-header">
            <div className="header-left">
              <FiAlertTriangle
                size={18}
                style={{ color: "var(--al-text-sub)" }}
              />
              <h3 className="alerts-list-title">
                {t("liveAlerts.active_alerts_list", "Active Alerts List")}
              </h3>
            </div>
            <div className="header-right">
              {/* Status Filter */}
              <select
                className="alerts-filter-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ marginRight: "8px", minWidth: "120px" }}
              >
                <option value="All">
                  {t("liveAlerts.all_status", "All Status")}
                </option>
                <option value="Active">
                  {t("liveAlerts.active_only", "Active Only")}
                </option>
                <option value="Resolved">
                  {t("liveAlerts.resolved_history", "Resolved History")}
                </option>
              </select>

              <select
                className="alerts-filter-dropdown"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">
                  {t("liveAlerts.all_priorities", "All Priorities")}
                </option>
                <option value="critical">
                  {t("liveAlerts.critical_priority", "Critical Priority")}
                </option>
                <option value="high">
                  {t("liveAlerts.high_priority", "High Priority")}
                </option>
                <option value="medium">
                  {t("liveAlerts.medium_priority", "Medium Priority")}
                </option>
                <option value="low">
                  {t("liveAlerts.low_priority", "Low Priority")}
                </option>
              </select>
              <div className="search-wrapper-mini">
                <FiSearch className="search-icon" size={14} />
                <input
                  type="text"
                  placeholder={t(
                    "buttons.search",
                    "Search VRN, Type (9M, 12M), Fleet...",
                  )}
                  className="search-input-mini"
                  value={alertsSearchQuery}
                  onChange={(e) => setAlertsSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="alerts-list-container">
            <AnimatePresence>
              {groupedByVehicle.length > 0 ? (
                groupedByVehicle.map((group) => {
                  // SINGLE ALERT CASE: Render standard row
                  if (group.alerts.length === 1) {
                    const alert = group.alerts[0];
                    const severity = getAlertSeverity(
                      alert.type,
                      alert.priority,
                    );
                    const severityInfo = getSeverityInfo(severity);
                    const category = getAlertCategory(alert.type);
                    const categoryConfig = ALERT_CATEGORY_CONFIG[category];

                    return (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        id={`alert-item-${alert.id}`}
                        className={`alert-list-item severity-${severity} ${alert.id === highlightedAlertId ? "highlighted" : ""}`}
                      >
                        <div className="alert-list-icon">
                          <div
                            className={`icon-wrapper severity-icon-${severity}`}
                          >
                            {alert.icon}
                          </div>
                        </div>

                        <div className="alert-list-content">
                          <div className="alert-list-header">
                            <div className="alert-list-title">
                              {getTranslatedAlert(alert.type, t)}
                            </div>
                            <span
                              className={`severity-badge severity-${severity}`}
                            >
                              {t(
                                `liveAlerts.${severity}`,
                                severityInfo.label,
                              ).toUpperCase()}
                            </span>
                          </div>

                          <div className="alert-list-subheader">
                            <span className="category-tag">
                              {categoryConfig?.label || "Alert"}
                            </span>
                            {alert.deviceType && alert.deviceType !== "N/A" && (
                              <span className="device-type-badge">
                                {alert.deviceType}
                              </span>
                            )}
                            <span className="response-indicator">
                              ⏱ {severityInfo.responseTime}
                            </span>
                          </div>

                          {alert.message && alert.message !== alert.type && (
                            <div className="alert-list-message">
                              {getTranslatedAlert(alert.message, t)}
                            </div>
                          )}

                          <div className="alert-list-meta">
                            <span className="meta-item">
                              <span className="vehicle-badge-mini">
                                {alert.vehicle}
                              </span>
                            </span>
                            {alert.city && alert.city !== "N/A" && (
                              <span className="meta-item">
                                <FiMapPin size={12} />
                                {alert.city}
                              </span>
                            )}
                            {alert.fleetName && alert.fleetName !== "N/A" && (
                              <span className="meta-item fleet-meta">
                                {alert.fleetName}
                              </span>
                            )}
                            <span className="meta-item">
                              <FiClock size={12} />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            {alert.duration && (
                              <span
                                className={`meta-item duration-badge ${alert.isActive ? "active" : ""}`}
                              >
                                <FiActivity size={12} />
                                {alert.duration}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="alert-list-actions">
                          {/* Ack button removed */}

                          {alert.req_data && alert.req_data.length > 0 && (
                            <button
                              className="btn-analyze-mini btn-analytics"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAnalytics(alert);
                              }}
                              title={t(
                                "liveAlerts.view_details",
                                "View Details",
                              )}
                            >
                              {t("liveAlerts.view_details", "Details")}
                              <FiArrowRight className="btn-icon-right" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  } else {
                    // MULTI-ALERT GROUP CASE: Nested Accordion
                    // Calculate quick stats for this group
                    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
                    group.alerts.forEach((a) => {
                      const sev = getAlertSeverity(a.type, a.priority);
                      if (counts[sev] !== undefined) counts[sev]++;
                    });

                    const severity = group.highestPriority || "medium";
                    const isExpanded = expandedVehicleIds.has(group.vehicle);

                    return (
                      <React.Fragment key={`group-container-${group.vehicle}`}>
                        {/* Parent Group Card (Click to Toggle) */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`alert-list-item group-card-industrial severity-${severity} ${isExpanded ? "expanded" : ""}`}
                          onClick={() => handleToggleGroup(group.vehicle)}
                        >
                          {/* 1. Icon Column */}
                          <div className="alert-list-icon">
                            <div
                              className={`icon-wrapper severity-icon-${severity}`}
                            >
                              <TbAlertOctagon size={24} />
                            </div>
                          </div>

                          {/* 2. Content Column */}
                          <div className="alert-list-content">
                            {/* Row 1: Vehicle Identity & Total Count */}
                            <div className="alert-list-header">
                              <div className="alert-list-title">
                                {group.vehicle}
                                {(group.alerts[0]?.fleetName ||
                                  group.alerts[0]?.city) && (
                                  <span
                                    className="vehicle-meta-info"
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "0.75rem",
                                      color: "#94a3b8",
                                      fontWeight: "400",
                                    }}
                                  >
                                    {[
                                      group.alerts[0]?.fleetName,
                                      group.alerts[0]?.city,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </span>
                                )}
                              </div>
                              <span className="group-total-badge">
                                {group.alerts.length} Active Incidents
                              </span>
                            </div>

                            {/* Row 2: Severity Breakdown Data Strip */}
                            <div className="group-severity-breakdown">
                              {counts.critical > 0 && (
                                <span className="breakdown-badge severity-critical">
                                  <span className="dot">●</span>{" "}
                                  {counts.critical} Critical
                                </span>
                              )}
                              {counts.high > 0 && (
                                <span className="breakdown-badge severity-high">
                                  <span className="dot">●</span> {counts.high}{" "}
                                  High
                                </span>
                              )}
                              {counts.medium > 0 && (
                                <span className="breakdown-badge severity-medium">
                                  <span className="dot">●</span> {counts.medium}{" "}
                                  Medium
                                </span>
                              )}
                              {counts.low > 0 && (
                                <span className="breakdown-badge severity-low">
                                  <span className="dot">●</span> {counts.low}{" "}
                                  Low
                                </span>
                              )}
                              <span
                                className="meta-separator"
                                style={{ margin: "0 8px", color: "#cbd5e1" }}
                              >
                                |
                              </span>
                              <span className="group-meta-item">
                                <FiClock size={12} />{" "}
                                {isExpanded ? "Hide Details" : "Show Details"}
                              </span>
                            </div>
                          </div>

                          {/* 3. Action Column (Chevron) */}
                          <div className="alert-list-actions">
                            <button className="btn-expand-group">
                              {isExpanded ? (
                                <FiChevronUp size={20} />
                              ) : (
                                <FiChevronDown size={20} />
                              )}
                            </button>
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="nested-alerts-container">
                                {group.alerts.map((nestedAlert) => {
                                  const nSev = getAlertSeverity(
                                    nestedAlert.type,
                                    nestedAlert.priority,
                                  );
                                  const nSevInfo = getSeverityInfo(nSev);

                                  return (
                                    <div
                                      key={nestedAlert.id}
                                      id={`alert-item-${nestedAlert.id}`}
                                      className={`nested-alert-item severity-${nSev}-border ${nestedAlert.id === highlightedAlertId ? "highlighted" : ""}`}
                                    >
                                      <div className="nested-item-content">
                                        <div className="nested-item-header">
                                          <span className="nested-alert-title">
                                            {getTranslatedAlert(
                                              nestedAlert.type,
                                              t,
                                            )}
                                          </span>
                                          <span
                                            className={`severity-badge-mini severity-${nSev}`}
                                          >
                                            {nSev.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="nested-item-meta">
                                          <span>⏱ {nSevInfo.responseTime}</span>
                                          <span>
                                            •{" "}
                                            {formatTimestamp(
                                              nestedAlert.timestamp,
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="nested-item-actions">
                                        {/* Ack button removed */}
                                        {nestedAlert.req_data &&
                                          nestedAlert.req_data.length > 0 && (
                                            <button
                                              className="btn-analyze-mini"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewAnalytics(
                                                  nestedAlert,
                                                );
                                              }}
                                              title="View Details"
                                            >
                                              <FiArrowRight />
                                            </button>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  }
                })
              ) : (
                <EmptyState error={error} />
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}

Alerts.propTypes = {
  alerts: propTypes.arrayOf(
    propTypes.shape({
      id: propTypes.number.isRequired,
      priority: propTypes.string.isRequired,
      type: propTypes.string.isRequired,
      icon: propTypes.node.isRequired,
      message: propTypes.string.isRequired,
      timestamp: propTypes.string.isRequired,
      location: propTypes.string.isRequired,
      vehicle: propTypes.string.isRequired,
      fleetName: propTypes.string.isRequired,
      status: propTypes.string.isRequired,
      fullDetails: propTypes.shape({
        description: propTypes.string,
        remedy: propTypes.string,
        potentialCauses: propTypes.string,
        remark: propTypes.string,
      }),
    }),
  ).isRequired,
  onViewDetails: propTypes.func.isRequired,
  isHighlighted: propTypes.bool,
};
AlertDetailModal.propTypes = {
  alert: propTypes.shape({
    id: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
    type: propTypes.string.isRequired,
    fleetName: propTypes.string.isRequired,
    vehicle: propTypes.string.isRequired,
    timestamp: propTypes.string.isRequired,
    location: propTypes.string.isRequired,
    fullDetails: propTypes.shape({
      description: propTypes.string,
      remedy: propTypes.string,
      potentialCauses: propTypes.string,
      remark: propTypes.string,
    }),
  }).isRequired,
  onClose: propTypes.func.isRequired,
};

KpiUnit.propTypes = {
  title: propTypes.string.isRequired,
  count: propTypes.number.isRequired,
  icon: propTypes.node.isRequired,
  type: propTypes.string.isRequired,
};

AlertCardPremium.propTypes = {
  alert: propTypes.shape({
    id: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
    priority: propTypes.string.isRequired,
    type: propTypes.string.isRequired,
    icon: propTypes.node.isRequired,
    message: propTypes.string.isRequired,
    timestamp: propTypes.string.isRequired,
    location: propTypes.string.isRequired,
    vehicle: propTypes.string.isRequired,
    fleetName: propTypes.string.isRequired,
    status: propTypes.string.isRequired,
    fullDetails: propTypes.shape({
      description: propTypes.string,
      remedy: propTypes.string,
      potentialCauses: propTypes.string,
      remark: propTypes.string,
    }),
  }).isRequired,
  onViewDetails: propTypes.func.isRequired,
  isHighlighted: propTypes.bool,
};

EmptyState.propTypes = {
  error: propTypes.string,
};

export default Alerts;
