import React, { useState, useMemo, useEffect } from "react";
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AddVehicle.css"; 
import { useTranslation } from "react-i18next";

// Import the new components
import VehicleHeader from "./VehicleHeader";
import VehicleTable from "./VehicleTable";
// import Pagination from "./Pagination";
import PaginationControls from "../Device Summary/PaginationControls";
import AddVehicleModal from "./AddVehicleModal";
import VehicleDetailsModal from "./VehicleDetailsModal";

// --- Main Alerts Component ---
const Alerts = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const __vehicleAdded = t("AddVehicle.vehicle_added", "Vehicle added successfully!");
  const __editAction = t("AddVehicle.edit_action", "Edit action triggered!");
  const __deleteAction = t("AddVehicle.delete_action", "Delete action triggered!");
  // All translation variables format __variableName
  // This convention helps quickly identify multilingual text in the component.
  // ----------------------------

  const initialFormState = {
    device_id: "",
    device_type: "",
    device_type_name: "",
    VRN: "",
    chassis_number: "",
    city: "",
    DOP: "",
    reg_date: "",
    battery_type: "",
    battery_make: "",
    refurbished: "No",
    expire_on: "",
    payment_model: "",
    fleet_owner: "",
    fleet: "",
    is_connected: false,
    is_active: true,
  };
  const [vehicleInfo, setVehicleInfo] = useState(initialFormState);

  // --- Data Fetching Stays Here ---
  const {
    data: allDevices,
    error,
    isLoading,
    refetch,
  } = useGetAllDevicesQuery();

  // --- Logic & Memoization Stays Here ---
  const filteredDevices = useMemo(() => {
    if (!allDevices) return [];
    if (!searchTerm) return allDevices;

    return allDevices.filter(
      (device) =>
        (device.device_id &&
          device.device_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.VRN &&
          device.VRN.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.chassis_number &&
          device.chassis_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (device.fleet_owner &&
          device.fleet_owner.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allDevices, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Dynamic items per page logic
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const availableHeight = window.innerHeight - 450;
      const rowHeight = 40;
      const calculated = Math.max(Math.floor(availableHeight / rowHeight), 5);
      setItemsPerPage(calculated);
    };

    calculateItemsPerPage();
    window.addEventListener("resize", calculateItemsPerPage);
    return () => {
      window.removeEventListener("resize", calculateItemsPerPage);
    };
  }, []);

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, currentPage, itemsPerPage]);

  const totalItems = filteredDevices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // --- All Event Handlers Stay Here ---
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVehicleInfo((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedVehicle(null);
    setVehicleInfo(initialFormState);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    console.log("Vehicle data submitted:", vehicleInfo);
    toast.success(__vehicleAdded);
    refetch();
    closeModals();
  };

  const handleEdit = () => {
    console.log("Editing vehicle:", selectedVehicle.device_id);
    toast.info(__editAction);
    refetch();
    closeModals();
  };

  const handleDelete = () => {
    console.log("Deleting vehicle:", selectedVehicle.device_id);
    toast.error(__deleteAction);
    refetch();
    closeModals();
  };

  const handleRowClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
  };

  // --- Render (now much simpler) ---
  return (
    <div className="vm-page">
      <ToastContainer position="top-right" autoClose={3000} />

      <VehicleHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <VehicleTable
        devices={paginatedDevices}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        onRowClick={handleRowClick}
      />

      {totalPages > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage} // number of items per page
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        onSubmit={handleAddSubmit}
        onChange={handleFormChange}
        formData={vehicleInfo}
      />

      <VehicleDetailsModal
        vehicle={selectedVehicle}
        onClose={closeModals}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Alerts;