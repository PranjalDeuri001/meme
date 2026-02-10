import React from 'react';
import { FiEye } from 'react-icons/fi';
import propTypes from 'prop-types';
import { useTranslation } from "react-i18next";

export function TicketTable({ tickets, onViewClick }) {
    const { t } = useTranslation();
    return (
        <div className="ticket-table-container">
            <table className="ticket-table">
                <thead>
                    <tr>
                        <th>{t("MaintenanceAndService.vrn", "VRN")}</th>
                        <th>{t("MaintenanceAndService.vehicle_type", "Vehicle Type")}</th>
                        <th>{t("MaintenanceAndService.date", "Date")}</th>
                        <th>{t("MaintenanceAndService.priority", "Priority")}</th>
                        <th>{t("MaintenanceAndService.category", "Category")}</th>
                        <th>{t("MaintenanceAndService.problem", "Problem")}</th>
                        <th>{t("MaintenanceAndService.status", "Status")}</th>
                        <th>{t("MaintenanceAndService.view", "View")}</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="no-tickets-message">
                                {t("MaintenanceAndService.no_tickets_raised", "No tickets have been raised yet.")}
                            </td>
                        </tr>
                    ) : (
                        tickets.map((ticket) => (
                            <tr key={ticket.id}>
                                {/* ADDED: data-label attributes for responsive design */}
                                <td data-label="VRN">{ticket.vrn}</td>
                                <td data-label="Vehicle Type">{ticket.device_specific_type}</td>
                                <td data-label="Date">{ticket.scheduled_date}</td>
                                <td data-label="Priority">{ticket.priority}</td>
                                <td data-label="Category">{ticket.category}</td>
                                <td data-label="Problem" className="problem-description-cell">{ticket.description}</td>
                                <td data-label="Status">
                                    <span className={`status status-${ticket.status ? ticket.status.toLowerCase() : 'open'}`}>
                                        {ticket.status || 'Open'}
                                    </span>
                                </td>
                                <td data-label="View">
                                    <button
                                      className="view-btn"
                                      onClick={() => onViewClick(ticket)}
                                      aria-label={t("MaintenanceAndService.view_detail", "View details for ticket {{vrn}}", { vrn: ticket.vrn })}
                                    >
                                        <FiEye />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
TicketTable.propTypes = {
    tickets: propTypes.arrayOf(
        propTypes.shape({
            id: propTypes.string.isRequired,
            vrn: propTypes.string.isRequired,
            device_specific_type: propTypes.string.isRequired,
            scheduled_date: propTypes.string.isRequired,
            priority: propTypes.string.isRequired,
            category: propTypes.string.isRequired,
            description: propTypes.string.isRequired,
            status: propTypes.string,
        })
    ).isRequired,
    onViewClick: propTypes.func.isRequired,
};  
export default TicketTable;