// C:\Users\1000863\Documents\EKA-Connect-Front-End\src\Pages\Faults\FaultCard.jsx
import React, { useState } from 'react';
import { 
  Car, 
  Clock, 
  Activity, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle 
} from 'lucide-react';

const FaultCard = ({ fault, deviceVrn }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract data for readability
  const { 
    vehicle_type, 
    identifier, 
    details 
  } = fault.rule;
  
  const component = fault.component;
  const startTime = new Date(fault.start_time).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fault-card">
      <div className="card-header" onClick={() => setIsOpen(!isOpen)}>
        
        {/* Row 1: VRN and Time */}
        <div className="card-top-row">
          <div className="vrn-badge">
            <Car size={14} />
            {deviceVrn || fault.imei}
          </div>
          <div className="vrn-badge">
            {vehicle_type}
          </div>
          <div className="time-badge">
            <Clock size={12} />
            {startTime}
          </div>
        </div>

        {/* Row 2: Fault Name */}
        <div className="card-main-info">
          <div className="fault-name">{details["fault name"]}</div>
        </div>

        {/* Row 3: Meta Data */}
        <div className="fault-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} /> {component}
          </span>
          {isOpen ? <ChevronUp size={16} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto' }} />}
        </div>
      </div>

      {/* Expanded Body */}
      {isOpen && (
        <div className="card-body">
          <div className="detail-section">
            <span className="detail-label">Identifier</span>
            <div className="detail-text">{identifier}</div>
          </div>
          
          <div className="detail-section">
            <span className="detail-label">Description</span>
            <div className="detail-text">{details["fault description"]}</div>
          </div>

          <div className="detail-section">
            <span className="detail-label">Possible Causes</span>
            <div className="detail-text" style={{ whiteSpace: 'pre-line' }}>{details.cause}</div>
          </div>

          <div className="detail-section">
            <span className="detail-label">Remedy</span>
            <div className="detail-text" style={{ whiteSpace: 'pre-line' }}>{details.remedy}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultCard;