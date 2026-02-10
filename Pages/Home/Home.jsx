// Home.jsx (Fully Updated, with Sequential Loading)

import React, { useState, useMemo, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setDeviceTypeName } from "../../store/authSlice";
import FleetInfo from "./FleetInfo";
import "./Home.css";
import { normalizeModelName } from "../../utils/vehicleUtils";
import { useGetVehiclesQuery, useGetFleetMetricsQuery } from "../../store/apiSlice";
import { useTranslation } from "react-i18next";
import HomeSkeleton, { DataCardsSkeletonInternal } from "./HomeSkeleton";
import { StateDisplay } from "../../Components/StateDisplay";

const HomeSecInfoContainer = lazy(() => import("./HomeSecInfoContainer"));

const MapAndDataFallback = () => (
  <div id="Home-vlist-info">
    <div className="hmap-cont skeleton-card skeleton"></div>
    <DataCardsSkeletonInternal />
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const selectedModel = useSelector(
    (state) => state.auth.selectedDeviceTypeName
  );

  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'nogps'

  // 1) Get vehicles for this user
  const {
    data: vehicleData,
    isLoading: isVehiclesLoading,
    isError,
    error,
    refetch,
  } = useGetVehiclesQuery(undefined, { skip: !userInfo });

  // 2) Only fetch KPIs after vehicles are loaded
  const { data: fleetMetrics, isFetching: isKpiLoading } =
    useGetFleetMetricsQuery(selectedModel || null, {
      skip: !userInfo || isVehiclesLoading,
    });

  const handleModelSelect = (model) => {
    if (selectedModel === model) {
      // Clicking again clears selection and shows all vehicles
      dispatch(setDeviceTypeName(null));
      setShowAllVehicles(true);
    } else {
      dispatch(setDeviceTypeName(model));
      setShowAllVehicles(false);
    }
  };

  const handleShowAllVehicles = () => {
    dispatch(setDeviceTypeName(null));
    setShowAllVehicles(true);
  };

  const productionVehicles = useMemo(() => {
    const list = Array.isArray(vehicleData) ? vehicleData : [];
    // Filter out test vehicles
    return list.filter(
      (v) => (v?.vehicleType || "").toString().toLowerCase() !== "test"
    );
  }, [vehicleData]);

  const filteredVehicles = useMemo(() => {
    const sel = (selectedModel || "").toString();
    if (!sel || showAllVehicles) {
      return productionVehicles;
    }

    return productionVehicles.filter((v) => {
      const vehicleModel = normalizeModelName(v.vehicleType);
      return vehicleModel === sel;
    });
  }, [productionVehicles, selectedModel, showAllVehicles]);

  const finalFleetMetrics = fleetMetrics || { co2_saving: "N/A" };

  // If user not logged in yet, show skeleton
  if (!userInfo) {
    return <HomeSkeleton />;
  }

  if (isError) {
    return (
      <div id="Home-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <StateDisplay
          type="error"
          title={t("loadingMessages.error", "Failed to Load Data")}
          message={error?.message || t("userAlerts.failedToLoadVehicleData", "Failed to load vehicle data from the server. Please check your connection and try again.")}
          onRetry={refetch}
          retryText={t("common.retry", "Try Again")}
          showContactSupport={true}
          supportEmail="support@eka.com"
        />
      </div>
    );
  }

  return (
    <div id="Home-container">
      <div id="Home-map-info">
        <div id="Home-info">
          <FleetInfo
            vehicles={productionVehicles}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            onShowAllVehicles={handleShowAllVehicles}
            isLoading={isVehiclesLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
      </div>

      <Suspense fallback={<MapAndDataFallback />}>
        <HomeSecInfoContainer
          vehiclesData={filteredVehicles}
          isMapOpen={isMapOpen}
          setIsMapOpen={setIsMapOpen}
          fleetMetrics={finalFleetMetrics}
          isLoadingKpis={isKpiLoading}
          selectedModel={selectedModel}
          isMapLoading={isVehiclesLoading}
          statusFilter={statusFilter}
        />
      </Suspense>

      {/* FAB to open map on small screens */}
      <button
        className="map-fab"
        onClick={() => setIsMapOpen(true)}
        aria-label="Open Map"
      >
        <i className="bi bi-map-fill" />
      </button>
    </div>
  );
};

export default Home;
