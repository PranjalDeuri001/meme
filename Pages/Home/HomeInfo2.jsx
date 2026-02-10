/* eslint-disable react-hooks/exhaustive-deps */
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

import RotatingVehicleMarker from "./RotatingVehicleMarker";
import CustomClusterMarker from "./CustomClusterMarker";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
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

import { chargingStations, pumaChargingStations } from "../../Data/data";
import { ChargingStationMarker } from "../../Components/Map/MapComponents";

const google_api = import.meta.env.VITE_GOOGLE_API_KEY;
const MAP_LIBRARIES = ["geometry", "maps"];

const LCV_ICON_SIZE_ROTATING = { width: 40, height: 40 };
const BUS_ICON_SIZE_ROTATING = { width: 55, height: 55 };
const ZOOM_ON_CLICK_LEVEL = 15;

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
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
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
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
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
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const LIGHT_CUSTOM_STYLES = `
  .hmap-cont .gm-style-mtc, .hmap-cont .gm-svpc { background: rgba(255, 255, 255, 0.92) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important; }
  .hmap-cont .gm-bundled-control-on-bottom .gmnoprint > div { background-color: transparent !important; box-shadow: none !important; }
  .hmap-cont .gm-bundled-control button, .hmap-cont .gm-fullscreen-control { background-color: rgba(255, 255, 255, 0.92) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important; border-radius: 50% !important; width: 36px !important; height: 36px !important; }
  .hmap-cont .gm-style-iw-chr { height: 10px !important;}
  .hmap-cont .gm-style-cc { border-radius: 6px !important; }
  .hmap-cont .gm-style .gm-style-iw-c { border-radius: 10px !important; background: rgba(255, 255, 255, 0.96) !important; }
  .hmap-cont .gm-style .gm-style-iw-d { overflow: auto !important; scrollbar-width: thin; }
`;

const DARK_CUSTOM_STYLES = `
  .hmap-cont .gm-style-mtc { background: rgba(31,41,55,0.92) !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important; }
  .hmap-cont .gm-style-mtc button, .hmap-cont .gm-style-mtc div { background: transparent !important; color: #e5e7eb !important; }
  .hmap-cont .gm-style-mtc [role="menu"] { background: rgba(31,41,55,0.95) !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important; }
  .hmap-cont .gm-bundled-control-on-bottom .gmnoprint > div { background-color: transparent !important; box-shadow: none !important; }
  .hmap-cont .gm-bundled-control button, .hmap-cont .gm-fullscreen-control, .hmap-cont .gm-svpc button { background: rgba(31,41,55,0.92) !important; border: 1px solid rgba(255,255,255,0.12) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important; border-radius: 50% !important; width: 36px !important; height: 36px !important; }
  .hmap-cont .gmnoprint button img, .hmap-cont .gm-fullscreen-control img { filter: invert(1) hue-rotate(180deg); }
  .hmap-cont .gm-style-cc, .hmap-cont .gm-style-cc div, .hmap-cont .gm-style-cc button, .hmap-cont .gm-style-cc a { background: rgba(17,24,39,0.72) !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 6px !important; }
  .hmap-cont .gm-style .gm-style-iw-c { background: #27303F !important; color: #e5e7eb !important; border-radius: 10px !important; }
  .hmap-cont .gm-style .gm-style-iw-d { color: #e5e7eb !important; }
  .hmap-cont .gm-ui-hover-effect { filter: invert(1) hue-rotate(180deg); }
  .hmap-cont .gm-style .gm-style-iw-t::after { background: rgba(31,41,55,0.96) !important; }
  .hmap-cont .gm-style button, .hmap-cont .gm-style a, .hmap-cont .gm-style span, .hmap-cont .gm-style label, .hmap-cont .gm-style p, .hmap-cont .gm-style strong { color: #e5e7eb !important; }
  .hmap-cont .gm-style-iw-chr { height: 10px !important;}
  .hmap-cont .gm-style .gm-style-iw-d { overflow: auto !important; scrollbar-width: thin; }
`;

