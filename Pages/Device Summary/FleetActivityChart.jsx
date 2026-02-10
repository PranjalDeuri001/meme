// FleetActivityChart.jsx

import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from 'echarts/core'; // Import echarts core for gradients
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";

// Register the required components
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

const FleetActivityChart = ({ isDarkMode = false, data, totalVehicles }) => {
  const textColor = isDarkMode ? "#e2e8f0" : "#1e293b";
  const axisLabelColor = isDarkMode ? "#a0aec0" : "#6b7280";
  const splitLineColor = isDarkMode ? "#4a5568" : "#e5e7eb";

  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const running_ = t("VehicleStatus.running", "Running");
  const idle_ = t("VehicleStatus.idle", "Idle");
  const charging_ = t("VehicleStatus.charging", "Charging");
  const stopped_ = t("VehicleStatus.stopped", "Stopped");
  const numberofVehicle_ = t("VehicleStatus.number_of_vehicle", "Number of Vehicles");
  const fleetActivity_ = t("VehicleStatus.fleet_activity", "Fleet Activity Trends (24h)");
  // All translation variables ends with a trailing underscore (e.g., totalLabel_)
  // This convention helps quickly identify multilingual text in the component.
  // ---------------------------- 

  // Define colors for easy reference
  const colors = {
    running: '#34d399', // green-400
    idle: '#f59e0b',    // amber-500
    charging: '#6366f1',// indigo-500
    stopped: '#ef4444'  // red-500
  };

  const runningData = data ? data.running : [];
  const idleData = data ? data.idle : [];
  const chargingData = data ? data.charging : [];
  const stoppedData = data ? data.stopped : [];

  const activityTrendsOptions = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: 'line', lineStyle: { color: axisLabelColor } },
      backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDarkMode ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor },
      formatter: function (params) {
        let tooltipHtml = `<div style="font-weight: 600; margin-bottom: 5px;">${params[0].name}</div>`;
        params.sort((a, b) => b.value - a.value) // Sort by value descending
        .forEach(param => {
          tooltipHtml += `${param.marker} ${param.seriesName}: <b style="float: right; margin-left: 20px;">${param.value}</b><br/>`;
        });
        return tooltipHtml;
      }
    },
    legend: {
      data: [ running_, idle_, charging_, stopped_ ], 
      bottom: 0,
      textStyle: { color: textColor },
      icon: 'circle',
      selectedMode: true, 
    },
    grid: { 
      left: "3%", 
      right: "4%", 
      bottom: "12%",
      top: "10%",
      containLabel: true 
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: axisLabelColor },
    },
    yAxis: {
      type: "value",
      name: numberofVehicle_,
      nameTextStyle: {
          color: axisLabelColor,
          padding: [0, 0, 0, 60]
      },
      min: 0,
      max: totalVehicles > 0 ? totalVehicles : undefined,
      splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
      axisLabel: { 
          color: axisLabelColor,
          formatter: (value) => Math.round(value)
      },
    },
    series: [
      {
        name: running_,
        type: 'line',
        smooth: 0.6,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(52, 211, 153, 0.5)'
          }, {
            offset: 1,
            color: 'rgba(52, 211, 153, 0)'
          }])
        },
        emphasis: { focus: 'none', lineStyle: { width: 4 } },
        data: runningData,
        color: colors.running,
      },
      {
        name: idle_,
        type: 'line',
        smooth: 0.6,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(245, 158, 11, 0.5)'
          }, {
            offset: 1,
            color: 'rgba(245, 158, 11, 0)'
          }])
        },
        emphasis: { focus: 'none', lineStyle: { width: 4 } },
        data: idleData,
        color: colors.idle,
      },
      {
        name: charging_,
        type: 'line',
        smooth: 0.6,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(99, 102, 241, 0.5)'
          }, {
            offset: 1,
            color: 'rgba(99, 102, 241, 0)'
          }])
        },
        emphasis: { focus: 'none', lineStyle: { width: 4 } },
        data: chargingData,
        color: colors.charging,
      },
      {
        name: stopped_,
        type: 'line',
        smooth: 0.6,
        showSymbol: false,
        areaStyle: null,
        lineStyle: {
          width: 2,
          type: 'dashed'
        },
        emphasis: { focus: 'none', lineStyle: { width: 4, type: 'dashed' } },
        data: stoppedData,
        color: colors.stopped,
      },
    ],
    backgroundColor: "transparent",
  };

  return (
    <div className="ds-card lg-col-span-2">
      <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary-text-color)" }}>
        {fleetActivity_}
      </h3>
      <ReactECharts
        option={activityTrendsOptions}
        style={{ height: 350, width: "100%" }}
        notMerge={true} 
        lazyUpdate={true}
        showLoading={!data || !data.running}
      />
    </div>
  );
};
FleetActivityChart.propTypes = {
  isDarkMode: PropTypes.bool,
  data: PropTypes.shape({
    running: PropTypes.arrayOf(PropTypes.number),
    idle: PropTypes.arrayOf(PropTypes.number),
    charging: PropTypes.arrayOf(PropTypes.number),
    stopped: PropTypes.arrayOf(PropTypes.number),
  }),
  highlightedStatus: PropTypes.string,
  totalVehicles: PropTypes.number,
};
FleetActivityChart.defaultProps = {
  isDarkMode: false,
  data: {
    running: [],
    idle: [],
    charging: [],
    stopped: [],
  },
  highlightedStatus: '',
  totalVehicles: 0,
};

export default FleetActivityChart;