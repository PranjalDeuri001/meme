// HomeSkeleton.jsx

import React from 'react';
import './Home.css';

// --- Individual Skeleton Components ---

// --- MODIFIED: Footer now has 3 items ---
export const FleetCardSkeleton = () => (
  <div className="fleet-card skeleton-card-new-base">
    {/* 1. Title Skeleton */}
    <div className="fleet-card-header">
      <div className="skeleton skeleton-text" style={{ width: '50%', height: '18px', margin: '0 auto' }}></div>
    </div>
    
    {/* 2. Image Skeleton (a box) */}
    <div className="skeleton skeleton-image-placeholder"></div>

    {/* 3. Total Count Skeleton */}
    <div className="fleet-card-body">
      <div className="skeleton skeleton-text" style={{ width: '30%', height: '40px', margin: '0 auto' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '25%', height: '13px', margin: '4px auto 0' }}></div>
    </div>

    {/* 4. Footer Skeleton (3 items) --- */}
    <div className="fleet-card-footer">
      <div className="skeleton skeleton-text" style={{ width: '30%', height: '30px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '30%', height: '30px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '30%', height: '30px' }}></div>
    </div>
  </div>
);

export const DataCardSkeleton = () => (
  <div className="skeleton skeleton-data-card">
    <div className="skeleton-card-content">
      <div className="skeleton skeleton-circle"></div>
      <div className="skeleton skeleton-text skeleton-text-lg" style={{ marginTop: '10px' }}></div>
      <div className="skeleton skeleton-text skeleton-text-sm"></div>
    </div>
  </div>
);


// --- Main Assembled Skeletons ---
export const FleetInfoSkeletonInternal = () => (
  <>
    <div className="skeleton skeleton-subtitle" style={{ width: '60%', height: '24px', marginBottom: '20px' }}></div>
    <div className="fleet-card-grid">
      <FleetCardSkeleton />
      <FleetCardSkeleton />
      <FleetCardSkeleton />
      <FleetCardSkeleton />
    </div>
  </>
);

const FleetInfoSkeleton = () => (
  <div id="Home-info" className="skeleton-card">
    <div className="skeleton skeleton-title"></div>
    <FleetInfoSkeletonInternal />
  </div>
);

export const DataCardsSkeletonInternal = () => (
  <div id="Home-sec-cont-2" className="skeleton-card skeleton-data-cards-grid">
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
    <DataCardSkeleton />
  </div>
);

const DataCardsSkeleton = () => (
  <DataCardsSkeletonInternal />
);

const MapSkeleton = () => (
  <div className="hmap-cont skeleton-card skeleton"></div>
);

const HomeSkeleton = () => {
  return (
    <div id="Home-container">
      <div id="Home-map-info">
        <FleetInfoSkeleton />
      </div>
      <div id="Home-vlist-info">
        <MapSkeleton />
        <DataCardsSkeleton />
      </div>
    </div>
  );
};

export default HomeSkeleton;