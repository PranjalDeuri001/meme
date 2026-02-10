// src/Components/Map/RotatingVehicleMarker.jsx

import React from "react";
import { OverlayView } from "@react-google-maps/api";
import PropTypes from 'prop-types';

const RotatingVehicleMarker = ({ position, iconUrl, heading, size, onClick }) => {
  if (!position || typeof position.lat !== "number" || typeof position.lng !== "number") {
    return null;
  }

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
  type="button"
  onClick={onClick}
  style={{
    position: "absolute",
    transform: `translate(-50%, -50%) rotate(${heading || 0}deg)`,
    transition: "transform 0.5s linear",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
  }}
>
  <img
    src={iconUrl}
    alt="Vehicle Icon"
    style={{
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: "block",
    }}
  />
</button>

    </OverlayView>
  );
};

RotatingVehicleMarker.propTypes = {
    position: PropTypes.object.isRequired,
    iconUrl: PropTypes.string.isRequired,
    heading: PropTypes.number,
    size: PropTypes.object.isRequired,
    onClick: PropTypes.func,
};

export default React.memo(RotatingVehicleMarker);