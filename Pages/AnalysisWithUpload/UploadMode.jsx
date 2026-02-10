// src/Pages/AnalysisWithUpload/UploadMode.jsx
import { useState, useMemo, useCallback } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// Local Imports
import { useDataProcessor } from "../../hooks/useDataProcessor";
import { useThemeDetector } from "../../hooks/useThemeDetector";
import ChartRenderer from "./ChartRenderer";

const UploadMode = () => {
  const { t } = useTranslation();
  const theme = useThemeDetector();
  const {
    data,
    columns,
    detectedFaults,
    isLoading,
    error,
    timeColumnKey,
    processFile,
    setData,
  } = useDataProcessor();

  const [selectedFile, setSelectedFile] = useState(null);
  const [rowsToSkip, setRowsToSkip] = useState(0);
  const [showSkipPrompt, setShowSkipPrompt] = useState(false);
  const [selectedFileSignals, setSelectedFileSignals] = useState([]);
  const [selectedFaults, setSelectedFaults] = useState([]);
  const [signalsToPlot, setSignalsToPlot] = useState([]);

  const fileSignalOptions = useMemo(
    () =>
      columns
        .filter(
          (col) =>
            col &&
            col !== timeColumnKey &&
            !["DATE", "TIME"].includes(col.toUpperCase()) &&
            !detectedFaults.some((f) => f.name === col)
        )
        .map((col) => ({ label: col, value: col })),
    [columns, timeColumnKey, detectedFaults]
  );
const groupedDetectedFaults = useMemo(() => {
  return detectedFaults.reduce((acc, fault) => {
    const category = fault.category;

    // If this category key doesn't exist yet, initialize it as an empty array
    if (!acc[category]) {
      acc[category] = [];
    }

    // Then push the fault
    acc[category].push(fault);

    return acc;
  }, {});
}, [detectedFaults]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setData([]);
    setSelectedFile(file);
    setSelectedFileSignals([]);
    setSelectedFaults([]);
    setSignalsToPlot([]);
    setRowsToSkip(0);
    setShowSkipPrompt(true);
  };

  const handleProcessFile = () => {
    if (selectedFile) processFile(selectedFile, rowsToSkip);
    setShowSkipPrompt(false);
  };

  const handlePlotChart = () => {
    const signals = selectedFileSignals;
    const faults = selectedFaults.map((f) => ({
      label: `FAULT: ${f}`,
      value: f,
    }));
    setSignalsToPlot([...signals, ...faults]);
  };

  const handleFaultSelectionChange = useCallback((e) => {
    const { name, checked } = e.target;
    setSelectedFaults((prev) =>
      checked ? [...prev, name] : prev.filter((faultName) => faultName !== name)
    );
  }, []);

  if (error) {
    toast.error(error);
  }

  const customSelectStyles = {
    control: (p) => ({
      ...p,
      backgroundColor: "var(--primary-color)",
      color: "#fff",
      border: "1px solid var(--border-color)",
      borderRadius: "8px",
      minHeight: "40px",
      height: "40px",
      fontFamily: '"Exo 2"',
      boxShadow: "none",
    }),
    valueContainer: (p) => ({ ...p, height: "40px", padding: "0 8px" }),
    input: (p) => ({ ...p, color: "#fff" }),
    placeholder: (p) => ({ ...p, color: "rgba(255, 255, 255, 0.8)" }),
    singleValue: (p) => ({ ...p, color: "#fff" }),
    indicatorsContainer: (p) => ({ ...p, height: "40px" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (p) => ({ ...p, color: "#fff" }),
    multiValue: (p) => ({ ...p, backgroundColor: "rgba(255, 255, 255, 0.2)" }),
    multiValueLabel: (p) => ({ ...p, color: "#fff" }),
    multiValueRemove: (p) => ({
      ...p,
      color: "#fff",
      ":hover": { backgroundColor: "#EF4444", color: "white" },
    }),
    menu: (p) => ({
      ...p,
      zIndex: 10,
      backgroundColor: "var(--page-background)",
      border: "1px solid var(--border-color)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
    }),
    option: (s, { isFocused, isSelected }) => {
  let backgroundColor;

  if (isSelected) {
    backgroundColor = "var(--primary-color)";
  } else if (isFocused) {
    backgroundColor = "var(--row-background-hover)";
  } else {
    backgroundColor = "transparent";
  }

  return {
    ...s,
    backgroundColor,
  };
}
  };

  return (
    <div className="upload-mode-container">
      <div className="controls-container">
        <div className="ca-form-group" style={{ width: "100%" }}>
          <label className="ca-form-label" htmlFor="file-upload-input">
            Upload your Data File (.xlsx, .xls, .csv)
          </label>
          <input
            id="file-upload-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="theme-control file-input"
            disabled={isLoading}
            key={selectedFile || ""}
          />
        </div>
      </div>

      {showSkipPrompt && (
        <div className="ca-card-container">
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
            Data Processing Options
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <label htmlFor="skip-rows-input" className="ca-form-label">
              Header Rows to Skip:
            </label>
            <input
              id="skip-rows-input"
              type="number"
              value={rowsToSkip}
              onChange={(e) => setRowsToSkip(e.target.value)}
              placeholder="0"
              className="theme-control"
              min="0"
              style={{ width: "100px", flexGrow: 0 }}
            />
            <button
              onClick={handleProcessFile}
              disabled={isLoading || !selectedFile}
              className="theme-control theme-btn-submit"
              style={{ flexGrow: 1 }}
            >
              {isLoading ? "Processing..." : "Process Data"}
            </button>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "var(--secondary-text-color)",
              marginTop: "0.5rem",
            }}
          >
            Set to 0 if the first row is your header. Increase this if you have
            title rows to ignore before the header.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="ca-card-container">
          <div className="skeleton-chart"></div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div
            className="controls-container signal-selector-controls"
            style={{ marginTop: "1.5rem" }}
          >
            <div className="ca-form-group ca-select-wrapper">
              <label className="ca-form-label" htmlFor="file-signal-select">
                Select Signals to Plot
              </label>
              <Select
                inputId="file-signal-select"
                options={fileSignalOptions}
                value={selectedFileSignals}
                onChange={setSelectedFileSignals}
                isMulti
                styles={customSelectStyles}
                placeholder="Select signals from your file..."
              />
            </div>
            <div className="ca-form-group">
              <p className="ca-form-label" style={{ visibility: "hidden" }}>
                Plot
              </p>
              <button
                type="button"
                className="theme-control theme-btn-action"
                onClick={handlePlotChart}
              >
                {t("buttons.plotChart")}
              </button>
            </div>
          </div>

          {detectedFaults.length > 0 && (
            <div className="ca-card-container">
             <p className="ca-form-label" style={{ fontSize: "1rem", margin: 0 }}>
    Detected Faults (Plot on Chart):
  </p>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginTop: "0.5rem",
                  padding: "0 5px",
                }}
              >
                {Object.entries(groupedDetectedFaults).map(
                  ([category, faults]) => (
                    <div key={category} style={{ marginBottom: "1rem" }}>
                      <h4
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "0.25rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {category}
                      </h4>
                      {faults.map((fault) => (
                        <div
                          key={fault.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            id={`fault-${fault.name}`}
                            name={fault.name}
                            checked={selectedFaults.includes(fault.name)}
                            onChange={handleFaultSelectionChange}
                            style={{
                              marginRight: "8px",
                              height: "16px",
                              width: "16px",
                            }}
                          />
                          <label htmlFor={`fault-${fault.name}`}>
                            {fault.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="ca-card-container">
            {signalsToPlot.length > 0 ? (
              <ChartRenderer
                rawData={data}
                selectedSignals={signalsToPlot}
                chartId="upload-file-chart-renderer"
                title={selectedFile?.name || "Uploaded File Analysis"}
                theme={theme}
                singleYAxis={true} // --- MODIFICATION: Pass the new prop ---
              />
            ) : (
              <div className="chart-placeholder-text">
                Select a signal or fault and click "Plot Chart" to visualize the
                data.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UploadMode;
