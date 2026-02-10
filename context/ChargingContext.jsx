import React, { createContext, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";
import useChargingAlert from "../hooks/useChargingAlert";

import { useGetAllDevicesQuery } from "../store/apiSlice";

const backendUrl = import.meta.env.VITE_API_URL_3;

const ChargingContext = createContext(null);

export const ChargingProvider = ({ children }) => {
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;

  // Fetch devices for lookup
  const { data: allDevices = [] } = useGetAllDevicesQuery();

  const deviceLookup = React.useMemo(() => {
    const lookup = {};
    allDevices.forEach(device => {
      const imei = device.device_id || device.imei;
      if (imei) {
        lookup[imei] = {
          vrn: device.VRN,
          chassisNumber: device.chassis_number,
          fleet: device.fleet || device.fleet_owner || 'N/A',
          city: device.city || 'N/A',
        };
      }
    });
    return lookup;
  }, [allDevices]);

  // 1. Destructure 'ignoreToast' from the hook
  const popupUrl = username && backendUrl ? `${backendUrl}/devices/popups/` : null;

  const {
    alertData,
    toasts,
    dismissToast,
    ignoreToast,
    isLoading,
  } = useChargingAlert(deviceLookup, popupUrl, username, 300000);

  const hasChargingData = alertData?.chargingDevices?.length > 0;

  const value = {
    alertData,
    toasts,
    dismissToast,
    ignoreToast, // <--- Added this to the value object
    isLoading,
    hasChargingData,
  };

  return (
    <ChargingContext.Provider value={value}>
      {children}
    </ChargingContext.Provider>
  );
};

ChargingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChargingContext = () => {
  const context = useContext(ChargingContext);
  if (!context) {
    throw new Error(
      "useChargingContext must be used within a ChargingProvider"
    );
  }
  return context;
};
