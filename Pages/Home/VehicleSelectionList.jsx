import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useContext,
} from "react";
import ReactDOM from "react-dom"; // Required for Portal
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import useDebounce from "../../hooks/useDebounce";
import { VehicleSelectionContext } from "./VehicleSelectionContext";
import {
  VEHICLE_LIST_IMAGE_MAP,
  SERVICE_CONTACTS_MAP,
} from "../../Data/data2.jsx";

// Material UI Icons
import {
  MdSpeed,
  MdBatteryChargingFull,
  MdRoute,
  MdThermostat,
  MdPerson,
  MdDirectionsBus,
  MdLocationOn,
  MdCheckCircle,
  MdCancel,
  MdBuild,
  MdPhone,
  MdClose,
  MdSearch, // <--- ADD THIS
  MdContentCopy,
} from "react-icons/md";

// --- CONSTANTS ---
// Standard keys to exclude from the technical details modal
const EXCLUDED_KEYS = new Set([
  "imei",
  "device_id",
  "vehicle_id",
  "displayId",
  "VRN",
  "chassis_number",
  "latitude",
  "longitude",
  "latitude_dir",
  "longitude_dir",
  "heading",
  "speed",
  "odometer",
  "is_connected",
  "last_timestamp",
  "timestamp",
  "soc",
  "SOC",
  "dte",
  "DTE",
  "ts",
  "TS",
  "cell_temp",
  "cellTemperature",
  "city",
  "fleet",
  "device_type_name",
  "vehicleType",
  "mode",
  "canData",
  "A_SOC_Value", // Add any specific mapped keys you don't want repeated
]);

// Define the grouping structure
const FIELD_GROUPS = {
  "Battery Pack A": [
    "A_Fault_Rank", "A_Insulation_Value", "A_Max_Cell_Temp", "A_Max_Cell_Volt",
    "A_Min_Cell_Temp", "A_Min_Cell_Volt", "A_Pack_Current_Value", "A_Pack_Voltage_Value", "A_SOH_Value"
  ],
  "Battery Pack B": [
    "B_Fault_Rank", "B_Insulation_Value", "B_Max_Cell_Temp", "B_Max_Cell_Volt",
    "B_Min_Cell_Temp", "B_Min_Cell_Volt", "B_Pack_Current_Value", "B_Pack_Voltage_Value", "B_SOC_Value", "B_SOH_Value"
  ],
  "Battery Pack C": [
    "C_Fault_Rank", "C_Insulation_Value", "C_Max_Cell_Temp", "C_Max_Cell_Volt",
    "C_Min_Cell_Temp", "C_Min_Cell_Volt", "C_Pack_Current_Value", "C_Pack_Voltage_Value", "C_SOC_Value", "C_SOH_Value"
  ],
  "Motor & MCU": [
    "MCU_Status", "MCU_State", "MCU_Motor_Speed", "MCU_HighPowerCurrent",
    "MCU_HighPowerVoltage", "MCU_Temperature", "Motor_Temperature", "MCU_DTC_1", "MCU_DTC_2"
  ],
  "Charging & EVCC": [
    "EVCC_1_Status", "EVCC_PresentVoltage", "EVCC_Present_Current", "Gun_Detection_1", "Gun_Detection_2", "Charging_Time"
  ],
  "Body & Peripheral": [
    "Door_1_F", "Door_2_R", "Door_3", "Cabin_Temprature", "Vehicle_Acceleration"
  ],
  "BMS General": [
    "BMS_Status", "BMS_DTC_1", "BMS_DTC_2"
  ]
};

