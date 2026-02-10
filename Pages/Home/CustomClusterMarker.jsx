// CustomClusterMarker.jsx
import React from "react";
import { OverlayView } from "@react-google-maps/api";
import PropTypes from "prop-types";

const clusterStyle = {
  position: "absolute",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "rgba(23,71,158,0.8)",
  border: "2px solid #ffffff",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
  transform: "translate(-50%, -50%)",
  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
  userSelect: "none",
};

const CustomClusterMarker = ({ position, count, onClick }) => {
  if (
    !position ||
    typeof position.lat !== "number" ||
    typeof position.lng !== "number" ||
    !Number.isFinite(position.lat) ||
    !Number.isFinite(position.lng)
  ) {
    return null;
  }

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        style={clusterStyle}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {count}
      </div>
    </OverlayView>
  );
};

CustomClusterMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  count: PropTypes.number.isRequired,
  onClick: PropTypes.func,
};

CustomClusterMarker.defaultProps = {
  onClick: () => {},
};

export default React.memo(CustomClusterMarker);
