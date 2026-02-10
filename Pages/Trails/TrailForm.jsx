// src/components/Trails/TrailForm.jsx
import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const TrailForm = memo(
  ({
    isLoading,
    onCancel,
    // New Props
    selectedFleet,
    setSelectedFleet,
    // Existing Props
    vehicleType,
    setVehicleType,
    selectedCity,
    setSelectedCity,
    deviceId,
    setDeviceId,
    date,
    setDate,
    userDevices,
    onSubmit,
    highlightDates,
  }) => {
    const { t } = useTranslation();
    const today = new Date();

    // --- UI State for Dropdowns ---
    const [isFleetOpen, setIsFleetOpen] = useState(false); // <--- NEW
    const [isVehicleTypeOpen, setIsVehicleTypeOpen] = useState(false);
    // const [isCityOpen, setIsCityOpen] = useState(false); // Optional: Keep if you still want City
    const [isVrnChassisOpen, setIsVrnChassisOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [vrnChassisDisplay, setVrnChassisDisplay] = useState("");

    // --- Refs for Click Outside ---
    const fleetRef = useRef(null); // <--- NEW
    const vehicleTypeRef = useRef(null);
    // const cityRef = useRef(null);
    const vrnChassisRef = useRef(null);

    // --- Click Outside Logic ---
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (fleetRef.current && !fleetRef.current.contains(event.target)) {
          setIsFleetOpen(false);
        }
        if (
          vehicleTypeRef.current &&
          !vehicleTypeRef.current.contains(event.target)
        ) {
          setIsVehicleTypeOpen(false);
        }
        // if (cityRef.current && !cityRef.current.contains(event.target)) {
        //   setIsCityOpen(false);
        // }
        if (
          vrnChassisRef.current &&
          !vrnChassisRef.current.contains(event.target)
        ) {
          setIsVrnChassisOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // =========================================================
    // --- CASCADING DATA LOGIC (Fleet -> Type -> Reg) ---
    // =========================================================

    // 1. FLEET OPTIONS (All Unique Fleets)
    const fleetOptions = useMemo(() => {
      const fleets = userDevices.map((v) => v.fleet_name).filter(Boolean);
      return [...new Set(fleets)].sort().map((f) => ({ value: f, label: f }));
    }, [userDevices]);

    // 2. VEHICLE TYPE OPTIONS (Filtered by Fleet)
    const vehicleTypeOptions = useMemo(() => {
      let filtered = userDevices;

      // Filter by Fleet if selected
      if (selectedFleet) {
        filtered = filtered.filter((v) => v.fleet_name === selectedFleet);
      }

      const uniqueTypes = [...new Set(filtered.map((v) => v.device_type_name))];
      return uniqueTypes.sort().map((type) => ({ value: type, label: type }));
    }, [userDevices, selectedFleet]);

    // 3. VRN/CHASSIS OPTIONS (Filtered by Fleet AND Type)
    const vrnChassisOptions = useMemo(() => {
      return userDevices
        .filter((v) => {
          const matchFleet = selectedFleet
            ? v.fleet_name === selectedFleet
            : true;
          const matchType = vehicleType
            ? v.device_type_name === vehicleType
            : true;
          return matchFleet && matchType;
        })
        .map((v) => ({
          value: v.device_id,
          label: v.VRN || v.chassis_number || "Unknown Device",
        }));
    }, [userDevices, selectedFleet, vehicleType]);

    const filteredVrnChassisOptions = vrnChassisOptions.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Handlers ---

    // Reset everything downstream when Fleet changes
    const handleFleetSelect = (fleet) => {
      setSelectedFleet(fleet);
      setVehicleType("");
      setDeviceId("");
      setVrnChassisDisplay("");
      setIsFleetOpen(false);
    };

    const handleVehicleTypeSelect = (selectedType) => {
      setVehicleType(selectedType);
      setDeviceId("");
      setVrnChassisDisplay("");
      setIsVehicleTypeOpen(false);
    };

    const handleVrnChassisSelect = (value, label) => {
      setDeviceId(value);
      setVrnChassisDisplay(label);
      setIsVrnChassisOpen(false);
      setSearchQuery("");
    };

    const handleSubmit = (e) => {
      if (e) e.preventDefault();
      // Validation
      if (!deviceId || !date) {
        toast.error(
          t(
            "userAlerts.selectBothVehicleAndDate",
            "Please select both a vehicle and a date."
          )
        );
        return;
      }
      onSubmit();
    };

    return (
      <form className="Trails-form" onSubmit={handleSubmit}>
        <div className="trails-header">
          <h2>{t("trails.title", "Trails")}</h2>
        </div>

        <div className="trails-controls">
          {/* 1. NEW FLEET DROPDOWN */}
          <span className="trails-dropdown-container" ref={fleetRef}>
            <p className="trails-dropdown-title">
              {t("vehicle.fleet", "Fleet")}
            </p>
            <button
              type="button"
              className="trails-dropdown-button"
              onClick={() => setIsFleetOpen(!isFleetOpen)}
              disabled={isLoading}
            >
              {selectedFleet || t("vehicle.selectFleet", "Select Fleet")}
            </button>
            {isFleetOpen && (
              <ul className="trails-dropdown-list" role="menu">
                {fleetOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => handleFleetSelect(option.value)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </span>

          {/* 2. VEHICLE TYPE DROPDOWN */}
          <span className="trails-dropdown-container" ref={vehicleTypeRef}>
            <p className="trails-dropdown-title">
              {t("vehicle.vehicleType", " Vehicle Type")}
            </p>
            <button
              type="button"
              className="trails-dropdown-button"
              onClick={() => setIsVehicleTypeOpen(!isVehicleTypeOpen)}
              // Disable if no Fleet selected (optional, remove disabled check if you want it loose)
              disabled={isLoading || !selectedFleet}
            >
              {vehicleType || t("vehicle.vehicleType", " Vehicle Type")}
            </button>
            {isVehicleTypeOpen && (
              <ul className="trails-dropdown-list" role="menu">
                {vehicleTypeOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => handleVehicleTypeSelect(option.value)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </span>

          {/* 3. VRN/Chassis Searchable Dropdown */}
          <span className="trails-dropdown-container" ref={vrnChassisRef}>
            <p className="trails-dropdown-title">
              {t("vehicle.vrnChassisNumber")}
            </p>
            {isVrnChassisOpen ? (
              <input
                type="text"
                className="trails-dropdown-button"
                placeholder="Search VRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="trails-dropdown-button"
                onClick={() => setIsVrnChassisOpen(!isVrnChassisOpen)}
                disabled={!vehicleType || isLoading}
              >
                {vrnChassisDisplay || t("reports.selectVrnChasis")}
              </button>
            )}
            {isVrnChassisOpen && (
              <ul className="trails-dropdown-list" role="menu">
                {filteredVrnChassisOptions.length > 0 ? (
                  filteredVrnChassisOptions.map((option) => (
                    <li
                      key={option.value}
                      onClick={() =>
                        handleVrnChassisSelect(option.value, option.label)
                      }
                    >
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className="trails-dropdown-no-results">
                    {t("systemUtility.noResults", "No results found")}
                  </li>
                )}
              </ul>
            )}
          </span>

          {/* 4. Date Picker */}
          <span className="Trails-Selection-Menu-Selections">
            <p className="Trails-Selection-Menu-Selections-title">
              {t("systemUtility.date", "Date")}
            </p>
            <DatePicker
              dateFormat="yyyy-MM-dd"
              selected={date}
              onChange={setDate}
              className="Trails-Date"
              placeholderText="YYYY-MM-DD"
              maxDate={today}
              disabled={isLoading}
            />
          </span>

          {/* Submit/Cancel Button */}
          <span className="Trails-Selection-Menu-Selections">
            <p className="Trails-Selection-Menu-Selections-title">&nbsp;</p>
            <button
              type="button"
              className={`Trails-submit ${isLoading ? "is-cancel" : ""}`}
              disabled={
                !isLoading &&
                (!selectedFleet || !vehicleType || !deviceId || !date)
              }
              onClick={isLoading ? onCancel : handleSubmit}
            >
              {isLoading ? t("buttons.cancel", "Cancel") : t("buttons.submit", "Submit")}
            </button>
          </span>
        </div>
      </form>
    );
  }
);

TrailForm.displayName = "TrailForm";

TrailForm.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  // Added Prop Types
  selectedFleet: PropTypes.string,
  setSelectedFleet: PropTypes.func.isRequired,
  vehicleType: PropTypes.string,
  setVehicleType: PropTypes.func.isRequired,
  deviceId: PropTypes.string,
  setDeviceId: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date),
  setDate: PropTypes.func.isRequired,
  userDevices: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TrailForm;
