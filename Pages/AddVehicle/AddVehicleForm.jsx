import React from "react";
import { useTranslation } from "react-i18next";

const AddVehicleForm = ({ onSubmit, onChange, formData, onCancel }) => {

  const { t } = useTranslation();  
  const __vehicleId = t("AddVehicle.vehicle_id", "Vehicle Identification");
  const __deviceId = t("AddVehicle.device_id", "Device ID");
  const __vnr = t("AddVehicle.VRN", "Vehicle Registration Number (VRN)");
  const __chassisNumber = t("AddVehicle.chassis_number", "Chassis Number");
  const __vehiclePurchase = t("AddVehicle.vehicle_purchase", "Vehicle & Purchase Details");
  const __deviceType = t("AddVehicle.device_type", "Device Type");
  const __deviceSpecific = t("AddVehicle.device_specific", "Device Specific Type");
  const __city = t("AddVehicle.city", "City");
  const __purchaseDate = t("AddVehicle.purchase_date", "Date of Purchase");
  const __registrationDate = t("AddVehicle.registration_date", "Registration Date");
  const __batteryFleetInfo = t("AddVehicle.battery_fleet_info", "Battery & Fleet Information");
  const __batteryType = t("AddVehicle.battery_type", "Battery Type");
  const __batteryMake = t("AddVehicle.battery_make", "Battery Make");
  const __refurbished = t("AddVehicle.refurbished", "Refurbished");
  const __no = t("AddVehicle.no", "No");
  const __yes = t("AddVehicle.yes", "Yes");
  const __fleetOwner = t("AddVehicle.fleet_owner", "Fleet Owner");
  const __fleet = t("AddVehicle.fleet", "Fleet");
  const __paymentModel = t("AddVehicle.payment_model", "Payment Model");
  const __amcStatus = t("AddVehicle.amc_status", "AMC & Status");
  const __amcExpiry = t("AddVehicle.amc_expiry", "AMC Expiry Date");
  const __isConnected = t("AddVehicle.is_connected", "Is Connected");
  const __isActive = t("AddVehicle.is_active", "Is Active");
  const __cancel = t("AddVehicle.cancel", "Cancel");
  const __addVehicle = t("AddVehicle.add_vehicle", "Add Vehicle");
  
  return (
    <form onSubmit={onSubmit} className="av-form-container">
      {/* Section 1: Vehicle Identification */}
      <div className="av-section">
        <h3 className="av-section-header">{__vehicleId}</h3>
        <div className="av-grid">
          <div className="form-group">
            <label htmlFor="device_id" className="form-label">
              {__deviceId}
            </label>
            <input
              type="text"
              name="device_id"
              id="device_id"
              value={formData.device_id}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="VRN" className="form-label">
              {__vnr}
            </label>
            <input
              type="text"
              name="VRN"
              id="VRN"
              value={formData.VRN}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="chassis_number" className="form-label">
              {__chassisNumber}
            </label>
            <input
              type="text"
              name="chassis_number"
              id="chassis_number"
              value={formData.chassis_number}
              onChange={onChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Vehicle & Purchase Details */}
      <div className="av-section">
        <h3 className="av-section-header">{__vehiclePurchase}</h3>
        <div className="av-grid">
          <div className="form-group">
            <label htmlFor="device_type" className="form-label">
              {__deviceType}
            </label>
            <input
              type="text"
              name="device_type"
              id="device_type"
              value={formData.device_type}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="device_type_name" className="form-label">
              {__deviceSpecific}
            </label>
            <input
              type="text"
              name="device_type_name"
              id="device_type_name"
              value={formData.device_type_name}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="city" className="form-label">
              {__city}
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="DOP" className="form-label">
              {__purchaseDate}
            </label>
            <input
              type="date"
              name="DOP"
              id="DOP"
              value={formData.DOP}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg_date" className="form-label">
              {__registrationDate}
            </label>
            <input
              type="date"
              name="reg_date"
              id="reg_date"
              value={formData.reg_date}
              onChange={onChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Battery & Fleet Information */}
      <div className="av-section">
        <h3 className="av-section-header">{__batteryFleetInfo}</h3>
        <div className="av-grid">
          <div className="form-group">
            <label htmlFor="battery_type" className="form-label">
              {__batteryType}
            </label>
            <input
              type="text"
              name="battery_type"
              id="battery_type"
              value={formData.battery_type}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="battery_make" className="form-label">
              {__batteryMake}
            </label>
            <input
              type="text"
              name="battery_make"
              id="battery_make"
              value={formData.battery_make}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="refurbished" className="form-label">
              {__refurbished}
            </label>
            <select
              name="refurbished"
              id="refurbished"
              value={formData.refurbished}
              onChange={onChange}
              className="form-input"
            >
              <option>{__no}</option>
              <option>{__yes}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="fleet_owner" className="form-label">
              {__fleetOwner}
            </label>
            <input
              type="text"
              name="fleet_owner"
              id="fleet_owner"
              value={formData.fleet_owner}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fleet" className="form-label">
              {__fleet}
            </label>
            <input
              type="text"
              name="fleet"
              id="fleet"
              value={formData.fleet}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="payment_model" className="form-label">
              {__paymentModel}
            </label>
            <input
              type="text"
              name="payment_model"
              id="payment_model"
              value={formData.payment_model}
              onChange={onChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Section 4: AMC & Status */}
      <div className="av-section">
        <h3 className="av-section-header">{__amcStatus}</h3>
        <div className="av-grid">
          <div className="form-group">
            <label htmlFor="expire_on" className="form-label">
              {__amcExpiry}
            </label>
            <input
              type="datetime-local"
              name="expire_on"
              id="expire_on"
              value={formData.expire_on}
              onChange={onChange}
              className="form-input"
            />
          </div>
          <div className="form-checkbox-group">
            <input
              type="checkbox"
              name="is_connected"
              id="is_connected"
              checked={formData.is_connected}
              onChange={onChange}
              className="form-checkbox"
            />
            <label htmlFor="is_connected" className="form-label">
              {__isConnected}
            </label>
          </div>
          <div className="form-checkbox-group">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={onChange}
              className="form-checkbox"
            />
            <label htmlFor="is_active" className="form-label">
              {__isActive}
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="av-submit-area">
        <button
          type="button"
          className="theme-btn theme-btn-outlined"
          onClick={onCancel}
        >
          {__cancel}
        </button>
        <button type="submit" className="theme-btn theme-btn-contained">
          {__addVehicle}
        </button>
      </div>
    </form>
  );
};

export default AddVehicleForm;
