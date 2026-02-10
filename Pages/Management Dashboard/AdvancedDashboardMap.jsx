// src/Pages/ManagementDashboard/AdvancedDashboardMap.jsx

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import {
  GoogleMap,
  InfoWindow,
  useJsApiLoader,
  TrafficLayer,
} from "@react-google-maps/api";
import useSupercluster from "use-supercluster";
import {
  SlidersHorizontal,
  Bus,
  MapPin,
  Gauge,
  Battery,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// --- Custom Components (same as Home) ---
import RotatingVehicleMarker from "../Home/RotatingVehicleMarker";
import CustomClusterMarker from "../Home/CustomClusterMarker";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { ChargingStationMarker } from "../../Components/Map/MapComponents";

const google_api = import.meta.env.VITE_GOOGLE_API_KEY;

// --- THIS IS THE FIX (1/2) ---
// This array MUST match all other useJsApiLoader calls in the app
const MAP_LIBRARIES = ["geometry", "maps"];
// --- END FIX ---

// --- SVG Icons for Rotating Markers (same set as Home) ---
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

// Constants and Helpers
const LCV_ICON_SIZE_ROTATING = { width: 40, height: 40 };
const BUS_ICON_SIZE_ROTATING = { width: 55, height: 55 };
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const INITIAL_ZOOM = 5;

// getRotatingVehicleIcon (same logic as HomeInfo2)
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
    } else if (modelLower.includes("3s")) {
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

// --- Map Styles (same style philosophy as HomeInfo2, but compact) ---
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
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
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
];

const LIGHT_CUSTOM_STYLES = `
  .hmap-cont .gm-style-mtc, .hmap-cont .gm-svpc {
    background: rgba(255, 255, 255, 0.92) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
  }
  .hmap-cont .gm-bundled-control-on-bottom .gmnoprint > div {
    background-color: transparent !important;
    box-shadow: none !important;
  }
  .hmap-cont .gm-bundled-control button, .hmap-cont .gm-fullscreen-control {
    background-color: rgba(255, 255, 255, 0.92) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
    border-radius: 50% !important;
    width: 36px !important;
    height: 36px !important;
  }
  .hmap-cont .gm-style-iw-chr { height: 10px !important;}
  .hmap-cont .gm-style-cc { border-radius: 6px !important; }
  .hmap-cont .gm-style .gm-style-iw-c { 
    border-radius: 10px !important; 
    background: rgba(255, 255, 255, 0.96) !important;
  }
  .hmap-cont .gm-style .gm-style-iw-d {
    overflow: auto !important; 
    scrollbar-width: thin;
    scrollbar-color: #b0b0b0 #e0e0e0;
  }
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar { width: 8px; }
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar-track { background: #e0e0e0; }
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar-thumb {
    background-color: #b0b0b0;
    border-radius: 4px;
  }
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar-thumb:hover { background-color: #909090; }
  .hmap-cont .gm-bundled-control .gmnoprint > div > div { display: none !important; }
`;

const DARK_CUSTOM_STYLES = `
  .hmap-cont .gm-style-mtc { background: rgba(31,41,55,0.92) !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important; }
  .hmap-cont .gm-style-mtc button, .hmap-cont .gm-style-mtc div { background: transparent !important; color: #e5e7eb !important; }
  .hmap-cont .gm-bundled-control-on-bottom .gmnoprint > div { 
    background-color: transparent !important; 
    box-shadow: none !important; 
    gap: 4px !important;
  }
  .hmap-cont .gm-bundled-control button, .hmap-cont .gm-fullscreen-control, .hmap-cont .gm-svpc button { 
    background: rgba(51, 65, 85, 0.85) !important; 
    border: 1px solid rgba(255,255,255,0.12) !important; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important;     
    border-radius: 50% !important;
    width: 36px !important;
    height: 36px !important;
  }
  .hmap-cont .gmnoprint button img, .hmap-cont .gm-fullscreen-control img { filter: invert(1) hue-rotate(180deg); }
  .hmap-cont .gm-style-cc, .hmap-cont .gm-style-cc div, .hmap-cont .gm-style-cc button, .hmap-cont .gm-style-cc a { background: rgba(17,24,39,0.72) !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.12) !important; }
  .hmap-cont .gm-bundled-control .gmnoprint > div > div { display: none !important; }
  .hmap-cont .gm-style .gm-style-iw-c { background: #27303F !important; color: #e5e7eb !important; border-radius: 10px !important; }
  .hmap-cont .gm-style .gm-style-iw-t::after { background: #27303F !important; }
  .hmap-cont .gm-style .gm-style-iw-d { overflow: auto !important; scrollbar-width: thin; scrollbar-color: #4a5568 #2d3748; }
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar { width: 8px; } 
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar-track { background: #2d3748; } 
  .hmap-cont .gm-style .gm-style-iw-d::-webkit-scrollbar-thumb { background-color: #4a5568; border-radius: 4px; }
`;