const getRotatingVehicleIcon = (model, status) => {
  status = (status || "").toLowerCase();
  const modelLower = (model || "").toLowerCase();
  let iconUrl, size;

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

// --- MODIFIED: Added activeVehicle prop ---
function HomeInfo2({
  vehiclesData,
  selectedModel,
  isMapLoading,
  activeVehicle,
  statusFilter,
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { t, i18n } = useTranslation();
  const [mapLocale] = useState(i18n.language);

  const [filters, setFilters] = useState({
    active: true,
    inactive: true,
    charging: false,
    ekaChargers: false,
    pumaChargers: false,
  });

  // --- NEW: Sync internal filters with external status filter ---
  useEffect(() => {
    if (!statusFilter) return;

    if (statusFilter === "all") {
      setFilters((prev) => ({
        ...prev,
        active: true,
        inactive: true,
        charging: false,
      }));
    } else if (statusFilter === "active") {
      setFilters((prev) => ({
        ...prev,
        active: true,
        inactive: false,
        charging: false,
      }));
    } else if (statusFilter === "inactive") {
      setFilters((prev) => ({
        ...prev,
        active: false,
        inactive: true,
        charging: false,
      }));
    } else if (statusFilter === "nogps") {
      // No GPS vehicles won't show on map anyway (no coordinates)
      // But we set filters to show none active/inactive
      setFilters((prev) => ({
        ...prev,
        active: false,
        inactive: false,
        charging: false,
      }));
    }
  }, [statusFilter]);

  const [isDark, setIsDark] = useState(
    () =>
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark"),
  );

  const [mapType, setMapType] = useState(isDark ? "terrain" : "roadmap");
  const [showTraffic, setShowTraffic] = useState(false);
  const [hasUserSelectedMapType, setHasUserSelectedMapType] = useState(false);

  const initialZoom = 5;
  const initialCenter = { lat: 18.740989, lng: 73.8444 };

  const [zoom, setZoom] = useState(initialZoom);
  const [bounds, setBounds] = useState(null);

  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // --- NEW: React to activeVehicle (from List Click) ---
  useEffect(() => {
    if (activeVehicle && mapRef.current) {
      const lat = parseFloat(activeVehicle.latitude);
      const lng = parseFloat(activeVehicle.longitude);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat !== 0 &&
        lng !== 0
      ) {
        // 1. Pan map to vehicle
        mapRef.current.panTo({ lat, lng });

        // 2. Zoom in close
        mapRef.current.setZoom(18);

        // 3. Open the info window (set internal selected ID)
        setSelectedVehicleId(activeVehicle.vehicle_id);

        // 4. Set interacting flag so the auto-fitter doesn't reset view immediately
        setIsUserInteracting(true);
      }
    }
  }, [activeVehicle]);
  // ---------------------------------------------------

  // Sync theme with root/body class
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const updateTheme = () => {
      const dark =
        root.classList.contains("dark") || body.classList.contains("dark");
      setIsDark(dark);
      if (!hasUserSelectedMapType) {
        setMapType(dark ? "terrain" : "roadmap");
      }
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });

    updateTheme();

    return () => observer.disconnect();
  }, [hasUserSelectedMapType]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: google_api,
    language: mapLocale,
    libraries: MAP_LIBRARIES,
  });

  const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMapInitialized(true);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMapInitialized(false);
  }, []);

  const handleMapIdle = useCallback(() => {
    if (!mapRef.current) return;

    const currentZoom = mapRef.current.getZoom();
    const currentBounds = mapRef.current.getBounds();
    if (!currentBounds) return;

    const boundsJson = currentBounds.toJSON();
    setZoom(currentZoom);
    setBounds([
      boundsJson.west,
      boundsJson.south,
      boundsJson.east,
      boundsJson.north,
    ]);

    // Only mark user interacting if map is fully ready
    if (mapInitialized) {
      // We don't want to set this immediately on load, but after drags
      // Optional: Logic to detect actual drag vs programatic pan
    }
  }, [mapInitialized]);

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

  const handleMapTypeChange = (type) => {
    setMapType(type);
    setHasUserSelectedMapType(true);
  };

  const handleFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
  };

  const visibleStations = useMemo(() => {
    const arr = [];
    if (filters.ekaChargers) arr.push(...chargingStations);
    if (filters.pumaChargers) arr.push(...pumaChargingStations);
    return arr;
  }, [filters.ekaChargers, filters.pumaChargers]);

  const filteredVehicles = useMemo(
    () =>
      vehiclesData.filter((v) => {
        const rawStatus = (v?.mode || "inactive").toLowerCase();
        if (rawStatus === "nogps") return false;

        const normalized = ["active", "inactive", "charging"].includes(
          rawStatus,
        )
          ? rawStatus
          : "inactive";

        return !!filters[normalized];
      }),
    [vehiclesData, filters],
  );

  // Auto-fit bounds ONLY if user hasn't interacted yet
  useEffect(() => {
    setIsUserInteracting(false);
  }, [selectedModel, filters]);

  useEffect(() => {
    if (isUserInteracting) return;
    if (!mapRef.current || !window.google || !filteredVehicles) return;

    if (filteredVehicles.length === 0) {
      if (mapInitialized) {
        mapRef.current.setCenter(initialCenter);
        mapRef.current.setZoom(initialZoom);
      }
      return;
    }

    const boundsObj = new window.google.maps.LatLngBounds();
    let validMarkers = 0;

    filteredVehicles.forEach((vehicle) => {
      const lat = parseFloat(vehicle.latitude);
      const lng = parseFloat(vehicle.longitude);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat !== 0 &&
        lng !== 0
      ) {
        boundsObj.extend({ lat, lng });
        validMarkers++;
      }
    });

    let listener = null;

    if (validMarkers > 0) {
      mapRef.current.fitBounds(boundsObj);
      listener = window.google.maps.event.addListenerOnce(
        mapRef.current,
        "idle",
        () => {
          if (
            mapRef.current &&
            mapRef.current.getZoom() > ZOOM_ON_CLICK_LEVEL
          ) {
            mapRef.current.setZoom(ZOOM_ON_CLICK_LEVEL);
          }
          setIsUserInteracting(true);
        },
      );
    } else if (mapInitialized) {
      mapRef.current.setCenter(initialCenter);
      mapRef.current.setZoom(initialZoom);
    }

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [filteredVehicles, mapInitialized, isUserInteracting]);

  const points = useMemo(
    () =>
      filteredVehicles
        .filter(
          (v) =>
            v.latitude &&
            v.longitude &&
            !isNaN(parseFloat(v.latitude)) &&
            !isNaN(parseFloat(v.longitude)) &&
            parseFloat(v.latitude) !== 0 &&
            parseFloat(v.longitude) !== 0,
        )
        .map((vehicle) => ({
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

  const liveSelectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehiclesData.find((v) => v.vehicle_id === selectedVehicleId);
  }, [selectedVehicleId, vehiclesData]);

  const canShowInfoWindow = useMemo(() => {
    if (!liveSelectedVehicle) return false;
    const lat = parseFloat(liveSelectedVehicle.latitude);
    const lng = parseFloat(liveSelectedVehicle.longitude);
    return (
      Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
    );
  }, [liveSelectedVehicle]);

  const infoWindowOffset = useMemo(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      return new window.google.maps.Size(0, -20);
    }
    return undefined;
  }, []);

  if (loadError) return <div>{t("loadingMessages.errorLoadingMaps")}</div>;
  if (!isLoaded) return <div>{t("loadingMessages.plotting")}</div>;

  const noVehiclesVisible = !isMapLoading && filteredVehicles.length === 0;

  return (
    <div className="w-full h-full hmap-cont" style={{ position: "relative" }}>
      <style>{isDark ? DARK_CUSTOM_STYLES : LIGHT_CUSTOM_STYLES}</style>

      {isMapLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
          <p>{t("loadingMessages.loadingVehicles", "Loading Vehicles...")}</p>
        </div>
      )}

      {noVehiclesVisible && (
        <div className="map-empty-overlay">
          <div className="map-empty-card">
            <p>
              {t(
                "map.noVehicles",
                "No vehicles available to display on the map.",
              )}
            </p>
            <p style={{ fontSize: "0.9em", opacity: 0.8, marginTop: "8px" }}>
              {t(
                "map.noVehiclesHint",
                "Vehicles without GPS signals or that don't match the selected filters cannot be shown.",
              )}
            </p>
          </div>
        </div>
      )}

      <button
        className="map-filter-fab"
        onClick={(e) => {
          e.stopPropagation();
          setIsFilterPopupOpen(!isFilterPopupOpen);
        }}
      >
        <SlidersHorizontal size={22} />
      </button>

      {/* ... (Filter Popup JSX remains the same) ... */}
      <div
        className={`map-filter-popup ${isFilterPopupOpen ? "is-open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-section">
          <div
            className="filter-title"
            style={{ color: isDark ? "#f0f0f0" : "#151d48" }}
          >
            {t("status.vehicleStatus")}
          </div>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={filters.active}
                onChange={handleFilterChange}
              />
              {t("status.active", "Active")}
            </label>
            <label>
              <input
                type="checkbox"
                name="inactive"
                checked={filters.inactive}
                onChange={handleFilterChange}
              />
              {t("status.inactive", "Inactive")}
            </label>
            <label>
              <input
                type="checkbox"
                name="charging"
                checked={filters.charging}
                onChange={handleFilterChange}
              />
              {t("status.charging", "Charging")}
            </label>
          </div>
        </div>
        <div className="filter-section">
          <div
            className="filter-title"
            style={{ color: isDark ? "#f0f0f0" : "#151d44" }}
          >
            {t("vehicle.chargingStation")}
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
          <div
            className="filter-title"
            style={{ color: isDark ? "#f0f0f0" : "#151d48" }}
          >
            {t("map.mapView", "Map View")}
          </div>
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
          <div
            className="filter-title"
            style={{ color: isDark ? "#f0f0f0" : "#151d48" }}
          >
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
        mapContainerStyle={containerStyle}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onIdle={handleMapIdle}
        onClick={() => {
          setIsFilterPopupOpen(false);
          setSelectedVehicleId(null);
          setSelectedStation(null);
        }}
      >
        {showTraffic && <TrafficLayer />}

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
                  setIsUserInteracting(true);
                }}
              />
            );
          }

          const vehicle = cluster.properties.vehicleData;
          if (!vehicle) return null;
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
                setIsUserInteracting(true);
              }}
            />
          );
        })}

        {canShowInfoWindow && (
          <InfoWindow
            position={{
              lat: parseFloat(liveSelectedVehicle.latitude),
              lng: parseFloat(liveSelectedVehicle.longitude),
            }}
            options={
              infoWindowOffset ? { pixelOffset: infoWindowOffset } : undefined
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
                      {liveSelectedVehicle.fleet || "N/A"}
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
                      {Math.round(liveSelectedVehicle.SOC || 0)}%
                    </span>
                    <span className="stat-label">SOC</span>
                  </div>
                </div>
                <div className="stat-item stat-item-full">
                  <MapPin size={18} className="stat-icon" />
                  <div>
                    <span className="stat-value">
                      {liveSelectedVehicle.city}
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

        {visibleStations.map((station, index) => {
          const lat = parseFloat(station.latitude);
          const lng = parseFloat(station.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const isEkaStation = chargingStations.some(
            (s) =>
              s.latitude === station.latitude &&
              s.longitude === station.longitude,
          );
          const isSelected = selectedStation === station;

          return (
            <React.Fragment key={`station-${index}`}>
              <ChargingStationMarker
                position={{ lat, lng }}
                onClick={() => {
                  setSelectedVehicleId(null);
                  setSelectedStation(station);
                  setIsUserInteracting(true);
                }}
                isEkaStation={isEkaStation}
              />
              {isSelected && (
                <InfoWindow
                  position={{ lat, lng }}
                  onCloseClick={() => setSelectedStation(null)}
                >
                  <div className={`charger-infowindow ${isDark ? "dark" : ""}`}>
                    <h3 className="charger-header">{station.name}</h3>
                    <hr className="charger-divider" />
                    <div className="charger-info-body">
                      {station.address && (
                        <div className="charger-info-row">
                          <MapPin size={16} className="charger-info-icon" />
                          <div className="charger-info-text">
                            <span className="charger-info-label">
                              {t("map.address", "Address")}
                            </span>
                            <span className="charger-info-value">
                              {station.address}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}

HomeInfo2.propTypes = {
  vehiclesData: PropTypes.arrayOf(
    PropTypes.shape({
      vehicle_id: PropTypes.string.isRequired,
      latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      vehicleType: PropTypes.string.isRequired,
      mode: PropTypes.string,
      displayId: PropTypes.string,
      fleet: PropTypes.string,
      speed: PropTypes.number,
      SOC: PropTypes.number,
      heading: PropTypes.number,
      city: PropTypes.string,
    }),
  ).isRequired,
  selectedModel: PropTypes.string,
  isMapLoading: PropTypes.bool,
  activeVehicle: PropTypes.object, // --- Added Prop Type
  statusFilter: PropTypes.string,
};

HomeInfo2.defaultProps = {
  selectedModel: null,
  isMapLoading: false,
  activeVehicle: null, // --- Added Default Prop
  statusFilter: "all",
};

export default React.memo(HomeInfo2);
