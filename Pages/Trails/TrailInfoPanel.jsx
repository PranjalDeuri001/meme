// src/components/Trails/TrailInfoPanel.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types'; // Added for type safety
import './TrailInfoPanel.css'; 
import { registerCircularRange } from '../../utils/CircularRange';

// --- Icons ---
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SpeedIcon from '@mui/icons-material/Speed';
import ExploreIcon from '@mui/icons-material/Explore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import EvStationIcon from '@mui/icons-material/EvStation';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import RouteIcon from '@mui/icons-material/Route';

// Register the custom element once
registerCircularRange();

// Sub-component: Odometer Display
const Odometer = ({ value }) => {
    const formattedValue = Number(value || 0).toFixed(1);
    return (
        <div className="odometer">
            <span className="odo-value">{formattedValue}</span>
            <span className="odo-label">KM</span>
        </div>
    );
};

Odometer.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const TrailInfoPanel = ({ data, vehicleType, tripSummary, onStopClick }) => { 
    const [activeTab, setActiveTab] = useState('live'); 
    
    // Safety check: ensure data is not undefined
    const safeData = data || {};

    const processedData = useMemo(() => {
        const rawTime = safeData.time || "00:00:00";
        const current = parseFloat(safeData.batteryCurrent) || 0;
        const motorSpeed = parseInt(safeData.motorSpeed) || 0;
        const soc = parseInt(safeData.soc) || 0;
        const speed = parseFloat(safeData.speed) || 0;
        const odo = parseFloat(safeData.totalDistance) || 0;
        const torque = parseInt(safeData.motorTorque) || 0;
        const heading = parseFloat(safeData.heading) || 0;
        const acc = parseInt(safeData.accPedal) || 0;
        const brk = parseInt(safeData.brakePedal) || 0;
        const faults = parseInt(safeData.fault_counts) || 0;

        let packCurrent = current;
        // Business Logic: Scale current for specific vehicle types
        if (vehicleType === '3S' || vehicleType === '6S') {
            packCurrent = current / 1000;
        }

        let powerStatus = "READY";
        let powerStatusClass = "status-ready";
        
        if (packCurrent > 0) {
            powerStatus = "REGEN";
            powerStatusClass = "status-regen";
        } else if (packCurrent < 0) {
            powerStatus = "POWER";
            powerStatusClass = "status-power";
        }

        return {
            time: rawTime,
            speed: speed.toFixed(0),
            soc,
            odometer: odo.toFixed(1),
            rpm: Math.abs(Math.round(motorSpeed)),
            torque,
            heading: heading.toFixed(1),
            powerStatus,
            powerStatusClass,
            packCurrent: packCurrent.toFixed(1) + ' A',
            accelerator: acc,
            brake: brk,
            faults,
        };
    }, [safeData, vehicleType]); 

    return (
        <div className="dashboard-container">
            {/* 1. Tab Switcher Header */}
            <div className="panel-header">
                <div className="tab-switcher" role="tablist">
                    <button 
                        role="tab"
                        aria-selected={activeTab === 'live'}
                        aria-controls="panel-live"
                        id="tab-live"
                        className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
                        onClick={() => setActiveTab('live')}
                    >
                        Track Route
                    </button>
                    <button 
                        role="tab"
                        aria-selected={activeTab === 'details'}
                        aria-controls="panel-details"
                        id="tab-details"
                        className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Trip Details
                    </button>
                </div>
            </div>

            {/* 2. LIVE DASHBOARD VIEW */}
            {activeTab === 'live' && (
                <div 
                    id="panel-live" 
                    role="tabpanel" 
                    aria-labelledby="tab-live"
                    className="live-view-wrapper fade-in"
                >
                    <div className="time-display">{processedData.time}</div>

                    <div className="soc-display-container">
                        <div className="soc-percentage">{processedData.soc}%</div>
                        <div className="soc-bar-container">
                            <div className="soc-bar" style={{ '--soc-percent': `${processedData.soc}%` }}>
                                <div className="soc-bar-indicator"></div>
                            </div>
                        </div>
                    </div>

                    <div className="main-grid">
                        <div className="gauge-container accelerator-container">
                            <label id="accelerator-arc-label" className="circular-range-label">
                                Accelerator
                                <circular-range
                                    className="accelerator-arc left-arc"
                                    aria-labelledby="accelerator-arc-label"
                                    value={processedData.accelerator}
                                    min="0" max="100" suffix="%"
                                    step="1" start="180" end="360" indices="11" reverse
                                ></circular-range>
                            </label>
                        </div>

                        <div className="speed-display">
                            <div id="power-status-text" className={processedData.powerStatusClass}>{processedData.powerStatus}</div>
                            <div id="pack-current-value" className={processedData.powerStatusClass}>{processedData.packCurrent}</div>
                            <div className="speed-number">{processedData.speed}</div>
                            <div className="speed-unit">KMPH</div>
                        </div>

                        <div className="gauge-container brake-container">
                            <label id="brake-arc-label" className="circular-range-label">
                                BRK
                                <circular-range
                                    className="brake-arc right-arc"
                                    aria-labelledby="brake-arc-label"
                                    value={processedData.brake}
                                    min="0" max="100" suffix="%"
                                    step="1" start="0" end="180" indices="11"
                                ></circular-range>
                            </label>
                        </div>
                    </div>

                    <div className="odometer-container">
                        <Odometer value={processedData.odometer} /> 
                        <div className="odometer-label">Odometer</div>
                    </div>

                    <div className="bottom-stats">
                        <div className="stat-item torque-stat">
                            <div className="stat-icon"><AutorenewIcon /></div>
                            <div className="stat-content">
                                <div className="stat-value">{processedData.torque} Nm</div>
                                <div className="stat-label">Motor Torque</div>
                            </div>
                        </div>
                        <div className="stat-item rpm-stat">
                            <div className="stat-icon"><SpeedIcon /></div>
                            <div className="stat-content">
                                <div className="stat-value">{processedData.rpm}</div>
                                <div className="stat-label">Motor RPM</div>
                            </div>
                        </div>
                        <div className="stat-item heading-stat">
                            <div className="stat-icon heading-icon"><ExploreIcon /></div>
                            <div className="stat-content">
                                <div className="stat-value">{processedData.heading}°</div>
                                <div className="stat-label">Heading</div>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className={`faults-display ${processedData.faults > 0 ? 'active' : ''}`}>
                            <span className="fault-icon">!</span>
                            <span className="fault-value">{processedData.faults} Faults</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. TRIP DETAILS VIEW */}
            {activeTab === 'details' && (
                <div 
                    id="panel-details" 
                    role="tabpanel" 
                    aria-labelledby="tab-details"
                    className="details-view-wrapper fade-in"
                >
                    <div className="details-card journey-summary">
                        <h3 className="details-title">Journey Overview</h3>
                        <div className="journey-timeline-row">
                            <div className="timeline-node">
                                <span className="node-label">Start</span>
                                <span className="node-time">{tripSummary?.startTime || "--:--"}</span>
                                <div className="node-stats">
                                    <span className="pill pill-soc"><BatteryStdIcon fontSize="inherit"/> {tripSummary?.startSoC || 0}%</span>
                                </div>
                            </div>
                            
                            {/* --- CENTER STATS CONTAINER --- */}
                            <div className="timeline-stats-container">
                                <div className="stat-primary-group">
                                    <div className="stat-value-large">
                                        <RouteIcon fontSize="small" style={{marginRight: 4, opacity: 0.7}}/>
                                        {tripSummary?.totalDistance || 0} <span className="unit">km</span>
                                    </div>
                                    <div className="stat-label-small">Total Dist.</div>
                                </div>
                                <div className="connector-line"></div>
                                
                                <div className="stat-secondary-row">
                                    <div className="stat-box">
                                         <div className="stat-label-tiny">Avg</div>
                                         <div className="stat-val-tiny">{tripSummary?.avgSpeed || 0} <small>km/h</small></div>
                                    </div>
                                    <div className="vertical-divider"></div>
                                    <div className="stat-box">
                                         <div className="stat-label-tiny">Max</div>
                                         <div className="stat-val-tiny">{tripSummary?.maxSpeed || 0} <small>km/h</small></div>
                                    </div>
                                </div>
                            </div>

                            <div className="timeline-node">
                                <span className="node-label">End</span>
                                <span className="node-time">{tripSummary?.endTime || "--:--"}</span>
                                <div className="node-stats">
                                    <span className="pill pill-soc"><BatteryStdIcon fontSize="inherit"/> {tripSummary?.endSoC || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stops-list-container">
                        <h3 className="details-title" style={{padding: '8px 10px', marginBottom: '5px'}}>
                            Stoppages & Charging
                            <span className="stops-count">{tripSummary?.stops?.length || 0}</span>
                        </h3>
                        <div className="stops-scroll-area">
                            {tripSummary?.stops && tripSummary.stops.length > 0 ? (
                                tripSummary.stops.map((stop, index) => (
                                    <div 
                                        key={index}
                                        onClick={() => onStopClick && onStopClick(stop)}
                                        className={`stop-item clickable-stop ${stop.type === 'Charging' ? 'charging-stop' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                onStopClick && onStopClick(stop);
                                            }
                                        }}
                                    >
                                        <div className="stop-icon" style={stop.type === 'Charging' ? { color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)' } : {}}>
                                            {stop.type === 'Charging' ? <EvStationIcon fontSize="small"/> : <LocationOnIcon fontSize="small"/>}
                                        </div>
                                        <div className="stop-info-row">
                                            <div className="stop-main">
                                                <div className="stop-time"><AccessTimeIcon fontSize="inherit" style={{marginRight: 4}}/> {stop.startTime}</div>
                                                <div className="stop-meta">
                                                    <span className="meta-item"><TimerIcon fontSize="inherit" style={{marginRight: 2}}/> {stop.durationMinutes} min</span>
                                                </div>
                                            </div>
                                            {stop.type === 'Charging' && <div className="charge-gain">+{stop.socAdded}%</div>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-stops"><p>No major stoppages detected.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PropTypes Validation for Production Safety ---
TrailInfoPanel.propTypes = {
    data: PropTypes.shape({
        time: PropTypes.string,
        batteryCurrent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        motorSpeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        soc: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        speed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        totalDistance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        motorTorque: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        heading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        accPedal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        brakePedal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        fault_counts: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    vehicleType: PropTypes.string,
    onStopClick: PropTypes.func,
    tripSummary: PropTypes.shape({
        startTime: PropTypes.string,
        endTime: PropTypes.string,
        startSoC: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        endSoC: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        totalDistance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        avgSpeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        maxSpeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        stops: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string,
            startTime: PropTypes.string,
            durationMinutes: PropTypes.number,
            socAdded: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            lat: PropTypes.number,
            lng: PropTypes.number
        }))
    })
};

export default TrailInfoPanel;