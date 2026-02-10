// HomeSecInfoContainer.jsx

import React, { useEffect, useState, useMemo } from "react";
import HomeInfo2 from "./HomeInfo2";
import HomeMap from "./HomeMap";
import VehicleSelectionList from "./VehicleSelectionList";
import { VehicleSelectionContext } from "./VehicleSelectionContext";
import propTypes from "prop-types";
import "./VehicleList.css";

// Material UI Icons for tabs
import DashboardIcon from "@mui/icons-material/Dashboard";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      resetKey: 0,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Map rendering error:", error, info);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    const { hasError, resetKey } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="map-error-fallback">
          <p className="map-error-message">
            Map failed to load. Please try again.
          </p>
          <button
            type="button"
            className="map-retry-btn"
            onClick={this.handleRetry}
          >
            Retry map
          </button>
        </div>
      );
    }

    return <React.Fragment key={resetKey}>{children}</React.Fragment>;
  }
}

MapErrorBoundary.propTypes = {
  children: propTypes.node,
};

function HomeSecInfoContainer({
  vehiclesData,
  selectedModel,
  isMapOpen,
  setIsMapOpen,
  fleetMetrics,
  isLoadingKpis,
  isMapLoading,
  statusFilter,
}) {
  const [activeView, setActiveView] = useState("kpi");

  // This state gets updated when you click a card in the list
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);

  const vehicleContextValue = useMemo(
    () => ({
      selectedVehicle,
      setSelectedVehicle,
      selectedVehicleIds,
      setSelectedVehicleIds,
      onSelectionChange: setSelectedVehicleIds,
    }),
    [selectedVehicle, selectedVehicleIds]
  );

  // Filter vehicles based on the active status filter
  const filteredVehiclesData = useMemo(() => {
    if (!statusFilter || statusFilter === 'all') {
      return vehiclesData;
    }

    return vehiclesData.filter((vehicle) => {
      const mode = (vehicle?.mode || '').toLowerCase();

      if (statusFilter === 'active') {
        return mode === 'active' || mode === 'charging';
      } else if (statusFilter === 'inactive') {
        return mode === 'inactive' || (mode !== 'active' && mode !== 'charging' && mode !== 'nogps');
      } else if (statusFilter === 'nogps') {
        return mode === 'nogps';
      }

      return true;
    });
  }, [vehiclesData, statusFilter]);

  useEffect(() => {
    if (!isMapOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsMapOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMapOpen, setIsMapOpen]);

  return (
    <div
      id="Home-vlist-info"
      className={isMapOpen ? "fullscreen" : ""}
      aria-label="Map and fleet metrics section"
    >
      <MapErrorBoundary>
        <HomeInfo2
          vehiclesData={filteredVehiclesData}
          selectedModel={selectedModel}
          isMapLoading={isMapLoading}
          // --- CHANGE START: Pass the selected vehicle to the map ---
          activeVehicle={selectedVehicle}
          // --- CHANGE END ---
          statusFilter={statusFilter}
        />
      </MapErrorBoundary>

      <div className="home-right-panel">
        <div className="home-view-switcher" role="tablist">
          <button
            role="tab"
            aria-selected={activeView === "kpi"}
            className={`home-view-tab ${activeView === "kpi" ? "active" : ""}`}
            onClick={() => setActiveView("kpi")}
          >
            <DashboardIcon fontSize="small" />
            <span>KPI Stats</span>
          </button>
          <button
            role="tab"
            aria-selected={activeView === "vehicles"}
            className={`home-view-tab ${activeView === "vehicles" ? "active" : ""
              }`}
            onClick={() => setActiveView("vehicles")}
          >
            <DirectionsBusIcon fontSize="small" />
            <span>Vehicles</span>
          </button>
        </div>

        <div className="home-view-content">
          {activeView === "kpi" && (
            <HomeMap
              selectedModel={selectedModel}
              fleetMetrics={fleetMetrics}
              isLoading={isLoadingKpis}
            />
          )}

          {activeView === "vehicles" && (
            <VehicleSelectionContext.Provider value={vehicleContextValue}>
              <div className="home-vehicle-list-wrapper">
                <VehicleSelectionList
                  imageName={selectedModel || "9m"}
                  vehicleData={filteredVehiclesData}
                />
              </div>
            </VehicleSelectionContext.Provider>
          )}
        </div>
      </div>

      {isMapOpen && (
        <button
          className="map-close-btn"
          onClick={() => setIsMapOpen(false)}
          aria-label="Close map view"
          type="button"
        ></button>
      )}
    </div>
  );
}

HomeSecInfoContainer.propTypes = {
  vehiclesData: propTypes.array.isRequired,
  selectedModel: propTypes.string,
  isMapOpen: propTypes.bool.isRequired,
  setIsMapOpen: propTypes.func.isRequired,
  fleetMetrics: propTypes.object,
  isLoadingKpis: propTypes.bool,
  isMapLoading: propTypes.bool,
  statusFilter: propTypes.string,
};

HomeSecInfoContainer.defaultProps = {
  selectedModel: "",
  fleetMetrics: null,
  isLoadingKpis: false,
  isMapLoading: false,
  statusFilter: "all",
};

export default React.memo(HomeSecInfoContainer);
