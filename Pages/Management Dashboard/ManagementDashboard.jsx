// src/Pages/ManagementDashboard/ManagementDashboard.jsx

import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import AdvancedDashboardMap from "./AdvancedDashboardMap";
import ManagementDashboardSkeleton from "./ManagementDashboardSkeleton";
import "./ManagementDashboard.css";
import { selectCurrentUser } from "../../store/authSlice";
import { useDashboardData } from "../../hooks/useDashboardData";
import { platformCategories } from "../../config/dashboardConfig";
import { useTranslation, Trans } from "react-i18next";

// --- MUI Icon Imports ---
import GridViewIcon from "@mui/icons-material/GridView";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PropTypes from "prop-types";

// --- Custom Icon Imports ---
import {
  DistanceIcon,
  MoneySavedIcon,
  CO2SavedIcon,
  EnergyUnitsIcon,
  RuntimeIcon,
  TractionIcon,
  RegenerationIcon,
  TreesSavedIcon,
} from "./Icons";

// --- RTK Query Imports ---
import {
  useGetVehiclesQuery,
  useGetFleetMetricsQuery,
  useGetSummaryDataQuery,
} from "../../store/apiSlice";

// --- Data Imports ---
import { chargingStations, pumaChargingStations } from "../../Data/data.jsx";

echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
]);

// --- PRODUCTION-READY HELPER FUNCTIONS (Moved outside component for performance) ---
const colorPalette = {
  distance: "#3b82f6",
  moneySaved: "#10b981",
  co2Saved: "#14b8a6",
  energyUnits: "#8b5cf6",
  runtime: "#f59e0b",
  traction: "#ef4444",
  regeneration: "#6366f1",
};

