import React from "react";
import { useTranslation } from "react-i18next";

// Helper to format table cell content
const formatCell = (content) => {
  if (content === null || content === undefined) return "N/A";
  if (typeof content === "boolean") return content ? "Yes" : "No";
  return String(content);
};

const VehicleTable = ({
  devices,
  isLoading,
  error,
  searchTerm,
  onRowClick,
}) => {

  const { t } = useTranslation();
  const __loading = t("AddVehicle.loading", "Loading devices...");
  const __failedLoad = t("AddVehicle.failed_load", "Failed to load devices.");
  const __vrn = t("AddVehicle.vrn", "VRN");
  const __deviceId = t("AddVehicle.device_id", "Device ID");
  const __chassisNumber = t("AddVehicle.chassis_number", "Chassis Number");
  const __deviceType = t("AddVehicle.device_type", "Device Type");
  const __typeName = t("AddVehicle.type_name", "Type Name");
  const __city = t("AddVehicle.city", "City");
  const __fleetOwner = t("AddVehicle.fleet_owner", "Fleet Owner");
  const __fleet = t("AddVehicle.fleet", "Fleet");
  const __dop = t("AddVehicle.dop", "DOP");
  const __regDate = t("AddVehicle.reg_date", "Reg. Date");
  const __batteryType = t("AddVehicle.battery_type", "Battery Type");
  const __batteryMake = t("AddVehicle.battery_make", "Battery Make");
  const __refurbished = t("AddVehicle.refurbished", "Refurbished");
  const __amcExpiry_ = t("AddVehicle.amc_expiry_", "AMC Expiry");
  const __paymentModel = t("AddVehicle.payment_model", "Payment Model");
  const __platform = t("AddVehicle.platform", "Platform");
  const __connected = t("AddVehicle.connected", "Connected");
  const __active = t("AddVehicle.active", "Active");
  const __lastSeen = t("AddVehicle.last_seen", "Last Seen");
  const __noDevicesMatch = t("AddVehicle.no_devices_match", "No devices match your search.");
  const __noDevicesFound = t("AddVehicle.no_devices_found", "No devices found.");
  // const __expireOn = t("AddVehicle.expire_on", "Expire On"); -- IGNORED AS NOT USED --

  if (isLoading) {
    return (
      <div className="vm-table-container">
        <div className="vm-loading">{__loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vm-table-container">
        <div className="vm-error">{__failedLoad}</div>
      </div>
    );
  }

  return (
    <div className="vm-table-container">
      <table className="vm-device-table">
        <thead>
          <tr>
            <th>{__deviceId}</th>
            <th>{__vrn}</th>
            <th>{__chassisNumber}</th>
            <th>{__deviceType}</th>
            <th>{__typeName}</th>
            <th>{__city}</th>
            <th>{__fleetOwner}</th>
            <th>{__fleet}</th>
            <th>{__dop}</th>
            <th>{__regDate}</th>
            <th>{__batteryType}</th>
            <th>{__batteryMake}</th>
            <th>{__refurbished}</th>
            <th>{__amcExpiry_}</th>
            <th>{__paymentModel}</th>
            <th>{__platform}</th>
            <th>{__connected}</th>
            <th>{__active}</th>
            <th>{__lastSeen}</th>
          </tr>
        </thead>
        <tbody>
          {devices.length > 0 ? (
            devices.map((device) => (
              <tr key={device.id} onClick={() => onRowClick(device)}>
                <td>{formatCell(device.device_id)}</td>
                <td>{formatCell(device.VRN)}</td>
                <td>{formatCell(device.chassis_number)}</td>
                <td>{formatCell(device.device_type)}</td>
                <td>{formatCell(device.device_type_name)}</td>
                <td>{formatCell(device.city)}</td>
                <td>{formatCell(device.fleet_owner)}</td>
                <td>{formatCell(device.fleet)}</td>
                <td>{formatCell(device.DOP)}</td>
                <td>{formatCell(device.reg_date)}</td>
                <td>{formatCell(device.battery_type)}</td>
                <td>{formatCell(device.battery_make)}</td>
                <td>{formatCell(device.refurbished)}</td>
                <td>{formatCell(new Date(device.expire_on).toLocaleString())}</td>
                <td>{formatCell(device.payment_model)}</td>
                <td>{formatCell(device.platform)}</td>
                <td>{formatCell(device.is_connected)}</td>
                <td>{formatCell(device.is_active)}</td>
                <td>{formatCell(new Date(device.last_seen).toLocaleString())}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="19" className="vm-no-data">
                {searchTerm
                  ? __noDevicesMatch
                  : __noDevicesFound}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleTable;
