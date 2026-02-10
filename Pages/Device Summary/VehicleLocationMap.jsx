import React, { useMemo, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { ArrowLeft, Bus, Users, Gauge, Battery, MapPin } from "lucide-react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// --- ADDED: Import marker and icon logic ---
import RotatingVehicleMarker from "../Home/RotatingVehicleMarker";
import puma15tMovingSvg from "../../Assets/Map Icons/Scv/Puma/Moving.svg";
import puma15tStoppedSvg from "../../Assets/Map Icons/Scv/Puma/Stopped.svg";
import scv6sMovingSvg from "../../Assets/Map Icons/Scv/6S/Moving.svg";
import scv6sStoppedSvg from "../../Assets/Map Icons/Scv/6S/Stopped.svg";
import scv3sMovingSvg from "../../Assets/Map Icons/Scv/3S/Moving.svg";
import scv3sStoppedSvg from "../../Assets/Map Icons/Scv/3S/Stopped.svg";
import bus7mMovingSvg from "../../Assets/Map Icons/Bus/7M/Moving.svg";
import bus7mStoppedSvg from "../../Assets/Map Icons/Bus/7M/Stopped.svg";
import bus9mMovingSvg from "../../Assets/Map Icons/Bus/9M/Moving.svg";
import bus9mStoppedSvg from "../../Assets/Map Icons/Bus/9M/Stopped.svg";
import bus12mMovingSvg from "../../Assets/Map Icons/Bus/12M/Moving.svg";
import bus12mStoppedSvg from "../../Assets/Map Icons/Bus/12M/Stopped.svg";
import bus135mMovingSvg from "../../Assets/Map Icons/Bus/13.5M/Moving.svg";
import bus135mStoppedSvg from "../../Assets/Map Icons/Bus/13.5M/Stopped.svg";
import truck7tMovingSvg from "../../Assets/Map Icons/Truck/7T/Moving.svg";
import truck7tStoppedSvg from "../../Assets/Map Icons/Truck/7T/Stopped.svg";
import truck55tMovingSvg from "../../Assets/Map Icons/Truck/55T/Moving.svg";
import truck55tStoppedSvg from "../../Assets/Map Icons/Truck/55T/Stopped.svg";
// --- END IMPORTS ---

// --- STYLING CONFIGURATION ---

// 1. Dark theme styles
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
];

// 2. Injected CSS
const InjectedMapStyles = ({ isDarkMode }) => (
  <style>{`
    .ds-map-view-container {
      flex-grow: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: ${isDarkMode ? "#242f3e" : "#e0e4e8"};
    }
    .ds-back-button {
      position: absolute;
      top: 1rem;
      left: 1rem;
      z-index: 10;
    }
    .ds-map-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
      background-color: ${isDarkMode ? "#450a0a" : "#fee2e2"};
      color: ${isDarkMode ? "#f87171" : "#ef4444"};
      border-radius: 8px;
    }
    
    /* --- Overrides for Google Maps UI --- */
    .gm-style .gm-style-iw-c { 
      border-radius: 10px !important; 
      background: ${
        isDarkMode ? "rgba(31,41,55,0.96)" : "rgba(255, 255, 255, 0.96)"
      } !important;
      color: ${isDarkMode ? "#e5e7eb" : "#151d48"} !important;
      padding: 0 !important; /* <-- REMOVE PADDING */
    }
    .gm-style .gm-style-iw-d { 
      overflow: hidden !important; /* <-- REMOVE SCROLLBAR */
      padding: 0 !important;
    }
    .gm-style .gm-style-iw-ch {
      padding: 0 !important; /* Remove padding from close button wrapper */
    }
    .gm-style .gm-style-iw-t::after { 
      background: ${
        isDarkMode ? "rgba(31,41,55,0.96)" : "rgba(255, 255, 255, 0.96)"
      } !important; 
    }
    .gm-style button, .gm-style a, .gm-style span, .gm-style label, .gm-style p, .gm-style strong {
      color: ${isDarkMode ? "#e5e7eb" : "#151d48"} !important;
    }
    .dark .gmnoprint button { 
      background: rgba(31,41,55,0.92) !important; 
    }

    /* --- InfoWindow Styles (Copied from Home/Dashboard) --- */
    .custom-infowindow {
      min-width: 240px;
      padding: 4px;
      font-family: "Exo 2", sans-serif;
    }
    .infowindow-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 8px 3px;
    }
    .infowindow-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .infowindow-icon {
      color: ${isDarkMode ? "#a0aec0" : "#0b5297"};
      flex-shrink: 0;
      width: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .infowindow-title {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .title-label {
      font-size: 10px;
      font-weight: 500;
      color: ${isDarkMode ? "#a0aec0" : "#5a6a85"};
      text-transform: uppercase;
    }
    .title-value {
      font-size: 13px;
      font-weight: 600;
      color: ${isDarkMode ? "#e2e8f0" : "#0b5297"};
    }
    .infowindow-divider {
      border: none;
      height: 1px;
      background-color: ${isDarkMode ? "#4a5568" : "#e0e4e8"};
      margin: 4px 0;
    }
    .infowindow-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      padding: 12px 4px 8px 4px;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-item-full {
      grid-column: 1 / -1;
    }
    .stat-icon {
      color: ${isDarkMode ? "#a0aec0" : "#425166"};
      flex-shrink: 0;
      width: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .stat-item div {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .stat-value {
      font-size: 13px;
      font-weight: 600;
    }
    .stat-label {
      font-size: 11px;
      color: ${isDarkMode ? "#a0aec0" : "#5a6a85"};
    }
  `}</style>
);

