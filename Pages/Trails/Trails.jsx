// src/components/Trails/Trails.jsx
"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Trails.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useJsApiLoader } from "@react-google-maps/api";
import { useGetVehiclesQuery } from "../../store/apiSlice";

// --- Components ---
import TrailInfoPanel from "./TrailInfoPanel";
import TrailForm from "./TrailForm";
import PlayerControls from "./PlayerControls";
import SimplificationControl from "./SimplificationControl";

// --- Utils & Workers ---
import SimplifyWorker from "../../utils/simplify.worker.js?worker";
import { createRotatableMarkerClass } from "../../utils/RotatableMarker";

// --- Assets ---
import Bus12M from "../../Assets/Map Icons/Bus/12M/Moving.svg";
import Bus13_5M from "../../Assets/Map Icons/Bus/13.5M/Moving.svg";
import Scv3S from "../../Assets/Map Icons/Scv/3S/Moving.svg"; // Path as per instruction
import Truck55T from "../../Assets/Map Icons/Truck/55T/Moving.svg";
import Truck5T from "../../Assets/Map Icons/Truck/7T/Moving.svg"; // Path as per instruction
import Scv6S from "../../Assets/Map Icons/Scv/6S/Moving.svg";
import Bus7M from "../../Assets/Map Icons/Bus/7M/Moving.svg";
import Bus9M from "../../Assets/Map Icons/Bus/9M/Moving.svg";

// ====================================================================
// --- CONSTANTS & CONFIG ---
// ====================================================================
const authApiUrl = import.meta.env.VITE_API_URL_3 || 'http://192.168.24.57:8002';
const BACKEND_URL = import.meta.env.VITE_API_URL_3;
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MAP_LIBRARIES = ["geometry", "maps"];

const SPEED_VALUES = [1000, 500, 250, 125];
const SPEED_LABELS = ["1x", "2x", "4x", "6x"];

const OVER_SPEED_LIMIT = 80;
const STOP_DURATION_SECONDS = 300;

