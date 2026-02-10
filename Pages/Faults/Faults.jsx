import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import { toast } from 'react-toastify';
import {
  FaCar,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaExclamation,
  FaEye,
  FaTimes,
  FaInfoCircle
} from "react-icons/fa";
import "./Faults.css";

const FAULTS_API_URL = import.meta.env.VITE_API_URL_3;

// Function to fetch faults data
const fetchFaults = async (username, password) => {
  const url = `${FAULTS_API_URL}/devices/faults/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching faults:", error);
    toast.error("Failed to fetch faults from server.");
    return [];
  }
};

const Faults = () => {
  const { t } = useTranslation();
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;

  const { data: devices = [] } = useGetAllDevicesQuery(username, {
    skip: !username,
  });

  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedFault, setSelectedFault] = useState(null);

  useEffect(() => {
    const loadFaults = async () => {
      if (!username) return;
      // Note: Replace hardcoded credentials with actual dynamic auth logic in production
      const faultsData = await fetchFaults("test@gmail.com", "admin@123");
      setFaults(faultsData);
      setLoading(false);
    };
    loadFaults();
  }, [username]);

  const groupedFaults = faults.reduce((acc, fault) => {
    const imei = fault.imei;
    if (!acc[imei]) acc[imei] = [];
    acc[imei].push(fault);
    return acc;
  }, {});

  const getDeviceInfo = (imei) =>
    devices.find((device) => device.device_id === imei);

  const filteredGroupedFaults = Object.keys(groupedFaults).reduce(
    (acc, imei) => {
      const filtered = groupedFaults[imei].filter((fault) => {
        if (priorityFilter === "All") return true;
        return (
          fault.rule.details.severity.toLowerCase() ===
          priorityFilter.toLowerCase()
        );
      });
      if (filtered.length > 0) acc[imei] = filtered;
      return acc;
    },
    {}
  );

  if (loading) return <div className="loading">Loading faults...</div>;

  return (
    <div className="faults-container">
      <div className="faults-header">
        <h1>{t("sidebar.faultDatabase")}</h1>

        <div className="filters">
          <label>Filter Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {Object.keys(filteredGroupedFaults).map((imei) => {
        const device = getDeviceInfo(imei);
        const fault = filteredGroupedFaults[imei][0];
        
        // Date Formatting
        const dateObj = new Date(fault.start_time);
        const dateStr = dateObj.toLocaleDateString(); 
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const displayId = device?.VRN || device?.chassis_number || imei;
        const severityClass = fault.rule.details.severity.toLowerCase();

        return (
          <div key={imei} className={`fault-card ${severityClass}`}>
            
            {/* Date pinned to top right via absolute positioning in CSS */}
            <div className="fault-date">
              <FaCalendarAlt />
              <span>{dateStr} • {timeStr}</span>
            </div>

            <div className="fault-card-header">
              <div className="vehicle-title">
                <span className={`priority-icon ${severityClass}`}>
                  {severityClass === 'high' ? <FaExclamationTriangle /> : 
                   severityClass === 'medium' ? <FaExclamation /> : <FaInfoCircle />}
                </span>
                <span>{displayId}</span>
              </div>
            </div>

            <div className="fault-info-grid">
              <div className="fault-info-item">
                <label>Vehicle Type</label>
                <span>{fault.rule.vehicle_type}</span>
              </div>
              <div className="fault-info-item">
                <label>Component</label>
                <span>{fault.component}</span>
              </div>
              <div className="fault-info-item">
                <label>Identifier</label>
                <span>{fault.rule.identifier}</span>
              </div>
              <div className="fault-info-item">
                <label>Priority</label>
                <span className={`priority-badge ${severityClass}`}>
                   {fault.rule.details.severity}
                </span>
              </div>
            </div>

            {/* Button pinned to bottom right via absolute positioning in CSS */}
            <button
              className="details-btn"
              onClick={() => setSelectedFault(fault)}
            >
              <FaEye />
              View Details
            </button>
          </div>
        );
      })}

      {selectedFault && (
        <div className="modal-overlay" onClick={() => setSelectedFault(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedFault(null)}
            >
              <FaTimes />
            </button>

            <h2 className="modal-title">Fault Diagnostics</h2>

            <div className="modal-section">
              <span className="modal-section-label">Fault Name</span>
              <p>{selectedFault.rule.details["fault name"]}</p>
            </div>

            <div className="modal-section">
              <span className="modal-section-label">Description</span>
              <p>{selectedFault.rule.details["fault description"]}</p>
            </div>

            <div className="modal-section">
              <span className="modal-section-label">Priority Level</span>
              <p className={`priority-${selectedFault.rule.details.severity.toLowerCase()}`}>
                {selectedFault.rule.details.severity}
              </p>
            </div>

            <div className="modal-section">
              <span className="modal-section-label">Potential Causes</span>
              <ul>
                {selectedFault.rule.details.cause.split('\n').filter(line => line.trim()).map((cause, index) => (
                  <li key={index}>{cause.trim()}</li>
                ))}
              </ul>
            </div>

            <div className="modal-section">
              <span className="modal-section-label">Recommended Remedy</span>
              <ul>
                {selectedFault.rule.details.remedy.split('\n').filter(line => line.trim()).map((remedy, index) => (
                  <li key={index}>{remedy.trim()}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faults;