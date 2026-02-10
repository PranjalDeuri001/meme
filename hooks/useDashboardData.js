// src/hooks/useDashboardData.js

import { useState, useEffect, useMemo } from 'react';
import { excludedImeis, platformCategories } from '../config/dashboardConfig';

const COST_PER_KWH = 8;
const CO2_PER_KWH = 0.82;

// Helper function to safely parse numeric values that might be strings or hyphens
const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "-") {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};


// This is the central filtering function for all calculations.
const filterDataForCalculations = (data, activeView, activeFleet, activeCategory, activePlatform) => {
  if (!data) return [];

  let dataToProcess = Array.isArray(data)
    ? data.filter(item => !excludedImeis.has(item.imei))
    : [];

  if (activeView === 'Fleet') {
    if (activeFleet !== 'All') {
      dataToProcess = dataToProcess.filter(item => item.fleet === activeFleet);
    }
  } else { // activeView === 'Platform'
    if (activeCategory !== 'All') {
      const modelsInCategory = platformCategories[activeCategory];
      if (activePlatform !== 'All') {
        dataToProcess = dataToProcess.filter(item => item.vehicle_type_name === activePlatform);
      } else {
        dataToProcess = dataToProcess.filter(item => modelsInCategory.includes(item.vehicle_type_name));
      }
    }
  }
  return dataToProcess;
};

