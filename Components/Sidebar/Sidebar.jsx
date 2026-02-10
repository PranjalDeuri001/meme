


import React, { useEffect, useRef } from "react";
import "./Sidebar.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import SidebarItem from "./SidebarItem";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { allRoutes } from "../../routesConfig.jsx";

function Sidebar({
  collapsed,
  setCollapsed,
  hoverEnabled,
  onItemClick,
  className,
  userInfo,
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const sidebarRef = useRef(null);

  // Safely get the user's allowed features from the API response
  const allowedFeatures =
    userInfo?.subscription?.features?.["EKA Dashboard"] || [];
  const allowedFeaturesSet = new Set(allowedFeatures);

  // Filter the master list of routes to get only the items visible in the sidebar
  const visibleItems = allRoutes.filter(
    (item) => item.alwaysVisible || allowedFeaturesSet.has(item.featureName)
  );

  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    const updateHeight = () => {
      const height = window.innerHeight - 50;
      sidebarElement.style.setProperty(
        "--sidebar-mobile-height",
        `${height}px`
      );
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const currentBasePath = "/" + location.pathname.split("/")[1];

  const handleMouseEnter = () => {
    if (hoverEnabled) setCollapsed(false);
  };
  const handleMouseLeave = () => {
    if (hoverEnabled) setCollapsed(true);
  };

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`sidebar ${className}`}
    >
      <ul className="sidebar-list">
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.path}
            title={
              item.title.startsWith("sidebar.") ? t(item.title) : item.title
            }
            to={item.path}
            icon={item.icon}
            currentPath={currentBasePath}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </ul>
    </div>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired,
  hoverEnabled: PropTypes.bool,
  onItemClick: PropTypes.func,
  className: PropTypes.string,
  userInfo: PropTypes.object,
};

Sidebar.defaultProps = {
  hoverEnabled: false,
  onItemClick: () => {},
  className: "",
  userInfo: null,
};

export default Sidebar;
