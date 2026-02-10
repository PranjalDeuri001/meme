import React from 'react';
import { FiX } from "react-icons/fi";
import PropTypes from 'prop-types';
import { useTranslation} from "react-i18next";

export function TicketViewModal({ ticket, onClose }) {
    const { t } = useTranslation();
    if (!ticket) return null;
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t("MaintenanceAndService.ticket_details", "Ticket Details")}</h2>
                    <button onClick={onClose} className="close-button" aria-label="Close modal">
                        <FiX />
                    </button>
                </div>
                <div className="ticket-details-grid">
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.vrn", "VRN")}</span>
                        <span className="detail-value">{ticket.vrn || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.vehicle_type", "Vehicle Type")}</span>
                        <span className="detail-value">{ticket.device_specific_type || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.chassis_number", "Chassis Number")}</span>
                        <span className="detail-value">{ticket.chassis_number || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.scheduled_date", "Scheduled Date")}</span>
                        <span className="detail-value">{ticket.scheduled_date || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.location", "Location")}</span>
                        <span className="detail-value">{ticket.location || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.priority", "Priority")}</span>
                        <span className="detail-value">{ticket.priority || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.category", "Category")}</span>
                        <span className="detail-value">{ticket.category || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{t("MaintenanceAndService.status", "Status")}</span>
                        <span className="detail-value">{ticket.status || 'Open'}</span>
                    </div>
                    <div className="detail-item full-width">
                        <span className="detail-label">{t("MaintenanceAndService.problem_description", "Problem Description")}</span>
                        <span className="detail-value">{ticket.description || t("MaintenanceAndService.no_description_provided", "No description provided.")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
TicketViewModal.propTypes = {
    ticket: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};  
export default TicketViewModal;