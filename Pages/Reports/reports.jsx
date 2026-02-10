 //report.jsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { DateRangePicker } from "react-date-range";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { useReportData } from "./useReportData";
import ReportTable from "./ReportTable";
import "./reports.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./DatePickerStyles.css";
import "./DatePickerThemes.css";
import { useTranslation } from "react-i18next";
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import { selectCurrentUser } from "../../store/authSlice";

const DATE_DISPLAY_FORMAT = "dd/MM/yy";
const DEFAULT_ARRAY = [];

// --- Helper Component: MultiSelect Dropdown (Updated with Search) ---
const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  label,
  isLoading,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Added Search State
  const dropdownRef = useRef(null);
  const { t } = useTranslation();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(""); // Reset search on close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    // Select all visible (filtered) options or all options?
    // Usually "Select All" applies to the currently filtered list in UX,

    // but here we stick to simple logic: if all selected, deselect all, else select all available options.
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      // Defensive check: Ensure opt exists and label is treated as a string
      const labelText = opt?.label ? String(opt.label) : ""; 
      return labelText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm]);


  // Calculate display text
  const getDisplayText = () => {
    if (disabled) return "Select VRN / Chassis";
    if (selectedValues.length === 0)
      return label === "Fleet"
        ? t("reports.selectFleet", "Select Fleet")
        : "Select VRN / Chassis";
    if (selectedValues.length === options.length) return "All Selected";
    if (selectedValues.length === 1) {
      const selectedOption = options.find((o) => o.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : "1 Selected";
    }
    return `${selectedValues.length} Selected`;
  };

  return (
    <span className="custom-dropdown-container" ref={dropdownRef}>
      <p className="reports-Selection-Menu-Selections-title">{label}</p>

      <button
        className="multi-select-button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={isLoading || disabled}
      >
        <span className="multi-select-text">{getDisplayText()}</span>
      </button>

      {isOpen && !disabled && (
        <ul
          className="custom-dropdown-list"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {/* Search Input Item */}
          <li onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder={t("reports.search", "Search...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "5px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
              autoFocus
            />
          </li>

          <li
            onClick={handleSelectAll}
            style={{ fontWeight: "bold", borderBottom: "2px solid #eee" }}
          >
            <input
              type="checkbox"
              checked={
                options.length > 0 && selectedValues.length === options.length
              }
              readOnly
            />
            {t("reports.selectAll", "Select All")}
          </li>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li key={option.value} onClick={() => toggleOption(option.value)}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => { }}
                />
                {option.label}
              </li>
            ))
          ) : (
            <li
              style={{ color: "#999", fontStyle: "italic", cursor: "default" }}
            >
              {t("reports.noResults", "No results found")}
            </li>
          )}
        </ul>
      )}
    </span>
  );
};

