// FilterButtons.jsx
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import DateTimeRangePicker from "./DateTimeRangePicker"; 
import propsTypes from "prop-types";

import "react-toastify/dist/ReactToastify.css";
 

const reportOptions = (t) => [
  { value: "CAN Report", label: t("reports.canReport") },
  { value: "Daily Summary Report", label: t("reports.dailySummaryReport") },
  { value: "Energy Consumption Report", label: t("reports.energyConsumptionReport") },
  { value: "MIS Report", label: t("reports.misReport") },
  { value: "Cooling Report", label: t("reports.coolingReport") },
  { value: "Charging Report", label: t("reports.chargingReport") },
  { value: "DOD Report", label: t("reports.dodReport") },
];

function FilterButtons({
  onSubmit,
  reportType,
  setReportType,
  vehicleType,
  setVehicleType,
  vrnChassis,
  setVrnChassis,
  dateRange,
  setDateRange,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  setSubmitted,
  showReportType = true,
  showVehicleType = true,
  showVrnChassis = true,
  showDateTime = true,
  showSubmit = true,
}) {
  const {
    data: vehicles = [],
    isLoading: isVehicleListLoading,
    isError: isVehicleListError,
  } = useGetAllDevicesQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [vrnChassisDisplay, setVrnChassisDisplay] = useState(
    vrnChassis ? vehicles.find((v) => v.chassis_number === vrnChassis)?.VRN || vrnChassis : ""
  );

  const { t } = useTranslation();

  const reportTypeRef = useRef(null);
  const vehicleTypeRef = useRef(null);
  const vrnChassisRef = useRef(null);

  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false);
  const [isVehicleTypeOpen, setIsVehicleTypeOpen] = useState(false);
  const [isVrnChassisOpen, setIsVrnChassisOpen] = useState(false);

  useEffect(() => {
    if (isVehicleListError) {
      toast.error(t("userAlerts.failedToLoadVehicleData"));
    }
  }, [isVehicleListError, t]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (reportTypeRef.current && !reportTypeRef.current.contains(event.target)) {
        setIsReportTypeOpen(false);
      }
      if (vehicleTypeRef.current && !vehicleTypeRef.current.contains(event.target)) {
        setIsVehicleTypeOpen(false);
      }
      if (vrnChassisRef.current && !vrnChassisRef.current.contains(event.target)) {
        setIsVrnChassisOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleReportTypeSelect = (value) => {
    setReportType(value);
    setIsReportTypeOpen(false);
    setSubmitted(false);
  };

  const handleVehicleTypeSelect = (value) => {
    setVehicleType(value);
    setVrnChassis("");
    setVrnChassisDisplay("");
    setIsVehicleTypeOpen(false);
    setSubmitted(false);
  };

  const handleVrnChassisSelect = (value, label) => {
    setVrnChassis(value);
    setVrnChassisDisplay(label);
    setIsVrnChassisOpen(false);
    setSubmitted(false);
  };

  const localHandleSubmit = () => {
    onSubmit({
      reportType,
      vehicleType,
      vrnChassis,
      dateRange,
      startTime,
      endTime,
    });
    setSubmitted(true);
  };

  const vehicleTypeOptions = [
    ...new Set(vehicles.map((v) => v.device_type_name)),
  ].map((type) => ({ value: type, label: type }));

  const uniqueVrnChassis = [
    ...new Set(
      vehicles
        .filter((v) => !vehicleType || v.device_type_name === vehicleType)
        .map((v) => v.chassis_number)
    ),
  ];

  const vrnChassisOptions = [
    ...uniqueVrnChassis.map((chassis) => {
      const selectedVehicle = vehicles.find((v) => v.chassis_number === chassis);
      return {
        value: chassis,
        label: selectedVehicle?.VRN || chassis,
      };
    }),
  ];

  const filteredVrnChassisOptions = vrnChassisOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="reports-form">
      {showReportType && (
        <span className="custom-dropdown-container" ref={reportTypeRef}>
          <p className="reports-Selection-Menu-Selections-title">
            {t("reports.reportType")}
          </p>
          <button
            className="report-dropdown"
            onClick={() => setIsReportTypeOpen(!isReportTypeOpen)}
          >
            {reportType || t("reports.selectReport")}
          </button>
          {isReportTypeOpen && (
            <ul className="custom-dropdown-list">
              {reportOptions(t).map((option) => (
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
      )}

      {showVehicleType && (
        <span className="custom-dropdown-container" ref={vehicleTypeRef}>
          <p className="reports-Selection-Menu-Selections-title">
            {t("vehicle.vehicleType")}
          </p>
          <button
            className="report-dropdown"
            onClick={() => setIsVehicleTypeOpen(!isVehicleTypeOpen)}
            disabled={!reportType || isVehicleListLoading}
          >
            {vehicleType || t("reports.selectVehicleType")}
          </button>
          {isVehicleTypeOpen && (
            <ul className="custom-dropdown-list">
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
      )}

      {showVrnChassis && (
        <span className="custom-dropdown-container" ref={vrnChassisRef}>
          <p className="reports-Selection-Menu-Selections-title">
            {t("vehicle.vrnChassisNumber")}
          </p>
          {isVrnChassisOpen ? (
            <input
              type="text"
              className="report-dropdown"
              placeholder="Search VRN / Chassis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!vehicleType || isVehicleListLoading}
            />
          ) : (
            <button
              className="report-dropdown"
              onClick={() => setIsVrnChassisOpen(!isVrnChassisOpen)}
              disabled={!vehicleType || isVehicleListLoading}
            >
              {vrnChassisDisplay || t("reports.selectVrnChasis")}
            </button>
          )}
          {isVrnChassisOpen && (
            <ul className="custom-dropdown-list">
              {filteredVrnChassisOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleVrnChassisSelect(option.value, option.label)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </span>
      )}

      {showDateTime && (
        <span className="date-time-picker-container">
          <p className="reports-Selection-Menu-Selections-title">
            {t("systemUtility.dateTimeRange")}
          </p>
          <DateTimeRangePicker
            onConfirm={({ dates, startTime: st, endTime: et }) => {
              // Normalize into Date objects safely
              const normalize = (d) => (d instanceof Date ? d : d ? new Date(d) : null);

              const start = normalize(dates?.[0]);
              const end = normalize(dates?.[dates.length - 1]);

              setDateRange(
                start && end
                  ? [{ startDate: start, endDate: end, key: "selection" }]
                  : []
              );

              setStartTime(normalize(st));
              setEndTime(normalize(et));
              setSubmitted(false);
            }}
          />
        </span>
      )}

      {showSubmit && (
        <span>
          <button
            className="report-dropdown submit-btn"
            onClick={localHandleSubmit}
            disabled={!reportType || !vrnChassis}
          >
            {t("buttons.submit")}
          </button>
        </span>
      )}
    </div>
  );
}
FilterButtons.propTypes = {
  onSubmit: propsTypes.func.isRequired,
  reportType: propsTypes.string,
  setReportType: propsTypes.func.isRequired,
  vehicleType: propsTypes.string,
  setVehicleType: propsTypes.func.isRequired,
  vrnChassis: propsTypes.string,
  setVrnChassis: propsTypes.func.isRequired,
  dateRange: propsTypes.array,
  setDateRange: propsTypes.func.isRequired,
  startTime: propsTypes.instanceOf(Date),
  setStartTime: propsTypes.func.isRequired, 
  endTime: propsTypes.instanceOf(Date),
  setEndTime: propsTypes.func.isRequired,
  setSubmitted: propsTypes.func.isRequired,
  showReportType: propsTypes.bool,  
  showVehicleType: propsTypes.bool,  
  showVrnChassis: propsTypes.bool,  
  showDateTime: propsTypes.bool,  
  showSubmit: propsTypes.bool,  
};

export default FilterButtons;


