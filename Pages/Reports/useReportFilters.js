import { useState } from "react";

export const useReportFilters = () => {
  const [reportType, setReportType] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [vrnChassis, setVrnChassis] = useState("");
  const [vrnChassisDisplay, setVrnChassisDisplay] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [fleet, setFleet] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleReportTypeSelect = (value) => {
    setReportType(value);
    // Reset dependent filters when the report type changes
    setVehicleType("");
    setVrnChassis("");
    setVrnChassisDisplay("");
    setFleet("");
  };

  const handleVehicleTypeSelect = (value) => {
    setVehicleType(value);
    setVrnChassis("");
    setVrnChassisDisplay("");
  };

  const handleVrnChassisSelect = (value, label) => {
    setVrnChassis(value);
    setVrnChassisDisplay(label);
  };

  const handleFleetSelect = (value) => {
    setFleet(value);
  };

  return {
    reportType,
    vehicle,
    vrnChassis,
    vrnChassisDisplay,
    vehicleType,
    fleet,
    searchQuery,
    setReportType,
    setVehicle,
    setVrnChassis,
    setVrnChassisDisplay,
    setVehicleType,
    setFleet,
    setSearchQuery,
    handleReportTypeSelect,
    handleVehicleTypeSelect,
    handleVrnChassisSelect,
    handleFleetSelect,
  };
};