function Individual() {
  const user = useSelector(selectCurrentUser);
  const {
    data: vehicles = [],
    isLoading: isVehicleListLoading,
    isError: isVehicleListError,
  } = useGetAllDevicesQuery(user?.username);
  const { t } = useTranslation();

  const [reportType, setReportType] = useState("");
  const [vrnChassis, setVrnChassis] = useState("");
  const [vrnChassisDisplay, setVrnChassisDisplay] = useState("");
  const [multiVehicles, setMultiVehicles] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [selectedFleets, setSelectedFleets] = useState([]);

  // Search States
  const [searchQuery, setSearchQuery] = useState(""); // For VRN
  const [vehicleTypeSearchQuery, setVehicleTypeSearchQuery] = useState(""); // NEW: For Vehicle Type

  const [submitted, setSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [popupStyles, setPopupStyles] = useState({});
  const [dateRange, setDateRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Dropdown visibility states
  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false);
  const [isVehicleTypeOpen, setIsVehicleTypeOpen] = useState(false);
  const [isVrnChassisOpen, setIsVrnChassisOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false); // Added for consistency

  // Refs for outside click handling
  const reportTypeRef = useRef(null);
  const vehicleTypeRef = useRef(null);
  const vrnChassisRef = useRef(null);
  const fleetRef = useRef(null);
  const calendarRef = useRef(null);
  const dateTimeButtonRef = useRef(null);

  const backendUrl = import.meta.env.VITE_API_URL_3;

  const MULTI_SELECT_REPORTS = [
    "Daily Summary Report",
    "Charging Report",
    "Energy Consumption Report",
    "Vehicle Status Report",
    "Alert Report",
    "Fault Report",
  ];

  const isMultiSelectMode = useMemo(
    () => MULTI_SELECT_REPORTS.includes(reportType),
    [reportType]
  );

  // --- API Param Logic ---
  let apiStartValue = "",
    apiEndValue = "",
    apiReportType = "",
    apiIdentifier = "",
    apiVehicleType = "",
    apiDateRange = DEFAULT_ARRAY,
    apiVrnDisplay = "",
    apiFleet = [];

  if (submitted && activeFilters) {
    apiReportType = activeFilters.reportType;
    apiVehicleType = activeFilters.vehicleType;
    apiDateRange = activeFilters.dateRange;
    apiVrnDisplay = activeFilters.vrnChassisDisplay;
    apiFleet = activeFilters.fleets;

    if (apiReportType === "MIS Report") apiIdentifier = activeFilters.fleets;
    else if (
      MULTI_SELECT_REPORTS.includes(apiReportType) &&
      Array.isArray(activeFilters.multiVehicles)
    )
      apiIdentifier = activeFilters.multiVehicles;
    else apiIdentifier = activeFilters.vehicle;

    if (apiReportType === "CAN Report") {
      const adjustedStartDate = new Date(activeFilters.dateRange[0].startDate);
      const [startHour, startMinute] = activeFilters.startTime
        .split(":")
        .map(Number);
      adjustedStartDate.setHours(startHour, startMinute, 0, 0);
      const adjustedEndDate = new Date(activeFilters.dateRange[0].endDate);
      const [endHour, endMinute] = activeFilters.endTime.split(":").map(Number);
      adjustedEndDate.setHours(endHour, endMinute, 0, 0);
      apiStartValue = format(adjustedStartDate, "yyyy-MM-dd'T'HH:mm:ss");
      apiEndValue = format(adjustedEndDate, "yyyy-MM-dd'T'HH:mm:ss");
    } else {
      apiStartValue = format(
        activeFilters.dateRange[0].startDate,
        "yyyy-MM-dd"
      );
      if (MULTI_SELECT_REPORTS.includes(apiReportType))
        apiEndValue = format(activeFilters.dateRange[0].endDate, "yyyy-MM-dd");
      else {
        const adjustedEndDate = new Date(activeFilters.dateRange[0].endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        apiEndValue = format(adjustedEndDate, "yyyy-MM-dd");
      }
    }
  }

  const {
    data,
    isLoading,
    nextPageUrl,
    previousPageUrl,
    currentPage,
    totalPages,
    handleNextPage,
    handlePreviousPage,
    cancelRequest,
  } = useReportData(
    submitted,
    apiReportType,
    apiIdentifier,
    apiStartValue,
    apiEndValue,
    backendUrl,
    apiDateRange,
    apiVehicleType,
    apiFleet
  );

  // For Alert Report: replace IMEI column value with VRN (or chassis if VRN null)
  const displayData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return data;
    if (apiReportType !== "Alert Report" && apiReportType !== "Fault Report")
      return data;

    // vehicles from useGetAllDevicesQuery: array of device objects
    const devicesMap = (vehicles || []).reduce((acc, dev) => {
      // prefer imei if present, else device_id
      const key = dev.imei || dev.device_id || dev.vehicle_id;
      if (key) acc[String(key)] = dev;
      return acc;
    }, {});

    return data.map((row) => {
      // find key for imei (case-insensitive)
      const imeiKey = Object.keys(row).find(
        (k) => k.toLowerCase() === "imei"
      );
      const newRow = { ...row };
      if (imeiKey) {
        const imeiVal = String(row[imeiKey] ?? "");
        // lookup device
        const dev = devicesMap[imeiVal];
        const display = dev ? dev.VRN || dev.chassis_number || imeiVal : imeiVal;

        // Remove original IMEI column and add VRN column
        delete newRow[imeiKey];
        newRow["VRN"] = display;
      }
      return newRow;
    });
  }, [data, vehicles, apiReportType]);

  const fetchParams = {
    ...(apiReportType === "MIS Report"
      ? { fleet: apiFleet }
      : {
        device_id: isMultiSelectMode
          ? activeFilters?.multiVehicles
          : activeFilters?.vehicle,
      }),
    start_date: apiStartValue,
    end_date: apiEndValue,
  };

  // --- FILTERING LOGIC (Hierarchical) ---

  // 1. Report Options
  const allReportOptions = useMemo(
    () => [
      { value: "CAN Report", label: t("reports.canReport") },
      { value: "Fault Report", label: t("reports.faultReport") },
      { value: "Daily Summary Report", label: t("reports.dailySummaryReport") },
      { value: "Charging Report", label: t("reports.chargingReport") },
      {
        value: "Energy Consumption Report",
        label: t("reports.energyConsumptionReport"),
      },
      {
        value: "Vehicle Status Report",
        label: t("reports.vehicleStatusReport", "Vehicle Status Report"),
      },
      { value: "MIS Report", label: t("reports.misReport") },
      { value: "Cooling Report", label: t("reports.coolingReport") },
      { value: "DOD Report", label: t("reports.dodReport") },
      { value: "Alert Report", label: t("reports.alertReport", "Alert Report") },
    ],
    [t]
  );

  const reportOptions = useMemo(() => {
    if (!user) return [];
    const allowedReports = (user?.subscription?.features?.Reports || []).map(
      (r) => r.toLowerCase()
    );
    // Always include certain reports regardless of subscription (useful for testing
    // or for reports that should be globally available).
    const alwaysInclude = ["alert report"];

    return allReportOptions.filter((option) =>
      allowedReports.includes(option.value.toLowerCase()) ||
      alwaysInclude.includes(option.value.toLowerCase())
    );
  }, [user, allReportOptions]);

  // 2. Fleet Options (Level 1 Filter)
  const fleetOptions = useMemo(() => {
    if (user && user.fleet) return [{ value: user.fleet, label: user.fleet }];
    // Unique fleets from vehicle list
    return [...new Set(vehicles.map((v) => v.fleet).filter(Boolean))].map(
      (name) => ({ value: name, label: name })
    );
  }, [vehicles, user]);

  // 3. Filtered Vehicles by Fleet (Intermediate Data)
  const vehiclesInSelectedFleet = useMemo(() => {
    if (selectedFleets.length === 0) return [];
    return vehicles.filter((v) => selectedFleets.includes(v.fleet));
  }, [vehicles, selectedFleets]);

  // 4. Vehicle Type Options (Level 2 Filter - Derived from Fleet Vehicles)
  const vehicleTypeOptions = useMemo(() => {
    // Only show types present in the selected fleet
    const types = [
      ...new Set(vehiclesInSelectedFleet.map((v) => v.device_type_name)),
    ];
    return types.map((type) =>
      typeof type === "string" ? { value: type, label: type } : type
    );
  }, [vehiclesInSelectedFleet]);

  // NEW: Filtered Vehicle Type Options based on Search
  const filteredVehicleTypeOptions = useMemo(() => {
    return vehicleTypeOptions.filter((opt) =>
      opt.label.toLowerCase().includes(vehicleTypeSearchQuery.toLowerCase())
    );
  }, [vehicleTypeOptions, vehicleTypeSearchQuery]);

  // 5. Vehicles Filtered by Type (Intermediate Data)
  const availableVehiclesForSelection = useMemo(() => {
    if (!vehicleType) return [];
    return vehiclesInSelectedFleet.filter(
      (v) => v.device_type_name === vehicleType
    );
  }, [vehiclesInSelectedFleet, vehicleType]);

  // 6. VRN/Chassis Options (Level 3 Filter - Derived from Type Vehicles)
  const vrnChassisOptions = useMemo(() => {
    const chassisList = [
      ...new Set(availableVehiclesForSelection.map((v) => v.chassis_number)),
    ];

    return chassisList.map((chassis) => {
      const selectedVehicle = availableVehiclesForSelection.find(
        (v) => v.chassis_number === chassis
      );
      return { value: chassis, label: selectedVehicle?.VRN || chassis };
    });
  }, [availableVehiclesForSelection]);

  const multiSelectOptions = useMemo(
    () =>
      availableVehiclesForSelection.map((v) => ({
        value: v.device_id,
        label: v.VRN || v.chassis_number,
      })),
    [availableVehiclesForSelection]
  );

  const filteredVrnChassisOptions = useMemo(
    () =>
      vrnChassisOptions.filter((option) =>
        (option.label || '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [vrnChassisOptions, searchQuery]
  );

  // --- State Handlers ---

  // Auto-select Fleet if user is restricted
  useEffect(() => {
    if (user && user.fleet && selectedFleets.length === 0) {
      setSelectedFleets([user.fleet]);
    }
  }, [user, selectedFleets]);

  const handleReportTypeSelect = (value) => {
    setReportType(value);

    // Reset Hierarchy Downstream
    if (!user?.fleet) setSelectedFleets([]); // Only reset fleet if user isn't locked to one
    setVehicleType("");
    setVrnChassis("");
    setVrnChassisDisplay("");
    setMultiVehicles([]);
    setIsReportTypeOpen(false);
  };

  const handleFleetSelect = (newFleets) => {
    // --- TEMP FIX START: Disable multi-select for MIS & CAN ---
    let finalSelection = newFleets;

    if (["MIS Report", "CAN Report"].includes(reportType)) {
      // If user selects more than one, force keep only the last selection (simulates radio behavior)
      if (newFleets.length > 1) {
        finalSelection = [newFleets[newFleets.length - 1]];
      }
    }

    setSelectedFleets(finalSelection);
    // --- TEMP FIX END ---

    // Reset Hierarchy Downstream
    setVehicleType("");
    setVrnChassis("");
    setVrnChassisDisplay("");
    setMultiVehicles([]);
    // setIsFleetOpen(false);
  };

  const handleVehicleTypeSelect = (value) => {
    setVehicleType(value);

    // Reset Hierarchy Downstream
    setVrnChassis("");
    setVrnChassisDisplay("");
    setMultiVehicles([]);

    setIsVehicleTypeOpen(false);
    setVehicleTypeSearchQuery(""); // Clear search on select
  };

  const handleVrnChassisSelect = (value, label) => {
    setVrnChassis(value);
    setVrnChassisDisplay(label);
    setIsVrnChassisOpen(false);
    setSearchQuery(""); // Clear search on select
  };

  const handleSubmitOrCancel = () => {
    if (isLoading) {
      cancelRequest();
      return;
    }
    setIsCalendarOpen(false);

    // Basic Validation
    if (!reportType) {
      toast.warn(t("userAlerts.pleaseSelectReportType"));
      return;
    }

    // Hierarchy Validation
    if (selectedFleets.length === 0) {
      toast.warn("Please select at least one Fleet.");
      return;
    }

    let selectedVehicleId = "";

    if (reportType !== "MIS Report") {
      // For non-MIS, we usually need vehicle(s)
      if (isMultiSelectMode) {
        if (multiVehicles.length === 0) {
          toast.warn("Please select at least one vehicle.");
          return;
        }
      } else if (reportType !== "Fault Report") {
        if (!vrnChassis) {
          toast.warn(t("userAlerts.pleaseSelectValidVrnChassisNumebr"));
          return;
        }
        const selectedVehicleObj = vehicles.find(
          (v) => v.chassis_number === vrnChassis
        );
        if (selectedVehicleObj)
          selectedVehicleId = selectedVehicleObj.device_id;
      }
    }

    setActiveFilters({
      reportType,
      vehicle: selectedVehicleId,
      multiVehicles,
      vrnChassis,
      vrnChassisDisplay: isMultiSelectMode
        ? `${multiVehicles.length} Vehicles`
        : vrnChassisDisplay,
      vehicleType,
      fleets: selectedFleets,
      dateRange,
      startTime,
      endTime,
    });
    setSubmitted(true);
  };

  useEffect(() => {
    if (isVehicleListError)
      toast.error(t("userAlerts.failedToLoadVehicleData"));
  }, [isVehicleListError, t]);

  // Outside Click Handler
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const isClickInside = (ref) =>
        ref.current && ref.current.contains(event.target);

      if (!isClickInside(reportTypeRef)) setIsReportTypeOpen(false);
      if (!isClickInside(fleetRef)) setIsFleetOpen(false);

      // Update: Reset search query when closing Vehicle Type dropdown
      if (!isClickInside(vehicleTypeRef)) {
        setIsVehicleTypeOpen(false);
      }

      if (!isClickInside(vrnChassisRef)) setIsVrnChassisOpen(false);

      if (!isClickInside(calendarRef) && !isClickInside(dateTimeButtonRef)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Calendar Positioning (Existing code...)
  useEffect(() => {
    if (isCalendarOpen && dateTimeButtonRef.current && calendarRef.current) {
      const buttonRect = dateTimeButtonRef.current.getBoundingClientRect();
      const calendarRect = calendarRef.current.getBoundingClientRect();
      let left = buttonRect.left;
      let top = buttonRect.bottom + 8;
      if (left + calendarRect.width > window.innerWidth)
        left = window.innerWidth - calendarRect.width - 10;
      if (left < 10) left = 10;
      setPopupStyles({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      });
    }
  }, [isCalendarOpen]);

  // Static Ranges for Calendar (Existing code...)
  const staticRanges = [
    {
      label: t("reports.today"),
      range: () => ({ startDate: new Date(), endDate: new Date() }),
      isSelected: (range) =>
        range.startDate.toDateString() === new Date().toDateString() &&
        range.endDate.toDateString() === new Date().toDateString(),
    },
    {
      label: t("reports.yesterday"),
      range: () => ({
        startDate: addDays(new Date(), -1),
        endDate: addDays(new Date(), -1),
      }),
      isSelected: (range) =>
        range.startDate.toDateString() ===
        addDays(new Date(), -1).toDateString(),
    },
    {
      label: t("reports.thisWeek"),
      range: () => ({
        startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
        endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }),
      isSelected: (range) =>
        range.startDate.toDateString() ===
        startOfWeek(new Date(), { weekStartsOn: 1 }).toDateString(),
    },
    {
      label: t("reports.thisMonth"),
      range: () => ({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
      }),
      isSelected: (range) =>
        range.startDate.toDateString() ===
        startOfMonth(new Date()).toDateString(),
    },
    {
      label: t("reports.last7Days"),
      range: () => ({
        startDate: addDays(new Date(), -6),
        endDate: new Date(),
      }),
      isSelected: (range) =>
        range.startDate.toDateString() ===
        addDays(new Date(), -6).toDateString(),
    },
  ];

  const renderContent = () => {
    // ... (Existing renderContent logic)
    const reportConfig = [
      {
        title: t("reports.canReport"),
        columns: [
          "Date",
          "Time",
          "WheelSpeed",
          "Pack_Voltage",
          "Pack_Current",
          "MCU_Power",
          "DCDC_Voltage",
        ],
      },
      {
        title: t("reports.coolingReport"),
        columns: [
          "Date",
          "Time",
          "MotorTemp",
          "MCUTemp",
          "DCDC_Temp",
          "Sink_Temp",
          "PumpSpeed",
        ],
      },
      {
        title: t("reports.energyConsumptionReport"),
        columns: [
          "Trip_Num",
          "Net_Energy",
          "Traction",
          "Regeneration",
          "Distance",
          "Consumption_Rate",
        ],
      },
      {
        title: t("reports.chargingReport"),
        columns: [
          "Cycle",
          "Start_Time",
          "End_Time",
          "Unit",
          "Duration",
          "Location",
          "Insufficiency",
        ],
      },
      {
        title: t("reports.dailySummaryReport"),
        columns: [
          "Trip_Id",
          "SOC_Start",
          "SOC_End",
          "RunTime",
          "IdleTime",
          "Max_Speed",
          "Avg_Speed",
        ],
      },
      {
        title: t("reports.faultReport"),
        columns: [
          "Trip_Id",
          "SOC_Start",
          "SOC_End",
          "RunTime",
          "IdleTime",
          "Max_Speed",
          "Avg_Speed",
        ],
      },
      {
        title: t("reports.vehicleStatusReport"),
        columns: [
          "Trip_Id",
          "SOC_Start",
          "SOC_End",
          "RunTime",
          "IdleTime",
          "Max_Speed",
          "Avg_Speed",
        ],
      },
      {
        title: t("reports.misReport"),
        columns: [
          "Trip_Id",
          "SOC_Start",
          "SOC_End",
          "RunTime",
          "IdleTime",
          "Max_Speed",
          "Avg_Speed",
        ],
      },
      {
        title: t("reports.dodReport"),
        columns: [
          "Trip_Id",
          "SOC_Start",
          "SOC_End",
          "RunTime",
          "IdleTime",
          "Max_Speed",
          "Avg_Speed",
        ],
      },
    ];

    if (isVehicleListLoading)
      return (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      );
    if (!submitted)
      return (
        <div className="report-content-area">
          <div className="reports-grid">
            {reportConfig.map((report, index) => (
              <div key={index} className="report-card">
                <div className="report-header">
                  <h3>{report.title}</h3>
                </div>

                <div className="report-overlay">
                  <div className="overlay-content">
                    <div className="overlay-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="48px"
                        viewBox="0 -960 960 960"
                        width="48px"
                        fill="#1e77eb"
                      >
                        <path d="M324.31-65.87q-32.74 0-56.27-23.35-23.52-23.36-23.52-55.87v-490.6q0-32.74 23.52-56.27 23.53-23.52 56.27-23.52h490.6q32.74 0 56.26 23.52 23.53 23.53 23.53 56.27v490.6q0 32.51-23.53 55.87-23.52 23.35-56.26 23.35h-490.6Zm0-79.22h210.21v-126.08H324.31v126.08Zm280.95 0h209.65v-126.08H605.26v126.08ZM65.87-231.56v-583.35q0-32.74 23.35-56.26 23.36-23.53 55.87-23.53h583.35v79.79H145.09v583.35H65.87Zm258.44-110.35h210.21V-469H324.31v127.09Zm280.95 0h209.65V-469H605.26v127.09ZM324.31-539.74h490.6v-96.52h-490.6v96.52Z" />
                      </svg>
                    </div>
                    <p className="overlay-text">
                      {" "}
                      {t("MaintenanceAndService.view", "View")} {report.title}
                    </p>
                    <p className="overlay-subtext">
                      {" "}
                      {t(
                        "reports.selectDetails",
                        "Select Date to view details"
                      )}{" "}
                    </p>
                  </div>
                </div>

                <div className="blur-content">
                  <div
                    className="dummy-table-row"
                    style={{ marginBottom: "20px" }}
                  >
                    {report.columns.slice(0, 5).map((col, i) => (
                      <span
                        key={i}
                        style={{
                          fontWeight: "bold",
                          fontSize: "12px",
                          flex: 1,
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  <div className="dummy-table-row">
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                  </div>
                  <div className="dummy-table-row">
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                  </div>
                  <div className="dummy-table-row">
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                  </div>
                  <div className="dummy-table-row">
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                    <div className="dummy-col" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
  };

  function translateReportType(type) {
    if (!type) return t("reports.selectReport");
    const option = reportOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
      {isCalendarOpen && (
        <div className="calendar-popup" ref={calendarRef} style={popupStyles}>
          <DateRangePicker
            ranges={dateRange}
            onChange={(item) => setDateRange([item.selection])}
            editableDateInputs={true}
            moveRangeOnFirstSelection={false}
            staticRanges={staticRanges}
            inputRanges={[]}
            dateDisplayFormat={DATE_DISPLAY_FORMAT}
            maxDate={new Date()}
          />
          {(reportType === "CAN Report" || reportType === "Fault Report") && (
            <div className="time-picker-container" style={{ padding: "5px" }}>
              <div>
                <label>{t("systemUtility.startTime")}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="HH:MM"
                  style={{ marginLeft: "5px", marginRight: "10px" }}
                />
              </div>
              <div>
                <label>{t("systemUtility.endTime")}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="HH:MM"
                  style={{ marginLeft: "5px" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reports-page-container">
        <div className="reports-form">
          <div className="report-header">
            <h2>Reports</h2>
          </div>

          {/* 1. REPORT TYPE */}
          <span className="custom-dropdown-container" ref={reportTypeRef}>
            <p className="reports-Selection-Menu-Selections-title">
              {t("reports.reportType")}
            </p>
            <button
              className="report-dropdown"
              onClick={() => setIsReportTypeOpen(!isReportTypeOpen)}
            >
              {translateReportType(reportType)}
            </button>
            {isReportTypeOpen && (
              <ul className="custom-dropdown-list">
                {reportOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => handleReportTypeSelect(option.value)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </span>

          {/* 2. FLEET (Level 1) - Multi Select (NOW WITH SEARCH) */}
          <MultiSelectDropdown
            options={fleetOptions}
            selectedValues={selectedFleets}
            onChange={handleFleetSelect}
            label={t("managementDashboard.fleet", "Fleet")}
            isLoading={isVehicleListLoading}
            disabled={isVehicleListLoading || !reportType || !!user?.fleet}
          />

          {/* 3. VEHICLE TYPE (Level 2) - Not for MIS Report (NOW WITH SEARCH) */}
          {reportType !== "MIS Report" && (
            <span className="custom-dropdown-container" ref={vehicleTypeRef}>
              <p className="reports-Selection-Menu-Selections-title">
                {t("vehicle.vehicleType")}
              </p>

              <button
                className="report-dropdown"
                onClick={() => setIsVehicleTypeOpen(!isVehicleTypeOpen)}
                disabled={
                  !reportType ||
                  isVehicleListLoading ||
                  selectedFleets.length === 0
                }
              >
                {vehicleType || t("reports.selectVehicle", "Select Vehicle Type")}
              </button>

              {isVehicleTypeOpen && (
                <ul className="custom-dropdown-list">
                  {/* Search Input Item - Added Inside Dropdown */}
                  {/* <li 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ cursor: "default", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <input
                      type="text"
                      placeholder={t("reports.searchVehicleType", "Search...")}
                      value={vehicleTypeSearchQuery}
                      onChange={(e) => setVehicleTypeSearchQuery(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.3)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </li> */}

                  {filteredVehicleTypeOptions.length > 0 ? (
                    filteredVehicleTypeOptions.map((option) => (
                      <li
                        key={option.value}
                        onClick={() => handleVehicleTypeSelect(option.value)}
                      >
                        {option.label}
                      </li>
                    ))
                  ) : (
                    <li
                      style={{
                        color: "#ccc",
                        fontStyle: "italic",
                        cursor: "default",
                      }}
                    >
                      {t("reports.noResults", "No results found")}
                    </li>
                  )}
                </ul>
              )}
            </span>
          )}

          {/* 4. VRN / CHASSIS (Level 3) - Not for MIS Report */}
          {reportType !== "MIS Report" && (
            <>
              {isMultiSelectMode ? (
                <MultiSelectDropdown
                  options={multiSelectOptions}
                  selectedValues={multiVehicles}
                  onChange={setMultiVehicles}
                  label={t("vehicle.vrnChassisNumber")}
                  isLoading={isVehicleListLoading}
                  disabled={!vehicleType}
                />
              ) : (
                reportType !== "Fault Report" && (
                  <span
                    className="custom-dropdown-container"
                    ref={vrnChassisRef}
                  >
                    <p className="reports-Selection-Menu-Selections-title">
                      {t("vehicle.vrnChassisNumber")}
                    </p>
                    {isVrnChassisOpen ? (
                      <input
                        type="text"
                        className="report-dropdown"
                        placeholder={t(
                          "fleetSummary.searchDeviceByVrnChassis",
                          "Search by VRN / Chassis No..."
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!vehicleType || isVehicleListLoading}
                        autoFocus
                      />
                    ) : (
                      <button
                        className="report-dropdown"
                        onClick={() => setIsVrnChassisOpen(!isVrnChassisOpen)}
                        // Hierarchy: Must select Vehicle Type first
                        disabled={!vehicleType || isVehicleListLoading}
                      >
                        {!vehicleType
                          ? t("reports.selectVrnChasis", "Select VRN / Chassis")
                          : vrnChassisDisplay || t("reports.selectVrnChasis")}
                      </button>
                    )}
                    {isVrnChassisOpen && (
                      <ul className="custom-dropdown-list">
                        {filteredVrnChassisOptions.length > 0 ? (
                          filteredVrnChassisOptions.map((option) => (
                            <li
                              key={option.value}
                              onClick={() =>
                                handleVrnChassisSelect(
                                  option.value,
                                  option.label
                                )
                              }
                            >
                              {option.label}
                            </li>
                          ))
                        ) : (
                          <li
                            style={{
                              color: "#999",
                              fontStyle: "italic",
                              cursor: "default",
                            }}
                          >
                            {t("reports.noResults", "No results found")}
                          </li>
                        )}
                      </ul>
                    )}
                  </span>
                )
              )}
            </>
          )}

          <span className="date-time-picker-container">
            <p className="reports-Selection-Menu-Selections-title">
              {t("systemUtility.dateTimeRange")}
            </p>
            <button
              ref={dateTimeButtonRef}
              className="report-dropdown date-time-button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              disabled={!reportType}
            >{`${format(
              dateRange[0].startDate,
              DATE_DISPLAY_FORMAT
            )} ${startTime} - ${format(
              dateRange[0].endDate,
              DATE_DISPLAY_FORMAT
            )} ${endTime}`}</button>
          </span>

          <span>
            <button
              className={`report-dropdown submit-btn ${isLoading ? "cancel-style" : ""
                }`}
              onClick={handleSubmitOrCancel}
              disabled={
                !isLoading &&
                (!reportType ||
                  // Validate Fleet
                  selectedFleets.length === 0 ||
                  // Validate MultiSelect
                  (isMultiSelectMode && multiVehicles.length === 0) ||
                  // Validate Single VRN (except Fault/MIS)
                  (!isMultiSelectMode &&
                    reportType !== "Fault Report" &&
                    reportType !== "MIS Report" &&
                    !vrnChassis))
              }
              style={
                isLoading
                  ? {
                    backgroundColor: "#dc3545",
                    borderColor: "#dc3545",
                    color: "#fff",
                  }
                  : {}
              }
            >
              {isLoading ? t("buttons.cancel", "Cancel") : t("buttons.submit")}
            </button>
          </span>
        </div>
        <div className="report-content-area">
          {submitted ? (
            <ReportTable
              data={displayData}
              isLoading={isLoading}
              reportName={apiReportType}
              currentPage={currentPage}
              totalPages={totalPages}
              nextPageUrl={nextPageUrl}
              previousPageUrl={previousPageUrl}
              handleNextPage={handleNextPage}
              handlePreviousPage={handlePreviousPage}
              fetchParams={fetchParams}
              backendUrl={backendUrl}
              dateRange={apiDateRange}
              vehicleType={apiVehicleType}
              vehicleIdentifier={apiVrnDisplay}
            />
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </>
  );
}

export default Individual;
