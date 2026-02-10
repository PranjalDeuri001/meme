
import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    FiX, FiCalendar, FiClock, FiActivity, FiBattery, FiZap,
    FiAlertTriangle, FiThermometer, FiCpu, FiHardDrive, FiHash, FiInfo
} from 'react-icons/fi';

import './AlertAnalyticsModal.css';

// --- Improved Helper Functions ---
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const formatMetricName = (key) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

const safeParseFloat = (val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        // Only return number if it's not NaN and is finite
        return (!isNaN(parsed) && isFinite(parsed)) ? parsed : val;
    }
    return val;
};

const detectMetrics = (reqData) => {
    if (!reqData || reqData.length === 0) return { type: 'NONE', metrics: [] };

    const sample = reqData[0];
    const numericFields = Object.entries(sample)
        .filter(([key, val]) => {
            // Allow numbers OR strings that look like numbers
            const isNumeric = typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)) && isFinite(parseFloat(val)));
            const isExcluded = ['timestamp', 'id', 'device_id', 'alert_id', 'created_at', 'updated_at'].includes(key.toLowerCase());
            return isNumeric && !isExcluded;
        })
        .map(([key]) => key);

    // Check if all values are zero for a field (noise)
    const metricsWithData = numericFields.filter(field => {
        // Allow 0 values, only filter out null/undefined
        const hasData = reqData.some(snapshot => snapshot[field] !== undefined && snapshot[field] !== null);
        return hasData;
    });

    // Check for battery-specific fields (only if actual battery data exists)
    // Expanded list to catch more variations
    const batteryFields = [
        'A_SOC_Value', 'B_SOC_Value', 'C_SOC_Value',
        'A_Max_Cell_Temp', 'B_Max_Cell_Temp', 'C_Max_Cell_Temp',
        'A_Pack_Voltage_Value', 'B_Pack_Voltage_Value', 'C_Pack_Voltage_Value',
        'A_SOC', 'B_SOC', 'C_SOC', 'SOC',
        'A_Temp', 'B_Temp', 'C_Temp', 'Temp',
        'A_Voltage', 'B_Voltage', 'C_Voltage', 'Voltage', 'Pack_Voltage', 'Pack_Current'
    ];
    const hasBatteryData = batteryFields.some(field =>
        reqData.some(snapshot => snapshot[field] !== undefined && snapshot[field] !== null)
    );

    if (hasBatteryData) return { type: 'BATTERY', metrics: metricsWithData };
    if (metricsWithData.length > 0) return { type: 'GENERIC', metrics: metricsWithData };
    return { type: 'FLAG_ONLY', metrics: [] };
};

