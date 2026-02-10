import React from "react";
import AddVehicleForm from "./AddVehicleForm";
import { useTranslation } from "react-i18next";

const AddVehicleModal = ({ isOpen, onClose, onSubmit, onChange, formData }) => {
  const { t } = useTranslation(); 
  const __addNewVehicle = t("AddVehicle.add_new_vehicle", "Add New Vehicle");
  if (!isOpen) return null;

  return (
    <div className="vm-modal-overlay" onClick={onClose}>
      <div className="vm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vm-modal-header">
          <h3 id="av-title">{__addNewVehicle}</h3>
          <button className="vm-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="vm-modal-body">
          <AddVehicleForm
            onSubmit={onSubmit}
            onChange={onChange}
            formData={formData}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