const AdvancedDashboardMap = ({ vehicles, chargingStations, activeFilter }) => {
  const mapRef = useRef(null);

  // Store only the ID to avoid stale object references
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [bounds, setBounds] = useState(null);

  const [isDark, setIsDark] = useState(
    () =>
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark"),
  );
  const { t, i18n } = useTranslation();
  const [mapLocale, setMapLocale] = useState(i18n.language);

  // Filters (aligned with ManagementDashboard + Home)
  const [filters, setFilters] = useState({
    active: true,
    inactive: true,
    charging: false,
    ekaChargers: false,
    pumaChargers: false,
  });

  // Auto-toggle filters when user clicks Total / Active / Inactive tabs
  useEffect(() => {
    if (activeFilter === "total") {
      setFilters((prev) => ({ ...prev, active: true, inactive: true }));
    } else if (activeFilter === "active") {
      setFilters((prev) => ({ ...prev, active: true, inactive: false }));
    } else if (activeFilter === "inactive") {
      setFilters((prev) => ({ ...prev, active: false, inactive: true }));
    }
  }, [activeFilter]);

  const [mapType, setMapType] = useState(isDark ? "terrain" : "roadmap");
  const [hasUserSelectedMapType, setHasUserSelectedMapType] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  // Theme watcher (same idea as Home)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const darkModeOn =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(darkModeOn);

      if (!hasUserSelectedMapType) {
        setMapType(darkModeOn ? "terrain" : "roadmap");
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [hasUserSelectedMapType]);

  // Language change
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setMapLocale(lng);
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  // --- THIS IS THE FIX (2/2) ---
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: google_api,
    language: mapLocale,
    libraries: MAP_LIBRARIES, // <-- Use the consistent libraries array
  });
  // --- END FIX ---

  const handleFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMapTypeChange = (type) => {
    setMapType(type);
    setHasUserSelectedMapType(true);
  };

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    map.setCenter(INDIA_CENTER);
    map.setZoom(INITIAL_ZOOM);
    setBounds([
      INDIA_CENTER.lng - 5,
      INDIA_CENTER.lat - 5,
      INDIA_CENTER.lng + 5,
      INDIA_CENTER.lat + 5,
    ]);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onIdle = useCallback(() => {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom();
    const b = mapRef.current.getBounds();
    if (!b) return;

    const bObj = b.toJSON();
    setZoom(z);
    setBounds([bObj.west, bObj.south, bObj.east, bObj.north]);
  }, []);

  const mapOptions = useMemo(
    () => ({
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      styles: isDark ? DARK_MAP_STYLES : [],
      backgroundColor: isDark ? "#0b1220" : "#ffffff",
      mapTypeId: mapType,
      maxZoom: 20,
    }),
    [isDark, mapType],
  );

  const visibleStations = useMemo(
    () =>
      chargingStations.filter((station) => {
        if (station.type === "EKA" && !filters.ekaChargers) return false;
        if (station.type === "PUMA" && !filters.pumaChargers) return false;
        return true;
      }),
    [chargingStations, filters.ekaChargers, filters.pumaChargers],
  );

  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];

    return vehicles.filter((v) => {
      const rawStatus = (v?.mode || "").toLowerCase();

      // Skip nogps vehicles from map, same as Home
      if (rawStatus === "nogps") return false;

      let statusKey = "inactive";
      if (rawStatus === "active") statusKey = "active";
      else if (rawStatus === "charging") statusKey = "charging";

      if (!filters[statusKey]) return false;

      const lat = parseFloat(v.latitude);
      const lng = parseFloat(v.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      if (lat === 0 && lng === 0) return false;

      return true;
    });
  }, [vehicles, filters]);

  const points = useMemo(
    () =>
      filteredVehicles.map((vehicle) => ({
        type: "Feature",
        properties: {
          cluster: false,
          vehicleData: vehicle,
        },
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(vehicle.longitude),
            parseFloat(vehicle.latitude),
          ],
        },
      })),
    [filteredVehicles],
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 15 },
  });

  // -------- Tooltip should follow live data (same pattern as HomeInfo2) --------
  const liveSelectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.vehicle_id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicles]);

  const canShowInfoWindow = useMemo(() => {
    if (!liveSelectedVehicle) return false;
    const lat = parseFloat(liveSelectedVehicle.latitude);
    const lng = parseFloat(liveSelectedVehicle.longitude);
    return (
      Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
    );
  }, [liveSelectedVehicle]);

  const [infoWindowOffset, setInfoWindowOffset] = useState(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const handleProjectionChanged = () => {
      try {
        const offset = new window.google.maps.Size(0, -30);
        setInfoWindowOffset(offset);
      } catch {
        // fail silently
      }
    };

    const listener = window.google.maps.event.addListener(
      mapRef.current,
      "projection_changed",
      handleProjectionChanged,
    );

    return () => {
      if (listener && window.google?.maps?.event?.removeListener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="mgmt-dash-map-container">
        {t("loadingMessages.errorLoadingMaps", "Error loading maps.")}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mgmt-dash-map-container">
        {t("loadingMessages.loading", "Loading...")}
      </div>
    );
  }

  return (
    <div
      className="h-full w-full hmap-cont"
      onClick={() => isFilterPopupOpen && setIsFilterPopupOpen(false)}
    >
      <style>{isDark ? DARK_CUSTOM_STYLES : LIGHT_CUSTOM_STYLES}</style>

      {/* Live Indicator */}
      <div
        className="map-live-indicator"
        title={t(
          "managementDashboard.liveTooltip",
          "Vehicle data is updated in real-time.",
        )}
      >
        <div className="live-dot-container">
          <div className="live-dot"></div>
        </div>
        <span className="live-text">LIVE</span>
      </div>

      {/* Filter FAB & Popup */}
      <button
        className="mgmt-map-filter-fab"
        onClick={(e) => {
          e.stopPropagation();
          setIsFilterPopupOpen((prev) => !prev);
        }}
      >
        <SlidersHorizontal size={22} />
      </button>

      <div
        className={`mgmt-map-filter-popup ${
          isFilterPopupOpen ? "is-open" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-section">
          <div className="filter-title">{t("status.vehicleStatus")}</div>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={filters.active}
                onChange={handleFilterChange}
              />
              {t("status.active")}
            </label>
            <label>
              <input
                type="checkbox"
                name="inactive"
                checked={filters.inactive}
                onChange={handleFilterChange}
              />
              {t("status.inactive")}
            </label>
            <label>
              <input
                type="checkbox"
                name="charging"
                checked={filters.charging}
                onChange={handleFilterChange}
              />
              {t("status.charging")}
            </label>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">
            {t("vehicle.chargingStation", "Charging Station")}
          </div>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="ekaChargers"
                checked={filters.ekaChargers}
                onChange={handleFilterChange}
              />
              {t("vehicle.bus", "Bus")}
            </label>
            <label>
              <input
                type="checkbox"
                name="pumaChargers"
                checked={filters.pumaChargers}
                onChange={handleFilterChange}
              />
              {t("vehicle.lcv", "LCV")}
            </label>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">{t("map.mapView", "Map View")}</div>
          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="mapType"
                value="roadmap"
                checked={mapType === "roadmap"}
                onChange={() => handleMapTypeChange("roadmap")}
              />
              {t("map.map", "Map")}
            </label>
            <label>
              <input
                type="radio"
                name="mapType"
                value="satellite"
                checked={mapType === "satellite"}
                onChange={() => handleMapTypeChange("satellite")}
              />
              {t("map.satellite", "Satellite")}
            </label>
            <label>
              <input
                type="radio"
                name="mapType"
                value="hybrid"
                checked={mapType === "hybrid"}
                onChange={() => handleMapTypeChange("hybrid")}
              />
              {t("map.hybrid", "Hybrid")}
            </label>
            <label>
              <input
                type="radio"
                name="mapType"
                value="terrain"
                checked={mapType === "terrain"}
                onChange={() => handleMapTypeChange("terrain")}
              />
              {t("map.terrain", "Terrain")}
            </label>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">
            {t("map.mapDetails", "Map Details")}
          </div>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="showTraffic"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
              />
              {t("map.traffic", "Traffic")}
            </label>
          </div>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onIdle={onIdle}
        center={INDIA_CENTER}
        zoom={INITIAL_ZOOM}
        onClick={() => {
          setIsFilterPopupOpen(false);
          setSelectedVehicleId(null);
          setSelectedStation(null);
        }}
      >
        {showTraffic && <TrafficLayer />}

        {/* Vehicles / Clusters */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } =
            cluster.properties;

          const latLng = { lat: latitude, lng: longitude };

          if (isCluster) {
            return (
              <CustomClusterMarker
                key={`cluster-${cluster.id}`}
                position={latLng}
                count={pointCount}
                onClick={(e) => {
                  e.stopPropagation();
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    20,
                  );
                  mapRef.current?.setZoom(expansionZoom);
                  mapRef.current?.panTo(latLng);
                }}
              />
            );
          }

          const vehicle = cluster.properties.vehicleData;
          if (!vehicle || !vehicle.vehicleType) {
            console.warn("Invalid vehicle data in cluster:", cluster);
            return null;
          }

          const { url, size } = getRotatingVehicleIcon(
            vehicle.vehicleType,
            vehicle.mode,
          );

          const heading =
            Number(
              vehicle.heading ?? vehicle.direction ?? vehicle.bearing ?? 0,
            ) || 0;

          const isSelected = selectedVehicleId === vehicle.vehicle_id;

          return (
            <RotatingVehicleMarker
              key={vehicle.vehicle_id}
              position={latLng}
              iconUrl={url}
              size={size}
              heading={heading}
              isSelected={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStation(null);
                setSelectedVehicleId(vehicle.vehicle_id);
                mapRef.current?.panTo(latLng);
              }}
            />
          );
        })}

        {/* Charging Stations */}
        {visibleStations.map((station) => (
          <ChargingStationMarker
            key={station.id}
            position={{ lat: station.lat, lng: station.lng }}
            isEkaStation={station.type === "EKA"}
            onClick={() => {
              setSelectedVehicleId(null);
              setSelectedStation(station);
            }}
          />
        ))}

        {/* Vehicle InfoWindow – uses live data + offset, same as Home */}
        {canShowInfoWindow && (
          <InfoWindow
            position={{
              lat: parseFloat(liveSelectedVehicle.latitude),
              lng: parseFloat(liveSelectedVehicle.longitude),
            }}
            options={
              infoWindowOffset
                ? {
                    pixelOffset: infoWindowOffset,
                  }
                : undefined
            }
            onCloseClick={() => setSelectedVehicleId(null)}
          >
            <div className={`custom-infowindow ${isDark ? "dark" : ""}`}>
              <div className="infowindow-header">
                <div className="infowindow-row">
                  <Bus size={20} className="infowindow-icon" />
                  <div className="infowindow-title">
                    <span className="title-label">
                      {t("vehicle.vrnChassisNumber", "VRN / Chassis")}
                    </span>
                    <span className="title-value">
                      {liveSelectedVehicle.displayId}
                    </span>
                  </div>
                </div>
                <div className="infowindow-row">
                  <LocalOfferOutlinedIcon
                    size={20}
                    className="infowindow-icon"
                  />
                  <div className="infowindow-title">
                    <span className="title-label">
                      {t("vehicle.vehicleType", "Vehicle Type")}
                    </span>
                    <span className="title-value">
                      {liveSelectedVehicle.vehicleType}
                    </span>
                  </div>
                </div>
                <div className="infowindow-row">
                  <Users size={20} className="infowindow-icon" />
                  <div className="infowindow-title">
                    <span className="title-label">
                      {t("vehicle.fleet", "fleet")}
                    </span>
                    <span className="title-value">
                      {liveSelectedVehicle.fleet ||
                        t("managementDashboard.na", "N/A")}
                    </span>
                  </div>
                </div>
              </div>
              <hr className="infowindow-divider" />
              <div className="infowindow-stats">
                {liveSelectedVehicle.mode === "active" ? (
                  <div className="stat-item">
                    <Gauge size={18} className="stat-icon" />
                    <div>
                      <span className="stat-value">
                        {Number(liveSelectedVehicle.speed ?? 0).toFixed(1)} km/h
                      </span>
                      <span className="stat-label">
                        {liveSelectedVehicle.mode === "active"
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
                      {liveSelectedVehicle.SOC ?? 0}%
                    </span>
                    <span className="stat-label">SOC</span>
                  </div>
                </div>
                <div className="stat-item stat-item-full">
                  <MapPin size={18} className="stat-icon" />
                  <div>
                    <span className="stat-value">
                      {liveSelectedVehicle.city ||
                        t("managementDashboard.unknown", "Unknown")}{" "}
                    </span>
                    <span className="stat-label">
                      {t("vehicle.location&Type", "Location")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Charger InfoWindow */}
        {selectedStation && !isNaN(parseFloat(selectedStation.lat)) && (
          <InfoWindow
            position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
            onCloseClick={() => setSelectedStation(null)}
          >
            <div className={`charger-infowindow ${isDark ? "dark" : ""}`}>
              <h3 className="charger-header">{selectedStation.name}</h3>
              {/* Add more station details here if available */}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

AdvancedDashboardMap.propTypes = {
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      vehicle_id: PropTypes.string.isRequired,
      latitude: PropTypes.string,
      longitude: PropTypes.string,
      vehicleType: PropTypes.string,
      mode: PropTypes.string,
      displayId: PropTypes.string,
      fleet: PropTypes.string,
      speed: PropTypes.number,
      SOC: PropTypes.number,
      heading: PropTypes.number,
      city: PropTypes.string,
    }),
  ).isRequired,
  chargingStations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lat: PropTypes.number,
      lng: PropTypes.number,
      type: PropTypes.oneOf(["EKA", "PUMA"]).isRequired,
    }),
  ).isRequired,
  activeFilter: PropTypes.string.isRequired,
};

AdvancedDashboardMap.defaultProps = {
  vehicles: [],
  chargingStations: [],
  activeFilter: "total",
};

export default React.memo(AdvancedDashboardMap);
