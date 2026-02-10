// src/Pages/Analysis/ChartRenderer.jsx

import React from "react";
import ReactECharts from "echarts-for-react";
import PropTypes from "prop-types";
import { useThemeDetector } from "../../hooks/useThemeDetector";

function ChartRenderer({ data, lines, chartId, title, yAxisName }) {
  const theme = useThemeDetector();

  // --- ECHARTS THEME CONFIGURATION ---
  const lightTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#333' },
    legend: { textStyle: { color: '#333' } },
    title: { textStyle: { color: '#333' } },
    toolbox: { iconStyle: { borderColor: '#333' } },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: 'transparent',
      textStyle: { color: '#333' },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 12px;'
    },
    dataZoom: { textStyle: { color: '#333' } },
  };

  const darkTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#ccc' },
    legend: { textStyle: { color: '#ccc' } },
    title: { textStyle: { color: '#ccc' } },
    toolbox: { iconStyle: { borderColor: '#ccc' } },
    tooltip: {
      backgroundColor: '#2d3748',
      borderColor: 'transparent',
      textStyle: { color: '#ccc' },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 12px;'
    },
    xAxis: { axisLine: { lineStyle: { color: '#888' } }, axisLabel: { color: '#ccc' } },
    yAxis: { axisLine: { lineStyle: { color: '#888' } }, axisLabel: { color: '#ccc' }, splitLine: { lineStyle: { color: '#444' } } },
    dataZoom: { textStyle: { color: '#ccc' }, borderColor: '#555', fillerColor: 'rgba(200,200,200,0.2)' },
  };

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  // =================================================================
  // ✅ UI/UX FIX: Create the xAxis data array *before* the option object
  // This allows both the xAxis and the dataZoom formatter to access it.
  // =================================================================
  const xAxisData = data.map((d) => d.time);

  const series = lines.map((line) => ({
    name: line.name,
    type: line.type || "line",
    data: data.map((d) => d[line.dataKey]),
    yAxisIndex: line.dataKey.toLowerCase().includes("soc") ? 0 : (line.yAxisIndex || 0),
    showSymbol: false,
    smooth: true,
    lineStyle: { width: 1.5, color: line.color },
    itemStyle: { color: line.color, opacity: 0.7 },
  }));
  
  const option = {
    ...currentTheme,
    title: {
      text: title,
      left: "center",
      top: "10px",
      textStyle: { ...currentTheme.title.textStyle, fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      ...currentTheme.tooltip,
      trigger: "axis",
      formatter: (params) => {
        if (!params || params.length === 0) return '';
        const timeHeader = params[0].axisValueLabel.split('T')[1]?.substring(0, 8) || params[0].axisValueLabel;
        let seriesContent = '';
        
        params.sort((a, b) => a.seriesIndex - b.seriesIndex).forEach(param => {
          const value = param.value;
          let formattedValue = (value === null || value === undefined) ? 'N/A' : value;
          if (typeof formattedValue === 'number') {
            formattedValue = formattedValue.toFixed(2);
          }

          seriesContent += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 12px;"> 
              <div style="display: flex; align-items: center;">
                ${param.marker}
                <span style="margin-left: 8px; color: ${currentTheme.textStyle.color};">${param.seriesName}</span>
              </div>
              <strong style="margin-left: 20px; color: ${currentTheme.textStyle.color};">${formattedValue}</strong>
            </div>`;
        });
        return `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${timeHeader}</div>${seriesContent}`;
      }
    },
    legend: {
      ...currentTheme.legend,
      orient: 'horizontal',
      bottom: 30,
      left: 'center',
      type: 'scroll',
      itemGap: 10, 
      textStyle: {
        fontSize: 11
      }
    },
    toolbox: {
      show: true,
      feature: { restore: {}, saveAsImage: {} },
      right: 20,
      top: 10,
    },
    grid: {
      left: 60,
      right: 60,
      bottom: 80, 
      top: 60,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xAxisData, // Use the pre-defined array
      axisLabel: {
        hideOverlap: true,
        fontSize: 10,
        formatter: (value) => {
          if (!value) return "";
          const parts = value.split("T");
          if (parts.length > 1) {
            const timePart = parts[1];
            return timePart.substring(0, 5); // "HH:MM"
          }
          return "";
        },
      },
    },
    yAxis: [
      { 
        type: "value", 
        name: "SOC (%)", 
        position: "left", 
        min: 0, 
        max: 100, 
        offset: 0, 
        axisLine: { show: true },
        axisLabel: { fontSize: 10 },
        nameGap: 25, 
        nameTextStyle: { fontSize: 11, align: 'left' } 
      },
      { 
        type: "value", 
        name: yAxisName || "Values", 
        position: "right", 
        min: (v) => Math.floor(v.min * 0.95),
        max: (v) => Math.ceil(v.max * 1.05),
        axisLine: { show: true },
        axisLabel: { fontSize: 10 },
        nameGap: 30,
        nameTextStyle: { fontSize: 11, align: 'right' }
      },
    ],
    dataZoom: [
      { type: "inside", xAxisIndex: 0, start: 0, end: 100 },
      { 
        type: "slider", 
        xAxisIndex: 0, 
        start: 0, 
        end: 100, 
        height: 20, 
        bottom: 5,
        showDetail: true,
        textStyle: { ...currentTheme.dataZoom.textStyle, fontSize: 10 },
        // =================================================================
        // ✅ UI/UX FIX: This formatter now correctly references xAxisData
        // =================================================================
        formatter: (value, endValue) => {
            // 'value' and 'endValue' are the *indexes*
            const startTime = xAxisData[value]; // Get string from pre-defined array
            const endTime = xAxisData[endValue]; // Get string from pre-defined array

            const formatTime = (timestamp) => {
                if (!timestamp || typeof timestamp !== 'string') return '';
                let timePart = timestamp;

                if (timestamp.includes('T')) {
                    const parts = timestamp.split('T');
                    if (parts.length < 2) return timestamp;
                    timePart = parts[1];
                }
                
                return timePart.split('.')[0] || '';
            };
            
            return `${formatTime(startTime)} - ${formatTime(endTime)}`;
        }
      },
    ],
    series: series,
  };

  return (
    <div
      className={`${chartId} chart-card-container`}
      style={{
        width: "100%",
        minWidth: "300px",
      }}
    >
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}

ChartRenderer.propTypes = {
  data: PropTypes.array.isRequired,
  lines: PropTypes.array.isRequired,
  chartId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  yAxisName: PropTypes.string,
};

ChartRenderer.defaultProps = {
  yAxisName: "Values",
};

export default ChartRenderer;