const AlertAnalyticsModal = ({ alert, onClose }) => {
    const { t } = useTranslation();

    // Detect alert type and available metrics - MUST be called before early return
    const { alertType, detectedMetrics } = useMemo(() => {
        if (!alert || !alert.req_data) return { alertType: 'NONE', detectedMetrics: [] };
        const detection = detectMetrics(alert.req_data);
        return { alertType: detection.type, detectedMetrics: detection.metrics };
    }, [alert]);

    // Parse telemetry data for charts (dynamic based on alert type) - MUST be called before early return
    const chartData = useMemo(() => {
        if (!alert || !alert.req_data || alert.req_data.length === 0) return null;

        return alert.req_data.map((snapshot, index) => {
            const dataPoint = {
                index: index + 1,
                time: snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : `#${index + 1}`,
            };

            // Dynamically add all detected metrics
            detectedMetrics.forEach(metric => {
                dataPoint[metric] = safeParseFloat(snapshot[metric]);
            });

            // For battery alerts, also add legacy fields for compatibility
            if (alertType === 'BATTERY') {
                dataPoint.socA = safeParseFloat(snapshot.A_SOC_Value ?? snapshot.A_SOC ?? snapshot.SOC_A ?? snapshot.SOC ?? snapshot.soc);
                dataPoint.socB = safeParseFloat(snapshot.B_SOC_Value ?? snapshot.B_SOC ?? snapshot.SOC_B);
                dataPoint.socC = safeParseFloat(snapshot.C_SOC_Value ?? snapshot.C_SOC ?? snapshot.SOC_C);
                dataPoint.socD = safeParseFloat(snapshot.D_SOC_Value ?? snapshot.D_SOC ?? snapshot.SOC_D);

                dataPoint.tempAMax = safeParseFloat(snapshot.A_Max_Cell_Temp ?? snapshot.A_Max_Temp ?? snapshot.Max_Cell_Temp ?? snapshot.Temp);
                dataPoint.tempAMin = safeParseFloat(snapshot.A_Min_Cell_Temp ?? snapshot.A_Min_Temp ?? snapshot.Min_Cell_Temp);
                dataPoint.tempBMax = safeParseFloat(snapshot.B_Max_Cell_Temp ?? snapshot.B_Max_Temp);
                dataPoint.tempBMin = safeParseFloat(snapshot.B_Min_Cell_Temp ?? snapshot.B_Min_Temp);
                dataPoint.tempCMax = safeParseFloat(snapshot.C_Max_Cell_Temp ?? snapshot.C_Max_Temp);
                dataPoint.tempCMin = safeParseFloat(snapshot.C_Min_Cell_Temp ?? snapshot.C_Min_Temp);
                dataPoint.tempDMax = safeParseFloat(snapshot.D_Max_Cell_Temp ?? snapshot.D_Max_Temp);
                dataPoint.tempDMin = safeParseFloat(snapshot.D_Min_Cell_Temp ?? snapshot.D_Min_Temp);

                dataPoint.voltageA = safeParseFloat(snapshot.A_Pack_Voltage_Value ?? snapshot.A_Pack_Voltage ?? snapshot.A_Voltage ?? snapshot.Pack_Voltage);
                dataPoint.voltageB = safeParseFloat(snapshot.B_Pack_Voltage_Value ?? snapshot.B_Pack_Voltage ?? snapshot.B_Voltage);
                dataPoint.voltageC = safeParseFloat(snapshot.C_Pack_Voltage_Value ?? snapshot.C_Pack_Voltage ?? snapshot.C_Voltage);
                dataPoint.voltageD = safeParseFloat(snapshot.D_Pack_Voltage_Value ?? snapshot.D_Pack_Voltage ?? snapshot.D_Voltage);

                dataPoint.currentA = safeParseFloat(snapshot.A_Pack_Current_Value ?? snapshot.A_Pack_Current ?? snapshot.A_Current ?? snapshot.Pack_Current);
                dataPoint.currentB = safeParseFloat(snapshot.B_Pack_Current_Value ?? snapshot.B_Pack_Current ?? snapshot.B_Current);
                dataPoint.currentC = safeParseFloat(snapshot.C_Pack_Current_Value ?? snapshot.C_Pack_Current ?? snapshot.C_Current);
                dataPoint.currentD = safeParseFloat(snapshot.D_Pack_Current_Value ?? snapshot.D_Pack_Current ?? snapshot.D_Current);
            }

            return dataPoint;
        });
    }, [alert, detectedMetrics, alertType]);

    // Calculate statistics (battery-specific for now) - MUST be called before early return
    const stats = useMemo(() => {
        if (!chartData || alertType !== 'BATTERY') return { dataPoints: chartData?.length || 0 };

        const temps = chartData.flatMap(d => [d.tempAMax, d.tempBMax, d.tempCMax, d.tempDMax]).filter(t => t !== undefined && t !== null && typeof t === 'number' && t > 0);
        const socs = chartData.flatMap(d => [d.socA, d.socB, d.socC, d.socD]).filter(s => s !== undefined && s !== null && typeof s === 'number' && s > 0);
        const voltages = chartData.flatMap(d => [d.voltageA, d.voltageB, d.voltageC, d.voltageD]).filter(v => v !== undefined && v !== null && typeof v === 'number' && v > 0);

        const safeMax = (arr) => arr.length > 0 ? Math.max(...arr) : 0;
        const safeMin = (arr) => arr.length > 0 ? Math.min(...arr) : 0;
        const safeAvg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "N/A";

        return {
            peakTemp: safeMax(temps),
            avgTemp: safeAvg(temps),
            avgSoc: safeAvg(socs),
            maxVoltage: safeMax(voltages),
            minVoltage: safeMin(voltages),
            dataPoints: chartData.length
        };
    }, [chartData, alertType]);

    // Early return check AFTER ALL hooks
    if (!alert) return null;

    // Format duration
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!chartData || chartData.length === 0) {
        return ReactDOM.createPortal(
            <div className="analytics-modal-overlay" onClick={onClose}>
                <div className="analytics-modal-content-empty" onClick={(e) => e.stopPropagation()}>
                    <div className="empty-header">
                        <FiAlertTriangle size={24} color="#f59e0b" />
                        <h3>{t('diagnosticModal.noTelemetryData')}</h3>
                        <button className="close-btn-empty" onClick={onClose}>
                            <FiX size={20} />
                        </button>
                    </div>
                    <div className="analytics-empty-state">
                        <FiActivity size={48} style={{ opacity: 0.3 }} />
                        <p>{t('diagnosticModal.noTelemetryMessage')}</p>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // Get severity for this alert (Use prop first, then fallback to calculation)
    const getSeverity = (type) => {
        if (alert.priority) return alert.priority.toLowerCase();

        if (!type) return 'medium';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('fire') || lowerType.includes('smoke') || lowerType.includes('collision')) return 'critical';
        if (lowerType.includes('brake') || lowerType.includes('steering') || lowerType.includes('overheat')) return 'high';
        if (lowerType.includes('battery') || lowerType.includes('soc') || lowerType.includes('temp')) return 'medium';
        return 'low';
    };

    const severity = getSeverity(alert.type || alert.title);
    const severityLabel = severity.toUpperCase();

    // Get recommendation based on alert type
    const getRecommendation = (type) => {
        if (!type) return t('diagnosticModal.recommendation_default', 'Monitor the vehicle and contact support if the issue persists.');
        const lowerType = type.toLowerCase();
        if (lowerType.includes('temp')) return t('diagnosticModal.recommendation_temp', 'Allow the battery pack to cool down. Avoid charging until temperature normalizes. Check cooling system.');
        if (lowerType.includes('soc')) return t('diagnosticModal.recommendation_soc', 'Plan for charging at the nearest available station. Reduce auxiliary power consumption.');
        if (lowerType.includes('brake')) return t('diagnosticModal.recommendation_brake', 'Immediate inspection required. Check brake pad wear and fluid levels.');
        if (lowerType.includes('voltage')) return t('diagnosticModal.recommendation_voltage', 'Check cell balance. May require battery pack diagnostics.');
        return t('diagnosticModal.recommendation_general', 'Monitor the vehicle telemetry and schedule maintenance if the issue persists.');
    };

    const recommendation = getRecommendation(alert.type || alert.title);

    // Render battery-specific charts (only show charts with actual data)
    const renderBatteryCharts = () => {
        // Check which data actually exists (allow 0 values)
        const hasSOC = chartData.some(d => (d.socA ?? d.socB ?? d.socC ?? d.socD) !== undefined && (d.socA ?? d.socB ?? d.socC ?? d.socD) !== null);
        const hasTemp = chartData.some(d => (d.tempAMax ?? d.tempBMax ?? d.tempCMax ?? d.tempDMax) !== undefined && (d.tempAMax ?? d.tempBMax ?? d.tempCMax ?? d.tempDMax) !== null);
        const hasVoltage = chartData.some(d => (d.voltageA ?? d.voltageB ?? d.voltageC ?? d.voltageD) !== undefined && (d.voltageA ?? d.voltageB ?? d.voltageC ?? d.voltageD) !== null);
        const hasCurrent = chartData.some(d => (d.currentA ?? d.currentB ?? d.currentC ?? d.currentD) !== undefined && (d.currentA ?? d.currentB ?? d.currentC ?? d.currentD) !== null);

        if (!hasSOC && !hasTemp && !hasVoltage && !hasCurrent) return null;

        return (
            <>
                {/* SOC Chart - only if data exists */}
                {hasSOC && (
                    <div className="chart-box">
                        <div className="chart-box-header">
                            <FiBattery size={16} strokeWidth={1} />
                            <span>{t('diagnosticModal.batterySOC')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="socGradientA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="socGradientB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="socGradientC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="socGradientD" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Area type="monotone" dataKey="socA" stroke="#10b981" fillOpacity={1} fill="url(#socGradientA)" name="Pack A (%)" />
                                <Area type="monotone" dataKey="socB" stroke="#3b82f6" fillOpacity={1} fill="url(#socGradientB)" name="Pack B (%)" />
                                <Area type="monotone" dataKey="socC" stroke="#8b5cf6" fillOpacity={1} fill="url(#socGradientC)" name="Pack C (%)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Temperature Chart - only if data exists */}
                {hasTemp && (
                    <div className="chart-box">
                        <div className="chart-box-header">
                            <FiThermometer size={16} strokeWidth={1} />
                            <span>{t('diagnosticModal.cellTemperature')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="tempAMax" stroke="#ef4444" strokeWidth={2} name="A Max (°C)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="tempAMin" stroke="#fca5a5" strokeWidth={2} name="A Min (°C)" dot={{ r: 2 }} strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="tempBMax" stroke="#f97316" strokeWidth={2} name="B Max (°C)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="tempBMin" stroke="#fdba74" strokeWidth={2} name="B Min (°C)" dot={{ r: 2 }} strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="tempCMax" stroke="#8b5cf6" strokeWidth={2} name="C Max (°C)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="tempCMin" stroke="#c4b5fd" strokeWidth={2} name="C Min (°C)" dot={{ r: 2 }} strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="tempDMax" stroke="#ec4899" strokeWidth={2} name="D Max (°C)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="tempDMin" stroke="#fbcfe8" strokeWidth={2} name="D Min (°C)" dot={{ r: 2 }} strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Voltage Chart - only if data exists */}
                {hasVoltage && (
                    <div className="chart-box">
                        <div className="chart-box-header">
                            <FiZap size={16} />
                            <span>{t('diagnosticModal.packVoltage')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="voltageA" stroke="#3b82f6" strokeWidth={2} name="Pack A (V)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="voltageB" stroke="#8b5cf6" strokeWidth={2} name="Pack B (V)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="voltageC" stroke="#10b981" strokeWidth={2} name="Pack C (V)" dot={{ r: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Current Chart - only if data exists */}
                {hasCurrent && (
                    <div className="chart-box">
                        <div className="chart-box-header">
                            <FiActivity size={16} />
                            <span>{t('diagnosticModal.packCurrent')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="currentA" stroke="#6366f1" strokeWidth={2} name="Pack A (A)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="currentB" stroke="#8b5cf6" strokeWidth={2} name="Pack B (A)" dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="currentC" stroke="#10b981" strokeWidth={2} name="Pack C (A)" dot={{ r: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </>
        );
    };

    // Render generic charts for any numeric metrics
    const renderGenericCharts = () => {
        // Take up to 4 most relevant metrics
        const metricsToPlot = detectedMetrics.slice(0, 4);

        if (metricsToPlot.length === 0) return (
            <div className="empty-chart-placeholder">
                <FiActivity size={24} color="#9ca3af" />
                <p>{t('diagnosticModal.noPlottableData', 'No numeric data available for visualization')}</p>
            </div>
        );

        return metricsToPlot.map((metric, idx) => (
            <div className="chart-box" key={metric}>
                <div className="chart-box-header">
                    <FiActivity size={16} />
                    <span>{formatMetricName(metric)}</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} width={30} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey={metric}
                            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                            strokeWidth={2}
                            name={formatMetricName(metric)}
                            dot={{ r: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        ));
    };

    return ReactDOM.createPortal(
        <div className="analytics-modal-overlay" onClick={onClose}>
            <div className="analytics-modal-content-receipt" onClick={(e) => e.stopPropagation()}>
                {/* Receipt Header */}
                <div className="receipt-header">
                    <div className="receipt-logo">
                        {alert.type?.toLowerCase().includes('soc') ?
                            <FiBattery size={32} color="#d97706" strokeWidth={1.5} /> :
                            <FiThermometer size={32} color="#ef4444" strokeWidth={1.5} />
                        }
                    </div>
                    <h2 className="receipt-title">{t('diagnosticModal.title')}</h2>
                    <p className="receipt-subtitle">{alert.title || alert.type}</p>
                    <span className={`receipt-severity-badge severity-${severity}`}>
                        {t(`diagnosticModal.${severity}Priority`, severityLabel)}
                    </span>
                    <button className="close-btn-receipt" onClick={onClose}>
                        <FiX size={22} />
                    </button>
                </div>

                {/* Receipt Divider */}
                <div className="receipt-divider"></div>

                {/* Receipt Details */}
                <div className="receipt-section">
                    <div className="receipt-row">
                        <span className="receipt-label">
                            <FiHash size={14} />
                            {t('diagnosticModal.vehicleId')}
                        </span>
                        <span className="receipt-value">{alert.device?.vrn || alert.vehicleId || 'N/A'}</span>
                    </div>
                    <div className="receipt-row">
                        <span className="receipt-label">
                            <FiHardDrive size={14} />
                            {t('diagnosticModal.deviceType')}
                        </span>
                        <span className="receipt-value">{alert.device_type_name || 'N/A'}</span>
                    </div>
                    <div className="receipt-row">
                        <span className="receipt-label">
                            <FiClock size={14} />
                            {t('diagnosticModal.started')}
                        </span>
                        <span className="receipt-value">{formatDate(alert.start_time)}</span>
                    </div>
                    <div className="receipt-row">
                        <span className="receipt-label">
                            <FiActivity size={14} />
                            {t('diagnosticModal.duration')}
                        </span>
                        <span className="receipt-value">{formatDuration(alert.duration_seconds || alert.duration || 0)}</span>
                    </div>
                    <div className="receipt-row">
                        <span className="receipt-label">
                            <FiInfo size={14} />
                            {t('diagnosticModal.status')}
                        </span>
                        <span className={`receipt-status ${alert.is_active ? 'active' : 'resolved'}`}>
                            {alert.is_active ? `● ${t('diagnosticModal.active')}` : `✓ ${t('diagnosticModal.resolved')}`}
                        </span>
                    </div>

                    {/* Recommendation Box */}
                    <div className="receipt-recommendation">
                        <div className="recommendation-label">
                            <FiAlertTriangle size={14} />
                            {t('diagnosticModal.recommendedAction')}
                        </div>
                        <p className="recommendation-text">{recommendation}</p>
                    </div>
                </div>

                <div className="receipt-divider"></div>

                {/* Telemetry Charts - Tiered Smart Detection */}
                {(() => {
                    if (alertType === 'NONE') return null;

                    // Fallback logic: Try to render battery charts, if null (no mapped data), render generic
                    const batteryContent = alertType === 'BATTERY' ? renderBatteryCharts() : null;
                    const finalContent = batteryContent || renderGenericCharts();

                    return (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="receipt-section">
                                <h3 className="receipt-section-title">
                                    <div className="section-title-content">
                                        <FiActivity size={18} className="section-icon-premium" />
                                        <span>{batteryContent ? t('diagnosticModal.liveTelemetry_simple') : t('diagnosticModal.performanceMetrics_simple')}</span>
                                    </div>
                                    <span className="snapshot-badge">
                                        {stats.dataPoints} {t('diagnosticModal.snapshots')}
                                    </span>
                                </h3>

                                <div className="charts-grid-receipt">
                                    {finalContent}
                                </div>
                            </div>
                        </>
                    );
                })()}

                {/* Summary Statistics - Only for Battery Alerts */}
                {(() => {
                    if (alertType !== 'BATTERY') return null;

                    // Updated stats usage to include C/D
                    return (
                        <>
                            <div className="receipt-divider"></div>
                            <div className="receipt-section">
                                <h3 className="receipt-section-title">{t('diagnosticModal.summaryStatistics')}</h3>
                                <div className="receipt-stats">
                                    <div className="receipt-stat">
                                        <span className="stat-label-receipt">{t('diagnosticModal.peakTemp')}</span>
                                        <span className="stat-value-receipt">{stats.peakTemp}°C</span>
                                    </div>
                                    <div className="receipt-stat">
                                        <span className="stat-label-receipt">{t('diagnosticModal.avgTemp')}</span>
                                        <span className="stat-value-receipt">{stats.avgTemp}°C</span>
                                    </div>
                                    <div className="receipt-stat">
                                        <span className="stat-label-receipt">{t('diagnosticModal.avgSOC')}</span>
                                        <span className="stat-value-receipt">{stats.avgSoc}%</span>
                                    </div>
                                    <div className="receipt-stat">
                                        <span className="stat-label-receipt">{t('diagnosticModal.voltageRange')}</span>
                                        <span className="stat-value-receipt">{stats.minVoltage}-{stats.maxVoltage}V</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}

                {/* Receipt Footer */}
                <div className="receipt-footer">
                    <p>────────────────</p>
                    <p className="receipt-footer-text">{t('diagnosticModal.endOfReport')}</p>
                    <p className="receipt-footer-text">{t('diagnosticModal.alertId')}: #{alert.id}</p>
                </div>
            </div>
        </div>
        , document.body);
};

AlertAnalyticsModal.propTypes = {
    alert: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        type: PropTypes.string,
        device: PropTypes.shape({
            vrn: PropTypes.string
        }),
        vehicleId: PropTypes.string,
        start_time: PropTypes.string,
        duration_seconds: PropTypes.number,
        duration: PropTypes.number,
        is_active: PropTypes.bool,
        device_type_name: PropTypes.string,
        req_data: PropTypes.arrayOf(PropTypes.object),
        priority: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired
};

export default AlertAnalyticsModal;
