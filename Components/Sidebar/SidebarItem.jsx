import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const SidebarItem = ({
  title,
  to,
  icon,
  currentPath,
  onItemClick,
  submenu,
  collapsed,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = to === currentPath;
  const hasSelectedSubmenuItem = submenu
    ? submenu.some((item) => item.to === currentPath)
    : false;

  const handleSubmenuToggle = () => {
    if (submenu) {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (collapsed) {
      setIsOpen(false);
    } else if (hasSelectedSubmenuItem) {
      setIsOpen(true);
    }
  }, [collapsed, hasSelectedSubmenuItem]);

  return (
    <li
      className={`sidebar-item ${
        isSelected || hasSelectedSubmenuItem ? "active" : ""
      } ${isOpen ? "open" : ""}`}
    >
      {!submenu ? (
        <Link
          to={to}
          className="sidebar-link"
          onClick={() => {
            if (onItemClick) onItemClick();
          }}
        >
          <div className="sidebar-icon">{icon}</div> {/* Simplified */}
          <span className="sidebar-text">{title}</span>
        </Link>
      ) : (
        <button className="sidebar-link" onClick={handleSubmenuToggle}>
          <div className="sidebar-icon">{icon}</div> {/* Simplified */}
          <span className="sidebar-text">{title}</span>
          <i
            className={`bi ${
              isOpen ? "bi-chevron-up" : "bi-chevron-down"
            } submenu-icon`}
          ></i>
        </button>
      )}
      {submenu && isOpen && (
         // ... submenu logic remains the same
        <ul className="submenu">
          {submenu.map((item) => (
          <li
       key={item.title}
       className={`submenu-item ${item.to === currentPath ? "active" : ""}`}
        >
        <Link
         to={item.to}
    className="submenu-link"
    onClick={() => {
      if (onItemClick) onItemClick();
    }}
  >
    {item.title}
  </Link>
        </li>
          ))}
        </ul>
      )}
    </li>
  );
};

SidebarItem.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string,
  icon: PropTypes.node.isRequired, // Simplified to only accept a React node
  currentPath: PropTypes.string.isRequired,
  onItemClick: PropTypes.func,
  submenu: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    })
  ),
  collapsed: PropTypes.bool,
};

export default SidebarItem;