import React from 'react';
import './ManagementDashboard.css';

// Skeleton component as a representation of final page layout.
const ManagementDashboardSkeleton = () => (
    <div className="mgmt-dash-page">
      <header className="mgmt-dash-header">
        <div className="mgmt-dash-header-title">
          <div className="skeleton" style={{ height: '36px', width: '350px' }}></div>
        </div>
        <div className="mgmt-dash-header-controls">
          <div className="skeleton" style={{ height: '40px', width: '150px' }}></div>
          <div className="skeleton" style={{ height: '40px', width: '250px' }}></div>
        </div>
      </header>
      
      {/* Skeleton for the filter bars */}
      <div className="skeleton" style={{ height: '40px', width: '400px', marginBottom: '1.5rem' }}></div>
      
      <div className="mgmt-dash-kpi-grid">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="mgmt-dash-kpi-card">
            <div className="mgmt-dash-kpi-header">
              <div className="skeleton" style={{ width: '30px', height: '30px', marginRight: '10px', borderRadius: '50%' }}></div>
              <div className="skeleton" style={{ height: '16px', flexGrow: 1 }}></div>
            </div>
            <div className="skeleton" style={{ height: '34px', width: '70%' }}></div>
          </div>
        ))}
      </div>

      <div className="mgmt-dash-main-grid">
        <div className="mgmt-dash-left-column">
          <div className="mgmt-dash-card">
            <div className="skeleton" style={{ height: '28px', width: '40%', marginBottom: '1rem' }}></div>
            <div className="mgmt-dash-status-grid">
              <div className="skeleton" style={{ height: '60px' }}></div>
              <div className="skeleton" style={{ height: '60px' }}></div>
              <div className="skeleton" style={{ height: '60px' }}></div>
            </div>
          </div>
          <div className="mgmt-dash-map-container mgmt-dash-card">
            <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
          </div>
        </div>
        <div className="mgmt-dash-right-column">
          <div className="mgmt-dash-charts-grid">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="mgmt-dash-card">
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '120px' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
);

export default ManagementDashboardSkeleton;