import React from "react";
import "./FleetSummary.css";

// A single shimmering placeholder for a KPI card
const KpiCardSkeleton = () => (
  <div className="fs-kpi-card fs-skeleton-card">
    <div className="fs-skeleton-line fs-skeleton-header"></div>
    <div className="fs-skeleton-line fs-skeleton-value"></div>
  </div>
);

// A placeholder for the controls bar
const ControlsSkeleton = () => <div className="fs-controls-container-skeleton fs-skeleton-card"></div>;

// A placeholder for a chart
const ChartSkeleton = () => <div className="fs-chart-container fs-skeleton-card"></div>;

// A placeholder that looks like a table with a header and a few rows
const TableSkeleton = () => (
  <div className="fs-skeleton-table-container fs-skeleton-card">
    <div className="fs-skeleton-line fs-skeleton-table-header"></div>
    <div className="fs-skeleton-line fs-skeleton-table-row"></div>
    <div className="fs-skeleton-line fs-skeleton-table-row"></div>
    <div className="fs-skeleton-line fs-skeleton-table-row"></div>
    <div className="fs-skeleton-line fs-skeleton-table-row"></div>
  </div>
);

// This is the main component that arranges all the individual skeletons
// to match the layout of your actual FleetSummary page.
const FleetSummarySkeleton = () => {
  return (
    <div className="fs-skeleton-wrapper">
      <div className="fs-kpi-container">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      
      {/* Placeholder for the controls bar is now included */}
      <ControlsSkeleton />

      <div className="fs-charts-grid-container">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
};

export default FleetSummarySkeleton;