// This array MUST match all other useJsApiLoader calls in the app
const MAP_LIBRARIES = ["geometry", "maps"];

// --- ADDED: Copied from HomeInfo2.jsx ---
const LCV_ICON_SIZE_ROTATING = { width: 40, height: 40 };
const BUS_ICON_SIZE_ROTATING = { width: 55, height: 55 };

const getRotatingVehicleIcon = (model, status) => {
  status = (status || "").toLowerCase();
  const modelLower = (model || "").toLowerCase();

  let iconUrl;
  let size;

  const isLcv =
    modelLower.includes("1.5t") ||
    modelLower.includes("6s") ||
    modelLower.includes("3s");

  if (isLcv) {
    size = LCV_ICON_SIZE_ROTATING;
    if (modelLower.includes("1.5t")) {
      iconUrl = status === "active" ? puma15tMovingSvg : puma15tStoppedSvg;
    }else if(modelLower.includes("3s")){
      iconUrl = status === "active" ? scv3sMovingSvg : scv3sStoppedSvg;
    } else {
      iconUrl = status === "active" ? scv6sMovingSvg : scv6sStoppedSvg;
    }
  } else if (modelLower.endsWith("m")) {
    size = BUS_ICON_SIZE_ROTATING;
    if (modelLower.includes("9m")) {
      iconUrl = status === "active" ? bus9mMovingSvg : bus9mStoppedSvg;
    } else if (modelLower.includes("12m")) {
      iconUrl = status === "active" ? bus12mMovingSvg : bus12mStoppedSvg;
    } else if (modelLower.includes("13.5m")) {
      iconUrl = status === "active" ? bus135mMovingSvg : bus135mStoppedSvg;
    } else {
      iconUrl = status === "active" ? bus7mMovingSvg : bus7mStoppedSvg;
    }
  } else {
    size = BUS_ICON_SIZE_ROTATING;
    if (modelLower.includes("7t")) {
      iconUrl = status === "active" ? truck7tMovingSvg : truck7tStoppedSvg;
    } else if (modelLower.includes("55t")) {
      iconUrl = status === "active" ? truck55tMovingSvg : truck55tStoppedSvg;
    } else {
      iconUrl = status === "active" ? truck7tMovingSvg : truck7tStoppedSvg;
    }
  }
  return { url: iconUrl, size };
};
// --- END: Copied from HomeInfo2.jsx ---

// --- THE COMPONENT ---

