 // FleetAnalyticsCharts.jsx
 
import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
// import { green } from "@mui/material/colors";
 
const THEME_COLORS = {
  primary: '#0b5297',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#CD2C58',
  yellow: '#FFD93D',
  red: '#ED3F27',
  green: '#D3E671',
  coastalblue: '#239BA7',
  lightText: '#ccc',
  darkText: '#333',
};
 
const truncateText = (text, maxLength = 20) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
 
const wrapText = (text, maxLineLength = 20) => {
  if (!text) return '';
  const words = text.split(' ');
  let currentLine = '';
  const lines = [];
 
  words.forEach(word => {
    if ((currentLine + ' ' + word).length > maxLineLength && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine.length === 0 ? '' : ' ') + word;
    }
  });
  lines.push(currentLine);
  return lines.join('\n');
};
 
 
function FleetAnalyticsCharts({ apiData = [] }) {
  const { t } = useTranslation();
  const [chartTheme, setChartTheme] = useState('light');
 
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.body.classList.contains('dark');
      setChartTheme(isDark ? 'dark' : 'light');
    });
 
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
   
    const isDark = document.body.classList.contains('dark');
    setChartTheme(isDark ? 'dark' : 'light');
 
    return () => observer.disconnect();
  }, []);
 
  const chartData = useMemo(() => {
    if (!apiData || apiData.length === 0) return null;
 
    const aggregated = {};
    let totalVehicles = 0;
 
    apiData.forEach(vehicle => {
      const fleetName = vehicle.fleet;
      if (!aggregated[fleetName]) {
        aggregated[fleetName] = { odometer: 0, run_time: 0, idle_time: 0, vehicleCount: 0 };
      }
      aggregated[fleetName].odometer += vehicle.odometer || 0;
      aggregated[fleetName].run_time += vehicle.run_time || 0;
      aggregated[fleetName].idle_time += vehicle.idle_time || 0;
      aggregated[fleetName].vehicleCount += 1;
      totalVehicles += 1;
    });
 
    const fleetEntries = Object.entries(aggregated);
 
    // --- Logic for Composition Pie Chart (remains the same) ---
    const OTHERS_THRESHOLD = 0.03;
    const mainSlices = [];
    let othersSlice = { value: 0, name: "Others" };
    fleetEntries.forEach(([name, data]) => {
      if (data.vehicleCount / totalVehicles < OTHERS_THRESHOLD && fleetEntries.length > 5) {
        othersSlice.value += data.vehicleCount;
      } else {
        mainSlices.push({ name, value: data.vehicleCount });
      }
    });
    const vehicleCountData = [...mainSlices];
    if (othersSlice.value > 0) {
      vehicleCountData.push(othersSlice);
    }
 
    // --- UPDATED: Logic for Distance Bar Chart ---
    // Sort all fleets by distance without slicing or grouping into "Others"
    const sortedByDistance = [...fleetEntries].sort(([, a], [, b]) => b.odometer - a.odometer);
    const distanceFleetNames = sortedByDistance.map(([name]) => name);
    const distanceData = sortedByDistance.map(([, data]) => parseFloat(data.odometer.toFixed(2)));
 
    // --- Logic for Time Stacked Bar Chart (already shows all fleets) ---
    const sortedTimeFleets = [...fleetEntries].sort(([a], [b]) => a.localeCompare(b));
    const timeFleetNames = sortedTimeFleets.map(([name]) => name);
    const runTimeData = sortedTimeFleets.map(([, data]) => parseFloat(data.run_time.toFixed(2)));
    const idleTimeData = sortedTimeFleets.map(([, data]) => parseFloat(data.idle_time.toFixed(2)));
 
    return { vehicleCountData, distanceFleetNames, distanceData, timeFleetNames, runTimeData, idleTimeData };
  }, [apiData]);
 
  if (!chartData) {
    return <div>No data available to display charts.</div>;
  }
 
  const isDark = chartTheme === 'dark';
  const labelColor = isDark ? THEME_COLORS.lightText : THEME_COLORS.darkText;
  const pieBorderColor = isDark ? '#27303f' : '#fff';
  const chartBackgroundColor = 'transparent';
 
  const createBaseChartOption = (titleText) => ({
    backgroundColor: chartBackgroundColor,
    title: { text: titleText, left: "center" },
    grid: { left: "1%", right: "4%", bottom: "5%", containLabel: true },
    legend: { show: true, top: 35, type: 'scroll' },
    tooltip: { trigger: 'axis' },
    xAxis: { splitLine: { show: false } },
    yAxis: { splitLine: { lineStyle: { type: 'dashed' } } },
    animationEasing: 'cubicInOut',
    animationDuration: 1000,
  });
 
  const distanceOption = {
    ...createBaseChartOption(t("calculations.distanceTravelledByFleet", "Distance Travelled by Fleet")),
    
    // 2. Remove the legend (the "Distance" toggle)
    legend: { show: false },

    grid: { 
      left: "2%", 
      right: "8%", 
      bottom: "5%",
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      data: chartData.distanceFleetNames, 
      axisLabel: { 
        fontSize: 10,
        show: false // 1. Hides the x-axis labels (fleet names)
      } 
    },
    yAxis: { type: 'value' },
    series: [ 
      { 
        name: t("vehicle.distance", "Distance"), 
        type: 'bar', 
        data: chartData.distanceData, 
        itemStyle: { color: THEME_COLORS.primary,
                     borderRadius: [8, 8, 0, 0] }, 
        label: { 
          show: true, 
          position: [10, -20], 
          formatter: '{c}', 
          color: labelColor, 
          fontSize: 10,
          rotate: 25,
        } 
      } 
    ],
    media: [
      { query: { maxWidth: 480 },
        option: {
          title: { textStyle: { fontSize: 14 } },
          grid: { right: "3%", left: "2%", bottom: "3%" },
          yAxis: { 
            axisLabel: { 
              fontSize: 7 
            } 
          },
          xAxis: { 
            axisLabel: { 
              fontSize: 7, 
              rotate: 30 
            } 
          },
          series: [{ label: { show: false } }]
        }
      }
    ]
  };
 
  const compositionOption = {
    ...createBaseChartOption(t("calculations.fleetComposition","Fleet Composition")),
    tooltip: { trigger: 'item', formatter: `{b}: {c} ${t("vehicle.vehicles", "Vehicles")} ({d}%)` },
    legend: { orient: 'vertical', right: 10, top: 'center', formatter: (name) => truncateText(name, 15) },
    series: [ { name: t("vehicle.vehicles", "vehicles"), type: "pie", radius: ["50%", "75%"], center: ['40%', '55%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 8, borderColor: pieBorderColor, borderWidth: 2 },
    label: { show: false, position: 'center' },
    labelLine: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: labelColor, formatter: (params) => `${wrapText(params.name, 12)}\n${params.percent.toFixed(2)}%` } },
    data: chartData.vehicleCountData,
    color: [THEME_COLORS.primary, THEME_COLORS.amber, THEME_COLORS.blue, THEME_COLORS.purple, THEME_COLORS.pink, THEME_COLORS.yellow, THEME_COLORS.green, THEME_COLORS.coastalblue, THEME_COLORS.red] }],
    media: [
      {
        query: { maxWidth: 768 },
        option: {
          title: { textStyle: { fontSize: 14 } },
          legend: { itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
          series: [{ center: ['50%', '55%'] }]
        }
      },
      {
        query: { maxWidth: 480 },
        option: {
          title: { textStyle: { fontSize: 12 } },
          legend: { orient: 'horizontal', top: 'auto', bottom: 18, right: 'auto', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 9 } },
          series: [{ center: ['50%', '50%'], radius: ["40%", "65%"] }]
        }
      }
    ]
  };
 
  const drivingTimeName = t("calculations.drivingTime", "Driving Time");
  const idleTimeName = t("reports.idleTime", "Idle Time");
  
  const handleTimeChartLegendSelect = (params, chart) => {
    const isDrivingSelected = params.selected[drivingTimeName];
    const isIdleSelected = params.selected[idleTimeName];

    const newDrivingRadius = (isDrivingSelected && !isIdleSelected) 
                             ? [8, 8, 0, 0] 
                             : [0, 0, 0, 0]; 

    chart.setOption({
      series: [
        { name: drivingTimeName,
          itemStyle: { borderRadius: newDrivingRadius } }
      ]
    });
  };

  const timeChartEvents = {
    'legendselectchanged': handleTimeChartLegendSelect
  };

  const timeOption = {
    ...createBaseChartOption(t("calculations.drivingVsIdlingTime","Driving vs. Idling Time")),

    grid: { left: "8%", right: "8%", bottom: "5%", top: "20%", containLabel: false },
    xAxis: {
      type: "category",
      data: chartData.timeFleetNames,
      axisLabel: {
        interval: 0,
        formatter: (value) => wrapText(value, 12),
        fontSize: 10,
        show: false,
      }
    },
    yAxis: { type: "value", name: t("systemUtility.timeHrs","Time (Hours)") },
    series: [ { name: drivingTimeName, 
                type: "bar", 
                stack: "Time", 
                data: chartData.runTimeData, 
                itemStyle: { color: THEME_COLORS.primary, borderRadius: [0, 0, 0, 0] } }, 
              { name: idleTimeName, 
                type: "bar", 
                stack: "Time", 
                data: chartData.idleTimeData, 
                itemStyle: { color: THEME_COLORS.amber, borderRadius: [8, 8, 0, 0] } } ],
    media: [
      {
        query: { maxWidth: 480 },
        option: {
          title: { textStyle: { fontSize: 12 } },
          grid: { left: "13%", right: "8%", bottom: "13%", top: "23%" },
          xAxis: {
            axisLabel: {
              rotate: 0, fontSize: 7,
              formatter: (value) => wrapText(value, 10)
            }
          }
        }
      }
    ]
  };

  return (
    <div className="fs-charts-grid-container">
      <div className="fs-chart-container">
        <ReactECharts 
          option={distanceOption} 
          theme={chartTheme} 
          style={{ height: "400px", width: "100%" }} 
        />
      </div>
      
      <div className="fs-chart-container">
        <ReactECharts 
          option={compositionOption} 
          theme={chartTheme} 
          style={{ height: "400px", width: "100%" }} 
        />
      </div>
      
      <div className="fs-chart-container">
        <ReactECharts 
          option={timeOption} 
          theme={chartTheme} 
          style={{ height: "400px", width: "100%" }}
          onEvents={timeChartEvents}
       />
      </div>
    </div>
  );
}
 
export default React.memo(FleetAnalyticsCharts);
 