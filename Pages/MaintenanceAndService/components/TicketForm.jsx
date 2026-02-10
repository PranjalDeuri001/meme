import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import propTypes from 'prop-types';
import { useTranslation } from "react-i18next";

const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export function TicketForm({ isOpen, onClose, onAddTicket }) {
    const { t } = useTranslation();
    const initialState = {
        vehicleType: '',
        vrn: '',
        chassisNumber: '',
        date: getTodayString(),
        location: '',
        priority: 'Medium',
        category: '',
        problemDescription: '',
        odometer: '',
    };

    const [formData, setFormData] = useState(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onAddTicket(formData);
            toast.success(t("MaintenanceAndService.ticket_created", "Ticket created successfully!"));
            setFormData(initialState);
            onClose();
        } catch (error) { // FIXED: Removed the incorrect '=>' from the catch block
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{t("MaintenanceAndService.raise_new_ticket", "Raise a New Ticket")}</h2>
                    <button onClick={onClose} className="close-button"><FiX /></button>
                </div>
                <form onSubmit={handleSubmit} className="ticket-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.vehicle_type", "Vehicle Type")}</label>
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required>
                                <option value="" disabled>{t("MaintenanceAndService.select_type", "Select Type")}</option>
                                <option value="12m">12m</option>
                                <option value="9m">9m</option>
                                <option value="6s">6s</option>
                                <option value="3s">3s</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.vrn_num", "VRN Number")}</label>
                            <input type="text" name="vrn" value={formData.vrn} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.chassis_number", "Chassis Number")}</label>
                            <input type="text" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} placeholder="Optional" />
                        </div>
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.odometer", "Odometer Reading")}</label>
                            <input
                                type="number"
                                name="odometer"
                                value={formData.odometer}
                                onChange={handleChange}
                                placeholder="e.g., 12345.6"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.locations", "Location (City/Depot)")}</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.date", "Date")}</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} min={getTodayString()} required />
                        </div>
                    </div>

                    <div className="form-row">
                       <div className="form-group">
                            <label>{t("MaintenanceAndService.priority", "Priority")}</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} required>
                                <option value="Low">{t("MaintenanceAndService.low", "Low")}</option>
                                <option value="Medium">{t("MaintenanceAndService.medium", "Medium")}</option>
                                <option value="High">{t("MaintenanceAndService.high", "High")}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t("MaintenanceAndService.category", "Category")}</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="" disabled>{t("MaintenanceAndService.select_category", "Select Category")}</option>
                                <option value="Electrical">{t("MaintenanceAndService.electrical", "Electrical")}</option>
                                <option value="Mechanical">{t("MaintenanceAndService.mechanical", "Mechanical")}</option>
                                <option value="Body">{t("MaintenanceAndService.body", "Body")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t("MaintenanceAndService.problem_description", "Problem Description")}</label>
                        <textarea name="problemDescription" value={formData.problemDescription} onChange={handleChange} rows="4" required></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-cancel" onClick={onClose} disabled={isSubmitting}>{t("MaintenanceAndService.cancel", "Cancel")}</button>
                        <button type="submit" className="btn btn-create" disabled={isSubmitting}>
                            {isSubmitting ? t("MaintenanceAndService.creating", "Creating...") : t("MaintenanceAndService.create_ticket", "Create Ticket")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
TicketForm.propTypes = {
    isOpen: propTypes.bool.isRequired,
    onClose: propTypes.func.isRequired,
    onAddTicket: propTypes.func.isRequired,
};

