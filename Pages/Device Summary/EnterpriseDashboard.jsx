// EnterpriseDashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
// --- Router Hook for URL State ---
import { useSearchParams } from "react-router-dom";
// --- Icon Imports ---
import { RefreshCw, X, FileDown } from "lucide-react";
import {
  TotalVehiclesIcon,
  DistanceIcon,
  RunningIcon,
  IdleIcon,
  ChargingIcon,
  StoppedIcon,
} from "./DeviceSummaryIcons";
// --- Date Handling ---
import { format } from "date-fns";
// --- XLSX Import for Excel Export ---
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice"; // Adjust path if needed
import useDebounce from "../../hooks/useDebounce";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// --- COMPONENT IMPORTS ---
import KPICard from "./KPICard";
import FleetActivityChart from "./FleetActivityChart";
import FleetStatusChart from "./FleetStatusChart";
import VehicleDetailsTable from "./VehicleDetailsTable";
import VehicleDetailsPanel from "./VehicleDetailsModal";
import DashboardSkeleton from "./DashboardSkeleton";
import RegionCard from "./RegionCard";

// --- CONFIG ---
import { districtToState, stateToRegion } from "./config/regionConfig.js";

// --- STYLES ---
import "./deviceSummary.css";

// --- PROFESSIONAL REGION MAPPING ---
const getRegionFromCity = (city) => {
  if (!city || typeof city !== "string") return "central";
  const lowerCaseCity = city.toLowerCase().trim();
  const state = districtToState[lowerCaseCity];
  if (state) {
    const region = stateToRegion[state] || "Central";
    return region.toLowerCase().replace(" ", "_");
  }
  return "central";
};

// --- CONSTANTS & HELPERS (moved outside component) ---
const ITEMS_PER_PAGE = 15;

const defaultFilters = {
  searchQuery: "",
  status: "All",
  region: "All",
  city: "All",
  fleet: "All",
  vehicleType: "All",
};

const filterBySearch = (vehicles, query) => {
  if (!query) return vehicles;
  const lowerCaseQuery = query.toLowerCase();
  return vehicles.filter(
    (v) =>
      v.id?.toLowerCase().includes(lowerCaseQuery) ||
      v.vrn?.toLowerCase().includes(lowerCaseQuery) ||
      v.chassis_number?.toLowerCase().includes(lowerCaseQuery)
  );
};
const filterByStatus = (vehicles, status) => {
  if (status === "All" || !status) return vehicles;
  return vehicles.filter((v) => v.status === status);
};
const filterByRegion = (vehicles, region) => {
  if (region === "All" || !region) return vehicles;
  return vehicles.filter((v) => v.region === region);
};
const filterByCity = (vehicles, city) => {
  if (city === "All" || !city) return vehicles;
  return vehicles.filter((v) => v.city === city);
};
const filterByFleet = (vehicles, fleet) => {
  if (fleet === "All" || !fleet) return vehicles;
  return vehicles.filter((v) => v.depot === fleet);
};
const filterByVehicleType = (vehicles, vehicleType) => {
  if (vehicleType === "All" || !vehicleType) return vehicles;
  return vehicles.filter((v) => v.vehicle_type_name === vehicleType);
};

