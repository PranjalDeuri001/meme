import React from "react";
import { OverlayView } from "@react-google-maps/api";
import PropTypes from "prop-types";

const RotatingVehicleMarker = ({
  position,
  iconUrl,
  heading,
  size,
  onClick,
  isSelected,
}) => {
  if (
    !position ||
    typeof position.lat !== "number" ||
    typeof position.lng !== "number" ||
    !Number.isFinite(position.lat) ||
    !Number.isFinite(position.lng)
  ) {
    return null;
  }

  // Slight visual emphasis when marker is selected
  const scale = isSelected ? 1.2 : 1.0;
  // const boxShadow = isSelected
  //   ? "0 0 8px rgba(59, 130, 246, 0.9)" // bluish glow
  //   : "none";

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) rotate(${heading || 0}deg) scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
          cursor: "pointer",
          // boxShadow,
          // borderRadius: "999px", // make glow look circular
        }}
        onClick={onClick}
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
      </div>
    </OverlayView>
  );
};

RotatingVehicleMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  iconUrl: PropTypes.string.isRequired,
  heading: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  size: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
};

RotatingVehicleMarker.defaultProps = {
  heading: 0,
  onClick: () => {},
  isSelected: false,
};

export default React.memo(RotatingVehicleMarker);
