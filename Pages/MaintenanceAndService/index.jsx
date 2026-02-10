import React, { useState } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';

import { useTickets } from '../../hooks/useTickets';
import { TicketTable } from './components/TicketTable';
import { TicketForm } from './components/TicketForm';
import { TicketViewModal } from './components/TicketViewModal';
import './MaintenanceAndService.css';
import propTypes from 'prop-types';
import { useTranslation } from "react-i18next";

const LoadingSpinner = () => {
    const { t } = useTranslation(); 
    return (
        <p className="loading-message">
            {t("MaintenanceAndService.loading_tickets", "Loading tickets...")}
        </p>
    );
};

const ErrorDisplay = ({ message, onRetry }) => {
    const { t } = useTranslation(); 

    // If 'message' prop isn't provided, use the translated default.
    const displayMessage = message 
        ? message 
        : t("MaintenanceAndService.error_while_fetching", "An error occurred while fetching tickets.");

    return (
        <div className="error-message">
            <p>{displayMessage}</p> 
            <button className="ms-theme-btn ms-theme-btn-contained" onClick={onRetry} style={{width: 'auto'}}>
                {t("MaintenanceAndService.retry", "Retry")}
            </button>
        </div>
    )
};
function MaintenanceAndServicePage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewingTicket, setViewingTicket] = useState(null);
    const { tickets, isLoading, error, fetchTickets, addTicket } = useTickets();
    const { t } = useTranslation();

    return (
        <div className="maintenance-page-container">
            <Toaster position="top-right" />
            <div className="page-header">
                <h1>{t("MaintenanceAndService.maintenance_and_service", "Maintenance & Service")}</h1>
                {/* UPDATED: Changed className to apply the new theme styles */}
                <button className="ms-theme-btn ms-theme-btn-contained" onClick={() => setIsFormOpen(true)}>
                    <FiPlusCircle /> {t("MaintenanceAndService.raise_ticket", "Raise Ticket")}
                </button>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && !isLoading && <ErrorDisplay message={error} onRetry={fetchTickets} />}
            {!isLoading && !error && <TicketTable tickets={tickets} onViewClick={setViewingTicket} />}

            <TicketForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onAddTicket={addTicket}
            />

            <TicketViewModal
                ticket={viewingTicket}
                onClose={() => setViewingTicket(null)}
            />
        </div>
    );
}

MaintenanceAndServicePage.propTypes = {
    tickets: propTypes.array.isRequired,
    isLoading: propTypes.bool.isRequired,
    error: propTypes.string,
    fetchTickets: propTypes.func.isRequired,
    addTicket: propTypes.func.isRequired,
};
ErrorDisplay.propTypes = {
    message: propTypes.string.isRequired,
    onRetry: propTypes.func.isRequired,
};
ErrorDisplay.defaultProps = {
    onRetry: () => console.warn('Retry function not provided'),
};
    
export default MaintenanceAndServicePage;