import React, { useState, useEffect, useMemo } from "react";
import { useDebounce } from "./useDebounce";
import "./deviceStatus.css"; // Ensure this CSS file has all the required styles
import { useTranslation } from "react-i18next";
import propsTypes from "prop-types";

const ITEMS_PER_PAGE = 15;

// Reusable Component for Pagination Controls
const PaginationControls = ({ currentPage, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button
        className="theme-btn theme-btn-outlined"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t("buttons.previous")}
      </button>
      <span className="pagination-text">
        {t("reports.page")} {currentPage} {t("reports.of")} {totalPages}
      </span>
      <button
        className="theme-btn theme-btn-outlined"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        {t("buttons.next")}
      </button>
    </div>
  );
};

function DeviceStatus() {
  const { t } = useTranslation();

  // State management
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Controls State reverted to handle two tables
  const [cityFilter, setCityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [currentPages, setCurrentPages] = useState({ active: 1, inactive: 1 });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await fetch(
          "http://192.168.24.136:8000/device_status/active_inactive/"
        );
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        let responseText = await response.text();
        const sanitizedText = responseText.replace(/:\s*NaN/g, ": null");
        const data = JSON.parse(sanitizedText);

        // Re-add the is_active flag needed to separate the tables
        const transformedData = data.map((device) => ({
          ...device,
          id: device.device_id,
          is_active: device.activity_status === "Active",
        }));

        setDevices(transformedData);
      } catch (error) {
        console.error("Failed to fetch or process devices:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const uniqueCities = useMemo(() => {
    const cities = new Set(devices.map((d) => d.city).filter(Boolean));
    return [
      "All Cities",
      ...Array.from(cities).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    ];
  }, [devices]);

  // Reverted to split devices into active and inactive lists
  const filteredAndSortedDevices = useMemo(() => {
    let filtered = devices
      .filter((d) => cityFilter === "all" || d.city === cityFilter)
      .filter((d) =>
        d.device_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );

    filtered.sort((a, b) => {
      if (a.device_id < b.device_id)
        return sortDirection === "ascending" ? -1 : 1;
      if (a.device_id > b.device_id)
        return sortDirection === "ascending" ? 1 : -1;
      return 0;
    });

    return {
      active: filtered.filter((d) => d.is_active),
      inactive: filtered.filter((d) => !d.is_active),
    };
  }, [devices, cityFilter, debouncedSearchTerm, sortDirection]);

  // Reverted to paginate two separate tables
  const paginatedDevices = useMemo(() => {
    const activeStart = (currentPages.active - 1) * ITEMS_PER_PAGE;
    const activeEnd = activeStart + ITEMS_PER_PAGE;
    const inactiveStart = (currentPages.inactive - 1) * ITEMS_PER_PAGE;
    const inactiveEnd = inactiveStart + ITEMS_PER_PAGE;

    return {
      active: filteredAndSortedDevices.active.slice(activeStart, activeEnd),
      inactive: filteredAndSortedDevices.inactive.slice(
        inactiveStart,
        inactiveEnd
      ),
    };
  }, [currentPages, filteredAndSortedDevices]);

  // Event Handlers for two tables
  const handleSort = () => {
    setSortDirection((prev) =>
      prev === "ascending" ? "descending" : "ascending"
    );
    setCurrentPages({ active: 1, inactive: 1 });
  };

  useEffect(() => {
    setCurrentPages({ active: 1, inactive: 1 });
  }, [cityFilter, debouncedSearchTerm]);

  const handlePageChange = (tableType, newPage) => {
    setCurrentPages((prev) => ({ ...prev, [tableType]: newPage }));
  };

  // Helper function for status color-coding
  const getStatusClass = (status) => {
    if (!status) return "status-no-data";
    const statusVal = status.toLowerCase();

    if (statusVal === "ok") return "status-ok";
    if (statusVal === "vehicle off") return "status-vehicle-off";
    if (statusVal === "no data") return "status-no-data";
    if (statusVal === "gps only") return "status-gps-only";

    return "status-default";
  };

  // Row rendering logic with updated columns and status styling
  const renderDeviceRow = (device) => (
    <tr key={device.id} className="vehicle-row">
      <td data-label="Type">{device.device_type_name || "N/A"}</td>
      <td data-label="Device">{device.device_id}</td>
      <td data-label="VTS SW version">{device.software_version || "N/A"}</td>
      <td data-label="VRN / Chassis">{device.VRN || device.chassis_number}</td>
      <td data-label="City">
        {device.city ? t(`city.${device.city.toLowerCase()}`) : "N/A"}
      </td>
      <td data-label="Status">
        <span className={`status-badge ${getStatusClass(device.status)}`}>
          {device.status || "N/A"}
        </span>
      </td>
    </tr>
  );

  // The DeviceTable component to be rendered twice
  const DeviceTable = ({ title, devices, totalItemsInList, tableType }) => {
    const sortIndicator = sortDirection === "ascending" ? " ▲" : " ▼";
    return (
      <div className="ds-table-wrapper">
        <h3 className="ds-table-caption">
          {title === "Active" ? t("status.active") : t("status.inactive")}{" "}
          <span className="count">({totalItemsInList})</span>
        </h3>
        <div className="fm-table-container">
          {devices.length > 0 ? (
            <table className="FM-table">
              <thead>
                <tr>
                  <th>{t("vehicle.vehicleType")}</th>
                  <th className="sortable" onClick={handleSort}>
                    {t("vehicle.deviceId")} {sortIndicator}
                  </th>
                  <th>{t("vehicle.vtsSwVersion")}</th>
                  <th> {t("vehicle.vrnChassisNumber")}</th>
                  <th>{t("vehicle.city")}</th>
                  <th>{t("status.status")}</th>
                </tr>
              </thead>
              <tbody>{devices.map(renderDeviceRow)}</tbody>
            </table>
          ) : (
            <div className="info-message">
              {t("loadingMessages.noDeviceMatchCriteria")}
            </div>
          )}
        </div>
        <PaginationControls
          currentPage={currentPages[tableType]}
          totalItems={totalItemsInList}
          onPageChange={(newPage) => handlePageChange(tableType, newPage)}
        />
      </div>
    );
  };

  return (
    <div className="FM_Page">
      <h2 id="FM-Title">{t("sidebar.deviceStatus")}</h2>
      <div className="controls-container">
        <input
          type="text"
          className="search-input"
          placeholder={t("vehicle.searchByDeviceId")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-dropdown"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          {uniqueCities.map((city) => (
            <option key={city} value={city === "All Cities" ? "all" : city}>
              {t(`city.${city.toLowerCase()}`)}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="info-message">
          {t("loadingMessages.loadingDevices")}
        </div>
      )}
      {isError && (
        <div className="info-message error">
          {t("loadingMessages.error")} : {t("loadingMessages.failedToLoadData")}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="ds-tables-container">
          <DeviceTable
            title="Active"
            devices={paginatedDevices.active}
            totalItemsInList={filteredAndSortedDevices.active.length}
            tableType="active"
          />
          <DeviceTable
            title="Inactive"
            devices={paginatedDevices.inactive}
            totalItemsInList={filteredAndSortedDevices.inactive.length}
            tableType="inactive"
          />
        </div>
      )}
    </div>
  );
}
DeviceStatus.propsTypes = {
  devices: propsTypes.array,
  isLoading: propsTypes.bool,
  isError: propsTypes.bool,
};
DeviceStatus.defaultProps = {
  devices: [],
  isLoading: false,
  isError: false,
};
PaginationControls.propTypes = {
  currentPage: propsTypes.number.isRequired,
  totalItems: propsTypes.number.isRequired,
  onPageChange: propsTypes.func.isRequired,
};
PaginationControls.defaultProps = {
  currentPage: 1,
  totalItems: 0,
  onPageChange: () => {},
};
PaginationControls.displayName = "PaginationControls";
PaginationControls.defaultProps = {
  currentPage: 1,
  totalItems: 0,
  onPageChange: () => {},
}; 


export default DeviceStatus;
