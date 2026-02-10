import React from 'react';
import './Alerts.css'; // Reusing the same CSS file for styles

// --- INDIVIDUAL SKELETON COMPONENTS ---

const KpiCardSkeleton = () => (
  <div className="kpi-card">
    <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '1rem' }}></div>
    <div className="skeleton-line" style={{ width: '40%', height: '28px' }}></div>
    <div className="skeleton-line" style={{ width: '80%', height: '16px', marginTop: '0.5rem' }}></div>
  </div>
);

const AlertItemSkeleton = () => (
  <div className="alert-item-skeleton">
    <div className="skeleton-line" style={{ width: '70%', height: '24px' }}></div>
    <div className="skeleton-line" style={{ width: '90%', height: '18px', marginTop: '1rem' }}></div>
  </div>
);


// --- MAIN SKELETON LOADER COMPONENT ---

const AlertsSkeleton = () => {
  return (
    <div className="alerts-page">
      {/* Header Skeleton */}
      <div className="alerts-header">
        <div className="skeleton-line" style={{ width: '300px', height: '32px' }}></div>
        <div className="skeleton-line skeleton-button" style={{ width: '160px', height: '40px' }}></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="kpi-container">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Content Section Skeleton */}
      <div className="alerts-content-section">
        <div className="section-header">
          <div className="skeleton-line" style={{ width: '250px', height: '28px' }}></div>
          <div className="skeleton-line" style={{ width: '200px', height: '40px' }}></div>
        </div>
        <div className="alerts-list">
          <AlertItemSkeleton />
          <AlertItemSkeleton />
          <AlertItemSkeleton />
          <AlertItemSkeleton />
          <AlertItemSkeleton />
        </div>
      </div>
    </div>
  );
};

export default AlertsSkeleton;