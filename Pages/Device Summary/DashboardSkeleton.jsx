import React from "react";
import propTypes from "prop-types";
import { Row } from "react-bootstrap";

// --- START: Code from TableSkeleton.jsx has been merged into this file ---

// This component creates a single skeleton row with the correct number of columns (17).
const SkeletonRow = () => (
  <div className="ds-skeleton-row" style={{ gap: "1rem" }}>
    {/* VRN */}           <div className="ds-skeleton-line" style={{ flex: "1.5", height: '20px' }}></div>
    {/* Status */}        <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Date */}          <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Vehicle Type */}  <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Region */}        <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* City */}          <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Depot */}         <div className="ds-skeleton-line" style={{ flex: "1.2", height: '20px' }}></div>
    {/* Start Odo */}     <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* End Odo */}       <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Daily KM */}      <div className="ds-skeleton-line" style={{ flex: "0.8", height: '20px' }}></div>
    {/* Running Time */}  <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Idle Time */}     <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Charging Time */} <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Stoppage Time */} <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Avg. Speed */}    <div className="ds-skeleton-line" style={{ flex: "1", height: '20px' }}></div>
    {/* Start SOC */}     <div className="ds-skeleton-line" style={{ flex: "0.8", height: '20px' }}></div>
    {/* End SOC */}       <div className="ds-skeleton-line" style={{ flex: "0.8", height: '20px' }}></div>
  </div>
);

// This component creates the full table placeholder.
const TableSkeleton = ({ rows = 10 }) => (
  <div className="ds-skeleton-wrapper">
    {Array.from({ length: rows }).map((_, index) => (
      <SkeletonRow key={index} />
    ))}
  </div>
);

// --- END: Merged code ---


// Skeleton for the filter controls bar
const ControlsSkeleton = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <div className="ds-skeleton-line" style={{ width: '250px', height: '40px', borderRadius: '8px' }}></div>
        {/* Updated to show 6 controls (5 dropdowns + 1 clear button) */}
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ds-skeleton-line" style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
        ))}
    </div>
);

// This is the main skeleton component for the entire page.
const DashboardSkeleton = () => (
    <div className="ds-main-content-layout">
        {/* Skeleton for KPI Cards */}
        <section className="ds-grid-section">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ds-skeleton-card" style={{ height: '120px', borderRadius: '12px' }}></div>
            ))}
        </section>

        {/* Skeleton for Regional Performance */}
        <div className="ds-card">
            <div className="ds-skeleton-line" style={{ height: '24px', width: '200px', marginBottom: '1rem', borderRadius: '8px' }}></div>
            <section className="ds-grid-section">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="ds-skeleton-card" style={{ height: '120px', borderRadius: '12px' }}></div>
                ))}
            </section>
        </div>

        {/* Skeleton for Charts (respects the 2fr and 1fr layout) */}
        <div className="ds-card">
            <section className="ds-grid-section ds-charts-grid">
                <div className="ds-skeleton-card" style={{ height: '350px', borderRadius: '12px' }}></div> {/* Fleet Activity Chart */}
                <div className="ds-skeleton-card" style={{ height: '350px', borderRadius: '12px' }}></div> {/* Fleet Status Chart */}
            </section>
        </div>

        {/* Skeleton for Table with Filters */}
        <div className="ds-card">
            <ControlsSkeleton />
            <div style={{ padding: "1rem" }}>
                <div className="ds-table-container">
                    <TableSkeleton rows={10} />
                </div>
            </div>
        </div>
    </div>
);
TableSkeleton.propTypes = {
    rows: propTypes.number,
};
DashboardSkeleton.propTypes = {
  rows: propTypes.number,
};
DashboardSkeleton.defaultProps = {
    rows: 10,
};
SkeletonRow.propTypes = {};
TableSkeleton.propTypes = {
    rows: propTypes.number,
};
ControlsSkeleton.propTypes = {};
ControlsSkeleton.defaultProps = {
    rows: 6,
};



export default DashboardSkeleton;