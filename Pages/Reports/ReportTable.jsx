import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { selectCurrentUser } from "../../store/authSlice";
import propTypes from "prop-types";
import { API_ENDPOINTS } from "./useReportData";
import "./reports.css";

const EmptyReportState = () => {
  const { t } = useTranslation();
  return (
    <div className="report-empty-state">
      <svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      <h3>{t("reports.noDataFoundTitle", "No Results Found")}</h3>
      <p>
        {t(
          "reports.noDataFoundSubtitle",
          "Try adjusting your filters to find the data you're looking for."
        )}
      </p>
    </div>
  );
};

function ReportTable({
  data,
  isLoading,
  reportName,
  fetchParams,
  backendUrl,
  vehicleType,
  vehicleIdentifier,
  handleNextPage,
  handlePreviousPage,
  currentPage,
  totalPages,
  previousPageUrl,
  nextPageUrl,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [allColumns, setAllColumns] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    if (data.length > 0) {
      // 1. Get all keys from the first row
      const rawKeys = Array.from(
        new Set(
          data.reduce((acc, row) => {
            Object.keys(row).forEach((k) => {
              if (k !== "_subRows") acc.push(k);
            });
            return acc;
          }, [])
        )
      );

      // 2. Reorder keys to match user preference if possible
      const priorityOrder = ["Date", "VRN", "City", "Chassis No"];
      const sortedKeys = [
        ...priorityOrder.filter((k) => rawKeys.includes(k)),
        ...rawKeys.filter((k) => !priorityOrder.includes(k)),
      ];

      setAllColumns(sortedKeys);
    } else {
      setAllColumns([]);
    }
    setExpandedRows({});
  }, [data]);

  const toggleRowExpansion = (idx) => {
    setExpandedRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExport = async () => {
    const { start_date, end_date } = fetchParams;
    if (!reportName || !backendUrl || !start_date || !end_date) {
      toast.error(t("userAlerts.exportParamsMissing"));
      return;
    }

    setIsExporting(true);

    try {
      const POST_REPORTS = [
        "Daily Summary Report",
        "Charging Report",
        "Energy Consumption Report",
        "Vehicle Status Report",
        "Alert Report",
        "Fault Report",
      ];

      const safeString = (str) => str.replace(/[: ]/g, "_").replace(/\//g, "-");
      const dynamicFilename = `${reportName}_${vehicleType}_${vehicleIdentifier}_${safeString(
        start_date
      )}_to_${safeString(end_date)}.xlsx`;

      let blob;

      if (POST_REPORTS.includes(reportName)) {
        // --- POST EXPORT LOGIC ---
        const url = `${backendUrl}/devices/reports/`;
        const reportTypeMapping = {
          "Daily Summary Report": "daily_summary_report",
          "Charging Report": "charging_report",
          "Energy Consumption Report": "energy_consumption_report",
          "Vehicle Status Report": "vehicle_status_report",
          "Alert Report": "alert_report",
          "Fault Report": "fault_report",
        };

        const payload = {
          devices: Array.isArray(fetchParams.device_id)
            ? fetchParams.device_id
            : [fetchParams.device_id],
          start_date: start_date,
          end_date: end_date,
          vehicle_type: vehicleType,
          report_type: reportTypeMapping[reportName],
          is_export: true, // Parameter in body
        };

        if (reportName === "Fault Report" && fetchParams.fleet) {
          payload.fleet_name = Array.isArray(fetchParams.fleet) ? fetchParams.fleet : [fetchParams.fleet];
        }

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Network response was not OK");
        blob = await response.blob();
      } else {
        // --- STANDARD GET EXPORT LOGIC ---
        const apiUrlGenerator = API_ENDPOINTS[reportName];
        let exportUrl = "";

        if (reportName === "MIS Report") {
          exportUrl = apiUrlGenerator(
            backendUrl,
            fetchParams.fleet,
            username,
            start_date,
            end_date,
            dateRange,
            true
          );
        } else {
          exportUrl = apiUrlGenerator(
            backendUrl,
            fetchParams.device_id,
            start_date,
            end_date,
            true
          );
        }

        const response = await fetch(exportUrl, { method: "GET" });
        if (!response.ok) throw new Error("Network response was not OK");
        blob = await response.blob();
      }

      // Download logic
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", dynamicFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("userAlerts.exportSuccess"));
    } catch (err) {
      console.error("Export failed:", err);
      toast.error(t("userAlerts.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && data.length === 0)
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  if (data.length === 0) return <EmptyReportState />;

  return (
    <>
      <div className="results-header">
        <h2 className="report-table-header">{reportName}</h2>
        <div className="actions-group">
          <button
            className={`action-btn export-btn ${isExporting ? "exporting" : ""
              }`}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Downloading..." : "Export Excel"}
          </button>
        </div>
      </div>

      <div className="report-table-container">
        <table>
          <thead>
            <tr style={{ backgroundColor: "#0b5297", color: "#fff" }}>
              {/* Toggle Column Header */}
              {data.some((r) => r._subRows) && (
                <th style={{ width: "40px", backgroundColor: "#0b5297", color: "#fff" }}></th>
              )}
              {allColumns.map((col) => (
                <th 
                  style={{ 
                    backgroundColor: "#0b5297", 
                    color: "#fff", 
                    padding: "12px 20px", 
                    fontSize: "0.85rem" 
                  }} 
                  key={col}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const hasSubRows = row._subRows && row._subRows.length > 0;
              const isExpanded = expandedRows[idx];

              return (
                <React.Fragment key={idx}>
                  <tr className={hasSubRows ? "parent-row" : ""}>
                    {data.some((r) => r._subRows) && (
                      <td style={{ textAlign: "center", padding: "5px" }}> 
                        {hasSubRows && (
                          <button
                            onClick={() => toggleRowExpansion(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1em", 
                              color: "#0078d4",
                              padding: "0",   
                              lineHeight: "1"
                            }}
                          >
                            {isExpanded ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                    )}

                    {allColumns.map((col) => (
                      <td 
                        key={col} 
                        data-label={col}
                        style={{ padding: "8px 20px" }} 
                      >
                        {row[col]}
                      </td>
                    ))}
                  </tr>

                  {/* Nested Row */}
                  {isExpanded && hasSubRows && (
                    <tr className="nested-row-container">
                      <td
                        colSpan={allColumns.length + 1}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <div className="nested-table-wrapper">
                          <h4
                            style={{
                              fontSize: "0.9rem",
                              marginBottom: "10px",
                              color: "#666",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                            }}
                          >
                            Details
                          </h4>
                          
                          {(() => {
                            // 1. Get all unique keys from ALL sub-rows
                            const nestedKeys = new Set();
                            row._subRows.forEach((sub) => {
                              Object.keys(sub).forEach((k) => nestedKeys.add(k));
                            });

                            // 2. Define Explicit Order (using Display Names generated by useReportData.js)
                            const COLUMN_ORDER = [
                              "Session No",
                              "Label",
                              "Total Distance (km)",    // Mapped from 'distance'
                              "Duration",
                              "Max Speed",
                              "Start Odo Val",
                              "End Odo Val",
                              "Start Soc Val",
                              "End Soc Val",
                              "Start Time",             // Mapped from 'start_time_val'
                              "End Time",               // Mapped from 'end_time_val'
                              "Start Latitude",
                              "End Latitude",
                              "Start Longitude",
                              "End Longitude",
                              "Battery Temperature",
                              "Motor Temperature",
                              "Charging Units",
                              "Session Ec",
                              "Session Ecr",
                              "Session Regen",
                              "Session Traction",
                              "Deep Discharge",
                              "Insufficient Charge"
                            ];

                            // 3. Sort columns based on the defined order
                            const nestedColumns = Array.from(nestedKeys).sort((a, b) => {
                              const indexA = COLUMN_ORDER.indexOf(a);
                              const indexB = COLUMN_ORDER.indexOf(b);

                              // If both are in the list, sort by index
                              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                              
                              // If only A is in list, A comes first
                              if (indexA !== -1) return -1;
                              
                              // If only B is in list, B comes first
                              if (indexB !== -1) return 1;

                              // If neither, fallback to alphabetical
                              return a.localeCompare(b);
                            });
                          
                            return (
                              <table
                                className="nested-table"
                                style={{ width: "100%"}}
                              >
                                <thead>
                                  <tr>
                                    {/* --- [CHANGE 2] USE SUPERSKET KEYS FOR HEADER --- */}
                                    {nestedColumns.map((subKey) => (
                                      <th
                                        key={subKey}
                                        style={{
                                          fontSize: "0.85em",
                                          padding: "8px",
                                          textAlign: "left",
                                          textTransform: "uppercase",
                                          backgroundColor: "#0b5297",
                                          color: "#fff",
                                        }}
                                      >
                                        {subKey}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {row._subRows.map((subRow, subIdx) => (
                                    <tr key={subIdx} style={{ backgroundColor: "#fff" }}>
                                      {/* --- [CHANGE 3] MAP OVER COLUMN LIST, NOT ROW VALUES --- */}
                                      {nestedColumns.map((colKey, vIdx) => (
                                        <td
                                          key={vIdx}
                                          style={{
                                            fontSize: "0.85em",
                                            padding: "8px",
                                          }}
                                        >
                                          {/* Render value if exists, else blank */}
                                          {subRow[colKey] !== undefined && subRow[colKey] !== null
                                            ? subRow[colKey]
                                            : "-"}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              );
                            })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button
          onClick={handlePreviousPage}
          disabled={!previousPageUrl || isLoading}
        >
          {t("buttons.previous")}
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={!nextPageUrl || isLoading}>
          {t("buttons.next")}
        </button>
      </div>
    </>
  );
}

ReportTable.propTypes = {
  data: propTypes.array.isRequired,
  isLoading: propTypes.bool.isRequired,
  reportName: propTypes.string.isRequired,
  // ... props definition
};

export default ReportTable;