const ThemeButton = ({
  children,
  onClick,
  variant = "contained",
  className = "",
  disabled = false,
}) => (
  <button
    onClick={onClick}
    className={`ds-theme-btn ds-theme-btn-${variant} ${className}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const getRegionFromCoords = (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) return "central";
  if (latitude > 28.0) return "north";
  if (latitude < 18.0) return "south";
  if (longitude > 88.0) return "east";
  if (longitude < 75.0) return "west";
  return "central";
};

const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getVehicleIdentifier = (v) => {
  if (v.imei && v.imei !== "-") return v.imei;
  if (v.chassis_number && v.chassis_number !== "-") return v.chassis_number;
  // A more stable fallback than Math.random()
  return `${v.vrn}-${v.date}-${v.start_odometer}`;
};

function EnterpriseDashboard({ isDarkMode = false }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const unknown_ = t("VehicleStatus.unknown", "Unknown");
  const totalFleet_ = t("VehicleStatus.total_fleet", "Total Fleet");
  const dailyDistance_ = t("VehicleStatus.daily_distance", "Daily Distance");
  const running_ = t("VehicleStatus.running", "Running");
  const idle_ = t("VehicleStatus.idle", "Idle");
  const charging_ = t("VehicleStatus.charging", "Charging");
  const stopped_ = t("VehicleStatus.stopped", "Stopped");
  const vehicles_ = t("VehicleStatus.vehicles", "Vehicles");
  const today_ = t("VehicleStatus.today", "km Today");
  const noVehiclesMatchingCriteria_ = t(
    "VehicleStatus.no_vehicles_matching_criteria",
    "No vehicles found matching your criteria."
  );
  const vehicleStatus_ = t("VehicleStatus.vehicle_status", "Vehicle Status");
  const refresh_ = t("VehicleStatus.refresh", "Refresh");
  const noVehicleData_ = t(
    "VehicleStatus.no_vehicle_data",
    "No Vehicle Data Available"
  );
  const noVehicleSummary_ = t(
    "VehicleStatus.no_vehicle_summary",
    "There is no vehicle summary data to display for the selected period."
  );
  const regionalPerformance_ = t(
    "VehicleStatus.regional_performance",
    "Regional Performance"
  );
  const searchVrn_ = t(
    "VehicleStatus.search_vrn",
    "Search by VRN or Chassis No..."
  );
  const status_ = t("VehicleStatus.status", "All Status");
  const regions_ = t("VehicleStatus.regions", "All Regions");
  const cities_ = t("VehicleStatus.cities", "All Cities");
  const fleets_ = t("VehicleStatus.fleets", "All Fleets");
  const vehicleTypes_ = t("VehicleStatus.vehicle_types", "All Vehicle Types");
  const clearFilters_ = t("VehicleStatus.clear_filters", "Clear filters");
  const export_ = t("VehicleStatus.export", "Export");
  // All translation variables ends with a trailing underscore (e.g., totalLabel_)

  const initialFilters = useMemo(
    () => ({
      searchQuery: searchParams.get("search") || "",
      status: searchParams.get("status") || "All",
      region: searchParams.get("region") || "All",
      city: searchParams.get("city") || "All",
      fleet: searchParams.get("fleet") || "All",
      vehicleType: searchParams.get("vehicleType") || "All",
    }),
    [searchParams]
  );

  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;
  const backendUrl = import.meta.env.VITE_API_URL_3;

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [filters, setFilters] = useState(initialFilters);
  const [dateRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 400);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allVehicles, setAllVehicles] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [highlightedStatus, setHighlightedStatus] = useState(null);
  const [error, setError] = useState(null);
  const [regionalData, setRegionalData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "ascending",
  });

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set("search", filters.searchQuery);
    if (filters.status !== "All") params.set("status", filters.status);
    if (filters.region !== "All") params.set("region", filters.region);
    if (filters.city !== "All") params.set("city", filters.city);
    if (filters.fleet !== "All") params.set("fleet", filters.fleet);
    if (filters.vehicleType !== "All")
      params.set("vehicleType", filters.vehicleType);
    if (currentPage > 1) params.set("page", currentPage);
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    document.body.classList.toggle("ds-modal-open", !!selectedVehicle);
    return () => document.body.classList.remove("ds-modal-open");
  }, [selectedVehicle]);

  useEffect(() => {
    if (selectedVehicle) {
      const updatedVehicleData = allVehicles.find(
        (v) => v.id === selectedVehicle.id
      );
      if (updatedVehicleData) {
        setSelectedVehicle(updatedVehicleData);
      }
    }
  }, [allVehicles, selectedVehicle]);

  const fetchData = useCallback(async () => {
    let cleanup = () => {};
    if (!username) {
      setIsLoading(true);
      return cleanup;
    }
    if (allVehicles.length === 0) setIsLoading(true);
    setError(null);

    try {
      const startDate = format(dateRange[0].startDate, "yyyy-MM-dd");
      const endDate = format(dateRange[0].endDate, "yyyy-MM-dd");
      const url = `${backendUrl}/devices/daily-summary-report/?start_date=${startDate}&end_date=${endDate}&username=${username}`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`API request failed with status ${response.status}`);
      const result = await response.json();

      let rawData = result.data || [];

      const uniqueDataMap = new Map();
      rawData.forEach((vehicle) => {
        const vehicleId = getVehicleIdentifier(vehicle);
        uniqueDataMap.set(vehicleId, vehicle);
      });

      const uniqueRawData = Array.from(uniqueDataMap.values());
      const transformedData = uniqueRawData.map((v) => {
        let status;
        switch (v.mode) {
          case "Movement":
            status = "Running";
            break;
          case "Idle":
            status = "Idle";
            break;
          case "Charging":
            status = "Charging";
            break;
          case "Stopped":
            status = "Stopped";
            break;
          default:
            status = "Stopped";
            break;
        }

        let regionKey;
        if (v.city && v.city !== "-") regionKey = getRegionFromCity(v.city);
        else regionKey = getRegionFromCoords(v.latitude, v.longitude);

        const region = t(
          `VehicleStatus.${regionKey}`,
          regionKey.charAt(0).toUpperCase() +
            regionKey.slice(1).replace("_", " ")
        );
        const distance = safeParseFloat(v.distance);
        const energyConsumed = safeParseFloat(v.energy_consumed);
        const energyConsumption = safeParseFloat(v.energy_consumption);

        // const sessionData = v.sessions || v.sesssions;
        const sessions = Array.isArray(v.sessions) ? v.sessions : [];

        let totalSocUsed = 0;
        sessions.forEach((session) => {
          const labelLower = session.label ? session.label.toLowerCase() : "";
          if (labelLower.includes("movement") || labelLower.includes("idle")) {
            const sessionStartSoc = safeParseFloat(session.start_soc_val);
            const sessionEndSoc = safeParseFloat(session.end_soc_val);

            if (sessionStartSoc > sessionEndSoc) {
              totalSocUsed += sessionStartSoc - sessionEndSoc;
            }
          }
        });

        const efficiencyValue =
          totalSocUsed > 0 ? distance / (totalSocUsed * 2.4) : 0;
        const newEfficiencyValue =
          totalSocUsed > 0 ? distance / totalSocUsed : 0;

        return {
          id: getVehicleIdentifier(v),
          vrn: v.vrn,
          imei: v.imei,
          chassis_number: v.chassis_number,
          status,
          latitude: safeParseFloat(v.latitude, null),
          longitude: safeParseFloat(v.longitude, null),
          region: region,
          city: v.city || "N/A",
          depot: v.fleet || "N/A",
          dailyKm: distance.toFixed(1),
          efficiency: efficiencyValue.toFixed(2),
          newEfficiency: newEfficiencyValue.toFixed(2),
          energyConsumed: energyConsumed.toFixed(2),
          energyConsumption: energyConsumption.toFixed(2),
          battery: Math.round(safeParseFloat(v.end_soc)),
          averageSpeed: safeParseFloat(v.average_speed).toFixed(1),
          batteryTemp: safeParseFloat(v.battery_temperature, null) ?? 0,
          motorEc: v.motor_ec ?? "-",
          dcdcEc: v.dcdc_ec ?? "-",
          ecompEc: v.ecompressor_and_steering_ec ?? "-",
          bcsEc: v.bcs_ec ?? "-",
          tcsEc: v.tcs_ec ?? "-",
          motorTemp: safeParseFloat(v.motor_temperature, null) ?? 0,
          date: v.date,
          dayStart: v.start_time_of_day
            ? new Date(v.start_time_of_day).toLocaleTimeString()
            : "N/A",
          dayEnd: v.stop_time_of_day
            ? new Date(v.stop_time_of_day).toLocaleTimeString()
            : "N/A",
          runningTime: safeParseFloat(v.runtime_minutes).toFixed(0),
          idleTime: safeParseFloat(v.idle_minutes).toFixed(0),
          chargingTime: safeParseFloat(v.charging_minutes).toFixed(0),
          stoppageTime: safeParseFloat(v.stoppage_minutes).toFixed(0),
          startOdometer: v.start_odometer ?? "N/A",
          endOdometer: v.end_odometer ?? "N/A",
          startSoc: v.start_soc ?? "N/A",
          endSoc: v.end_soc ?? "N/A",
          regenEnergy: v.regen_energy ?? "-",
          chargingUnit: v.charging_unit ?? 0,
          vehicle_type_name: v.vehicle_type_name,
          depth_of_discharge: v.depth_of_discharge ? "Yes" : "No",
          insufficient_charge: v.insufficient_charge ? "Yes" : "No",
          _raw: {
            dailyKm: distance,
            efficiency: efficiencyValue,
            newEfficiency: newEfficiencyValue,
            energyConsumed: energyConsumed,
            energyConsumption: energyConsumption,
            battery: Math.round(safeParseFloat(v.end_soc)),
            averageSpeed: safeParseFloat(v.average_speed),
            batteryTemp: safeParseFloat(v.battery_temperature, null),
            motorTemp: safeParseFloat(v.motor_temperature, null),
            runningTime: safeParseFloat(v.runtime_minutes),
            idleTime: safeParseFloat(v.idle_minutes),
            chargingTime: safeParseFloat(v.charging_minutes),
            stoppageTime: safeParseFloat(v.stoppage_minutes),
            startSoc: safeParseFloat(v.start_soc),
            regenEnergy: safeParseFloat(v.regen_energy),
            endOdometer: safeParseFloat(v.end_odometer),
            startOdometer: safeParseFloat(v.start_odometer),
          },
          sessions,
        };
      });

      // --- START: SPECIAL OVERRIDE FOR PRESENTATION ---
      const imeisToModify = [
        // "861409075136896",
        // "861919088633267",
        // "861409075032996",
        // "861409075137449",
        // "861409075083106",
        // "861919088658017",
        // "861919088636864",
        // "861919088636369",
        // "8KA919088608947",
        // "8KA919088608947",
        // "861409075083841",
        // "861919088616056",
        // "861919088637078",
        // "861919088636658",
        // "867950074294073",
        // "861409075032574",
        // "861409075127796",
        // "861409075137480",
        // "861409075144957",
        // "867950074346543",
        // "867409071405836",
        // "861919088607386"
      ];
      const finalData = transformedData.map((vehicle) => {
        if (imeisToModify.includes(String(vehicle.imei))) {
          const modifiedVehicle = { ...vehicle, _raw: { ...vehicle._raw } };

          // 1. Remove distance from KPI totals by setting raw value to 0
          modifiedVehicle._raw.dailyKm = 0;

          // 2. Set all specified display values to "-"
          modifiedVehicle.startOdometer = "-";
          modifiedVehicle.endOdometer = "-";
          modifiedVehicle.dailyKm = "-";
          modifiedVehicle.runningTime = "-";
          modifiedVehicle.idleTime = "-";
          modifiedVehicle.chargingTime = "-";
          modifiedVehicle.stoppageTime = "-";
          modifiedVehicle.averageSpeed = "-";
          modifiedVehicle.startSoc = "-";
          modifiedVehicle.battery = "-"; // This is End SOC
          modifiedVehicle.efficiency = "-";
          modifiedVehicle.newEfficiency = "-";
          modifiedVehicle.motorEc = "-";
          modifiedVehicle.dcdcEc = "-";
          modifiedVehicle.ecompEc = "-";
          modifiedVehicle.bcsEc = "-";
          modifiedVehicle.tcsEc = "-";
          modifiedVehicle.energyConsumed = "-";
          modifiedVehicle.energyConsumption = "-";
          modifiedVehicle.regenEnergy = "-";
          modifiedVehicle.chargingUnit = "-";
          modifiedVehicle.batteryTemp = "-";
          modifiedVehicle.motorTemp = "-";

          // 3. Nullify corresponding raw values to ensure correct sorting (sorted to bottom)
          Object.keys(modifiedVehicle._raw).forEach((key) => {
            modifiedVehicle._raw[key] = null;
          });
          modifiedVehicle._raw.dailyKm = 0; // Ensure this is 0 for KPI calc

          return modifiedVehicle;
        }
        return vehicle;
      });
      setAllVehicles(finalData);
      // --- END: SPECIAL OVERRIDE FOR PRESENTATION ---

      // --- REGIONAL DATA CALCULATION ---
      const regionKeys = [
        "central",
        "west",
        "north",
        "south",
        "east",
        "north_east",
      ];

      const primaryRegions = regionKeys.map((key) =>
        t(
          `VehicleStatus.${key}`,
          key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")
        )
      );

      const initialRegionalSummary = primaryRegions.reduce(
        (acc, translatedRegionName) => {
          acc[translatedRegionName] = {
            region: translatedRegionName,
            total: 0,
            running: 0,
            distance: 0,
            faults: 0,
          };
          return acc;
        },
        {}
      );
      const regionalSummary = finalData.reduce((acc, v) => {
        if (!acc[v.region])
          acc[v.region] = {
            region: v.region,
            total: 0,
            running: 0,
            distance: 0,
            faults: 0,
          };
        acc[v.region].total++;
        // Use the raw numeric value for distance calculation
        acc[v.region].distance += v._raw.dailyKm !== null ? v._raw.dailyKm : 0;
        if (v.status === "Running") acc[v.region].running++;
        return acc;
      }, initialRegionalSummary);

      const unknownRegion = unknown_;
      const regionOrder = [...primaryRegions, unknownRegion];

      const sortedRegionalData = Object.values(regionalSummary).sort(
        (a, b) => regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region)
      );
      setRegionalData(sortedRegionalData);
    } catch (err) {
      setError("Could not fetch vehicle data. Please try refreshing the page.");
      console.error("API Fetch Error:", err);
    } finally {
      setIsLoading(false);
      const timeoutId = setTimeout(
        () => setRefreshTrigger((p) => p + 1),
        60000
      );
      cleanup = () => clearTimeout(timeoutId);
    }
    return cleanup;
  }, [backendUrl, dateRange, username, t, allVehicles.length, unknown_]);

  useEffect(() => {
    const promise = fetchData();
    return () => {
      promise.then((cleanup) => cleanup());
    };
  }, [fetchData, refreshTrigger]);

  const baseFilteredData = useMemo(() => {
    let data = allVehicles;
    data = filterByRegion(data, filters.region);
    data = filterByCity(data, filters.city);
    data = filterByFleet(data, filters.fleet);
    data = filterByVehicleType(data, filters.vehicleType);
    return data;
  }, [
    allVehicles,
    filters.region,
    filters.city,
    filters.fleet,
    filters.vehicleType,
  ]);

  // =================================================================
  // --- FIX START: Replaced multiple effects with a single useMemo for performance ---
  // =================================================================
  const derivedData = useMemo(() => {
    if (isLoading && baseFilteredData.length === 0) {
      return {
        kpiData: [],
        fleetStatusData: [],
        activityChartData: null,
        totalFleetCount: 0,
      };
    }

    // 1. Calculate KPIs and Counts
    const totalFleet = baseFilteredData.length;
    const runningCount = baseFilteredData.filter(
      (v) => v.status === "Running"
    ).length;
    const idleCount = baseFilteredData.filter(
      (v) => v.status === "Idle"
    ).length;
    const chargingCount = baseFilteredData.filter(
      (v) => v.status === "Charging"
    ).length;
    const stoppedCount = baseFilteredData.filter(
      (v) => v.status === "Stopped"
    ).length;
    const totalDistance = baseFilteredData.reduce(
      (sum, v) => sum + (v._raw.dailyKm || 0),
      0
    );

    const kpiData = [
      {
        keyName: "Total Fleet",
        icon: TotalVehiclesIcon,
        title: totalFleet_,
        value: totalFleet,
        subText: vehicles_,
      },
      {
        keyName: "Daily Distance",
        icon: DistanceIcon,
        title: dailyDistance_,
        value: totalDistance.toFixed(0),
        subText: today_,
      },
      {
        keyName: "Running",
        icon: RunningIcon,
        title: running_,
        value: runningCount,
      },
      { keyName: "Idle", icon: IdleIcon, title: idle_, value: idleCount },
      {
        keyName: "Charging",
        icon: ChargingIcon,
        title: charging_,
        value: chargingCount,
      },
      {
        keyName: "Stopped",
        icon: StoppedIcon,
        title: stopped_,
        value: stoppedCount,
      },
    ];

    // 2. Calculate Fleet Status (Pie Chart)
    const fleetStatusData = [
      {
        keyName: "Running",
        value: runningCount,
        name: running_,
        itemStyle: { color: "#34d399" },
      },
      {
        keyName: "Idle",
        value: idleCount,
        name: idle_,
        itemStyle: { color: "#f59e0b" },
      },
      {
        keyName: "Charging",
        value: chargingCount,
        name: charging_,
        itemStyle: { color: "#6366f1" },
      },
      {
        keyName: "Stopped",
        value: stoppedCount,
        name: stopped_,
        itemStyle: { color: "#ef4444" },
      },
    ];

    // 3. Calculate Fleet Activity (Line Chart)
    const hourlyActivity = Array.from({ length: 24 }, () => ({
      Running: 0,
      Idle: 0,
      Charging: 0,
      Stopped: 0,
    }));
    baseFilteredData.forEach((vehicle) => {
      const sessions = Array.isArray(vehicle.sessions) ? vehicle.sessions : [];
      const vehicleHourlyStatus = new Array(24).fill("Stopped");
      sessions.forEach((session) => {
        if (!session.start_time_val || !session.end_time_val || !session.label)
          return;
        const start = new Date(session.start_time_val);
        const end = new Date(session.end_time_val);
        const startHour = start.getHours();
        const endHour = end.getHours();
        const labelLower = session.label.toLowerCase();
        let statusKey = null;
        if (labelLower.includes("movement")) statusKey = "Running";
        else if (labelLower.includes("idle")) statusKey = "Idle";
        else if (labelLower.includes("charging")) statusKey = "Charging";

        if (statusKey) {
          if (startHour <= endHour) {
            for (let h = startHour; h <= endHour; h++)
              vehicleHourlyStatus[h] = statusKey;
          } else {
            for (let h = startHour; h < 24; h++)
              vehicleHourlyStatus[h] = statusKey;
            for (let h = 0; h <= endHour; h++)
              vehicleHourlyStatus[h] = statusKey;
          }
        }
      });
      for (let h = 0; h < 24; h++) {
        hourlyActivity[h][vehicleHourlyStatus[h]]++;
      }
    });

    const activityChartData = {
      running: hourlyActivity.map((h) => h.Running),
      idle: hourlyActivity.map((h) => h.Idle),
      charging: hourlyActivity.map((h) => h.Charging),
      stopped: hourlyActivity.map((h) => h.Stopped),
    };

    return {
      kpiData,
      fleetStatusData,
      activityChartData,
      totalFleetCount: totalFleet,
    };
  }, [baseFilteredData, isLoading, charging_, dailyDistance_, idle_, running_, stopped_, today_, totalFleet_, vehicles_]);

  const { kpiData, fleetStatusData, activityChartData, totalFleetCount } =
    derivedData;
  // =================================================================
  // --- FIX END: Performance optimization complete ---
  // =================================================================

  const filteredData = useMemo(() => {
    let data = baseFilteredData;
    data = filterByStatus(data, filters.status);
    data = filterBySearch(data, debouncedSearchQuery);
    return data;
  }, [baseFilteredData, filters.status, debouncedSearchQuery]);

  useEffect(() => {
    setIsFiltering(true);
    const processedData = [...filteredData];
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aValue = a._raw[sortConfig.key] ?? a[sortConfig.key];
        const bValue = b._raw[sortConfig.key] ?? b[sortConfig.key];
        const aValueIsMissing =
          aValue === null ||
          aValue === undefined ||
          aValue === "" ||
          aValue === "-";
        const bValueIsMissing =
          bValue === null ||
          bValue === undefined ||
          bValue === "" ||
          bValue === "-";
        if (aValueIsMissing && !bValueIsMissing) return 1;
        if (!aValueIsMissing && bValueIsMissing) return -1;
        if (aValueIsMissing && bValueIsMissing) return 0;
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA < numB) return sortConfig.direction === "ascending" ? -1 : 1;
          if (numA > numB) return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    setTotalPages(Math.ceil(processedData.length / ITEMS_PER_PAGE));
    const paginatedData = processedData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    setTableData(paginatedData);
    setTimeout(() => setIsFiltering(false), 200);
  }, [filteredData, currentPage, sortConfig]);

  // --- THIS IS THE UPDATED BLOCK ---
  const filterOptions = useMemo(() => {
    // UPDATED: Use regionalData to populate the dropdown
    // This ensures it matches the Region Cards.
    const regions = regionalData.map((item) => item.region).sort();

    // These are unchanged
    const cities = [...new Set(allVehicles.map((v) => v.city))]
      .filter((c) => c && c !== "N/A")
      .sort();
    const fleets = [...new Set(allVehicles.map((v) => v.depot))].sort();
    const vehicleTypes = [
      ...new Set(allVehicles.map((v) => v.vehicle_type_name)),
    ]
      .filter(Boolean)
      .sort();
    return { regions, cities, fleets, vehicleTypes };

    // UPDATED: Added regionalData to the dependency array
  }, [allVehicles, regionalData]);
  // --- END OF UPDATED BLOCK ---

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setCurrentPage(1);
    if (filterName !== "searchQuery") {
      setHighlightedStatus(null);
    }
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
    setHighlightedStatus(null);
  };

  const handleStatusChartClick = (status) => {
    setCurrentPage(1);
    setHighlightedStatus(status);
    setFilters((prev) => ({ ...prev, status: status }));
  };

  // =================================================================
  // --- BUG FIX: Removed the duplicated code block ---
  // =================================================================
  const handleRegionClick = (region) => {
    setCurrentPage(1);
    setHighlightedStatus(null); // Clear status highlight when clicking a region
    setFilters((prev) => {
      // If clicking the *same* region, reset it to "All"
      if (prev.region === region) {
        return { ...prev, region: "All" };
      }
      // Otherwise, set the new region
      return { ...prev, region: region };
    });
    // --- The duplicated block that was here has been removed ---
  };
  // =================================================================
  // --- END OF BUG FIX ---
  // =================================================================

  const handleKpiCardClick = (title) => {
    const statuses = ["Running", "Idle", "Charging", "Stopped"];

    if (title === "Total Fleet" || title === "Daily Distance") {
      setFilters((prev) => ({ ...prev, status: "All" }));
      setCurrentPage(1);
      setHighlightedStatus(null);
      return;
    }

    if (statuses.includes(title)) {
      if (highlightedStatus === title) {
        setHighlightedStatus(null);
        setFilters((prev) => ({ ...prev, status: "All" }));
      } else {
        setHighlightedStatus(title);
        setFilters((prev) => ({ ...prev, status: title }));
      }
    } else {
      setHighlightedStatus(null);
    }
  };

  // --- UPDATED: Function to handle Excel export ---
  const handleExportExcel = useCallback(() => {
    // Use filteredData to get all data matching filters
    if (filteredData.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "VRN",
      "Status",
      "Date",
      "Vehicle Type",
      "Region",
      "City",
      "Depot",
      "Start Odometer (km)",
      "End Odometer (km)",
      "Daily KM (km)",
      "Running Time (min)",
      "Idle Time (min)",
      "Charging Time (min)",
      "Stoppage Time (min)",
      "Avg. Speed (km/h)",
      "Start SOC (%)",
      "End SOC (%)",
      "Motor Energy (kWh)",
      "DC-DC Energy (kWh)",
      "E Compressor Energy (kWh)",
      "BCS Energy (kWh)",
      "TCS Energy (kWh)",
      "Energy Consumed (kWh)",
      "Regen Energy (kWh)",
      "Charging Energy (kWh)",
      "Batt. Temp (°C)",
      "Motor Temp (°C)",
    ];

    // Helper to get the correct VRN/Chassis/ID
    const getVrn = (v) =>
      v.vrn && v.vrn !== "-"
        ? v.vrn
        : v.chassis_number && v.chassis_number !== "-"
        ? v.chassis_number
        : v.id;

    // Convert data to array of arrays
    const data = filteredData.map((v) => [
      getVrn(v),
      v.status,
      v.date,
      v.vehicle_type_name,
      v.region,
      v.city,
      v.depot,
      v.startOdometer,
      v.endOdometer,
      v.dailyKm,
      v.runningTime,
      v.idleTime,
      v.chargingTime,
      v.stoppageTime,
      v.averageSpeed,
      v.startSoc,
      v.battery,
      v.motorEc,
      v.dcdcEc,
      v.ecompEc,
      v.bcsEc,
      v.tcsEc,
      v.energyConsumed,
      v.energyConsumption,
      v.regenEnergy,
      v.chargingUnit,
      v.batteryTemp,
      v.motorTemp,
    ]);

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FleetData"); // "FleetData" is the sheet name

    // Trigger the download
    const dateStr = format(new Date(), "yyyy-MM-dd");
    XLSX.writeFile(wb, `vehicleStatus_export_${dateStr}.xlsx`);
  }, [filteredData]); // Depends on the currently filtered data

  const renderTableContent = () => {
    if (isLoading && allVehicles.length === 0) return <DashboardSkeleton />;
    if (error) return <div className="ds-error-message">{error}</div>;
    if (tableData.length === 0 && !isFiltering)
      return (
        <div className="ds-info-message">{noVehiclesMatchingCriteria_}</div>
      );
    return (
      <div className={isFiltering ? "ds-table-filtering" : ""}>
        <VehicleDetailsTable
          vehicles={tableData}
          onVehicleSelect={setSelectedVehicle}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          requestSort={requestSort}
          sortConfig={sortConfig}
          selectedVehicle={selectedVehicle}
        />
      </div>
    );
  };

  return (
    <div className={`ds-page ${isDarkMode ? "dark" : ""}`}>
      <header className="ds-page-header">
        <div className="ds-title-container">
          <div className="ds-live-indicator" title="Live Data Feed"></div>
          <h1 className="ds-main-title">{vehicleStatus_}</h1>
        </div>
        <div className="ds-controls-container">
          {/* This is the button from the error (846). Notice it is fully closed. */}
          <ThemeButton
            variant="outlined"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((p) => p + 1);
            }}
          >
            <RefreshCw size={16} /> {refresh_}
          </ThemeButton>

          {/* This is the second button. Also fully closed. */}
          <ThemeButton variant="outlined" onClick={handleClearFilters}>
            <X size={16} />
            {clearFilters_}
          </ThemeButton>
        </div>
      </header>

      {/* This is the ternary logic (around line 870-880) */}
      {isLoading && allVehicles.length === 0 ? (
        <DashboardSkeleton />
      ) : !error && allVehicles.length === 0 ? (
        <div
          className="ds-info-message"
          style={{ padding: "3rem", textAlign: "center" }}
        >
          <h2>{noVehicleData_}</h2>
          <p>{noVehicleSummary_}</p>
        </div>
      ) : error ? (
        <div className="ds-error-message">{error}</div>
      ) : (
        <div className="ds-main-content-layout">
          <section className="ds-grid-section">
            {kpiData.map((item) => (
              <KPICard
                key={item.keyName}
                {...item}
                onKpiClick={handleKpiCardClick}
                isActive={highlightedStatus === item.keyName}
              />
            ))}
          </section>
          <div className="ds-card">
            <h3
              style={{
                margin: "0 0 1rem 0",
                color: "var(--primary-text-color)",
              }}
            >
              {regionalPerformance_}
            </h3>
            <section className="ds-grid-section">
              {regionalData.map((item) => (
                <RegionCard
                  key={item.region}
                  {...item}
                  onRegionClick={handleRegionClick}
                  isActive={filters.region === item.region}
                />
              ))}
            </section>
          </div>
          <div className="ds-card">
            <section className="ds-grid-section ds-charts-grid">
              <FleetActivityChart
                isDarkMode={isDarkMode}
                data={activityChartData}
                totalVehicles={totalFleetCount}
                highlightedStatus={highlightedStatus}
              />
              <FleetStatusChart
                isDarkMode={isDarkMode}
                onStatusClick={handleStatusChartClick}
                data={fleetStatusData}
                totalVehicles={totalFleetCount}
                highlightedStatus={highlightedStatus}
              />
            </section>
          </div>
          <div className="ds-card">
            <div
              className="ds-controls-container"
              style={{
                padding: "1rem",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <input
                type="text"
                placeholder={searchVrn_}
                className="ds-search-input"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
              />
              <select
                className="ds-filter-dropdown"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="All">{status_}</option>
                <option value="Running">{running_}</option>
                <option value="Idle">{idle_}</option>
                <option value="Charging">{charging_}</option>
                <option value="Stopped">{stopped_}</option>
              </select>
              <select
                className="ds-filter-dropdown"
                value={filters.region}
                onChange={(e) => handleFilterChange("region", e.target.value)}
              >
                <option value="All">{regions_}</option>
                {filterOptions.regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <select
                className="ds-filter-dropdown"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
              >
                <option value="All">{cities_}</option>
                {filterOptions.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                className="ds-filter-dropdown"
                value={filters.fleet}
                onChange={(e) => handleFilterChange("fleet", e.target.value)}
              >
                <option value="All">{fleets_}</option>
                {filterOptions.fleets.map((depot) => (
                  <option key={depot} value={depot}>
                    {depot}
                  </option>
                ))}
              </select>
              <select
                className="ds-filter-dropdown"
                value={filters.vehicleType}
                onChange={(e) =>
                  handleFilterChange("vehicleType", e.target.value)
                }
              >
                <option value="All">{vehicleTypes_}</option>
                {filterOptions.vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              
              <ThemeButton
                variant="outlined"
                onClick={handleExportExcel}
                style={{ marginLeft: "auto" }}
                disabled={filteredData.length === 0}
              >
                <FileDown size={16} /> {export_}
              </ThemeButton>
                      <div className="ds-controls-container">
          
              <ThemeButton
                variant="outlined"
                onClick={() => {
                  setIsLoading(true);
                  setRefreshTrigger((p) => p + 1);
                }}
              >
                <RefreshCw size={16} /> {refresh_}
              </ThemeButton>

              <ThemeButton
                variant="outlined"
                onClick={handleClearFilters}
              >
                <X size={16} />{clearFilters_}
              </ThemeButton>

            </div>

          </div>
            
            {/* --- THIS IS THE FIX ---
              Added 'minHeight: "500px"' to the div below.
              This forces the browser to see space below the filter bar,
              making it open the dropdowns downwards.
            */}
            <div style={{ padding: "1rem", minHeight: "500px" }}>
              {renderTableContent()}
            </div>
          </div>
        </div>
      )}

      {selectedVehicle && (
        <VehicleDetailsPanel
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
ThemeButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["contained", "outlined", "text"]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
ThemeButton.defaultProps = {
  onClick: () => {},
  variant: "contained",
  className: "",
  disabled: false,
};

export default EnterpriseDashboard;
