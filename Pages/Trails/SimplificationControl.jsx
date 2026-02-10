import React, { memo, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const SIMPLIFICATION_PRESETS = [
  { label: "High Accuracy", value: 0.00001 }, 
  { label: "Balanced", value: 0.0001 },      
  { label: "Performance", value: 0.0005 },    
];

const SimplificationControl = memo(
  ({ simplificationTolerance, setSimplificationTolerance }) => {
    const [isOpen, setIsOpen] = useState(false);
    const controlRef = useRef(null);

    // Handle clicking outside to close the menu
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (controlRef.current && !controlRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="simplification-control" ref={controlRef}>
        <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="control-button"
            title="Adjust Map Path Quality"
            aria-haspopup="true"
            aria-expanded={isOpen}
        >
          <i className="bi bi-bar-chart-line"></i>
        </button>
        
        {isOpen && (
          <ul className="control-menu" role="menu">
            {SIMPLIFICATION_PRESETS.map((preset) => (
              <li
                key={preset.label}
                role="menuitem"
                className={
                  simplificationTolerance === preset.value ? "active" : ""
                }
                onClick={() => {
                  setSimplificationTolerance(preset.value);
                  setIsOpen(false);
                }}
              >
                {preset.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

SimplificationControl.displayName = "SimplificationControl";

// Strict type checking
SimplificationControl.propTypes = {
  simplificationTolerance: PropTypes.number.isRequired,
  setSimplificationTolerance: PropTypes.func.isRequired,
};

export default SimplificationControl;