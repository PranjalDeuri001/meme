// src/Pages/Analysis/ChartsDisplay.jsx
import ChartRenderer from "./ChartRenderer";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { useChartConfig } from "../../hooks/useChartConfig";
import { Info } from "lucide-react"; // Using lucide-react, but you can use any icon

function ChartsDisplay({ selectedCharts, chartData, selectedVehicle }) {
  const { t } = useTranslation();
  
  const {
    voltageLines,
    temperatureLines: staticTemperatureLines,
    packCurrentLines,
    packVoltageLines,
    coolingPerformanceLines,
    tcsPerformanceLines,
  } = useChartConfig(selectedVehicle);

  const isOptionSelected = (value) => selectedCharts.some((opt) => opt.value === value);
  const is6SVehicle = selectedVehicle?.type?.toLowerCase().includes("6s");

  const build6STemperatureLines = () => {
    const data = chartData?.batteryCharts?.batteryTemperature;
    if (!is6SVehicle || !data?.length) return [];
    
    const firstDataPoint = data[0];
    const availableKeys = Object.keys(firstDataPoint);
    const tsColors = ["#3B82F6", "#22C55E", "#FBBF24", "#EF4444", "#60A5FA", "#16A34A"];
    
    const dynamicLines = availableKeys
      .filter((key) => key.startsWith("TS"))
      .map((key, index) => ({
        name: key,
        dataKey: key,
        color: tsColors[index % tsColors.length],
        yAxisIndex: 1 // Assign to the 'Values' axis
      }));
      
    if (availableKeys.includes("SOC")) {
      dynamicLines.push({ name: "SOC", dataKey: "SOC", color: "#F97316", yAxisIndex: 0 });
    }
    return dynamicLines;
  };

  const temperatureLines = is6SVehicle ? build6STemperatureLines() : staticTemperatureLines;

  const hasData = chartData?.batteryCharts?.batteryCellVoltage?.length > 0;

  if (!hasData) {
    return (
      <div className="Analysis-Empty-State">
        <div className="Analysis-Empty-State-Icon">
          <Info size={48} /> 
        </div>
        <h2>{selectedVehicle ? t("userAlerts.noDataForVehicleAndDate") : t("charts.BeginYourAnalysis", "Begin Your Analysis")}</h2>
        <p>
          {selectedVehicle
            ? t("charts.PleaseCheckVehicle", "Please check your vehicle selection or try a different date.")
            : t("charts.PleaseSelectVehicle", "Please select a vehicle, date, and charts to display data.")}
        </p>
      </div>
    );
  }

  return (
    <div className="Analysis-Charts">
      {isOptionSelected("batteryCharts") && (
        <>
          <ChartRenderer
            data={chartData.batteryCharts.batteryCellVoltage}
            lines={voltageLines}
            chartId="Battery-Cell-Voltage"
            title={t("charts.batteryCellVoltage")}
            yAxisName="Voltage (V)"
          />
          <ChartRenderer
            data={chartData.batteryCharts.batteryTemperature}
            lines={temperatureLines}
            chartId="Battery-Temperature"
            title={t("charts.batteryTemperature")}
            yAxisName="Temp (°C)"
          />
          <ChartRenderer
            data={chartData.batteryCharts.batteryPackCurrent}
            lines={packCurrentLines}
            chartId="Battery-Pack-Current"
            title={t("charts.batteryPackCurrent")}
            yAxisName="Current (A)"
          />
          <ChartRenderer
            data={chartData.batteryCharts.batteryPackVoltage}
            lines={packVoltageLines}
            chartId="Battery-Pack-Voltage"
            title={t("charts.batteryPackVoltage")}
            yAxisName="Voltage (V)"
          />
        </>
      )}

      {!is6SVehicle && isOptionSelected("coolingPerformanceCharts") && (
        <ChartRenderer
          data={chartData.coolingPerformanceCharts}
          lines={coolingPerformanceLines}
          chartId="coolingPerformance"
          title={t("reports.coolingReport")}
          yAxisName="Temp (°C)"
        />
      )}

      {!is6SVehicle && isOptionSelected("tcsPerformanceCharts") && (
        <ChartRenderer
          data={chartData.tcsPerformanceCharts}
          lines={tcsPerformanceLines}
          chartId="dutyCycle"
          title={t("charts.tcsPerformance")}
          yAxisName="Value"
        />
      )}
    </div>
  );
}

ChartsDisplay.propTypes = {
  selectedCharts: PropTypes.array.isRequired,
  chartData: PropTypes.object.isRequired,
  selectedVehicle: PropTypes.object,
};

ChartsDisplay.defaultProps = {
  selectedVehicle: null,
};

export default ChartsDisplay;