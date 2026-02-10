import { toast } from 'react-toastify';

// =================================================================================
// --- TEMPORARILY COMMENTED OUT - This code is for a different page and has a path error ---
// You will need to find the correct path for this file when working on the Device Summary page.
// =================================================================================
/*
import { vehicleDetailsData } from "../Pages/Device Summary/dashboardMockData";

const ITEMS_PER_PAGE = 15;

const parseValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? value.toLowerCase() : parsed;
  }
  return value;
};

export const simulateApiCall = (filters) => {
  const { 
    currentPage, 
    searchQuery, 
    statusFilter, 
    regionFilter, 
    depotFilter,
    sortConfig
  } = filters;

  let data = [...vehicleDetailsData];

  if (sortConfig && sortConfig.key) {
    data.sort((a, b) => {
      const aValue = parseValue(a[sortConfig.key]);
      const bValue = parseValue(b[sortConfig.key]);
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }

  if (searchQuery) {
    const lowercasedQuery = searchQuery.toLowerCase();
    data = data.filter(
      (vehicle) =>
        vehicle.id.toLowerCase().includes(lowercasedQuery) ||
        vehicle.driver.toLowerCase().includes(lowercasedQuery)
    );
  }
  if (statusFilter && statusFilter !== "All") data = data.filter((vehicle) => vehicle.status === statusFilter);
  if (regionFilter && regionFilter !== "All") data = data.filter((vehicle) => vehicle.region === regionFilter);
  if (depotFilter && depotFilter !== "All") data = data.filter((vehicle) => vehicle.depot === depotFilter);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vehicles: paginatedData,
        totalPages: totalPages,
      });
    }, 500); 
  });
};
*/
// =================================================================================
// --- END OF TEMPORARILY COMMENTED OUT SECTION ---
// =================================================================================


// ===================================================================
// --- FUNCTION FOR THE CUSTOM ANALYSIS PAGE (This is what we need) ---
// ===================================================================

const API_URL = import.meta.env.VITE_API_URL_3;

const transformColumnarToRowData = (columnarData) => {
  if (!columnarData || Object.keys(columnarData).length === 0 || Object.values(columnarData)[0].length === 0) {
    return [];
  }
  const headers = Object.keys(columnarData);
  const rowCount = columnarData[headers[0]].length;
  const hasTimestamp = headers.some(h => h.toLowerCase() === 'timestamp' || h.toLowerCase() === 'time');
  
  return Array.from({ length: rowCount }, (_, i) => {
    const rowObject = {};
    for (const header of headers) {
      const rawValue = columnarData[header][i];
      const isNumeric = typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)) && isFinite(rawValue);
      rowObject[header.trim()] = isNumeric ? Number(rawValue) : rawValue;
    }
    if (!hasTimestamp) rowObject.index = i;
    return rowObject;
  });
};

export const fetchDeviceData = async (deviceId, date, signal) => {
  if (!deviceId || !date) {
    toast.error("Please select a vehicle and a date.");
    return null;
  }
  
  const startTime = new Date(date); startTime.setUTCHours(0, 0, 0, 0);
  const endTime = new Date(date); endTime.setUTCHours(23, 59, 59, 999);
  const url = `${API_URL}/devices/chart-view/?device_id=${deviceId}&start_datetime=${startTime.toISOString()}&end_datetime=${endTime.toISOString()}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const tripData = await response.json();
    const columnarData = tripData.data || tripData;
    const transformedData = transformColumnarToRowData(columnarData);

    if (transformedData.length === 0) {
      toast.info("No data found for the selected vehicle and date.");
      return null;
    }
    return transformedData;
  } 
    catch (error) {
      if (error.name === "AbortError") {
        return null;
      }
      console.error("Error fetching device data:", error);
      toast.error("An error occurred while fetching data.");
      return null;
    }

};