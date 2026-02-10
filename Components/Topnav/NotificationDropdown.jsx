import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./NotificationDropdownStyles.css";

// Tabler Icons
import {
  TbBell,
  TbCircle,
  TbAlertCircle,
  TbFilter,
  TbChevronDown,
  TbClock,
  TbBatteryCharging,
  TbPlugConnected,
  TbChevronRight,
  TbArrowRight
} from "react-icons/tb";
import {
  getAlertIcon,
  getAlertSeverity,
  getAlertCategory,
  getSeverityInfo,
  CATEGORY_CONFIG as ALERT_CATEGORY_CONFIG
} from "../../utils/alertIcons";

// --- TRANSLATION HELPER ---
const getTranslatedAlert = (alertText, t) => {
  if (!alertText) return '';
  // Normalize to translation key format
  const key = alertText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return t(`alertTypes.${key}`, alertText);
};

// --- 1. SIMPLIFIED CATEGORIES ---
const CATEGORIES = {
  ALL: "all",
  ALERTS: "alerts", // Renamed 'FAULTS' to 'ALERTS'
  CHARGING: "charging",
};

// --- 2. UPDATED CONFIG ---
const CATEGORY_CONFIG = {
  [CATEGORIES.ALL]: { label: "all", icon: null },
  [CATEGORIES.ALERTS]: { label: "alerts", icon: TbAlertCircle },
  [CATEGORIES.CHARGING]: { label: "charging", icon: TbBatteryCharging },
};

// --- 3. UPDATED CLASSIFICATION LOGIC ---
const classifyNotification = (notification) => {
  // If it's the special charging alert object created in the component
  if (notification.type === "charging" || notification.isChargingAlert) {
    return CATEGORIES.CHARGING;
  }

  const identifier = notification.rule?.identifier?.toLowerCase() || "";
  const type = notification.type?.toLowerCase() || "";

  // Check for Charging keywords in regular notifications
  if (identifier.includes("charging") || type === "charging") {
    return CATEGORIES.CHARGING;
  }

  // Default everything else to ALERTS (Faults, Updates, Account, etc.)
  return CATEGORIES.ALERTS;
};