// --- COMPONENT: Technical Details Modal (Fixed Search & Display) ---
const TechDetailsModal = ({ isOpen, onClose, data, vehicleId }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Hook 2: Effect
  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen, data]);

  // Hook 3: useMemo
  const groupedSections = useMemo(() => {
    if (!data) return [];

    const sections = [];
    const usedKeys = new Set();
    const lowerTerm = searchTerm ? searchTerm.toLowerCase() : "";

    // 1. Process Pre-defined Groups
    Object.entries(FIELD_GROUPS).forEach(([groupTitle, keys]) => {
      const groupItems = [];

      keys.forEach((key) => {
        // Check if key exists in data (handling potential case sensitivity if needed, currently strict)
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];

          // Apply Search Filter
          const displayKey = key.replace(/_/g, " ").toLowerCase();
          const rawKey = key.toLowerCase();
          const valStr = String(value).toLowerCase();
          const matches = !lowerTerm || displayKey.includes(lowerTerm) || rawKey.includes(lowerTerm) || valStr.includes(lowerTerm);

          if (matches) {
            groupItems.push([key, value]);
            usedKeys.add(key);
          }
        }
      });

      if (groupItems.length > 0) {
        sections.push({ title: groupTitle, items: groupItems });
      }
    });

    // 2. Process "Others" (Remaining items not in groups and not excluded)
    const otherItems = Object.entries(data).filter(([key, value]) => {
      if (usedKeys.has(key) || EXCLUDED_KEYS.has(key)) return false;

      // Apply Search Filter to Others
      const displayKey = key.replace(/_/g, " ").toLowerCase();
      const rawKey = key.toLowerCase();
      const valStr = String(value).toLowerCase();
      return !lowerTerm || displayKey.includes(lowerTerm) || rawKey.includes(lowerTerm) || valStr.includes(lowerTerm);
    });

    if (otherItems.length > 0) {
      sections.push({ title: "Other Parameters", items: otherItems });
    }

    return sections;
  }, [data, searchTerm]);

  // Helper function
  const handleCopy = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  // --- EARLY RETURN ---
  if (!isOpen || !data) return null;

  return ReactDOM.createPortal(
    <div
      className="tech-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="tech-modal-content"
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "800px",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          animation: "fadeIn 0.2s ease-out",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header Section --- */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f0f0f0",
            backgroundColor: "#fff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#1a1a1a" }}>
                Technical Parameters
              </h3>
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    background: "#eef2ff",
                    color: "#4f46e5",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {vehicleId}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#f5f5f5",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#e5e5e5")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            >
              <MdClose size={22} color="#333" />
            </button>
          </div>

          {/* --- Search Bar --- */}
          <div style={{ position: "relative", width: "100%" }}>
            <MdSearch
              size={20}
              color="#999"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search parameters (e.g. SOC)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#f9fafb" }}>

          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.title} style={{ marginBottom: "32px" }}>

                {/* Group Header */}
                <h4 style={{
                  margin: "0 0 16px 0",
                  fontSize: "1.1rem",
                  color: "#0b5297",
                  borderBottom: "2px solid #e0e0e0",
                  paddingBottom: "8px",
                  display: "inline-block"
                }}>
                  {section.title}
                </h4>

                {/* Grid for this Group */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", // Slightly smaller min-width for compactness
                  gap: "16px",
                }}>
                  {section.items.map(([key, value]) => (
                    <div
                      key={key}
                      className="tech-card"
                      style={{
                        backgroundColor: "#fff",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        border: "2px solid #eee", // Subtle border
                        borderLeft: "4px solid #0b5297", // Accent border on left
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        position: "relative",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                      }}
                      title="Click to copy value"
                      onClick={() => handleCopy(String(value))}
                    >
                      <span style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "#64748b",
                        fontWeight: "700",
                        marginBottom: "6px",
                        wordBreak: "break-word",
                      }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "1.1rem", color: "#1e293b", fontWeight: "600", wordBreak: "break-all" }}>
                          {value === null || value === undefined ? <span style={{ color: "#ccc" }}>N/A</span> : String(value)}
                        </span>
                        <MdContentCopy size={14} color="#cbd5e1" className="copy-icon" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
              <MdSearch size={48} color="#eee" />
              <p style={{ marginTop: "10px" }}>No parameters match "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .tech-modal-content ::-webkit-scrollbar {
          width: 8px;
        }
        .tech-modal-content ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .tech-modal-content ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .tech-modal-content ::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
        .tech-card:hover {
          border-color: #d1d5db !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          cursor: pointer;
        }
        .tech-card .copy-icon {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .tech-card:hover .copy-icon {
          opacity: 1;
        }
      `}</style>
    </div>,
    document.body
  );
};

// ... (Helper functions like getVehicleImage remain unchanged) ...
const getVehicleImage = (model_vrn) => {
  const lower_model = model_vrn?.toLowerCase();
  return VEHICLE_LIST_IMAGE_MAP[lower_model] || VEHICLE_LIST_IMAGE_MAP.default;
};

// ... (VehicleSelector Component remains unchanged) ...
const VehicleSelector = ({
  vehicles,
  selectedVehicleIds,
  onSelectionChange,
}) => {
  // ... [Copy existing VehicleSelector code here] ...
  // It does not need modification for this feature.
  // For brevity in the solution, I am assuming this block is unchanged.
  // Ensure you paste the full VehicleSelector code here.
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { t } = useTranslation();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredVehicles = useMemo(() => {
    const vehicleList = Array.isArray(vehicles) ? vehicles : [];
    if (!debouncedSearchTerm) return vehicleList;
    return vehicleList.filter(
      (v) =>
        (v.displayId || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (v.vehicle_id || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [debouncedSearchTerm, vehicles]);

  const availableVehicles = vehicles.filter(
    (v) => !v.isComingSoon && v.mode !== "nogps"
  );

  const handleSelectAll = (e) => {
    onSelectionChange(
      e.target.checked ? availableVehicles.map((v) => v.vehicle_id) : [],
      null
    );
  };

  const isAllSelected =
    availableVehicles.length > 0 &&
    selectedVehicleIds.length === availableVehicles.length;

  return (
    <div ref={wrapperRef} className="vehicle-selector-wrapper">
      <div className="vehicle-selector-content">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`vehicle-selector-trigger ${isOpen ? "is-open" : ""}`}
          aria-expanded={isOpen}
        >
          <span>
            {selectedVehicleIds.length > 0
              ? `${selectedVehicleIds.length} vehicle(s) selected`
              : t("reports.selectVrnChasisNumber")}
          </span>
          <span className="vehicle-selector-arrow">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="vehicle-selector-panel">
            <input
              type="text"
              className="vehicle-selector-search-input"
              placeholder={t("buttons.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="vehicle-selector-list">
              <li className="vehicle-selector-list-item header">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={availableVehicles.length === 0}
                />
                <label htmlFor="select-all">
                  {t("buttons.selectALlOrNone")}
                </label>
              </li>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => {
                  const isComingSoon = vehicle.isComingSoon;
                  const isNoGps = vehicle.mode === "nogps";
                  const isDisabled = isComingSoon || isNoGps;
                  return (
                    <li
                      key={vehicle.vehicle_id}
                      className={`vehicle-selector-list-item ${isComingSoon ? "is-coming-soon" : ""
                        } ${isNoGps ? "is-nogps" : ""}`}
                    >
                      <input
                        type="checkbox"
                        id={vehicle.vehicle_id}
                        checked={selectedVehicleIds.includes(
                          vehicle.vehicle_id
                        )}
                        onChange={() => {
                          const newSelection = selectedVehicleIds.includes(
                            vehicle.vehicle_id
                          )
                            ? selectedVehicleIds.filter(
                              (id) => id !== vehicle.vehicle_id
                            )
                            : [...selectedVehicleIds, vehicle.vehicle_id];
                          onSelectionChange(newSelection, vehicle);
                        }}
                        disabled={isDisabled}
                      />
                      <label
                        htmlFor={vehicle.vehicle_id}
                        style={{
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        <span
                          className={`vehicle-status-dot ${isNoGps
                            ? "nogps"
                            : vehicle.mode === "inactive"
                              ? "inactive"
                              : "active"
                            }`}
                        ></span>
                        <span className="vehicle-item-text">
                          {vehicle.displayId || vehicle.vehicle_id}
                          {isComingSoon && (
                            <span className="vsl-dropdown-coming-soon-badge">
                              Coming Soon
                            </span>
                          )}
                          {isNoGps && (
                            <span className="vsl-dropdown-nogps-badge">
                              No GPS
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })
              ) : (
                <li className="vehicle-selector-no-results">
                  {t("status.noResultsFound", "No vehicles found.")}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Optimized VehicleCard (Includes Double Click) ---
const VehicleCard = React.memo(
  ({
    vehicle,
    isSelected,
    onSelect,
    onDoubleClick, // <--- Props
    t,
    address,
    onFetchAddress,
    isComingSoon,
    isNoGps,
  }) => {
    const isDisabled = isComingSoon || isNoGps;

    // Performance: Only recalc image when imageName changes

    const handleMouseEnter = useCallback(() => {
      if (
        !isDisabled &&
        (!address || address === t("status.addressNotFound"))
      ) {
        onFetchAddress(vehicle);
      }
    }, [isDisabled, address, t, onFetchAddress, vehicle]);

    // Handler wrappers
    const handleClick = useCallback(
      () => !isDisabled && onSelect(vehicle),
      [isDisabled, onSelect, vehicle]
    );
    const handleDoubleClick = useCallback(() => {
      if (!isDisabled && onDoubleClick) {
        onDoubleClick(vehicle);
      }
    }, [isDisabled, onDoubleClick, vehicle]);

    const handleKeyPress = (e) => {
      if (e.key === "Enter") handleClick();
    };

    function formatISTTime(isoString) {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "N/A";
      const options = {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      };
      return new Intl.DateTimeFormat("en-IN", options).format(date);
    }

    // Temperature selection logic (memoized):
    // - for vehicle types including '6s' or '3s' prefer socket 'ts'
    // - otherwise prefer socket 'cell_temp'
    const displayTemp = useMemo(() => {
      const socket = vehicle?.socketData || {};
      const model = (vehicle?.vehicleType || "").toString().toLowerCase();
      const isTsModel = model.includes("6s") || model.includes("3s");

      let val;
      if (isTsModel) {
        val = socket.ts ?? socket.TS ?? socket.ts1 ?? socket.ts_val ?? socket.cell_temp ?? socket.cellTemperature;
      } else {
        val = socket.cell_temp ?? socket.cellTemp ?? socket.cellTemperature ?? socket.ts ?? socket.TS;
      }

      if (val === undefined || val === null || val === "") {
        val = vehicle?.cellTemperature ?? vehicle?.cell_temp ?? vehicle?.cellTemp ?? 0;
      }

      const n = Number(val);
      return Number.isFinite(n) ? n : val;
    }, [vehicle]);

    // Determine Status Class
    let statusClass = "v-status-active";
    let statusText = t("status.active");

    if (isComingSoon) {
      statusClass = "v-status-coming-soon";
      statusText = t("status.inactive");
    } else if (isNoGps) {
      statusClass = "v-status-nogps";
      statusText = t("status.noGps", "No GPS");
    } else if (vehicle.mode === "inactive") {
      statusClass = "v-status-inactive";
      statusText = t("status.inactive");
    }

    return (
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        id="vs-lcontainer"
        className={`${statusClass} ${isSelected ? "is-selected" : ""}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick} // <--- Event Attached
        onMouseEnter={handleMouseEnter}
        onKeyPress={!isDisabled ? handleKeyPress : undefined}
        style={{
          cursor: isDisabled ? "not-allowed" : "pointer",
          // Border is now handled via CSS classes
          outlineOffset: "2px",
          userSelect: "none", // Prevents text selection on double click
        }}
      >
        <div id="vsl-status">
          <p>{statusText}</p>
        </div>
        <div
          id="vsl-vdetails"
        // Inline background color logic removed in favor of CSS classes
        >
          {/* ... (Existing Card Content Layout - Unchanged) ... */}
          <div id="vsl-fleetOwnertitle">
            <div id="vsl-fleetOwnerList">
              <MdPerson className="vsl-mui-icon vsl-icon-fleet" />
              <p>{vehicle.fleet || "N/A"}</p>
            </div>
            <div id="vsl-fleetInfo">
              <MdDirectionsBus className="vsl-mui-icon vsl-icon-type" />
              <p>{vehicle.vehicleType}</p>
            </div>
            <div
              className={`can-status ${vehicle.mode === "inactive"
                ? "unavailable"
                : vehicle.canData
                  ? "available"
                  : "unavailable"
                }`}
            >
              {vehicle.mode === "active" &&
                (vehicle.canData ? (
                  <MdCheckCircle className="vsl-mui-icon vsl-icon-can-ok" />
                ) : (
                  <MdCancel className="vsl-mui-icon vsl-icon-can-na" />
                ))}

              <span className="status-text">
                {vehicle.mode === "active"
                  ? vehicle.canData
                    ? "CAN Data Available"
                    : "CAN Data N/A"
                  : formatISTTime(vehicle.timestamp)}
              </span>
            </div>
          </div>
          <div id="vsl-vinfo">
            <div id="vsl-vd-image">
              {isComingSoon && (
                <div className="vsl-coming-soon-badge">COMING SOON</div>
              )}
              <img
                src={getVehicleImage(vehicle.vehicleType)}
                alt="Vehicle"
                className="vehicle-card-image" // Added class for CSS control
              />
              <p>{vehicle.displayId || vehicle.vehicle_id}</p>
            </div>
            <div id="vsl-dinfo">
              <div id="vsl-vd-ow">
                <div className="vsl-stat-item">
                  <MdSpeed className="vsl-mui-icon vsl-icon-speed" />
                  <p>{vehicle.speed?.toFixed(1) ?? 0} km/h</p>
                </div>
                <div className="vsl-stat-item">
                  <MdBatteryChargingFull className="vsl-mui-icon vsl-icon-soc" />
                  <p>{(Number(vehicle.SOC) || 0).toFixed(0)}%</p>
                </div>
                <div className="vsl-stat-item">
                  <MdRoute className="vsl-mui-icon vsl-icon-dte" />
                  <p>{vehicle.DTE ?? 0} km</p>
                </div>
                <div className="vsl-stat-item">
                  <MdThermostat className="vsl-mui-icon vsl-icon-temp" />
                  <p>{displayTemp === null || displayTemp === undefined ? (
                    <span style={{ color: "#ccc" }}>N/A</span>
                  ) : (
                    `${displayTemp}°C`
                  )}</p>
                </div>
              </div>
              <p id="vsl-vl-add">
                <MdLocationOn className="vsl-mui-icon vsl-icon-location" />
                <span>{address}</span>
              </p>

              {/* Service Info Block */}
              {(() => {
                const contactKey = Object.keys(SERVICE_CONTACTS_MAP).find(
                  (key) =>
                    (vehicle.vehicleType &&
                      vehicle.vehicleType.includes(key)) ||
                    (vehicle.city && vehicle.city.includes(key))
                );
                const contactInfo = contactKey
                  ? SERVICE_CONTACTS_MAP[contactKey]
                  : null;
                if (!contactInfo || !contactInfo.name) return null;

                const is25T = contactKey === "2.5t";
                const showEkaService = !is25T;

                return (
                  <div
                    id="vsl-service-info"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      marginTop: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {showEkaService && (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <MdBuild
                          className="vsl-mui-icon vsl-icon-service"
                          style={{ marginRight: "6px" }}
                        />
                        <strong className="small-text">EKA Service</strong>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginLeft: is25T ? "60px" : "0px",
                      }}
                    >
                      <MdPerson
                        className="vsl-mui-icon vsl-icon-contact"
                        style={{ marginRight: "6px" }}
                      />
                      <span>{contactInfo.name}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginLeft: is25T ? "60px" : "0px",
                      }}
                    >
                      <MdPhone
                        className="vsl-mui-icon vsl-icon-phone"
                        style={{ marginRight: "6px" }}
                      />
                      <span>{contactInfo.contact}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// --- MAIN COMPONENT ---
function VehicleSelectionList({ imageName, vehicleData }) {
  const { t } = useTranslation();
  const {
    selectedVehicle,
    setSelectedVehicle,
    selectedVehicleIds,
    onSelectionChange,
  } = useContext(VehicleSelectionContext);

  const [addressCache, setAddressCache] = useState(new Map());
  const addressCacheRef = useRef(new Map());
  const isFetchingRef = useRef(new Set());

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    data: null,
    vehicleId: "",
  });

  // Update Cache Helper
  const updateAddressCache = (key, value) => {
    addressCacheRef.current.set(key, value);
    setAddressCache(new Map(addressCacheRef.current));
  };

  // --- LOGIC: Double Click to Open Modal ---
  const handleCardDoubleClick = useCallback((vehicle) => {
    const data = vehicle?.socketData; // Safe access
    if (!data) {
      // Optional: User feedback if needed, or silent fail
      // console.warn("No live data available");
      return;
    }

    // Heuristic: "Special" data has significantly more keys (e.g. >20) than standard data (~14)
    if (Object.keys(data).length > 20) {
      setModalState({
        isOpen: true,
        data: data,
        vehicleId: vehicle.displayId || vehicle.vehicle_id,
      });
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const fetchAddressForVehicle = useCallback(
    async (vehicle) => {
      const vehicleId = vehicle.vehicle_id;
      // Prevent duplicate fetches
      if (
        addressCacheRef.current.has(vehicleId) ||
        isFetchingRef.current.has(vehicleId)
      )
        return;

      // Check session storage
      const cached = sessionStorage.getItem(`address_${vehicleId}`);
      if (cached) {
        updateAddressCache(vehicleId, cached);
        return;
      }

      isFetchingRef.current.add(vehicleId);
      let fetchedAddress;

      if (vehicle.latitude === undefined || vehicle.longitude === undefined) {
        fetchedAddress = t("status.locationNotAvailable");
      } else {
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
          const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${vehicle.latitude},${vehicle.longitude}&key=${apiKey}`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          fetchedAddress =
            data.status === "OK" && data.results[0]
              ? data.results[0].formatted_address
              : t("status.addressNotFound");
        } catch (error) {
          fetchedAddress = t("status.couldNotRetrieveAddress");
          console.error(error);
        }
      }

      sessionStorage.setItem(`address_${vehicleId}`, fetchedAddress);
      isFetchingRef.current.delete(vehicleId);
      updateAddressCache(vehicleId, fetchedAddress);
    },
    [t]
  );

  // Sorting & Filtering Logic
  const sortedVehicleData = useMemo(() => {
    const list = Array.isArray(vehicleData) ? vehicleData : [];
    return [...list].sort((a, b) => {
      if (a.isComingSoon !== b.isComingSoon) return a.isComingSoon ? 1 : -1;
      const aNoGps = a.mode === "nogps";
      const bNoGps = b.mode === "nogps";
      if (aNoGps !== bNoGps) return aNoGps ? 1 : -1;
      const aActive = a.mode === "active";
      const bActive = b.mode === "active";
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (a.displayId || "").localeCompare(b.displayId || "");
    });
  }, [vehicleData]);

  const vehiclesToDisplay = useMemo(() => {
    if (selectedVehicleIds.length > 0) {
      return sortedVehicleData.filter(
        (v) =>
          !v.isComingSoon &&
          v.mode !== "nogps" &&
          selectedVehicleIds.includes(v.vehicle_id)
      );
    }
    return sortedVehicleData;
  }, [selectedVehicleIds, sortedVehicleData]);

  // Infinite Scroll Logic
  const INITIAL_BATCH = 15;
  const LOAD_MORE_COUNT = 15;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const containerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [vehiclesToDisplay.length]); // Reset when list changes

  const visibleVehicles = useMemo(
    () => vehiclesToDisplay.slice(0, visibleCount),
    [vehiclesToDisplay, visibleCount]
  );

  const hasMore = visibleCount < vehiclesToDisplay.length;

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) =>
            Math.min(prev + LOAD_MORE_COUNT, vehiclesToDisplay.length)
          );
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 } // Increased margin for smoother loading
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, vehiclesToDisplay.length]);

  const handleSelectionChange = useCallback(
    (selectedIds, lastToggledVehicle) => {
      onSelectionChange(selectedIds);
      if (lastToggledVehicle) {
        setSelectedVehicle(lastToggledVehicle);
      } else if (selectedIds.length > 0) {
        // Logic to keep a 'current' selection highlighting if user mass selects
        const lastSelectedId = selectedIds[selectedIds.length - 1];
        const vehicle = sortedVehicleData.find(
          (v) => v.vehicle_id === lastSelectedId
        );
        if (vehicle) setSelectedVehicle(vehicle);
      } else {
        setSelectedVehicle(null);
      }
    },
    [onSelectionChange, setSelectedVehicle, sortedVehicleData]
  );

  return (
    <div
      id="vehicleSelection-info-container-2-vlist"
      ref={containerRef}
      style={{ height: "100%" }}
    >
      <VehicleSelector
        vehicles={sortedVehicleData}
        selectedVehicleIds={selectedVehicleIds}
        onSelectionChange={handleSelectionChange}
      />
      <div id="vsl-cont" style={{ flex: 1, overflowY: "auto" }}>
        {visibleVehicles.length > 0 ? (
          <>
            {visibleVehicles.map((vehicle) => {
              const isNoGps = vehicle.mode === "nogps";
              // Address lookup
              const address = isNoGps
                ? t("status.locationNotAvailable")
                : addressCache.get(vehicle.vehicle_id) ||
                sessionStorage.getItem(`address_${vehicle.vehicle_id}`) ||
                t("status.addressNotFound");

              return (
                <VehicleCard
                  key={vehicle.vehicle_id}
                  vehicle={vehicle}
                  isComingSoon={vehicle.isComingSoon}
                  isNoGps={isNoGps}
                  isSelected={
                    selectedVehicle?.vehicle_id === vehicle.vehicle_id
                  }
                  imageName={imageName}
                  onSelect={setSelectedVehicle}
                  onDoubleClick={handleCardDoubleClick} // <--- Passed here
                  t={t}
                  address={address}
                  onFetchAddress={fetchAddressForVehicle}
                />
              );
            })}
            {hasMore && (
              <div
                ref={loadMoreTriggerRef}
                style={{
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "var(--secondary-text-color)",
                  fontSize: "12px",
                }}
              >
                Loading more...
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--secondary-text-color)",
            }}
          >
            <h3>{t("status.noVehiclesToDisplay")}</h3>
            <p>{t("status.tryClearingFilters")}</p>
          </div>
        )}
      </div>

      {/* Render Modal via Portal */}
      <TechDetailsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        data={modalState.data}
        vehicleId={modalState.vehicleId}
      />
    </div>
  );
}

VehicleSelectionList.propTypes = {
  imageName: PropTypes.string.isRequired,
  vehicleData: PropTypes.arrayOf(
    PropTypes.shape({
      vehicle_id: PropTypes.string.isRequired,
      mode: PropTypes.string,
    })
  ).isRequired,
};

export default VehicleSelectionList;
