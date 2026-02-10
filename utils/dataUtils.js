import { excludedImeis } from '../config/dashboardConfig';

/**
 * Applies global business-rule filters to a raw vehicle data array.
 * This should be the first filtering step for any component that uses fleet data
 * to ensure consistency across the application.
 *
 * @param {Array} data - The raw vehicle data array from an API.
 * @returns {Array} The data array with globally excluded vehicles removed.
 */
export const applyGlobalVehicleFilters = (data) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  // This filters out any vehicles based on the `excludedImeis` set in your config.
  // Even if the list is empty now, this future-proofs your logic.
  return data.filter(item => item && !excludedImeis.has(item.imei));
};