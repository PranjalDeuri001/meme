// src/Components/Map/MapComponents.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { OverlayView } from '@react-google-maps/api';

// --- REUSABLE SVG ICONS (No changes needed) ---

// EKA / Bus Stations (Orange Map Pin)
export const EkaChargerIcon = () => (
  <svg width="30" height="30" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0C11.2 0 5 6.2 5 14C5 24.5 19 38 19 38S33 24.5 33 14C33 6.2 26.8 0 19 0Z" fill="#d36e25ff"/>
    <path d="M19.9167 10.5H18.0833L16.25 16.6667H20.75L18.9167 22.8333L22.5833 14.8333H19.0833L19.9167 10.5Z" fill="white"/>
  </svg>
);

// Puma / LCV Stations (Blue Map Pin)
export const PumaChargerIcon = () => (
  <svg width="30" height="30" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0C11.2 0 5 6.2 5 14C5 24.5 19 38 19 38S33 24.5 33 14C33 6.2 26.8 0 19 0Z" fill="#1e5e9fff"/>
    <path d="M19.9167 10.5H18.0833L16.25 16.6667H20.75L18.9167 22.8333L22.5833 14.8333H19.0833L19.9167 10.5Z" fill="white"/>
  </svg>
);

// --- REUSABLE CHARGER MARKER COMPONENT ---

export function ChargingStationMarker({ position, onClick, isEkaStation }) {
  const handleActivate = (e) => {
    e.stopPropagation?.();
    onClick?.(); // Simplified: The parent component already knows which station was clicked.
  };
  
  const getPixelPositionOffset = (width, height) => ({
    x: -(width / 2),
    y: -height,
  });
  
  const iconToRender = isEkaStation ? <EkaChargerIcon /> : <PumaChargerIcon />;

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => getPixelPositionOffset(30, 30)} // Simplified: Using direct values.
    >
      <button
  type="button"
  className="station-marker"
  onClick={handleActivate}
  onTouchStart={handleActivate}
  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
>
  {iconToRender}
</button>
    </OverlayView>
  );
}

// --- PROP TYPES VALIDATION (Preserved) ---
ChargingStationMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  isEkaStation: PropTypes.bool,
};

ChargingStationMarker.defaultProps = {
  onClick: () => {},
  isEkaStation: false,
};

// --- CLUSTER STYLES (Preserved) ---

// Is this even used? It only exist in this file and is not called in any other file or even in this file.

// export const getClusterStyles = (isDark) => [
//   {
//     url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
//       `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#2563EB" stroke="${isDark ? '#2D3748' : '#FFFFFF'}" stroke-width="1.5"/></svg>`
//     )}`,
//     height: 24,
//     width: 24,
//     textColor: "#ffffff",
//     textSize: 10,
//     fontWeight: "bold",
//   },
//   {
//     url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
//       `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="#1D4ED8" stroke="${isDark ? '#2D3748' : '#FFFFFF'}" stroke-width="1.5"/></svg>`
//     )}`,
//     height: 30,
//     width: 30,
//     textColor: "#ffffff",
//     textSize: 11,
//     fontWeight: "bold",
//   },
//   {
//     url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
//       `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="17" fill="#0B5297" stroke="${isDark ? '#2D3748' : '#FFFFFF'}" stroke-width="1.5"/></svg>`
//     )}`,
//     height: 36,
//     width: 36,
//     textColor: "#ffffff",
//     textSize: 12,
//     fontWeight: "bold",
//   },
// ];