export const useDashboardData = (
  { dailySummaryData, weeklySummaryData, monthlySummaryData },
  { timePeriod, activeView, activeFleet, activeCategory, activePlatform }
) => {
  const [historicalKpis, setHistoricalKpis] = useState(null);

  useEffect(() => {
    if (timePeriod === 'Cumulative') { setHistoricalKpis(null); return; }

    let sourceData;
    if (timePeriod === 'Daily') sourceData = dailySummaryData;
    if (timePeriod === 'Weekly') sourceData = weeklySummaryData;
    if (timePeriod === 'Monthly') sourceData = monthlySummaryData;

    if (!sourceData) { setHistoricalKpis(null); return; }

    const filteredData = filterDataForCalculations(sourceData, activeView, activeFleet, activeCategory, activePlatform);
    const totals = { total_distance: 0, energy_consumption: 0, run_time: 0, traction_energy: 0, regen_energy: 0 };
    const is3WCategory = activeView === 'Platform' && activeCategory === '3W';

    // This logic correctly uses top-level summary data for all periods, ensuring KPI accuracy.
    filteredData.forEach(item => {
      totals.total_distance += safeParseFloat(item.distance);
      totals.energy_consumption += safeParseFloat(item.energy_consumed);
      totals.run_time += safeParseFloat(item.runtime_minutes) / 60;
      totals.regen_energy += safeParseFloat(item.regen_energy);
      
      if (!is3WCategory) {
        totals.traction_energy += safeParseFloat(item.motor_ec);
      }
    });

    totals.cost_saved = totals.energy_consumption * COST_PER_KWH;
    totals.co2_saving = totals.energy_consumption * CO2_PER_KWH;
    setHistoricalKpis(totals);
  }, [timePeriod, dailySummaryData, weeklySummaryData, monthlySummaryData, activeView, activeFleet, activeCategory, activePlatform]);

  const { chartData, chartLabels } = useMemo(() => {
    const initialMetrics = { distance: [], moneySaved: [], co2Saved: [], energyUnits: [], runtime: [], traction: [], regeneration: [] };

    if (timePeriod === 'Daily' && dailySummaryData) {
      const dataToProcess = filterDataForCalculations(dailySummaryData, activeView, activeFleet, activeCategory, activePlatform);
      const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
      const hourlyData = { distance: Array(24).fill(0), moneySaved: Array(24).fill(0), co2Saved: Array(24).fill(0), energyUnits: Array(24).fill(0), runtime: Array(24).fill(0), traction: Array(24).fill(0), regeneration: Array(24).fill(0) };
      const is3WCategory = activeView === 'Platform' && activeCategory === '3W';
      
      let sessionTotalDistance = 0;

      dataToProcess.forEach(vehicle => {
        (Array.isArray(vehicle.sessions) ? vehicle.sessions : []).forEach(session => {
          sessionTotalDistance += safeParseFloat(session.distance);

          const sessionDuration = safeParseFloat(session.duration);
          if (!session.start_time_val || !session.end_time_val || sessionDuration <= 0) return;

          const start = new Date(session.start_time_val);
          const end = new Date(session.end_time_val);

          const distancePerMin = safeParseFloat(session.distance) / sessionDuration;
          const energyPerMin = Math.abs(safeParseFloat(session.session_ec)) / sessionDuration;
          const regenPerMin = safeParseFloat(session.session_regen) / sessionDuration;
          const tractionEnergyPerMin = is3WCategory ? 0 : Math.max(0, energyPerMin - regenPerMin);

          for (let hour = start.getHours(); hour <= end.getHours() + (end.getDate() - start.getDate()) * 24; hour++) {
            const currentHour = hour % 24;
            const hourStart = new Date(start); hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(hourStart); hourEnd.setHours(hour + 1, 0, 0, 0);
            const chunkStart = Math.max(start, hourStart);
            const chunkEnd = Math.min(end, hourEnd);
            const chunkDuration = (chunkEnd - chunkStart) / (1000 * 60);

            if (chunkDuration > 0) {
              hourlyData.distance[currentHour] += distancePerMin * chunkDuration;
              hourlyData.energyUnits[currentHour] += energyPerMin * chunkDuration;
              hourlyData.regeneration[currentHour] += regenPerMin * chunkDuration;
              hourlyData.traction[currentHour] += tractionEnergyPerMin * chunkDuration;
              hourlyData.runtime[currentHour] += chunkDuration;
              hourlyData.moneySaved[currentHour] += (energyPerMin * chunkDuration) * COST_PER_KWH;
              hourlyData.co2Saved[currentHour] += (energyPerMin * chunkDuration) * CO2_PER_KWH;
            }
          }
        });
      });

      // DATA RECONCILIATION: Scale the chart data to match the definitive KPI total.
      const kpiTotalDistance = dataToProcess.reduce((sum, vehicle) => sum + safeParseFloat(vehicle.distance), 0);
      
      if (kpiTotalDistance > sessionTotalDistance && sessionTotalDistance > 0) {
        const scalingFactor = kpiTotalDistance / sessionTotalDistance;
        hourlyData.distance = hourlyData.distance.map(val => val * scalingFactor);
        hourlyData.energyUnits = hourlyData.energyUnits.map(val => val * scalingFactor);
        hourlyData.moneySaved = hourlyData.moneySaved.map(val => val * scalingFactor);
        hourlyData.co2Saved = hourlyData.co2Saved.map(val => val * scalingFactor);
      }

      hourlyData.runtime = hourlyData.runtime.map(mins => parseFloat((mins / 60).toFixed(2)));
      Object.keys(hourlyData).forEach(key => {
        if (key !== 'runtime') hourlyData[key] = hourlyData[key].map(val => parseFloat(val.toFixed(2)));
      });
      return { chartData: hourlyData, chartLabels: labels };
    }

    if (timePeriod === 'Weekly' && weeklySummaryData) {
      const dataToProcess = filterDataForCalculations(weeklySummaryData, activeView, activeFleet, activeCategory, activePlatform);
      const labels = [];
      const today = new Date();
      const dayOfWeek = today.getDay();
      const dayOfWeekMondayStart = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeekMondayStart);
      const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
      for (let i = 0; i < 7; i++) { const currentDate = new Date(monday); currentDate.setDate(monday.getDate() + i); const day = String(currentDate.getDate()).padStart(2, '0'); const month = String(currentDate.getMonth() + 1).padStart(2, '0'); const dayName = dayFormatter.format(currentDate); labels.push(`${dayName} ${day}/${month}`); }
      const weeklyBuckets = { distance: Array(7).fill(0), moneySaved: Array(7).fill(0), co2Saved: Array(7).fill(0), energyUnits: Array(7).fill(0), runtime: Array(7).fill(0), traction: Array(7).fill(0), regeneration: Array(7).fill(0) };
      if (dataToProcess?.length > 0) {
        dataToProcess.forEach(item => {
          const itemDate = new Date(item.date);
          if (isNaN(itemDate.getTime())) return;
          const itemDayOfWeek = itemDate.getDay();
          const bucketIndex = (itemDayOfWeek === 0) ? 6 : itemDayOfWeek - 1;
          if (bucketIndex >= 0 && bucketIndex < 7) {
            const energy = safeParseFloat(item.energy_consumed);
            weeklyBuckets.distance[bucketIndex] += safeParseFloat(item.distance);
            weeklyBuckets.energyUnits[bucketIndex] += energy;
            weeklyBuckets.moneySaved[bucketIndex] += energy * COST_PER_KWH;
            weeklyBuckets.co2Saved[bucketIndex] += energy * CO2_PER_KWH;
            weeklyBuckets.traction[bucketIndex] += safeParseFloat(item.motor_ec);
            weeklyBuckets.regeneration[bucketIndex] += safeParseFloat(item.regen_energy);
            weeklyBuckets.runtime[bucketIndex] += safeParseFloat(item.runtime_minutes) / 60;
          }
        });
      }
      Object.keys(weeklyBuckets).forEach(key => { weeklyBuckets[key] = weeklyBuckets[key].map(val => parseFloat(val.toFixed(2))); });
      return { chartData: weeklyBuckets, chartLabels: labels };
    }

    if (timePeriod === 'Monthly' && monthlySummaryData) {
      const dataToProcess = filterDataForCalculations(monthlySummaryData, activeView, activeFleet, activeCategory, activePlatform);
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const monthlyBuckets = { distance: Array(daysInMonth).fill(0), moneySaved: Array(daysInMonth).fill(0), co2Saved: Array(daysInMonth).fill(0), energyUnits: Array(daysInMonth).fill(0), runtime: Array(daysInMonth).fill(0), traction: Array(daysInMonth).fill(0), regeneration: Array(daysInMonth).fill(0) };
      dataToProcess.forEach(item => {
        const dayOfMonth = new Date(item.date).getDate() - 1;
        if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
          const energy = safeParseFloat(item.energy_consumed);
          monthlyBuckets.distance[dayOfMonth] += safeParseFloat(item.distance);
          monthlyBuckets.energyUnits[dayOfMonth] += energy;
          monthlyBuckets.moneySaved[dayOfMonth] += energy * COST_PER_KWH;
          monthlyBuckets.co2Saved[dayOfMonth] += energy * CO2_PER_KWH;
          monthlyBuckets.traction[dayOfMonth] += safeParseFloat(item.motor_ec);
          monthlyBuckets.regeneration[dayOfMonth] += safeParseFloat(item.regen_energy);
          monthlyBuckets.runtime[dayOfMonth] += safeParseFloat(item.runtime_minutes) / 60;
        }
      });
      Object.keys(monthlyBuckets).forEach(key => { monthlyBuckets[key] = monthlyBuckets[key].map(val => parseFloat(val.toFixed(2))); });
      return { chartData: monthlyBuckets, chartLabels: labels };
    }

    return { chartData: initialMetrics, chartLabels: [] };
  }, [dailySummaryData, weeklySummaryData, monthlySummaryData, timePeriod, activeView, activeFleet, activeCategory, activePlatform]);

  return { historicalKpis, chartData, chartLabels };
};