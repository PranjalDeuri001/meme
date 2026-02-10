import React from "react";
import { useTranslation } from "react-i18next";

// Helper to format cell content
const formatCell = (content) => {
  if (content === null || content === undefined) return "N/A";
  if (typeof content === "boolean") return content ? "Yes" : "No";
  return String(content);
};

const VehicleDetailsModal = ({ vehicle, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation(); 
  const __vehicleDetails = t("AddVehicle.vehicle_details", "Vehicle Details:");
  const __edit = t("AddVehicle.edit", "Edit");
  const __delete = t("AddVehicle.delete", "Delete");

  if (!vehicle) return null;

  return (
    <div className="vm-modal-overlay" onClick={onClose}>
      <div className="vm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vm-modal-header">
          <h3 id="av-title"> {__vehicleDetails} {vehicle.device_id}</h3>
          <button className="vm-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="vm-modal-body vm-details-body">
          <ul>
            {Object.entries(vehicle).map(
              ([key, value]) =>
                key !== "id" && (
                  <li key={key}>
                    <strong>{t(`AddVehicle.${key}`, key.replace(/_/g, " "))}:</strong>
                    <span>{formatCell(value)}</span>
                  </li>
                )
            )}
          </ul>
        </div>
        <div className="vm-modal-footer">
          <button className="theme-btn theme-btn-outlined" onClick={onEdit}>
            {__edit}
          </button>
          <button className="theme-btn theme-btn-danger" onClick={onDelete}>
            {__delete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;