const VehicleLocationMap = ({
  apiKey,
  vehicle,
  onBack,
  isDarkMode = false,
}) => {
  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const errorLoadingMap_ = t(
    "VehicleStatus.error_loading_map",
    "Error loading map. Please check your API key and network connection.",
  );
  const details_ = t("VehicleStatus.details", "Back to Details");
  const loadingMap_ = t("VehicleStatus.loading_map", "Loading Map...");

  // --- UPDATED: InfoWindow is OFF by default ---
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

  // --- UPDATED: Added offset state ---
  const [infoWindowOffset, setInfoWindowOffset] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES, // <-- Use the consistent libraries array
  });

  // Memoize map options
  const mapOptions = useMemo(
    () => ({
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: isDarkMode ? DARK_MAP_STYLES : [],
      backgroundColor: isDarkMode ? "#0b1220" : "#ffffff",
    }),
    [isDarkMode],
  );

  const center = {
    lat: vehicle.latitude,
    lng: vehicle.longitude,
  };

  // Get icon properties
  const { url, size } = getRotatingVehicleIcon(
    vehicle.vehicle_type_name,
    vehicle.status === "Running" ? "active" : "inactive",
  );

  // --- ADDED: Set InfoWindow offset ---
  // This calculates the correct vertical offset based on the icon's height
  useEffect(() => {
    if (isLoaded && window.google) {
      // Offset by half the icon height + a small gap (e.g., 10px)
      const yOffset = -(size.height / 2) - 10;
      setInfoWindowOffset(new window.google.maps.Size(0, yOffset));
    }
  }, [isLoaded, size.height]);

  if (loadError) {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <InjectedMapStyles isDarkMode={isDarkMode} />
        <div className="ds-map-error">{errorLoadingMap_}</div>
      </div>
    );
  }

  return (
    <div className={`ds-map-view-container ${isDarkMode ? "dark" : ""}`}>
      <InjectedMapStyles isDarkMode={isDarkMode} />

      <button
        onClick={onBack}
        className="ds-theme-btn ds-theme-btn-outlined ds-back-button"
      >
        <ArrowLeft size={16} /> {details_}
      </button>

      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={15}
          options={mapOptions}
          onClick={() => setIsInfoWindowOpen(false)} // Close on map click
        >
          {/* --- UPDATED: Use RotatingVehicleMarker --- */}
          <RotatingVehicleMarker
            position={center}
            iconUrl={url}
            size={size}
            heading={0}
            isSelected={isInfoWindowOpen}
            onClick={(e) => {
              e.stopPropagation(); // Prevent map click
              setIsInfoWindowOpen((prev) => !prev);
            }}
          />

          {/* --- UPDATED: InfoWindow (Layout from Home page) --- */}
          {isInfoWindowOpen && (
            <InfoWindow
              position={center}
              onCloseClick={() => setIsInfoWindowOpen(false)}
              options={{ pixelOffset: infoWindowOffset }} // Apply offset
            >
              <div className="custom-infowindow">
                {" "}
                {/* Use standard class */}
                <div className="infowindow-header">
                  <div className="infowindow-row">
                    <Bus size={20} className="infowindow-icon" />
                    <div className="infowindow-title">
                      <span className="title-label">
                        {t("vehicle.vrnChassisNumber", "VRN / Chassis")}
                      </span>
                      <span className="title-value">
                        {vehicle.vrn && vehicle.vrn !== "-"
                          ? vehicle.vrn
                          : vehicle.id}
                      </span>
                    </div>
                  </div>
                  <div className="infowindow-row">
                    <Users size={20} className="infowindow-icon" />
                    <div className="infowindow-title">
                      <span className="title-label">
                        {t("vehicle.fleet", "Fleet")}
                      </span>
                      <span className="title-value">
                        {vehicle.depot || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <hr className="infowindow-divider" />
                <div className="infowindow-stats">
                  {vehicle.status === "Running" ? (
                    <div className="stat-item">
                      <Gauge size={18} className="stat-icon" />
                      <div>
                        <span className="stat-value">
                          {Number(vehicle.averageSpeed ?? 0).toFixed(1)} km/h
                        </span>
                        <span className="stat-label">
                          {vehicle.status === "Running"
                            ? t("vehicle.speed", "speed")
                            : t("vehicle.lastSpeed", "Last Known Speed")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  <div className="stat-item">
                    <Battery size={18} className="stat-icon" />
                    <div>
                      <span className="stat-value">
                        {vehicle.battery ?? 0}%
                      </span>
                      <span className="stat-label">SOC</span>
                    </div>
                  </div>
                  <div className="stat-item stat-item-full">
                    <MapPin size={18} className="stat-icon" />
                    <div>
                      <span className="stat-value">
                        {vehicle.region || "N/A"} ({vehicle.vehicle_type_name})
                      </span>
                      <span className="stat-label">
                        {t("vehicle.location&Type", "Location & Type")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
          {/* --- END: InfoWindow --- */}
        </GoogleMap>
      ) : (
        <div>{loadingMap_}</div>
      )}
    </div>
  );
};

VehicleLocationMap.propTypes = {
  apiKey: PropTypes.string.isRequired,
  vehicle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    vrn: PropTypes.string,
    displayId: PropTypes.string,
    depot: PropTypes.string,
    fleet: PropTypes.string,
    averageSpeed: PropTypes.number,
    speed: PropTypes.number,
    battery: PropTypes.number,
    city: PropTypes.string,
    region: PropTypes.string,
    vehicle_type_name: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
};

VehicleLocationMap.defaultProps = {
  isDarkMode: false,
};

export default VehicleLocationMap;
