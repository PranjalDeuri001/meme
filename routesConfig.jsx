import React, { lazy } from "react";

// --- ICON IMPORTS ---
import HomeIcon from "@mui/icons-material/Home";
import DirectionsBusFilledIcon from "@mui/icons-material/DirectionsBusFilled";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ViewListIcon from "@mui/icons-material/ViewList";
import DepartureBoardOutlinedIcon from "@mui/icons-material/DepartureBoardOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import CalculateIcon from "@mui/icons-material/Calculate";
import RouteIcon from "@mui/icons-material/Route";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import BuildIcon from "@mui/icons-material/Build";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SettingsIcon from "@mui/icons-material/Settings";

// --- LAZY-LOADED PAGE COMPONENTS ---
const Home = lazy(() => import("./Pages/Home/Home.jsx"));
const FleetSummary = lazy(() =>
  import("./Pages/Fleet Summary/FleetSummary.jsx")
);
const Analysis = lazy(() => import("./Pages/Analysis/Analysis.jsx"));
const Report = lazy(() => import("./Pages/Reports/reports.jsx"));
// const Faults = lazy(() => import("./Pages/Faults/Faults.jsx"));
const Faults = lazy(() => import("./Pages/Faults/Faults.jsx"));
const Setting = lazy(() => import("./Pages/Settings/Settings.jsx"));
const Trails = lazy(() => import("./Pages/Trails/Trails.jsx"));
const ExcelPlotter = lazy(() =>
  import("./Pages/AnalysisWithUpload/CustomAnalysis.jsx")
);
const AddVehicle = lazy(() => import("./Pages/AddVehicle/AddVehicle.jsx"));
const ManagementDashboard = lazy(() =>
  import("./Pages/Management Dashboard/ManagementDashboard.jsx")
);
const DeviceSummary = lazy(() =>
  import("./Pages/Device Summary/EnterpriseDashboard.jsx")
);
const AlertsNotification = lazy(() =>
  import("./Pages/AlertNotification/Alerts.jsx")
);
const MaintenanceService = lazy(() => import("./Pages/MaintenanceAndService"));

/**
 * Configuration for all application routes.
 * - path: The URL path.
 * - title: The text or translation key for the sidebar link.
 * - icon: The icon component for the sidebar.
 * - component: The lazy-loaded page component to render.
 * - featureName: The exact string from the API's 'features' array required to access this route.
 * - alwaysVisible: If true, the route is accessible to any authenticated user, regardless of features.
 */
export const allRoutes = [
  {
    path: "/home",
    title: "sidebar.ekaDashboard",
    icon: <HomeIcon />,
    component: <Home />,
    alwaysVisible: true,
  },

  {
    path: "/management-dashboard",
    title: "sidebar.managementDashboard",
    icon: <SpaceDashboardIcon />,
    component: <ManagementDashboard />,
    featureName: "Management Dashboard", // Hidden unless granted by API
  },
  {
    path: "/fleet-summary",
    title: "sidebar.fleetSummary",
    icon: <ViewListIcon />,
    component: <FleetSummary />,
    featureName: "Fleet Summary", // Hidden unless granted by API
  },
  {
    path: "/device-summary",
    title: "sidebar.vehicle_status",
    icon: <DepartureBoardOutlinedIcon />,
    component: <DeviceSummary />,
    featureName: "Vehicle Status", // Must match API response
  },
  {
    path: "/analysis",
    title: "sidebar.tripAnalysis",
    icon: <TimelineIcon />,
    component: <Analysis />,
    featureName: "Trip Analysis", // Must match API response
  },
  {
    path: "/custom-analysis",
    title: "sidebar.customAnalysis",
    icon: <CalculateIcon />,
    component: <ExcelPlotter />,
    featureName: "Custom Analysis", // Hidden unless granted by API
  },
  {
    path: "/trails",
    title: "sidebar.dailyTrails",
    icon: <RouteIcon />,
    component: <Trails />,
    featureName: "Trails", // Must match API response
  },
  {
    path: "/reports",
    title: "sidebar.reports",
    icon: <FileDownloadIcon />,
    component: <Report />,
    featureName: "Reports", // Must match API response
  },
  // {
  //   path: "/faults",
  //   title: "sidebar.faultDatabase",
  //   icon: <WarningAmberIcon />,
  //   component: <Faults />,
  //   featureName: "Fault Database",
  // },
  {
    path: "/faults",
    title: "sidebar.faultDatabase",
    icon: <WarningAmberIcon />,
    component: <Faults />,
    featureName: "Fault Database",
  },
  {
    path: "/alerts-notification",
    title: "sidebar.liveAlerts",
    icon: <NotificationsActiveIcon />,
    component: <AlertsNotification />,
    featureName: "Live Alerts", // Hidden unless granted by API
  },
  {
    path: "/maintenance-service",
    title: "sidebar.maintenance_and_service",
    icon: <BuildIcon />,
    component: <MaintenanceService />,
    featureName: "Maintenance & Service", // Hidden unless granted by API
  },
  {
    path: "/add-vehicle",
    title: "sidebar.add_vehicle",
    icon: <AddCircleIcon />,
    component: <AddVehicle />,
    featureName: "Add Vehicle", // Hidden unless granted by API
  },
  {
    path: "/settings",
    title: "sidebar.userSettings",
    icon: <SettingsIcon />,
    component: <Setting />,
    alwaysVisible: true,
  },
];