const NotificationDropdown = ({
  notifications = [],
  chargingData = null,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES.ALL);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [chargingDismissed, setChargingDismissed] = useState(false);

  const dropdownRef = useRef(null);
  const btnRef = useRef(null);

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

  // Create charging notification from charging data
  const chargingNotification = useMemo(() => {
    if (!chargingData?.chargingDevices?.length || chargingDismissed)
      return null;

    return {
      id: "charging-alert-main", // Unique ID
      type: "charging",
      is_seen: false,
      created_at: new Date().toISOString(),
      title: `${chargingData.chargingDevices.length} ${t("notifications.vehicles_charging", "vehicles charging")}`,
      message: chargingData.message,
      chargingDevices: chargingData.chargingDevices,
      isChargingAlert: true, // Flag to identify this special object
    };
  }, [chargingData, chargingDismissed]);

  // Categorize notifications
  const categorizedNotifications = useMemo(() => {
    const result = {
      [CATEGORIES.ALL]: [],
      [CATEGORIES.ALERTS]: [],
      [CATEGORIES.CHARGING]: [],
    };

    // Add regular notifications
    notifications.forEach((notification) => {
      const category = classifyNotification(notification);
      // Ensure the category exists in our result object (safety check)
      if (result[category]) {
        result[category].push(notification);
      } else {
        result[CATEGORIES.ALERTS].push(notification); // Fallback
      }
      result[CATEGORIES.ALL].push(notification);
    });

    // Add charging notification if exists
    if (chargingNotification) {
      result[CATEGORIES.CHARGING].unshift(chargingNotification);
      result[CATEGORIES.ALL].unshift(chargingNotification); // Put at top
    }

    return result;
  }, [notifications, chargingNotification]);

  // Get filtered notifications
  const filteredNotifications = useMemo(() => {
    let list = categorizedNotifications[activeCategory] || [];

    if (showUnreadOnly) {
      list = list.filter((n) => !n.is_seen);
    }

    return [...list].sort((a, b) => {
      // Industry Standard: Strictly time-based sorting (Newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [categorizedNotifications, activeCategory, showUnreadOnly]);

  const unreadCounts = useMemo(() => {
    const counts = {};
    Object.keys(CATEGORIES).forEach((key) => {
      const cat = CATEGORIES[key];
      counts[cat] = categorizedNotifications[cat].filter(
        (n) => !n.is_seen
      ).length;
    });
    return counts;
  }, [categorizedNotifications]);

  // Add total counts per category (for tab badges)
  const totalCounts = useMemo(() => {
    const counts = {};
    Object.keys(CATEGORIES).forEach((key) => {
      const cat = CATEGORIES[key];
      counts[cat] = categorizedNotifications[cat]?.length || 0;
    });
    return counts;
  }, [categorizedNotifications]);

  const totalUnread = unreadCounts[CATEGORIES.ALL];
  const totalCount = categorizedNotifications[CATEGORIES.ALL]?.length || 0;

  // --- 4. NAVIGATION LOGIC ---
  const handleNotificationClick = useCallback(
    (notification) => {
      // Close dropdown
      setIsOpen(false);

      // Navigate to Live Alerts page with alert ID to scroll to specific alert
      if (notification.id) {
        navigate(`/alerts-notification?alert_id=${notification.id}`);
      } else {
        navigate('/alerts-notification');
      }
    },
    [navigate]
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t("notifications.just_now", "Just now");
    if (diffMins < 60) return `${diffMins}${t("notifications.m_ago", "m ago")}`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}${t("notifications.h_ago", "h ago")}`;
    return date.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTitle = (notification) => {
    if (notification.isChargingAlert) return notification.title;

    let text = notification.title || "Notification";
    if (notification.rule?.identifier) {
      text = notification.rule.identifier.replace(/_/g, " ").toUpperCase();
    }

    return getTranslatedAlert(text, t);
  };

  // Get severity for a notification using the new industrial-standard system
  const getNotificationSeverity = useCallback((notification) => {
    if (notification.isChargingAlert) return 'high';
    const alertType = notification.type || notification.title || notification.rule?.identifier;
    const existingPriority = notification.priority || notification.rule?.priority;
    return getAlertSeverity(alertType, existingPriority);
  }, []);

  // Get category for a notification
  const getNotificationCategory = useCallback((notification) => {
    if (notification.isChargingAlert) return 'operational';
    const alertType = notification.type || notification.title || notification.rule?.identifier;
    return getAlertCategory(alertType);
  }, []);

  const getSeverityClass = (notification) => {
    const severity = getNotificationSeverity(notification);
    return `severity-${severity}`;
  };

  // Handle Analytics button click - opens the modal directly
  const handleAnalyticsClick = useCallback((e, notification) => {
    e.stopPropagation();
    setIsOpen(false);
    // Navigate to alerts page with alert ID and open_modal flag to show analytics popup directly
    navigate(`/alerts-notification?alert_id=${notification.id}&open_modal=true`);
  }, [navigate]);

  // Handle View All click
  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate('/alerts-notification');
  }, [navigate]);



  // Check if notification has meaningful analytics data
  // Only show View Details for alerts with substantial telemetry data
  const hasAnalytics = (notification) => {
    if (!notification.req_data || !Array.isArray(notification.req_data)) {
      return false;
    }
    // Only show button if there are at least 3 data points (meaningful analysis)
    return notification.req_data.length >= 3;
  };

  return (
    <div className="notification-dropdown-wrapper">
      <button
        ref={btnRef}
        className="topnav-icon-btn notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications: ${totalUnread} unread`}
      >
        <TbBell className="notification-bell-icon" />
        {totalUnread > 0 && (
          <span className="notification-badge">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Backdrop Overlay - closes dropdown when clicked */}
      {isOpen && (
        <div
          className="notification-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div ref={dropdownRef} className="notification-dropdown-modern">
          {/* Header */}
          <div className="noti-header">
            <div className="noti-header-left">
              <TbBell className="noti-header-icon" />
              <span className="noti-header-title">{t("notifications.title", "Notifications")}</span>
              {totalUnread > 0 && (
                <span className="noti-header-count">{totalUnread}</span>
              )}
            </div>
            <div className="noti-header-right">
              <button className="noti-close-btn" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="noti-tabs">
            {Object.values(CATEGORIES).map((category) => (
              <button
                key={category}
                className={`noti-tab ${activeCategory === category ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {t(`notifications.${CATEGORY_CONFIG[category].label}`, CATEGORY_CONFIG[category].label)}
                {unreadCounts[category] > 0 && (
                  <span className="noti-tab-badge">{unreadCounts[category]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="noti-list">
            {filteredNotifications.slice(0, 20).map((notification, index) => (
              <div
                key={notification.id || index}
                className={`noti-card ${!notification.is_seen ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
                title={t("common.click_to_view", "Click to view details")}
              >
                {/* Left: Icon with Severity Color */}
                <div className={`noti-card-icon ${notification.isChargingAlert ? 'severity-charging' : `severity-${getNotificationSeverity(notification)}`}`}>
                  {notification.isChargingAlert
                    ? <TbBatteryCharging />
                    : getAlertIcon(notification.title || notification.type)
                  }
                </div>

                {/* Center: Content (Title + Context) */}
                <div className="noti-card-content">
                  <div className="noti-card-title">
                    {formatTitle(notification)}
                  </div>
                  <div className="noti-card-subtitle">
                    {/* VRN + Severity Tag inline */}
                    {notification.device?.vrn && (
                      <span className="noti-vrn">
                        {notification.device.vrn}
                      </span>
                    )}
                    {notification.device?.vrn && !notification.isChargingAlert && <span className="noti-separator"> • </span>}
                    {!notification.isChargingAlert && (
                      <span className={`noti-severity-tag severity-${getNotificationSeverity(notification)}`}>
                        {getNotificationSeverity(notification)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Time + Chevron */}
                <div className="noti-card-right">
                  {/* Time at top right of card-right section */}
                  <span className="noti-time-right">{formatDate(notification.created_at)}</span>
                  {!notification.is_seen && <span className="noti-unread-dot" />}

                  {/* Chevron for navigation hint */}
                  <TbChevronRight className="noti-chevron" />
                </div>
              </div>
            ))}

            {loading && <div className="noti-loading">Loading...</div>}

            {!loading && filteredNotifications.length === 0 && (
              <div className="noti-empty">
                <TbBell className="noti-empty-icon" />
                <p>{t("notifications.no_notifications", "No notifications")}</p>
              </div>
            )}
          </div>

          {/* Footer - Full Width Sticky */}
          <button className="noti-footer-full" onClick={handleViewAll}>
            <span>{t("notifications.view_all_notifications", "View All Notifications")}</span>
            <TbArrowRight className="noti-footer-icon" />
          </button>
        </div>
      )}
    </div>
  );
};

NotificationDropdown.propTypes = {
  notifications: PropTypes.array,
  chargingData: PropTypes.shape({
    chargingDevices: PropTypes.arrayOf(PropTypes.string),
    message: PropTypes.string,
  }),
  loading: PropTypes.bool,
};

export default NotificationDropdown;
