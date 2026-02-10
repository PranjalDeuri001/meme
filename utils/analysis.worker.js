// src/utils/analysis.worker.js

/**
 * Safely parses a value to a float.
 * @param {*} val - The value to parse.
 * @returns {number|null} - The parsed number or null.
 */
function parseFloatSafe(val) {
  if (typeof val !== "number") {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }
  return val;
}

/**
 * Transforms columnar data for non-6S vehicles.
 */
function transformNon6SData(columnarData) {
  const dataLength = columnarData.timestamp.length;
  const batteryCellVoltage = [],
    batteryTemperature = [],
    batteryPackCurrent = [],
    batteryPackVoltage = [],
    coolingPerformance = [],
    tcsPerformance = [];

  for (let i = 0; i < dataLength; i++) {
    const time = columnarData.timestamp[i];
    batteryCellVoltage.push({
      time,
      A_Max_Cell_Volt: parseFloatSafe(columnarData.A_Max_Cell_Volt?.[i]),
      A_Min_Cell_Volt: parseFloatSafe(columnarData.A_Min_Cell_Volt?.[i]),
      B_Max_Cell_Volt: parseFloatSafe(columnarData.B_Max_Cell_Volt?.[i]),
      B_Min_Cell_Volt: parseFloatSafe(columnarData.B_Min_Cell_Volt?.[i]),
      C_Max_Cell_Volt: parseFloatSafe(columnarData.C_Max_Cell_Volt?.[i]),
      C_Min_Cell_Volt: parseFloatSafe(columnarData.C_Min_Cell_Volt?.[i]),
      A_SOC_Value: parseFloatSafe(columnarData.A_SOC_Value?.[i]),
      B_SOC_Value: parseFloatSafe(columnarData.B_SOC_Value?.[i]),
      C_SOC_Value: parseFloatSafe(columnarData.C_SOC_Value?.[i]),
    });
    batteryTemperature.push({
      time,
      A_Max_Cell_Temp: parseFloatSafe(columnarData.A_Max_Cell_Temp?.[i]),
      A_Min_Cell_Temp: parseFloatSafe(columnarData.A_Min_Cell_Temp?.[i]),
      B_Max_Cell_Temp: parseFloatSafe(columnarData.B_Max_Cell_Temp?.[i]),
      B_Min_Cell_Temp: parseFloatSafe(columnarData.B_Min_Cell_Temp?.[i]),
      C_Max_Cell_Temp: parseFloatSafe(columnarData.C_Max_Cell_Temp?.[i]),
      C_Min_Cell_Temp: parseFloatSafe(columnarData.C_Min_Cell_Temp?.[i]),
      A_SOC_Value: parseFloatSafe(columnarData.A_SOC_Value?.[i]),
      B_SOC_Value: parseFloatSafe(columnarData.B_SOC_Value?.[i]),
      C_SOC_Value: parseFloatSafe(columnarData.C_SOC_Value?.[i]),
    });
    batteryPackCurrent.push({
      time,
      A_Pack_Current_Value: parseFloatSafe(
        columnarData.A_Pack_Current_Value?.[i]
      ),
      B_Pack_Current_Value: parseFloatSafe(
        columnarData.B_Pack_Current_Value?.[i]
      ),
      C_Pack_Current_Value: parseFloatSafe(
        columnarData.C_Pack_Current_Value?.[i]
      ),
      A_SOC_Value: parseFloatSafe(columnarData.A_SOC_Value?.[i]),
      B_SOC_Value: parseFloatSafe(columnarData.B_SOC_Value?.[i]),
      C_SOC_Value: parseFloatSafe(columnarData.C_SOC_Value?.[i]),
    });
    batteryPackVoltage.push({
      time,
      A_Pack_Voltage_Value: parseFloatSafe(
        columnarData.A_Pack_Voltage_Value?.[i]
      ),
      B_Pack_Voltage_Value: parseFloatSafe(
        columnarData.B_Pack_Voltage_Value?.[i]
      ),
      C_Pack_Voltage_Value: parseFloatSafe(
        columnarData.C_Pack_Voltage_Value?.[i]
      ),
      A_SOC_Value: parseFloatSafe(columnarData.A_SOC_Value?.[i]),
      B_SOC_Value: parseFloatSafe(columnarData.B_SOC_Value?.[i]),
      C_SOC_Value: parseFloatSafe(columnarData.C_SOC_Value?.[i]),
    });
    coolingPerformance.push({
      time,
      aMaxTemp: parseFloatSafe(columnarData.A_Max_Cell_Temp?.[i]),
      aMinTemp: parseFloatSafe(columnarData.A_Min_Cell_Temp?.[i]),
      bMaxTemp: parseFloatSafe(columnarData.B_Max_Cell_Temp?.[i]),
      bMinTemp: parseFloatSafe(columnarData.B_Min_Cell_Temp?.[i]),
      bcsThermistor1: parseFloatSafe(columnarData.BCS_Thermistor_1?.[i]),
      bcsThermistor2: parseFloatSafe(columnarData.BCS_Thermistor_2?.[i]),
      compressorInputCurrent: parseFloatSafe(
        columnarData.BCS_Compressor_Input_Current?.[i]
      ),
      pumpCurrent: parseFloatSafe(columnarData.Pump_Current?.[i]),
    });
    tcsPerformance.push({
      time,
      pumpCurrent: parseFloatSafe(columnarData.Pump_Current?.[i]),
      tcsThermistor: parseFloatSafe(columnarData.TCS_Thermistor?.[i]),
    });
  }
  return {
    batteryCharts: {
      batteryCellVoltage,
      batteryTemperature,
      batteryPackCurrent,
      batteryPackVoltage,
    },
    coolingPerformanceCharts: coolingPerformance,
    tcsPerformanceCharts: tcsPerformance,
    hvData: [],
  };
}