// --- Map Styles (Matches AdvancedDashboardMap.jsx) ---
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
  .trails-map-wrapper .gm-style-mtc,
  .trails-map-wrapper .gm-bundled-control-on-bottom .gmnoprint > div {
    color: #232426 !important; background: rgba(255, 255, 255, 0.92) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
  }
  .player-controls {
    background: rgba(255, 255, 255, 0.8) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
  }
  .player-time-display { color: #334155 !important; }
  
  .trails-map-wrapper .gm-style .gm-style-iw-c:not(.event-tooltip-window) {
    color: #1e293b !important; background: rgba(255, 255, 255, 0.96) !important; backdrop-filter: blur(10px) !important; border-radius: 10px !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
    padding: 0 !important;
  }
  .trails-map-wrapper .gm-style .gm-style-iw-d { 
    overflow: auto !important; 
    scrollbar-width: thin;
    scrollbar-color: #b0b0b0 #e0e0e0;
  }
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar { width: 8px; }
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar-track { background: #e0e0e0; }
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar-thumb {
    background-color: #b0b0b0;
    border-radius: 4px;
  }
  
  .bus-tooltip-content-wrapper { padding: 12px 16px; font-family: 'Exo 2', sans-serif; font-size: 14px; }
  
  /* --- FIX: CLOSE BUTTON VISIBILITY (LIGHT) --- */
  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect {
    background: rgba(0, 0, 0, 0.08) !important;
    border-radius: 50% !important;
    width: 30px !important;
    height: 30px !important;
    top: 6px !important;
    right: 6px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 1 !important;
    z-index: 10000 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect > * {
    display: none !important;
  }

  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect::after {
    content: "✕" !important;
    font-size: 16px !important;
    color: #333 !important;
    font-weight: bold !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  .trails-map-wrapper .gm-style .gm-style-iw-c.event-tooltip-window {
    background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(8px) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 8px !important; padding: 0 !important; min-width: 200px !important;
  }
  .event-tooltip-content { padding: 10px 14px; font-family: "Exo 2", sans-serif; line-height: 1.5; font-size: 13px; color: #333; }
  .event-tooltip-content strong { display: block; font-size: 14px; margin-bottom: 4px; color: #000; }
`;

const DARK_CUSTOM_STYLES = `
  /* 1. ADAPTED FROM MANAGEMENT DASHBOARD REFERENCE */
  .trails-map-wrapper .gm-style-mtc { 
    background: rgba(31,41,55,0.92) !important; 
    color: #e5e7eb !important; 
    border: 1px solid rgba(255,255,255,0.12) !important; 
    border-radius: 8px !important; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.45) !important; 
  }
  .trails-map-wrapper .gm-style-mtc button, .trails-map-wrapper .gm-style-mtc div { 
    background: transparent !important; 
    color: #e5e7eb !important; 
  }
  
  /* Container for bottom controls */
  .trails-map-wrapper .gm-bundled-control-on-bottom .gmnoprint > div { 
    background-color: transparent !important; 
    box-shadow: none !important; 
    gap: 4px !important;
  }
  
  /* Invert Icon Colors */
  .trails-map-wrapper .gmnoprint button img, 
  .trails-map-wrapper .gm-fullscreen-control img { 
    filter: invert(1) hue-rotate(180deg); 
  }
  
  /* Copyright & Terms */
  .trails-map-wrapper .gm-style-cc, 
  .trails-map-wrapper .gm-style-cc div, 
  .trails-map-wrapper .gm-style-cc button, 
  .trails-map-wrapper .gm-style-cc a { 
    background: rgba(17,24,39,0.72) !important; 
    color: #e5e7eb !important; 
    border: 1px solid rgba(255,255,255,0.12) !important; 
  }
  
  /* Hide arrows */
  .trails-map-wrapper .gm-bundled-control .gmnoprint > div > div { display: none !important; }

  /* 2. PLAYER CONTROLS (Preserved) */
  .player-controls {
    background: rgba(30, 41, 59, 0.85) !important; 
    backdrop-filter: blur(12px) !important; 
    border: 1px solid rgba(255, 255, 255, 0.15) !important; 
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2) !important; 
    color: #fff !important;
  }
  .player-time-display { color: #e5e7eb !important; }

  /* 3. INFO WINDOWS (Matches Management Dashboard) */
  .trails-map-wrapper .gm-style .gm-style-iw-c { 
    background: #27303F !important; 
    color: #e5e7eb !important; 
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important; 
    padding: 0 !important;
  }
  
  /* Tail color */
  .trails-map-wrapper .gm-style .gm-style-iw-t::after { 
    background: #27303F !important; 
  }
  
  /* Scrollbar logic */
  .trails-map-wrapper .gm-style .gm-style-iw-d { 
    overflow: auto !important; 
    scrollbar-width: thin; 
    scrollbar-color: #4a5568 #2d3748; 
  }
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar { width: 8px; } 
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar-track { background: #2d3748; } 
  .trails-map-wrapper .gm-style .gm-style-iw-d::-webkit-scrollbar-thumb { background-color: #4a5568; border-radius: 4px; }

  /* Tooltip text padding */
  .bus-tooltip-content-wrapper { padding: 12px 16px; font-family: 'Exo 2', sans-serif; font-size: 14px; }

  /* 4. CLOSE BUTTON FIX (Retained) */
  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect {
    background: rgba(255, 255, 255, 0.15) !important;
    border-radius: 50% !important;
    width: 30px !important;
    height: 30px !important;
    top: 6px !important;
    right: 6px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 1 !important;
    z-index: 10000 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Nuke Children */
  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect > * { display: none !important; }

  /* Insert White X */
  .trails-map-wrapper .gm-style .gm-style-iw-c button.gm-ui-hover-effect::after {
    content: "✕" !important;
    font-size: 16px !important;
    color: #ffffff !important;
    font-weight: bold !important;
    line-height: 1 !important;
    margin: 0 !important;
  }
`;

// Helper: Date Formatting
const formatDateForAPI = (dateObj) => {
  if (!dateObj) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Data Normalization
const normalizePointData = (item) => {
  if (!item.timestamp) return null;
  const dateObj = new Date(item.timestamp);
  if (isNaN(dateObj.getTime())) return null;
  dateObj.setHours(dateObj.getHours() - 5);
  dateObj.setMinutes(dateObj.getMinutes() - 30);
  const normalizedTime = dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return {
    lat: Number.parseFloat(item.latitude),
    lng: Number.parseFloat(item.longitude),
    time: normalizedTime || "00:00:00",
    speed: item.speed ?? "0",
    soc: item.A_SOC_Value ?? "0",
    accPedal: item.Accpedal_Position ?? "0",
    brakePedal: item.Brake_Pedal_Position ?? "0",
    motorSpeed: item.MCU_MotorSpeed ?? "0",
    motorTorque: item.MCU_MotorTorqueEstimated ?? "0",
    batteryCurrent: item.A_Pack_Current_Value ?? "0",
    totalDistance: item.odometer ?? "0",
    fault_counts: item.fault_counts ?? 0,
    heading: item.heading ?? 0,
  };
};

const Trails = () => {
  const { t } = useTranslation();

  // -- Auth & Config --
  const userInfo = useSelector((state) => state.auth.userInfo);

  // ✅ FIX: Use RTK Query to fetch vehicles instead of userInfo.devices
  const { data: vehicleData = [], isLoading: isLoadingVehicles, error: vehiclesError } = useGetVehiclesQuery(undefined, { skip: !userInfo });

  // ✅ Transform vehicle data to match expected format
  const userDevices = useMemo(() => {
    if (!vehicleData || vehicleData.length === 0) {
      return [];
    }

    const transformed = vehicleData.map(v => ({
      device_id: v.vehicle_id,
      device_type_name: v.vehicleType,
      city: v.city,
      VRN: v.displayId,
      chassis_number: v.displayId,
      fleet_name: v.fleet || "N/A",
    }));

    return transformed;
  }, [vehicleData]);

  // -- Google Maps Loader --
  const { isLoaded: isMapsApiLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  // -- UI State --
  const [selectedFleet, setSelectedFleet] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [date, setDate] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeVehicleType, setActiveVehicleType] = useState("");
  const [showNoDataOverlay, setShowNoDataOverlay] = useState(false);

  // --- Lock State ---
  const [isMapUnlocked, setIsMapUnlocked] = useState(false);

  const [simplificationTolerance, setSimplificationTolerance] = useState(0.0001);

  // -- Data State --
  const [trailData, setTrailData] = useState([]);
  const [originalTrailData, setOriginalTrailData] = useState([]);
  const [tripSummary, setTripSummary] = useState(null);

  // -- Player State --
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);

  // -- Refs --
  const googleMapRef = useRef(null);
  const progressRef = useRef(0);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const lastThrottleUpdateRef = useRef(0);
  const lastTooltipUpdateRef = useRef(0); // <-- NEW: For throttling DOM updates
  const isDarkRef = useRef(false); // Ref to track theme for imperative updates
  const isFollowingRef = useRef(true);

  // --- Refs for Request Management ---
  const abortControllerRef = useRef(null);
  const workerRef = useRef(null);

  const mapEntitiesRef = useRef({
    busMarker: null,
    coveredRoute: null,
    fullRoute: null,
    startMarker: null,
    endMarker: null,
    infoWindow: null, // Vehicle Tooltip
    tooltipAnchor: null,
    eventMarkers: [],
    eventInfoWindow: null, // Event Tooltip
  });

  // -- VALIDATION: Check Environment Variables --
  useEffect(() => {
    if (!MAPS_API_KEY) {
      console.error("CRITICAL: Missing Environment Variables (VITE_GOOGLE_API_KEY)");
      toast.error("System Configuration Error: Missing Google Maps API Key.");
    }
  }, []);

  // -- CLEANUP: Master cleanup on unmount --
  useEffect(() => {
    return () => {
      // Stop animation
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      // Terminate active request and worker
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (workerRef.current) workerRef.current.terminate();

      // Remove Map Entities to prevent memory leaks
      const entities = mapEntitiesRef.current;
      if (entities.busMarker) entities.busMarker.setMap(null);
      if (entities.fullRoute) entities.fullRoute.setMap(null);
      if (entities.coveredRoute) entities.coveredRoute.setMap(null);
      if (entities.startMarker) entities.startMarker.setMap(null);
      if (entities.endMarker) entities.endMarker.setMap(null);
      entities.eventMarkers.forEach(m => m.setMap(null));
      if (entities.infoWindow) entities.infoWindow.close();
      if (entities.eventInfoWindow) entities.eventInfoWindow.close();
    };
  }, []);

  // -- Theme Watcher --
  useEffect(() => {
    const checkDark = () =>
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark");

    const darkMode = checkDark();
    setIsDark(darkMode);
    isDarkRef.current = darkMode; // Sync Ref

    const observer = new MutationObserver(() => {
      const newDark = checkDark();
      setIsDark(newDark);
      isDarkRef.current = newDark; // Sync Ref
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // -- Map Initialization (Immediate) --
  const initializeMap = useCallback(() => {
    if (!window.google || !document.getElementById("mapContainer")) return;

    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: 20.5937, lng: 78.9629 });
      googleMapRef.current.setZoom(5);
      googleMapRef.current.setOptions({
        styles: isDark ? DARK_MAP_STYLES : null,
        mapTypeId: isDark ? "terrain" : "roadmap",
        zoomControl: false,
        backgroundColor: isDark ? "#242f3e" : "#ffffff", // Force bg color
      });
      return;
    }

    const map = new window.google.maps.Map(document.getElementById("mapContainer"), {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapTypeId: isDark ? "terrain" : "roadmap",
      styles: isDark ? DARK_MAP_STYLES : null,
      backgroundColor: isDark ? "#242f3e" : "#ffffff", // Initial bg color
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
      zoomControl: false,
    });

    map.addListener("dragstart", () => { isFollowingRef.current = false; });
    map.addListener("zoom_changed", () => { isFollowingRef.current = false; });

    mapEntitiesRef.current.eventInfoWindow = new window.google.maps.InfoWindow({
      className: "event-tooltip-window",
      pixelOffset: new window.google.maps.Size(0, 0)
    });

    googleMapRef.current = map;
  }, [isDark]);

  useEffect(() => {
    if (isMapsApiLoaded && !googleMapRef.current) {
      initializeMap();
    }
  }, [isMapsApiLoaded, initializeMap]);

  // -- CRITICAL FIX: Robust Dynamic Switch --
  useEffect(() => {
    if (googleMapRef.current) {
      const map = googleMapRef.current;
      map.setOptions({
        mapTypeId: isDark ? "terrain" : "roadmap",
        styles: isDark ? DARK_MAP_STYLES : null,
        backgroundColor: isDark ? "#242f3e" : "#ffffff",
        zoomControl: false
      });
      window.google.maps.event.trigger(map, "resize");
    }
  }, [isDark]);

  // -- Logic --
  const processEvents = (data) => {
    const events = [];
    let stopStart = null;
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (point.speed > OVER_SPEED_LIMIT) {
        events.push({ type: "Overspeed", lat: point.lat, lng: point.lng, title: "Overspeed", content: `${point.speed} km/h at ${point.time}` });
      }
      if (point.fault_counts > 0 && (!data[i - 1] || data[i - 1].fault_counts === 0)) {
        events.push({ type: "Fault", lat: point.lat, lng: point.lng, title: "Fault", content: `Detected at ${point.time}` });
      }
      if (parseFloat(point.speed) === 0) {
        if (!stopStart) stopStart = point;
      } else {
        if (stopStart) {
          const startTime = new Date(`1970-01-01T${stopStart.time}Z`);
          const endTime = new Date(`1970-01-01T${point.time}Z`);
          const duration = (endTime - startTime) / 1000;
          if (duration > STOP_DURATION_SECONDS) {
            const startSoc = parseFloat(stopStart.soc) || 0;
            const endSoc = parseFloat(point.soc) || 0;
            const socDiff = endSoc - startSoc;
            const isCharging = socDiff > 1;
            events.push({
              type: isCharging ? "Charging" : "Stop",
              lat: stopStart.lat, lng: stopStart.lng,
              title: isCharging ? "Charging" : "Stop",
              startTime: stopStart.time,
              durationMinutes: Math.round(duration / 60),
              socAdded: isCharging ? socDiff.toFixed(1) : null,
              content: isCharging ? `+${socDiff.toFixed(1)}% over ${Math.round(duration / 60)} min` : `${Math.round(duration / 60)} min stop`
            });
          }
          stopStart = null;
        }
      }
    }
    return events;
  };

  const setupMapEntities = (points, events, currentVehicleType) => {
    if (!googleMapRef.current) initializeMap();
    if (!googleMapRef.current) return;

    const map = googleMapRef.current;

    // Cleanup
    const entities = mapEntitiesRef.current;
    if (entities.fullRoute) entities.fullRoute.setMap(null);
    if (entities.coveredRoute) entities.coveredRoute.setMap(null);
    if (entities.busMarker) entities.busMarker.setMap(null);
    if (entities.startMarker) entities.startMarker.setMap(null);
    if (entities.endMarker) entities.endMarker.setMap(null);
    entities.eventMarkers.forEach(m => m.setMap(null));
    entities.eventMarkers = [];
    if (entities.eventInfoWindow) entities.eventInfoWindow.close();

    const path = points.map(p => ({ lat: p.lat, lng: p.lng }));

    entities.fullRoute = new window.google.maps.Polyline({
      path, map, geodesic: true, strokeColor: "#808080", strokeOpacity: 0.5, strokeWeight: 4
    });

    entities.coveredRoute = new window.google.maps.Polyline({
      path: [path[0]], map, geodesic: true, strokeColor: "#007bff", strokeOpacity: 1.0, strokeWeight: 4, zIndex: 99
    });

    entities.startMarker = new window.google.maps.Marker({
      position: path[0], map, title: "Start",
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#28a745", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 }
    });
    entities.endMarker = new window.google.maps.Marker({
      position: path[path.length - 1], map, title: "End",
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#dc3545", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 }
    });

    const RotatableMarker = createRotatableMarkerClass(window.google);

    const getVehicleAssets = (type) => {
      switch (type) {
        case "12M":   return { icon: Bus12M, w: 100, h: 80 };
        case "13.5M": return { icon: Bus13_5M, w: 100, h: 80 };
        case "3S":    return { icon: Scv3S, w: 70, h: 55 };
        case "55T":   return { icon: Truck55T, w: 100, h: 80 };
        case "5T":    return { icon: Truck5T, w: 100, h: 80 };
        case "6S":    return { icon: Scv6S, w: 70, h: 55 };
        case "7M":    return { icon: Bus7M, w: 100, h: 80 };
        case "9M":    return { icon: Bus9M, w: 100, h: 80 };
        default:      return { icon: Bus12M, w: 100, h: 80 }; // Fallback for undefined types
      }
    };

    const { icon: vehicleIcon, w: width, h: height } = getVehicleAssets(currentVehicleType);

    entities.busMarker = new RotatableMarker(path[0], vehicleIcon, map, width, height, () => {
      // Force Close event window before opening Bus Window
      if (entities.eventInfoWindow) entities.eventInfoWindow.close();
      if (entities.infoWindow) {
        entities.infoWindow.open({ anchor: entities.tooltipAnchor, map });
        // Fix: Force update content immediately (bypass throttle)
        updateVisuals(progressRef.current, true);
      }
    });

    entities.tooltipAnchor = new window.google.maps.Marker({ position: path[0], map, visible: false });
    entities.infoWindow = new window.google.maps.InfoWindow({
      pixelOffset: new window.google.maps.Size(0, -(height / 2) - 10),
      disableAutoPan: true
    });
    entities.infoWindow.open({ anchor: entities.tooltipAnchor, map });

    events.forEach(event => {
      let icon;
      if (event.type === 'Overspeed') icon = { path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#f39c12", scale: 5, strokeColor: "white", strokeWeight: 1, fillOpacity: 1 };
      else if (event.type === 'Fault') icon = { path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#e74c3c", scale: 5, strokeColor: "white", strokeWeight: 1, fillOpacity: 1 };
      else if (event.type === 'Charging') icon = { path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#16a34a", scale: 5, strokeColor: "white", strokeWeight: 1, fillOpacity: 1 };
      else icon = { path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#3498db", scale: 5, strokeColor: "white", strokeWeight: 1, fillOpacity: 1 };

      const marker = new window.google.maps.Marker({ position: { lat: event.lat, lng: event.lng }, map, icon, title: event.title, zIndex: 100 });
      marker.addListener('click', () => {
        setIsPaused(true);
        // Force close vehicle window before opening event window
        if (entities.infoWindow) entities.infoWindow.close();
        entities.eventInfoWindow.setContent(`
                <div class="event-tooltip-content">
                    <strong>${event.title}</strong>
                    <p>${event.content}</p>
                </div>
             `);
        entities.eventInfoWindow.open(map, marker);
      });
      entities.eventMarkers.push(marker);
    });

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds);
  };

  // --- NEW: Centralized Cancel Handler ---
  const handleCancelRequest = useCallback(() => {
    // 1. Abort Fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Terminate Worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    // 3. Reset Loading State
    setIsLoading(false);
    toast.info("Request cancelled.");
  }, []);

  const handleSubmit = async () => {
    // Abort previous if any (Safety check)
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Terminate existing worker if any
    if (workerRef.current) workerRef.current.terminate();

    setIsLoading(true);
    resetPlayerState(); // <-- This now clears the map immediately
    if (!googleMapRef.current) initializeMap();

    try {
      // ✅ TEMPORARY FIX: Use Username instead of Token for Authentication
      // const token = getAccessToken();
      // if (!token) { ... }

      const formattedDate = formatDateForAPI(date);
      // Append username to query params
      const url = `${authApiUrl}/devices/daily-trail/?device_id=${deviceId}&date=${formattedDate}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          // Authorization: `Bearer ${token}`, // <-- COMMENTED OUT
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Fetch failed");

      const data = await response.json();
      const resultsArray = Array.isArray(data) ? data : (data.results || []);

      const validPoints = resultsArray
        .filter(item => item.latitude && item.longitude && parseFloat(item.latitude) !== 0)
        .map(normalizePointData)
        .filter(Boolean);

      if (validPoints.length === 0) {
        toast.warning(t("userAlerts.noValidDataFound", "No Data Found"));
        setShowNoDataOverlay(true);
        abortControllerRef.current = null;
        setIsLoading(false);
        return;
      }

      // --- UNLOCK ANIMATION ---
      setIsMapUnlocked(true);

      // -- INIT WORKER --
      const worker = new SimplifyWorker();
      workerRef.current = worker;

      // -- ERROR HANDLING --
      worker.onerror = (err) => {
        console.error("Worker processing failed:", err);
        toast.error(t("userAlerts.processingError", "Error processing map data (Worker Failed)."));
        // Cleanup
        worker.terminate();
        workerRef.current = null;
        abortControllerRef.current = null;
        setIsLoading(false);
      };

      worker.postMessage({ points: validPoints, tolerance: simplificationTolerance });

      worker.onmessage = (e) => {
        const simplifiedPoints = e.data;
        if (simplifiedPoints && simplifiedPoints.length > 0) {
          setOriginalTrailData(validPoints);
          setTrailData(simplifiedPoints);
          setActiveVehicleType(vehicleType);

          const events = processEvents(validPoints);
          setupMapEntities(simplifiedPoints, events, vehicleType);
          updateVisuals(0);

          const pFirst = validPoints[0];
          const pLast = validPoints[validPoints.length - 1];
          const dist = (parseFloat(pLast.totalDistance) - parseFloat(pFirst.totalDistance)).toFixed(1);

          const speeds = validPoints.map(p => parseFloat(p.speed) || 0);
          const maxS = speeds.length ? Math.max(...speeds) : 0;
          const avgS = speeds.length ? (speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;

          const enrichedStops = events
            .filter(e => e.type === "Stop" || e.type === "Charging")
            .map(ev => ({ ...ev, socAtStop: validPoints.find(vp => vp.time === ev.startTime)?.soc || 'N/A' }));

          setTripSummary({
            startTime: pFirst.time, endTime: pLast.time,
            startSoC: pFirst.soc, endSoC: pLast.soc,
            totalDistance: dist,
            maxSpeed: maxS.toFixed(0),
            avgSpeed: avgS.toFixed(0),
            stops: enrichedStops
          });
        } else {
          toast.warning(t("userAlerts.noValidDataFound", "No Data Found"));
          setShowNoDataOverlay(true);
        }
        // Success Cleanup
        worker.terminate();
        workerRef.current = null;
        abortControllerRef.current = null;
        setIsLoading(false);
      };
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        toast.error(t("userAlerts.mapLoadError"));
      }
      // Error Cleanup
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const updateVisuals = (progressFloat, forceUpdate = false) => {
    const idx = Math.floor(progressFloat);
    const nextIdx = Math.min(idx + 1, trailData.length - 1);
    const ratio = progressFloat - idx;

    const p1 = trailData[idx];
    const p2 = trailData[nextIdx];
    const entities = mapEntitiesRef.current;

    if (!p1 || !entities.busMarker) return;

    let lat, lng, heading;
    if (p1 && p2) {
      lat = p1.lat + (p2.lat - p1.lat) * ratio;
      lng = p1.lng + (p2.lng - p1.lng) * ratio;
      heading = window.google.maps.geometry.spherical.computeHeading(
        new window.google.maps.LatLng(p1.lat, p1.lng),
        new window.google.maps.LatLng(p2.lat, p2.lng)
      );
    } else {
      lat = p1.lat; lng = p1.lng; heading = 0;
    }

    const pos = new window.google.maps.LatLng(lat, lng);

    // 1. High Frequency Updates (60fps)
    entities.busMarker.updatePosition(pos);
    if (heading && Math.abs(heading) > 0.1) entities.busMarker.updateRotation(heading);

    entities.tooltipAnchor.setPosition(pos);

    const path = entities.fullRoute.getPath().getArray().slice(0, idx + 1);
    path.push(pos);
    entities.coveredRoute.setPath(path);

    if (isFollowingRef.current && googleMapRef.current) {
      googleMapRef.current.panTo(pos);
    }

    // 2. Throttled DOM Updates (~10fps) for Tooltip
    // Fix: Allow force update (e.g., on click)
    const now = performance.now();
    // CRITICAL FIX: If forceUpdate is true, bypass 'getMap()' check because we just called 'open()'
    // and the map property might not be set synchronously yet.
    if (entities.infoWindow && (forceUpdate || (entities.infoWindow.getMap() && (now - lastTooltipUpdateRef.current > 100)))) {
      // Improved Contrast Colors
      // Fix: Use Ref to avoid stale closure issues in click handlers
      const isDark = isDarkRef.current;
      const textColor = isDark ? '#ffffff' : '#000000'; // Pure White (Dark) vs Pure Black (Light)
      const labelColor = isDark ? '#cbd5e1' : '#374151'; // Slate-300 (Dark) vs Gray-700 (Light)

      const content = `
             <div class="bus-tooltip-content-wrapper" style="color: ${textColor} !important; min-width: 250px;">
               
               <!-- Time Row (Margin added for Close Button) -->
               <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; margin-right: 28px;">
                 <div style="display: flex; align-items: center; gap: 8px;">
                   <i class="bi bi-clock" style="font-size: 14px; color: ${labelColor} !important;"></i>
                   <span style="font-weight: 500; font-size: 13px; color: ${labelColor} !important; text-transform: uppercase; letter-spacing: 0.5px;">${t("systemUtility.time", "Time")}</span>
                 </div>
                 <span style="font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">${p1.time}</span>
               </div>

               <!-- Speed Row -->
               <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                 <div style="display: flex; align-items: center; gap: 8px;">
                   <i class="bi bi-speedometer2" style="font-size: 14px; color: ${labelColor} !important;"></i>
                   <span style="font-weight: 500; font-size: 13px; color: ${labelColor} !important; text-transform: uppercase; letter-spacing: 0.5px;">${t("vehicle.speed", "Speed")}</span>
                 </div>
                 <span style="font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">${p1.speed} <span style="font-size: 11px; font-weight: 400; color: ${labelColor} !important;">km/h</span></span>
               </div>

               <!-- SoC Row -->
               <div style="display: flex; align-items: center; justify-content: space-between;">
                 <div style="display: flex; align-items: center; gap: 8px;">
                   <i class="bi bi-lightning-charge-fill" style="font-size: 14px; color: ${Number(p1.soc) < 20 ? '#ef4444' : (Number(p1.soc) < 50 ? '#f59e0b' : '#22c55e')};"></i>
                   <span style="font-weight: 500; font-size: 13px; color: ${labelColor} !important; text-transform: uppercase; letter-spacing: 0.5px;">${t("vehicle.stateOfCharge", "SoC")}</span>
                 </div>
                 <span style="font-weight: 600; font-size: 14px; color: ${textColor} !important;">${p1.soc}<span style="font-size: 11px; margin-left: 2px;">%</span></span>
               </div>

             </div>`;
      entities.infoWindow.setContent(content);
      lastTooltipUpdateRef.current = now;
    }
  };

  const animate = (timestamp) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    if (!isPaused && trailData.length > 0) {
      const msPerPoint = SPEED_VALUES[speedIndex];
      progressRef.current += (deltaTime / msPerPoint);

      if (progressRef.current >= trailData.length - 1) {
        progressRef.current = trailData.length - 1;
        setIsPaused(true);
      }

      updateVisuals(progressRef.current);

      if (timestamp - lastThrottleUpdateRef.current > 200) {
        setCurrentIndex(Math.floor(progressRef.current));
        lastThrottleUpdateRef.current = timestamp;
      }
    }

    if (!isPaused) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (!isPaused) {
      lastFrameTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
      const idx = Math.floor(progressRef.current);
      setCurrentIndex(idx);
      if (trailData.length > 0) updateVisuals(progressRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused, trailData, speedIndex, isDark]); // <-- Added isDark dependency

  // --- UPDATED: Clears map visuals immediately ---
  const resetPlayerState = () => {
    setIsPaused(true);
    progressRef.current = 0;
    setCurrentIndex(0);
    setTrailData([]);
    setOriginalTrailData([]);
    setShowNoDataOverlay(false);
    isFollowingRef.current = true;
    setTripSummary(null);

    // Clear Map Entities Immediately
    const entities = mapEntitiesRef.current;
    if (entities.fullRoute) entities.fullRoute.setMap(null);
    if (entities.coveredRoute) entities.coveredRoute.setMap(null);
    if (entities.busMarker) entities.busMarker.setMap(null);
    if (entities.startMarker) entities.startMarker.setMap(null);
    if (entities.endMarker) entities.endMarker.setMap(null);
    if (entities.eventMarkers) {
      entities.eventMarkers.forEach(m => m.setMap(null));
      entities.eventMarkers = []; // Clear array
    }
    if (entities.infoWindow) entities.infoWindow.close();
    if (entities.eventInfoWindow) entities.eventInfoWindow.close();
  };

  const handleSliderChange = (val) => {
    progressRef.current = val;
    setCurrentIndex(val);
    updateVisuals(val);
  };

  // Wrapped in useCallback for stability
  const handleStopClick = useCallback((stop) => {
    setIsPaused(true);
    const map = googleMapRef.current;
    const entities = mapEntitiesRef.current;

    if (!map) return;

    map.panTo({ lat: stop.lat, lng: stop.lng });

    const targetMarker = entities.eventMarkers.find(marker => {
      const pos = marker.getPosition();
      const latDiff = Math.abs(pos.lat() - stop.lat);
      const lngDiff = Math.abs(pos.lng() - stop.lng);
      return latDiff < 0.00001 && lngDiff < 0.00001;
    });

    if (targetMarker) {
      window.google.maps.event.trigger(targetMarker, 'click');
    }
  }, []);

  return (
    <>
      <ToastContainer position="top-right" theme={isDark ? "dark" : "light"} />
      <div className="Trails trails-map-wrapper">
        <style>{isDark ? DARK_CUSTOM_STYLES : LIGHT_CUSTOM_STYLES}</style>

        {/* --- FIXED: Passing onCancel prop instead of abortController --- */}
        <TrailForm
          isLoading={isLoading}
          selectedFleet ={selectedFleet}
          setSelectedFleet={setSelectedFleet}
          vehicleType={vehicleType} setVehicleType={setVehicleType}
          selectedCity={selectedCity} setSelectedCity={setSelectedCity}
          deviceId={deviceId} setDeviceId={setDeviceId}
          date={date} setDate={setDate}
          userDevices={userDevices}
          onSubmit={handleSubmit}
          onCancel={handleCancelRequest}
          setIsLoading={setIsLoading}
        />

        <div className="map-and-info">
          <div className="map-wrapper">

            <div
              id="mapContainer"
              className={`map-container ${!isMapUnlocked ? 'locked-blur' : ''}`}
            ></div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="map-loading-overlay">
                <div className="pin"></div>
                <div className="pulse"></div>
              </div>
            )}

            {/* Lock Overlay (Hidden during loading) */}
            {!isMapUnlocked && !isLoading && (
              <div className="map-lock-overlay">
                <h3>Select Parameters</h3>
                <p>{t("userAlerts.selectBothVehicleAndDate", "Please select Parameters to Load Trails")}</p>
              </div>
            )}

            {showNoDataOverlay && (
              <div className="map-no-data-overlay">
                <i className="bi bi-info-circle-fill"></i>
                <p>{t("userAlerts.noValidDataFound", "No data found.")}</p>
              </div>
            )}

            {trailData.length > 0 && isMapUnlocked && !isLoading && (
              <PlayerControls
                isPaused={isPaused}
                onPlayPause={() => setIsPaused(!isPaused)}
                speedLabel={SPEED_LABELS[speedIndex]}
                onSpeedChange={() => setSpeedIndex((prev) => (prev + 1) % SPEED_VALUES.length)}
                onRestart={() => handleSliderChange(0)}
                currentIndex={currentIndex}
                totalPoints={trailData.length}
                onSliderChange={handleSliderChange}
                currentTime={trailData[currentIndex]?.time || "00:00:00"}
                totalTime={trailData[trailData.length - 1]?.time || "00:00:00"}
                timeData={trailData.map((d) => d.time)}
              />
            )}

            {isMapUnlocked && (
              <SimplificationControl
                simplificationTolerance={simplificationTolerance}
                setSimplificationTolerance={(val) => setSimplificationTolerance(val)}
              />
            )}
          </div>

          <div className="info-container">
            <TrailInfoPanel
              data={trailData[currentIndex] || {}}
              vehicleType={activeVehicleType}
              tripSummary={tripSummary}
              onStopClick={handleStopClick}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Trails;