// src/Pages/AnalysisWithUpload/ChartRenderer.jsx

import React from "react";
import ReactECharts from "echarts-for-react";
import propsTypes from "prop-types";

const findTimeKey = (data) => {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0] || {});

  const keyPriorities = ["timestamp", "time", "index"];
  for (const key of keyPriorities) {
    const foundKey = keys.find((k) => k.toLowerCase() === key);
    if (foundKey) return foundKey;
  }

  return keys.length > 0 ? keys[0] : null;
};

// --- MODIFICATION: Added 'singleYAxis' prop ---
function ChartRenderer({
  rawData,
  selectedSignals,
  chartId,
  title,
  theme,
  singleYAxis,
}) {
  if (
    !rawData ||
    rawData.length === 0 ||
    !selectedSignals ||
    selectedSignals.length === 0
  ) {
    return (
      <div className="chart-placeholder-text">
        No data available to plot for the selected signals.
      </div>
    );
  }

  const timeKey = findTimeKey(rawData);

  if (!timeKey) {
    return (
      <div className="chart-placeholder-text">
        Could not determine the time column in the data.
      </div>
    );
  }

  const colors = [
    "#5470C6",
    "#91CC75",
    "#FAC858",
    "#EE6666",
    "#73C0DE",
    "#3BA272",
    "#FC8452",
    "#9A60B4",
    "#EA7CCC",
  ];

  const isDark = theme === "dark";
  const textColor = isDark ? "#E5E7EB" : "#4B5563";
  const axisLineColor = isDark ? "#4B5563" : "#D1D5DB";
  const splitLineColor = isDark ? "#374151" : "#E5E7EB";

  // --- MODIFICATION START: Conditionally define the Y-axis configuration ---
  const yAxisConfig = singleYAxis
    ? [
        {
          type: "value",
          name: "Value", // Generic name for the single axis
          position: "left",
          axisLine: { show: true, lineStyle: { color: axisLineColor } },
          axisLabel: { color: textColor },
          splitLine: { lineStyle: { type: "dashed", color: splitLineColor } },
        },
      ]
    : [
        {
          type: "value",
          name: "SOC (%)",
          position: "left",
          min: 0,
          max: 100,
          axisLine: { show: true, lineStyle: { color: axisLineColor } },
          axisLabel: { color: textColor },
          splitLine: { lineStyle: { type: "dashed", color: splitLineColor } },
        },
        {
          type: "value",
          name: "Values",
          position: "right",
          axisLine: { show: true, lineStyle: { color: axisLineColor } },
          axisLabel: { color: textColor },
          splitLine: { show: false },
        },
      ];
  // --- MODIFICATION END ---

  const option = {
    title: {
      text: title,
      left: "center",
      textStyle: { color: textColor },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: { backgroundColor: "#6a7985" },
      },
    },
    legend: {
      type: "scroll",
      top: 30,
      left: "center",
      textStyle: { color: textColor },
    },
    toolbox: {
      show: true,
      feature: { restore: {}, saveAsImage: {} },
      right: 20,
      top: 0,
      iconStyle: { borderColor: textColor },
    },
    grid: {
      left: 60,
      right: 60,
      bottom: 60,
      top: 70,
      containLabel: true,
    },
    dataset: {
      dimensions: Object.keys(rawData[0] || {}),
      source: rawData,
    },
    xAxis: {
      type: "category",
      name: timeKey,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: yAxisConfig, // Use the new conditional config
    dataZoom: [{ type: "inside" }, { type: "slider", height: 20, bottom: 10 }],
    series: selectedSignals.map((signal, index) => ({
      name: signal.label,
      type: "line",
      step: signal.label.startsWith("FAULT:") ? "start" : undefined,
      connectNulls: true,
      // --- MODIFICATION: If singleYAxis is true, always use index 0 ---
      yAxisIndex: singleYAxis
        ? 0
        : signal.value.toLowerCase().includes("soc")
        ? 0
        : 1,
      showSymbol: false,
      smooth: signal.label.startsWith("FAULT:") ? false : 0.2,
      lineStyle: { width: 2 },
      color: colors[index % colors.length],
      encode: { x: timeKey, y: signal.value },
      sampling: "lttb",
      progressive: 1000,
      progressiveThreshold: 2000,
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "450px", width: "100%" }}
      notMerge={true}
      lazyUpdate={true}
      key={chartId}
      theme={theme}
    />
  );
}

ChartRenderer.propTypes = {
  rawData: propsTypes.arrayOf(propsTypes.object),
  selectedSignals: propsTypes.arrayOf(
    propsTypes.shape({
      label: propsTypes.string.isRequired,
      value: propsTypes.string.isRequired,
    })
  ).isRequired,
  chartId: propsTypes.string.isRequired,
  title: propsTypes.string.isRequired,
  theme: propsTypes.string,
  singleYAxis: propsTypes.bool, // --- MODIFICATION: Add prop type ---
};

ChartRenderer.defaultProps = {
  theme: "light",
  singleYAxis: false, // --- MODIFICATION: Add default prop value ---
};

export default ChartRenderer;