/**
 * Transforms columnar data for 6S vehicles.
 */
function transform6SData(columnarData) {
  const dataLength = columnarData.timestamp.length;
  const transformed = [];

  for (let i = 0; i < dataLength; i++) {
    const item = {
      time: columnarData.timestamp[i],
      MaxCellVolt: parseFloatSafe(columnarData.MaxCellVolt?.[i]),
      MinCellVolt: parseFloatSafe(columnarData.MinCellVolt?.[i]),
      SOC: parseFloatSafe(columnarData.SOC?.[i]),
      TS1: parseFloatSafe(columnarData.TS1?.[i]),
      TS2: parseFloatSafe(columnarData.TS2?.[i]),
      TS3: parseFloatSafe(columnarData.TS3?.[i]),
      TS4: parseFloatSafe(columnarData.TS4?.[i]),
      TS5: parseFloatSafe(columnarData.TS5?.[i]),
      TS6: parseFloatSafe(columnarData.TS6?.[i]),
      BatteryCurrent: parseFloatSafe(columnarData.BatteryCurrent?.[i]),
      BatteryVoltage: parseFloatSafe(columnarData.BatteryVoltage?.[i]),
    };
    transformed.push(item);
  }
  return {
    batteryCharts: {
      batteryCellVoltage: transformed,
      batteryTemperature: transformed,
      batteryPackCurrent: transformed,
      batteryPackVoltage: transformed,
    },
    coolingPerformanceCharts: [],
    tcsPerformanceCharts: [],
    hvData: [],
  };
}

// Listen for messages from the main thread
self.onmessage = function (e) {
  const { chartValues, vehicleType } = e.data;

  try {
    let transformedData;
    if (vehicleType?.toLowerCase().includes("6s")) {
      transformedData = transform6SData(chartValues);
    } else {
      transformedData = transformNon6SData(chartValues);
    }
    // Send the result back to the main thread
    self.postMessage({ success: true, data: transformedData });
  } catch (error) {
    // Send an error back
    self.postMessage({ success: false, error: error.message });
  }
};