const getChartOptions = (
  metricName,
  seriesData,
  labels,
  type,
  area,
  isDark,
  timePeriod,
  t
) => {
  const color = colorPalette[metricName];
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const axisLabelColor = isDark ? "#94a3b8" : "#64748b";
  const splitLineColor = isDark ? "#334155" : "#e2e8f0";
  const tooltipBgColor = isDark
    ? "rgba(30, 41, 59, 0.9)"
    : "rgba(255, 255, 255, 0.95)";
  const tooltipBorderColor = isDark ? "#475569" : "#e2e8f0";

  let xAxisInterval = 0;
  if (timePeriod === "Daily") xAxisInterval = 3;
  if (timePeriod === "Monthly") xAxisInterval = 6;

  const now = new Date();
  let cutoffIndex = -1;
  const isProgressiveView = ["Daily", "Weekly", "Monthly"].includes(timePeriod);

  if (timePeriod === "Daily") {
    cutoffIndex = now.getHours();
  } else if (timePeriod === "Weekly") {
    cutoffIndex = (now.getDay() + 6) % 7; // Monday = 0
  } else if (timePeriod === "Monthly") {
    cutoffIndex = now.getDate() - 1; // 1st of month = 0
  }

  let allSeries = [];
  const tKey =
    metricName === "moneySaved"
      ? "money_saved"
      : metricName === "co2Saved"
      ? "co2_saved"
      : metricName;
  const fallbackName =
    metricName.charAt(0).toUpperCase() +
    metricName.slice(1).replace(/([A-Z])/g, " $1");

  if (
    isProgressiveView &&
    Array.isArray(seriesData) &&
    seriesData.length > 0 &&
    cutoffIndex < seriesData.length - 1
  ) {
    if (type === "line") {
      const pastData = seriesData.map((val, index) =>
        index <= cutoffIndex ? val : null
      );
      const futureData = seriesData.map((val, index) => {
        if (index === cutoffIndex) return seriesData[cutoffIndex];
        return index > cutoffIndex ? val : null;
      });

      allSeries.push({
        name: t(`managementDashboard.${tKey}`, fallbackName),
        data: pastData,
        type,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
        areaStyle: area
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: echarts.color.modifyAlpha(color, 0.5) },
                { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
              ]),
            }
          : null,
        emphasis: { focus: "series", lineStyle: { width: 3.5 } },
      });

      allSeries.push({
        name: t("managementDashboard.future", "(Future)"),
        data: futureData,
        type,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1,
          color: color,
          shadowBlur: 6,
          shadowColor: echarts.color.modifyAlpha(color, 0.4),
          opacity: 0.8,
        },
        itemStyle: { color },
        areaStyle: area
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: echarts.color.modifyAlpha(color, 0.5) },
                { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
              ]),
              opacity: 0.5,
            }
          : null,
      });
    } else {
      const truncatedData = seriesData.map((val, index) =>
        index <= cutoffIndex ? val : null
      );
      allSeries.push({
        name: t(`managementDashboard.${tKey}`, fallbackName),
        data: truncatedData,
        type,
        itemStyle: { color },
        emphasis: { focus: "series" },
      });
    }
  } else {
    allSeries.push({
      name: t(`managementDashboard.${tKey}`, fallbackName),
      data: seriesData,
      type,
      smooth: type === "line",
      showSymbol: false,
      lineStyle: type === "line" ? { width: 2, color } : undefined,
      itemStyle: { color },
      areaStyle: area
        ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: echarts.color.modifyAlpha(color, 0.5) },
              { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
            ]),
          }
        : null,
      emphasis: { focus: "series" },
    });
  }

  const tooltipFormatter = (params) => {
    const param = params.find((p) => p.value != null);
    if (!param) return;

    const mainSeriesName = allSeries[0].name;
    const marker = params[0].marker;
    let timeLabel = param.name;

    if (timePeriod === "Daily") {
      const hour = param.dataIndex;
      const period = hour >= 12 ? "PM" : "AM";
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      timeLabel = `${displayHour} ${period}`;
    } else if (timePeriod === "Monthly") {
      const day = parseInt(param.name, 10);
      const month = now.toLocaleString("default", { month: "short" });
      timeLabel = `${month} ${day}`;
    }

    if (isProgressiveView && param.dataIndex > cutoffIndex) {
      const futureSuffix =
        type === "line"
          ? ` ${t("managementDashboard.projected", "(Projected)")}`
          : ` ${t("managementDashboard.future", "(Future)")}`;
      return `<div style="font-family: Exo 2, sans-serif; font-size: 12px;"><strong>${timeLabel}</strong>${futureSuffix}</div>`;
    }

    const value = param.value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
    return `<div style="font-family: Exo 2, sans-serif; font-size: 12px;">
                    <strong>${timeLabel}</strong>
                    <div style="margin-top: 5px;">
                        ${marker} ${mainSeriesName}:
                        <strong style="float: right; margin-left: 20px;">${value}</strong>
                    </div>
                </div>`;
  };

  return {
    grid: { top: 20, right: 20, bottom: 20, left: 45 },
    legend: { show: false },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: type === "bar",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: axisLabelColor,
        fontSize: 10,
        interval: xAxisInterval,
        formatter: (v) => v.replace(", ", "\n"),
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: splitLineColor } },
      axisLabel: {
        color: axisLabelColor,
        fontSize: 10,
        formatter: (v) => (v > 1000 ? `${(v / 1000).toFixed(1)}k` : v),
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBgColor,
      borderColor: tooltipBorderColor,
      textStyle: { color: textColor },
      formatter: tooltipFormatter,
    },
    series: allSeries,
  };
};

