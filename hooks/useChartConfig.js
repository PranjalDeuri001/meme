// src/hooks/useChartConfig.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const colors = {
  red: { light: "#FCA5A5", medium: "#EF4444" },
  orange: { light: "#FDBA74", medium: "#F97316" },
  yellow: { medium: "#FBBF24" },
  blue: { light: "#93C5FD", medium: "#3B82F6" },
  purple: { light: "#C4B5FD", medium: "#8B5CF6" },
  pink: { light: "#F9A8D4", medium: "#EC4899" },
  teal: { light: "#5EEAD4", medium: "#14B8A6" },
  green: { light: "#86EFAC", medium: "#22C55E", dark: "#16A34A" },
  lightBlue: { medium: "#60A5FA" },
};

export const useChartConfig = (selectedVehicle) => {
  const { t } = useTranslation();

  const is6SVehicle = selectedVehicle?.type?.toLowerCase().includes("6s");
  const vehicleTypeForCheck = selectedVehicle?.type?.toLowerCase() || "";

  const voltageLines = useMemo(() => {
    if (is6SVehicle) {
      return [
        { name: "Max Cell Volt", dataKey: "MaxCellVolt", color: colors.blue.medium },
        { name: "Min Cell Volt", dataKey: "MinCellVolt", color: colors.green.medium },
        { name: "SOC", dataKey: "SOC", color: colors.yellow.medium, yAxisIndex: 0 },
      ];
    }
    const lines = [
      { name: t("charts.aCellVMax"), dataKey: "A_Max_Cell_Volt", color: colors.blue.medium, yAxisIndex: 1 },
      { name: t("charts.aCellVMin"), dataKey: "A_Min_Cell_Volt", color: colors.green.medium, yAxisIndex: 1 },
      { name: "A SOC", dataKey: "A_SOC_Value", color: colors.yellow.medium, yAxisIndex: 0 },
    ];
    if (vehicleTypeForCheck.includes("12")) {
      lines.push(
        { name: t("charts.bCellVMax"), dataKey: "B_Max_Cell_Volt", color: colors.red.medium, yAxisIndex: 1 },
        { name: t("charts.bCellVMin"), dataKey: "B_Min_Cell_Volt", color: colors.lightBlue.medium, yAxisIndex: 1 },
        { name: "B SOC", dataKey: "B_SOC_Value", color: colors.green.dark, yAxisIndex: 0 },
        { name: t("charts.cCellVMax"), dataKey: "C_Max_Cell_Volt", color: colors.orange.medium, yAxisIndex: 1 },
        { name: t("charts.cCellVMin"), dataKey: "C_Min_Cell_Volt", color: colors.purple.medium, yAxisIndex: 1 },
        { name: "C SOC", dataKey: "C_SOC_Value", color: colors.pink.medium, yAxisIndex: 0 }
      );
    } else if (vehicleTypeForCheck.includes("9")) {
      lines.push(
        { name: t("charts.bCellVMax"), dataKey: "B_Max_Cell_Volt", color: colors.red.medium, yAxisIndex: 1 },
        { name: t("charts.bCellVMin"), dataKey: "B_Min_Cell_Volt", color: colors.lightBlue.medium, yAxisIndex: 1 },
        { name: "B SOC", dataKey: "B_SOC_Value", color: colors.green.dark, yAxisIndex: 0 }
      );
    }
    return lines;
  }, [is6SVehicle, vehicleTypeForCheck, t]);

  const temperatureLines = useMemo(() => {
    if (is6SVehicle) {
      return null; 
    }
    const lines = [
      { name: t("charts.aMaxCellT"), dataKey: "A_Max_Cell_Temp", color: colors.blue.medium, yAxisIndex: 1 },
      { name: t("charts.aMinCellT"), dataKey: "A_Min_Cell_Temp", color: colors.green.medium, yAxisIndex: 1 },
      { name: "A SOC", dataKey: "A_SOC_Value", color: colors.yellow.medium, yAxisIndex: 0 },
    ];
    if (vehicleTypeForCheck.includes("12")) {
      lines.push(
        { name: t("charts.bMaxCellT"), dataKey: "B_Max_Cell_Temp", color: colors.red.medium, yAxisIndex: 1 },
        { name: t("charts.bMinCellT"), dataKey: "B_Min_Cell_Temp", color: colors.lightBlue.medium, yAxisIndex: 1 },
        { name: "B SOC", dataKey: "B_SOC_Value", color: colors.green.dark, yAxisIndex: 0 },
        { name: t("charts.cMaxCellT"), dataKey: "C_Max_Cell_Temp", color: colors.orange.medium, yAxisIndex: 1 },
        { name: t("charts.cMinCellT"), dataKey: "C_Min_Cell_Temp", color: colors.purple.medium, yAxisIndex: 1 },
        { name: "C SOC", dataKey: "C_SOC_Value", color: colors.pink.medium, yAxisIndex: 0 }
      );
    } else if (vehicleTypeForCheck.includes("9")) {
      lines.push(
        { name: t("charts.bMaxCellT"), dataKey: "B_Max_Cell_Temp", color: colors.red.medium, yAxisIndex: 1 },
        { name: t("charts.bMinCellT"), dataKey: "B_Min_Cell_Temp", color: colors.lightBlue.medium, yAxisIndex: 1 },
        { name: "B SOC", dataKey: "B_SOC_Value", color: colors.green.dark, yAxisIndex: 0 }
      );
    }
    return lines;
  }, [is6SVehicle, vehicleTypeForCheck, t]);

  const packCurrentLines = useMemo(() => {
    // =================================================================
    // ✅ UI/UX FIX: Reverting all "Pack Current" charts to "line" type
    // All `type: "bar"` and `large: true` properties have been removed.
    // =================================================================
    if (is6SVehicle) {
        return [
            { name: t("vehicle.batteryCurrent"), dataKey: "BatteryCurrent", color: colors.blue.medium, yAxisIndex: 1 },
            { name: "SOC", dataKey: "SOC", color: colors.green.medium, yAxisIndex: 0 },
        ];
    }
    const lines = [
        { name: t("charts.aPackCurrent"), dataKey: "A_Pack_Current_Value", color: colors.blue.medium, yAxisIndex: 1 },
        { name: "A SOC", dataKey: "A_SOC_Value", color: colors.green.medium, yAxisIndex: 0 },
    ];
    if (vehicleTypeForCheck.includes("12")) {
        lines.push(
            { name: "B Pack Current", dataKey: "B_Pack_Current_Value", color: colors.yellow.medium, yAxisIndex: 1 },
            { name: "B SOC", dataKey: "B_SOC_Value", color: colors.red.medium, yAxisIndex: 0 },
            { name: "C Pack Current", dataKey: "C_Pack_Current_Value", color: colors.lightBlue.medium, yAxisIndex: 1 },
            { name: "C SOC", dataKey: "C_SOC_Value", color: colors.green.dark, yAxisIndex: 0 }
        );
    } else if (vehicleTypeForCheck.includes("9")) {
        lines.push(
            { name: "B Pack Current", dataKey: "B_Pack_Current_Value", color: colors.yellow.medium, yAxisIndex: 1 },
            { name: "B SOC", dataKey: "B_SOC_Value", color: colors.red.medium, yAxisIndex: 0 }
        );
    }
    return lines;
  }, [is6SVehicle, vehicleTypeForCheck, t]);
  
  const packVoltageLines = useMemo(() => {
    if (is6SVehicle) {
        return [
            { name: t("vehicle.batteryVoltage"), dataKey: "BatteryVoltage", color: colors.blue.medium, yAxisIndex: 1 },
            { name: "SOC", dataKey: "SOC", color: colors.green.medium, yAxisIndex: 0 },
        ];
    }
    const lines = [
        { name: t("charts.aPackVoltage"), dataKey: "A_Pack_Voltage_Value", color: colors.blue.medium, yAxisIndex: 1 },
        { name: "A SOC", dataKey: "A_SOC_Value", color: colors.green.medium, yAxisIndex: 0 },
    ];
     if (vehicleTypeForCheck.includes("12")) {
        lines.push(
            { name: t("charts.bPackVoltage"), dataKey: "B_Pack_Voltage_Value", color: colors.yellow.medium, yAxisIndex: 1 },
            { name: "B SOC", dataKey: "B_SOC_Value", color: colors.red.medium, yAxisIndex: 0 },
            { name: t("charts.cPackVoltage"), dataKey: "C_Pack_Voltage_Value", color: colors.lightBlue.medium, yAxisIndex: 1 },
            { name: "C SOC", dataKey: "C_SOC_Value", color: colors.green.dark, yAxisIndex: 0 }
        );
    } else if (vehicleTypeForCheck.includes("9")) {
        lines.push(
            { name: t("charts.bPackVoltage"), dataKey: "B_Pack_Voltage_Value", color: colors.yellow.medium, yAxisIndex: 1 },
            { name: "B SOC", dataKey: "B_SOC_Value", color: colors.red.medium, yAxisIndex: 0 }
        );
    }
    return lines;
  }, [is6SVehicle, vehicleTypeForCheck, t]);

  const coolingPerformanceLines = useMemo(() => [
    { name: t("charts.aMaxTemp"), dataKey: "aMaxTemp", color: colors.blue.medium, yAxisIndex: 1 },
    { name: t("charts.aMinTemp"), dataKey: "aMinTemp", color: colors.green.medium, yAxisIndex: 1 },
    { name: t("charts.bMaxTemp"), dataKey: "bMaxTemp", color: colors.red.medium, yAxisIndex: 1 },
    { name: t("charts.bMinTemp"), dataKey: "bMinTemp", color: colors.red.light, yAxisIndex: 1 },
    { name: t("charts.bcsTherm1"), dataKey: "bcsThermistor1", color: colors.lightBlue.medium, yAxisIndex: 1 },
    { name: t("charts.bcsTherm2"), dataKey: "bcsThermistor2", color: colors.green.dark, yAxisIndex: 1 },
    { name: t("charts.compressorCurrent"), dataKey: "compressorInputCurrent", color: colors.orange.medium, yAxisIndex: 0 },
  ], [t]);

  const tcsPerformanceLines = useMemo(() => [
    { name: t("charts.tcsTherminator"), dataKey: "tcsThermistor", color: colors.teal.medium },
  ], [t]);

  return {
    voltageLines,
    temperatureLines,
    packCurrentLines,
    packVoltageLines,
    coolingPerformanceLines,
    tcsPerformanceLines,
  };
};