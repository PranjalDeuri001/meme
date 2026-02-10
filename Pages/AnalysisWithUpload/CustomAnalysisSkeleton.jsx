import React from 'react';
import './CustomAnalysis.css';

const ControlSkeleton = () => <div className="skeleton-line skeleton-control"></div>;
const ChartSkeleton = () => <div className="skeleton-card skeleton-chart"></div>;

const CustomAnalysisSkeleton = () => {
  return (
    <div className="FM_Page">
      <div className="skeleton-line skeleton-title"></div>
      <div className="ca-mode-tabs" style={{marginBottom: '1.5rem'}}>
        <div className="skeleton-line" style={{height: '2rem', width: '150px'}}></div>
        <div className="skeleton-line" style={{height: '2rem', width: '150px'}}></div>
      </div>
      <div className="controls-container skeleton-card">
        <ControlSkeleton />
        <ControlSkeleton />
        <ControlSkeleton />
        <ControlSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );
};

export default CustomAnalysisSkeleton;