const getEnergyBalanceChartOptions = (
  energyData,
  regenData,
  labels,
  isDark,
  timePeriod,
  t
) => {
  const energyColor = colorPalette.energyUnits;
  const regenColor = colorPalette.regeneration;
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const axisLabelColor = isDark ? "#94a3b8" : "#64748b";
  const splitLineColor = isDark ? "#334155" : "#e2e8f0";
  const tooltipBgColor = isDark
    ? "rgba(30, 41, 59, 0.9)"
    : "rgba(255, 255, 255, 0.95)";
  const tooltipBorderColor = isDark ? "#475569" : "#e2e8f0";

  let xAxisInterval = 0;
  if (timePeriod === "Daily") xAxisInterval = 3;
  if (timePeriod === "Monthly") xAxisInterval = 6;

  const now = new Date();
  let cutoffIndex = -1;
  const isProgressiveView = ["Daily", "Weekly", "Monthly"].includes(timePeriod);

  if (timePeriod === "Daily") cutoffIndex = now.getHours();
  else if (timePeriod === "Weekly") cutoffIndex = (now.getDay() + 6) % 7;
  else if (timePeriod === "Monthly") cutoffIndex = now.getDate() - 1;

  const allSeries = [];

  const createSeries = (name, data, color, area, zLevel = 0) => {
    if (
      isProgressiveView &&
      Array.isArray(data) &&
      data.length > 0 &&
      cutoffIndex < data.length - 1
    ) {
      const pastData = data.map((val, index) =>
        index <= cutoffIndex ? val : null
      );
      const futureData = data.map((val, index) => {
        if (index === cutoffIndex) return data[cutoffIndex];
        return index > cutoffIndex ? val : null;
      });
      return [
        {
          name,
          data: pastData,
          type: "line",
          smooth: true,
          showSymbol: false,
          z: zLevel,
          lineStyle: { width: 2.5, color },
          itemStyle: { color },
          areaStyle: area
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: echarts.color.modifyAlpha(color, 0.5) },
                  { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
                ]),
              }
            : null,
          emphasis: { focus: "series", lineStyle: { width: 3.5 } },
        },
        {
          name: `${name} ${t("managementDashboard.future", "(Future)")}`,
          data: futureData,
          type: "line",
          smooth: true,
          showSymbol: false,
          z: zLevel,
          lineStyle: {
            width: 1,
            color: color,
            shadowBlur: 6,
            shadowColor: echarts.color.modifyAlpha(color, 0.4),
            opacity: 0.8,
          },
          itemStyle: { color },
          areaStyle: area
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: echarts.color.modifyAlpha(color, 0.2) },
                  { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
                ]),
                opacity: 0.5,
              }
            : null,
        },
      ];
    } else {
      return [
        {
          name,
          data,
          type: "line",
          smooth: true,
          showSymbol: false,
          z: zLevel,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          areaStyle: area
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: echarts.color.modifyAlpha(color, 0.5) },
                  { offset: 1, color: echarts.color.modifyAlpha(color, 0) },
                ]),
              }
            : null,
          emphasis: { focus: "series" },
        },
      ];
    }
  };

  allSeries.push(
    ...createSeries(
      t("managementDashboard.energy_units", "Energy Units"),
      energyData,
      energyColor,
      true,
      1
    )
  );
  allSeries.push(
    ...createSeries(
      t("managementDashboard.regeneration", "Regeneration"),
      regenData,
      regenColor,
      false,
      2
    )
  );

  const tooltipFormatter = (params) => {
    if (!params || params.length === 0) return;

    const pointIndex = params[0].dataIndex;
    let timeLabel = params[0].name;

    if (timePeriod === "Daily") {
      const hour = pointIndex;
      const period = hour >= 12 ? "PM" : "AM";
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      timeLabel = `${displayHour} ${period}`;
    } else if (timePeriod === "Monthly") {
      const day = parseInt(params[0].name, 10);
      const month = now.toLocaleString("default", { month: "short" });
      timeLabel = `${month} ${day}`;
    }

    if (isProgressiveView && pointIndex > cutoffIndex) {
      return `<div style="font-family: Exo 2, sans-serif; font-size: 12px;"><strong>${timeLabel}</strong>${t(
        "managementDashboard.projected",
        "(Projected)"
      )}</div>`;
    }

    let tooltipContent = `<div style="font-family: Exo 2, sans-serif; font-size: 12px;"><strong>${timeLabel}</strong>`;
    params.forEach((param) => {
      if (
        param.seriesName.includes(
          t("managementDashboard.future", "(Future)")
        ) ||
        param.value == null
      )
        return;

      const value = param.value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });
      tooltipContent += `<div style="margin-top: 5px;">
                                ${param.marker} ${param.seriesName}:
                                <strong style="float: right; margin-left: 20px;">${value}</strong>
                             </div>`;
    });
    tooltipContent += `</div>`;
    return tooltipContent;
  };

  return {
    grid: { top: 20, right: 20, bottom: 20, left: 45 },
    legend: { show: false },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: axisLabelColor,
        fontSize: 10,
        interval: xAxisInterval,
        formatter: (v) => v.replace(", ", "\n"),
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: splitLineColor } },
      axisLabel: {
        color: axisLabelColor,
        fontSize: 10,
        formatter: (v) => (v > 1000 ? `${(v / 1000).toFixed(1)}k` : v),
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBgColor,
      borderColor: tooltipBorderColor,
      textStyle: { color: textColor },
      formatter: tooltipFormatter,
    },
    series: allSeries,
  };
};

