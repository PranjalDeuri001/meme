// FleetStatusChart.jsx

import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import propTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";

const FleetStatusChart = ({ isDarkMode = false, onStatusClick, data = [], totalVehicles = 0, highlightedStatus }) => {
  const chartRef = useRef(null);
  const textColor = isDarkMode ? "#e2e8f0" : "#475569";
  const cardBgColor = isDarkMode ? '#1f2937' : '#ffffff';
  
  // --- MULTILINGUAL SECTION ---
  const { t } = useTranslation();
  const totalFleet_ = t("VehicleStatus.total_fleet", "Total Fleet");
  const fleetStatusDistribution_ = t("VehicleStatus.fleet_status_distn", "Fleet Status Distribution");
  // All translation variables ends with a trailing underscore (e.g., totalLabel_)
  // This convention helps quickly identify multilingual text in the component.

  const processedData = data.map(item => ({
      ...item,
      itemStyle: {
          ...item.itemStyle,
          opacity: highlightedStatus && highlightedStatus !== item.name ? 0.5 : 1
      }
  }));

  const initialOptions = {
    backgroundColor: "transparent",
    tooltip: { 
      trigger: "item", 
      formatter: "<b>{b}</b>: {c} ({d}%)",
      backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDarkMode ? '#4a5568' : '#e2e8f0',
      textStyle: { color: textColor },
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      data: data.map((item) => item.name),
      textStyle: { color: textColor },
      type: "scroll",
      icon: 'circle',
    },
    title: {
      text: totalVehicles,
      subtext: totalFleet_,
      left: 'center',
      top: '42%',
      textStyle: { fontSize: 28, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1e293b' },
      subtextStyle: { fontSize: 14, color: textColor },
    },
    series: [{
        name: "Fleet Status",
        type: "pie",
        radius: ["65%", "80%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: processedData,
        // ADDED: New styling for a more professional look
        borderRadius: 8,
        itemStyle: {
            borderColor: cardBgColor,
            borderWidth: 2
        },
        emphasis: {
            scaleSize: 10,
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    }],
  };

  const onEvents = {
    click: (params) => {
      const clickKeyName = params.data?.keyName || params.name;
      if (onStatusClick) onStatusClick(clickKeyName);
    },
    mouseover: (params) => {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: params.dataIndex });
      echartsInstance.setOption({ title: { text: params.value, subtext: params.name } });
    },
    mouseout: (params) => {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: params.dataIndex });
      echartsInstance.setOption({ title: { text: totalVehicles, subtext: totalFleet_ } });
    },
  };
  
  return (
    <div className="ds-card">
      <h3 style={{ margin: "0 0 1rem 0", color: "var(--primary-text-color)" }}>
        {fleetStatusDistribution_}
      </h3>
      <ReactECharts
        ref={chartRef}
        option={initialOptions}
        style={{ height: 350, width: "100%" }}
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
        key={highlightedStatus + data.map(d => d.value).join('')}
      />
    </div>
  );
};
FleetStatusChart.propTypes = {
  isDarkMode: propTypes.bool,
  onStatusClick: propTypes.func,
  data: propTypes.arrayOf(
    propTypes.shape({
      name: propTypes.string.isRequired,
      value: propTypes.number.isRequired,
      keyName: propTypes.string,
      itemStyle: propTypes.object,
    })
  ),
  totalVehicles: propTypes.number,
  highlightedStatus: propTypes.string,
};
FleetStatusChart.defaultProps = {
  isDarkMode: false,
  onStatusClick: () => {},
  data: [],
  totalVehicles: 0,
  highlightedStatus: null,
};
      

export default FleetStatusChart;