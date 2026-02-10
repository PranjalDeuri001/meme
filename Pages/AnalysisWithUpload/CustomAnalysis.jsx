// src/Pages/AnalysisWithUpload/CustomAnalysis.jsx (Refactored)
"use client";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

// Local Imports
import { useGetAllDevicesQuery } from "../../store/apiSlice";
import CustomAnalysisSkeleton from "./CustomAnalysisSkeleton";
import FetchMode from "./FetchMode"; // Our new component
import UploadMode from "./UploadMode"; // Our new component

// CSS Imports
import "./CustomAnalysis.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/ReactToastify.css";

const ModeButton = ({ label, mode, activeMode, setMode }) => (
  <button className={`ca-mode-tab ${mode === activeMode ? 'active' : ''}`} onClick={() => setMode(mode)}>
    {label}
  </button>
);
ModeButton.propTypes = {
  label: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  activeMode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
};

function CustomAnalysis() {
  const { t } = useTranslation();
  const { isLoading: isDeviceListLoading } = useGetAllDevicesQuery();
  const [analysisMode, setAnalysisMode] = useState('fetch');

  if (isDeviceListLoading) {
    return <CustomAnalysisSkeleton />;
  }

  return (
    <div className="ca-page">
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      <h2 id="ca-title">{t("sidebar.customAnalysis")}</h2>
      
      <div className="ca-mode-tabs">
        <ModeButton label={t("CustomAnalysis.FetchfromServer", "Fetch from Server")} mode="fetch" activeMode={analysisMode} setMode={setAnalysisMode} />
        <ModeButton label={t("CustomAnalysis.UploadFile", "Upload File")} mode="upload" activeMode={analysisMode} setMode={setAnalysisMode} />
      </div>

      {analysisMode === 'fetch' ? <FetchMode /> : <UploadMode />}
    </div>
  );
}

export default CustomAnalysis;