// --- PRODUCTION-READY MEMOIZED COMPONENTS ---
const KpiCard = React.memo(({ title, value, unit, icon }) => (
  <div className="mgmt-dash-kpi-card">
    <div className="mgmt-dash-kpi-header">
      {icon}
      <div className="mgmt-dash-kpi-title">{title}</div>
    </div>
    <div className="mgmt-dash-kpi-value">
      {value}
      <span className="mgmt-dash-kpi-unit">{unit}</span>
    </div>
  </div>
));
KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  unit: PropTypes.string,
  icon: PropTypes.element.isRequired,
};
KpiCard.defaultProps = {
  unit: "",
};

const ChartCard = React.memo(({ title, chartOptions }) => {
  const hasData = chartOptions?.series?.[0]?.data?.some((value) => value > 0);
  const { t } = useTranslation();
  return (
    <div className="mgmt-dash-card h-full flex flex-col">
      <h3 className="mgmt-dash-card-title">{title}</h3>
      <div className="flex-grow h-full">
        {hasData ? (
          <ReactECharts
            option={chartOptions}
            style={{ height: "100%", minHeight: "190px" }}
            notMerge={true}
            opts={{ renderer: "svg" }}
            lazyUpdate={true}
          />
        ) : (
          <div className="mgmt-dash-no-data-placeholder">
            <ShowChartIcon />
            <span>
              {t(
                "managementDashboard.No_data_available_for_this_period",
                "No data available for this period."
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  chartOptions: PropTypes.object,
};
ChartCard.defaultProps = {
  chartOptions: {},
};

const ErrorDisplay = ({ message }) => (
  <div className="error-display">
    <ErrorOutlineIcon />
    <span>
      {message ||
        "An error occurred while fetching data. Please try again later."}
    </span>
  </div>
);
ErrorDisplay.propTypes = {
  message: PropTypes.string,
};
ErrorDisplay.defaultProps = {
  message: "An error occurred while fetching data. Please try again later.",
};

const ManagementDashboard = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [activeView, setActiveView] = useState("Platform");
  const [activeFleet, setActiveFleet] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePlatform, setActivePlatform] = useState("All");
  const [timePeriod, setTimePeriod] = useState("Cumulative");
  const [mapStatusFilter, setMapStatusFilter] = useState("total");

  const { t } = useTranslation();
  const userInfo = useSelector(selectCurrentUser);
  const username = userInfo?.username;

  const allChargingStations = useMemo(() => {
    const ekaStations = (chargingStations || []).map((station, index) => ({
      ...station,
      lat: station.latitude,
      lng: station.longitude,
      id: `eka-${station.name}-${index}`,
      type: "EKA",
    }));
    const pcmcStations = (pumaChargingStations || []).map((station, index) => ({
      ...station,
      lat: station.latitude,
      lng: station.longitude,
      id: `puma-${station.name}-${index}`,
      type: "PUMA",
    }));
    return [...ekaStations, ...pcmcStations];
  }, []);

  // --- YEH RAHA FIX (PART 1) ---
  const {
    data: allVehicles,
    isLoading: isLoadingVehicles,
    isError: isVehicleError,
  } = useGetVehiclesQuery(undefined, { skip: !username });

  // --- UPDATED KPI QUERY ARG LOGIC ---
  const kpiQueryArg = useMemo(() => {
    if (activeView === "Platform") {
      // 1. If a specific model is selected (e.g., E9), send that model string.
      if (activePlatform !== "All") {
        return activePlatform;
      }
      // 2. If no specific model is selected, but a category is (e.g. Bus, Truck, 3W),
      // send the object { platform: "Bus" } etc.
      else if (activeCategory !== "All") {
        return { platform: activeCategory };
      }
    }
    // Default to null for All/Global
    return null;
  }, [activeView, activePlatform, activeCategory]);

  // --- YEH RAHA FIX (PART 2) ---
  // Is query (aur iske WebSocket) ko tab tak skip karo jab tak vehicles load ho rahe hain
  const {
    data: cumulativeKpiTotals,
    isLoading: isKpiLoading,
    isError: isKpiError,
  } = useGetFleetMetricsQuery(kpiQueryArg, {
    skip: !username || isLoadingVehicles, // <-- FIX APPLIED HERE
  });
  // --- END OF FIX ---

  const commonQueryParams = { username };

  const {
    data: dailySummaryData,
    isLoading: isLoadingDailyData,
    isFetching: isFetchingDaily,
    isError: isDailyError,
  } = useGetSummaryDataQuery(
    { period: "today", ...commonQueryParams },
    {
      skip: timePeriod !== "Daily" || !username,
      pollingInterval: timePeriod === "Daily" ? 60000 : 0,
    }
  );
  const {
    data: weeklySummaryData,
    isLoading: isLoadingWeeklyData,
    isError: isWeeklyError,
  } = useGetSummaryDataQuery(
    { period: "week", ...commonQueryParams },
    { skip: timePeriod !== "Weekly" || !username }
  );
  const {
    data: monthlySummaryData,
    isLoading: isLoadingMonthlyData,
    isError: isMonthlyError,
  } = useGetSummaryDataQuery(
    { period: "month", ...commonQueryParams },
    { skip: timePeriod !== "Monthly" || !username }
  );

  const isLoading =
    isLoadingVehicles ||
    isKpiLoading ||
    (timePeriod === "Daily" && isLoadingDailyData) ||
    (timePeriod === "Weekly" && isLoadingWeeklyData) ||
    (timePeriod === "Monthly" && isLoadingMonthlyData);
  const isError =
    isVehicleError ||
    isKpiError ||
    isDailyError ||
    isWeeklyError ||
    isMonthlyError;

  const handleTimePeriodClick = (period) => {
    setTimePeriod(period);
  };

  const processedDailySummaryData = useMemo(() => {
    if (
      activeView === "Platform" &&
      activeCategory === "3W" &&
      Array.isArray(dailySummaryData)
    ) {
      return dailySummaryData.map((dataPoint) => ({
        ...dataPoint,
        traction_energy: 0,
      }));
    }
    return dailySummaryData;
  }, [dailySummaryData, activeView, activeCategory]);

  const { historicalKpis, chartData, chartLabels } = useDashboardData(
    {
      dailySummaryData: processedDailySummaryData,
      weeklySummaryData,
      monthlySummaryData,
    },
    { timePeriod, activeView, activeFleet, activeCategory, activePlatform }
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!allVehicles) return [];
    if (activeView === "Fleet")
      return activeFleet === "All"
        ? allVehicles
        : allVehicles.filter((v) => v.fleet === activeFleet);
    if (activeView === "Platform") {
      if (activeCategory === "All") return allVehicles;
      const modelsInCategory = platformCategories[activeCategory] || [];
      return activePlatform === "All"
        ? allVehicles.filter((v) => modelsInCategory.includes(v.vehicleType))
        : allVehicles.filter((v) => v.vehicleType === activePlatform);
    }
    return allVehicles;
  }, [allVehicles, activeView, activeFleet, activeCategory, activePlatform]);

  const vehicleCounts = useMemo(() => {
    const counts = { total: 0, active: 0, inactive: 0, nogps: 0 };
    if (!filteredVehicles) return counts;

    counts.total = filteredVehicles.length;

    filteredVehicles.forEach((v) => {
      const mode = v.mode?.toLowerCase() || "inactive";
      if (mode === "active") {
        counts.active++;
      } else if (mode === "nogps") {
        counts.nogps++;
      } else {
        counts.inactive++;
      }
    });
    return counts;
  }, [filteredVehicles]);

  const displayKpis =
    timePeriod === "Cumulative" ? cumulativeKpiTotals : historicalKpis;
  const treesSaved = useMemo(() => {
    const co2 = parseFloat(displayKpis?.co2_saving);
    return isNaN(co2) || co2 <= 0 ? 0 : Math.round(co2 / 12.5);
  }, [displayKpis]);

  const formatKpiValue = (value) => {
    if (value == null || isNaN(Number(value))) return "---";
    return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };

  const kpiMetrics = useMemo(
    () => [
      {
        title: t("managementDashboard.distance", "Distance"),
        value: displayKpis?.total_distance,
        unit: "km",
        icon: <DistanceIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.money_saved", "Money Saved"),
        value: displayKpis?.cost_saved,
        unit: "₹",
        icon: <MoneySavedIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.co2_saved", "CO2 Saved"),
        value: displayKpis?.co2_saving,
        unit: "kg",
        icon: <CO2SavedIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.energy_units", "Energy Units"),
        value: displayKpis?.energy_consumption,
        unit: "kWh",
        icon: <EnergyUnitsIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.runtime", "Runtime"),
        value: displayKpis?.run_time,
        unit: "hrs",
        icon: <RuntimeIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.traction", "Traction"),
        value: displayKpis?.traction_energy,
        unit: "kWh",
        icon: <TractionIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.regeneration", "Regeneration"),
        value: displayKpis?.regen_energy,
        unit: "kWh",
        icon: <RegenerationIcon className="mgmt-dash-kpi-icon" />,
      },
      {
        title: t("managementDashboard.trees_saved", "Trees Saved"),
        value: treesSaved,
        unit: "",
        icon: <TreesSavedIcon className="mgmt-dash-kpi-icon" />,
      },
    ],
    [displayKpis, treesSaved, t]
  );

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setActivePlatform("All");
  };
  const fleetButtons = useMemo(() => {
    if (!allVehicles) return ["All"];
    const uniqueFleets = [
      ...new Set(allVehicles.map((v) => v.fleet).filter(Boolean)),
    ].sort();
    return ["All", ...uniqueFleets];
  }, [allVehicles]);

  const categoryIcons = {
    Bus: <DirectionsBusIcon sx={{ fontSize: 16 }} />,
    Truck: <LocalShippingIcon sx={{ fontSize: 16 }} />,
    "3W": <DirectionsCarIcon sx={{ fontSize: 16 }} />,
  };

  if (isLoading && !cumulativeKpiTotals) {
    return <ManagementDashboardSkeleton />;
  }

  return (
    <div className="mgmt-dash-page">
      <header className="mgmt-dash-header">
        <div className="mgmt-dash-header-title">
          <h1>
            {t(
              "managementDashboard.management_Dashboard",
              "Management Dashboard"
            )}
          </h1>
        </div>
        <div className="mgmt-dash-header-controls">
          <div className="mgmt-dash-filter-group">
            {["Fleet", "Platform"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`mgmt-dash-filter-button ${
                  activeView === view ? "mgmt-dash-filter-button-active" : ""
                }`}
              >
                {t(`managementDashboard.${view.toLowerCase()}`)}
              </button>
            ))}
          </div>
          <div className="mgmt-dash-filter-group">
            <button
              key="Cumulative"
              onClick={() => handleTimePeriodClick("Cumulative")}
              className={`mgmt-dash-filter-button ${
                timePeriod === "Cumulative"
                  ? "mgmt-dash-filter-button-active"
                  : ""
              }`}
            >
              {t("managementDashboard.cumulative")}
            </button>
          </div>
          <div className="mgmt-dash-filter-group">
            {["Daily", "Weekly", "Monthly"].map((p) => (
              <button
                key={p}
                onClick={() => handleTimePeriodClick(p)}
                className={`mgmt-dash-filter-button ${
                  timePeriod === p ? "mgmt-dash-filter-button-active" : ""
                }`}
              >
                {t(`managementDashboard.${p.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-4 mb-6">
        {activeView === "Platform" && (
          <>
            <div className="mgmt-dash-filter-group">
              <button
                onClick={() => handleCategoryClick("All")}
                className={`mgmt-dash-filter-button ${
                  activeCategory === "All"
                    ? "mgmt-dash-filter-button-active"
                    : ""
                }`}
              >
                <GridViewIcon sx={{ fontSize: 16 }} />{" "}
                <span>{t("managementDashboard.all", "All")}</span>
              </button>
              {Object.keys(platformCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`mgmt-dash-filter-button ${
                    activeCategory === cat
                      ? "mgmt-dash-filter-button-active"
                      : ""
                  }`}
                >
                  {categoryIcons[cat]}{" "}
                  <span>
                    {t(
                      `managementDashboard.${
                        cat === "3W" ? "3w" : cat.toLowerCase()
                      }`
                    )}
                  </span>
                </button>
              ))}
            </div>
            {activeCategory !== "All" && (
              <div className="mgmt-dash-filter-group">
                <button
                  onClick={() => setActivePlatform("All")}
                  className={`mgmt-dash-filter-button ${
                    activePlatform === "All"
                      ? "mgmt-dash-filter-button-active"
                      : ""
                  }`}
                >
                  {t("managementDashboard.all", "All")}{" "}
                  {t(
                    `managementDashboard.${
                      activeCategory === "3W"
                        ? "3w"
                        : activeCategory.toLowerCase()
                    }`
                  )}
                </button>
                {platformCategories[activeCategory].map((model) => (
                  <button
                    key={model}
                    onClick={() => setActivePlatform(model)}
                    className={`mgmt-dash-filter-button ${
                      activePlatform === model
                        ? "mgmt-dash-filter-button-active"
                        : ""
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {activeView === "Fleet" && (
          <div className="mgmt-dash-filter-group">
            {fleetButtons.map((f) => {
              let buttonText;
              if (f === "All") {
                buttonText = t("managementDashboard.all", "All");
              } else {
                const fleetKey = f.toLowerCase().replace(/ /g, "_");
                buttonText = t(`managementDashboard.fleets.${fleetKey}`, f);
              }

              return (
                <button
                  key={f}
                  onClick={() => setActiveFleet(f)}
                  className={`mgmt-dash-filter-button ${
                    activeFleet === f ? "mgmt-dash-filter-button-active" : ""
                  }`}
                >
                  <ChevronRightIcon sx={{ fontSize: 16 }} />
                  {buttonText}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div
        className={`mgmt-dash-kpi-grid ${isFetchingDaily ? "is-updating" : ""}`}
      >
        {kpiMetrics.map((metric) => (
          <KpiCard
            key={metric.title}
            {...metric}
            value={formatKpiValue(metric.value)}
          />
        ))}
      </div>

      <div className="mgmt-dash-main-section">
        {isError ? (
          <ErrorDisplay
            message={t(
              "managementDashboard.errorOccurred",
              "An error occurred while fetching data. Please try again later."
            )}
          />
        ) : (
          <div className="mgmt-dash-main-grid">
            <div className="mgmt-dash-left-column">
              <div className="mgmt-dash-map-container mgmt-dash-card hmap-cont">
                <div className="mgmt-dash-status-bar">
                  <div
                    className={`status-item ${
                      mapStatusFilter === "total" ? "status-item-active" : ""
                    }`}
                    onClick={() => setMapStatusFilter("total")}
                  >
                    <span>
                      {t("managementDashboard.total", "Total")}:{" "}
                      <strong className="status-value-total">
                        {vehicleCounts.total}
                      </strong>
                    </span>
                  </div>
                  <div className="status-divider"></div>
                  <div
                    className={`status-item ${
                      mapStatusFilter === "active" ? "status-item-active" : ""
                    }`}
                    onClick={() => setMapStatusFilter("active")}
                  >
                    <span>
                      {t("managementDashboard.active", "Active")}:{" "}
                      <strong className="status-value-active">
                        {vehicleCounts.active}
                      </strong>
                    </span>
                  </div>
                  <div className="status-divider"></div>
                  <div
                    className={`status-item ${
                      mapStatusFilter === "inactive" ? "status-item-active" : ""
                    }`}
                    onClick={() => setMapStatusFilter("inactive")}
                  >
                    <span>
                      {t("managementDashboard.inactive", "Inactive")}:{" "}
                      <strong className="status-value-inactive">
                        {vehicleCounts.inactive}
                      </strong>
                    </span>
                  </div>

                  <div className="status-divider"></div>
                  <div className="status-item-info">
                    <span>
                      {t("status.noGps", "No GPS")}:{" "}
                      <strong className="status-value-nogps">
                        {vehicleCounts.nogps}
                      </strong>
                    </span>
                  </div>
                </div>
                <AdvancedDashboardMap
                  vehicles={filteredVehicles}
                  chargingStations={allChargingStations}
                  activeFilter={mapStatusFilter}
                />
              </div>
            </div>
            <div className="mgmt-dash-right-column">
              <div className="relative h-full">
                {timePeriod === "Cumulative" && (
                  <div className="cumulative-overlay">
                    <div className="cumulative-overlay-content">
                      <TimelineIcon className="overlay-icon" />
                      <h3 className="overlay-title">
                        {t(
                          "managementDashboard.viewPerformanceTrends",
                          "View Performance Trends"
                        )}
                      </h3>
                      <p className="overlay-text">
                        <Trans i18nKey="managementDashboard.cumulativeOverlayText">
                          Select <strong>Daily</strong>, <strong>Weekly</strong>
                          , or <strong>Monthly</strong> to visualize data over
                          time.
                        </Trans>
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`mgmt-dash-charts-grid ${
                    timePeriod === "Cumulative" ? "cumulative-view" : ""
                  }`}
                >
                  <ChartCard
                    title={t(
                      "managementDashboard.distance_trend",
                      "Distance Trend (km)"
                    )}
                    chartOptions={getChartOptions(
                      "distance",
                      chartData?.distance ?? [],
                      chartLabels,
                      "line",
                      true,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                  <ChartCard
                    title={t(
                      "managementDashboard.money_saved_rs",
                      "Money Saved (₹)"
                    )}
                    chartOptions={getChartOptions(
                      "moneySaved",
                      chartData?.moneySaved ?? [],
                      chartLabels,
                      "line",
                      true,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                  <ChartCard
                    title={t(
                      "managementDashboard.co2_saved_kg",
                      "CO2 Saved (kg)"
                    )}
                    chartOptions={getChartOptions(
                      "co2Saved",
                      chartData?.co2Saved ?? [],
                      chartLabels,
                      "bar",
                      false,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                  <ChartCard
                    title={t(
                      "managementDashboard.energy_balanced",
                      "Energy Balanced (kWh)"
                    )}
                    chartOptions={getEnergyBalanceChartOptions(
                      chartData?.energyUnits ?? [],
                      chartData?.regeneration ?? [],
                      chartLabels,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                  <ChartCard
                    title={t(
                      "managementDashboard.runtime_hrs",
                      "Runtime (hrs)"
                    )}
                    chartOptions={getChartOptions(
                      "runtime",
                      chartData?.runtime ?? [],
                      chartLabels,
                      "line",
                      true,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                  <ChartCard
                    title={t(
                      "managementDashboard.traction_energy",
                      "Traction Energy (kWh)"
                    )}
                    chartOptions={getChartOptions(
                      "traction",
                      chartData?.traction ?? [],
                      chartLabels,
                      "line",
                      true,
                      isDark,
                      timePeriod,
                      t
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;
