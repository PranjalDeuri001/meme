import React from 'react';
import PropTypes from 'prop-types';
import {
    MdError,
    MdInbox,
    MdRefresh,
    MdEmail,
    MdWarning
} from 'react-icons/md';
import './StateDisplay.css';

/**
 * A professional, reusable component for displaying error and empty states
 * Matches EKA Connect theme with Material UI icons and proper dark mode support
 */
const StateDisplay = ({
    type = 'empty',
    title,
    message,
    icon: CustomIcon,
    onRetry,
    retryText = 'Try Again',
    showContactSupport = false,
    supportEmail = 'support@eka.com',
    className = '',
}) => {
    // Default icons based on type (Material UI icons)
    const DefaultIcon = type === 'error' ? MdError : MdInbox;
    const IconComponent = CustomIcon || DefaultIcon;

    // Default titles based on type
    const defaultTitle = type === 'error'
        ? 'Something went wrong'
        : 'No data available';

    return (
        <div className={`state-display state-display-${type} ${className}`}>
            <div className="state-display-content">
                <div className={`state-display-icon state-display-icon-${type}`}>
                    <IconComponent />
                </div>

                <h3 className="state-display-title">
                    {title || defaultTitle}
                </h3>

                {message && (
                    <p className="state-display-message">
                        {message}
                    </p>
                )}

                <div className="state-display-actions">
                    {onRetry && (
                        <button
                            type="button"
                            className="state-display-btn state-display-btn-primary"
                            onClick={onRetry}
                        >
                            <MdRefresh className="state-display-btn-icon" />
                            {retryText}
                        </button>
                    )}

                    {showContactSupport && (
                        <a
                            href={`mailto:${supportEmail}`}
                            className="state-display-btn state-display-btn-secondary"
                        >
                            <MdEmail className="state-display-btn-icon" />
                            Contact Support
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

StateDisplay.propTypes = {
    type: PropTypes.oneOf(['error', 'empty']),
    title: PropTypes.string,
    message: PropTypes.string,
    icon: PropTypes.elementType,
    onRetry: PropTypes.func,
    retryText: PropTypes.string,
    showContactSupport: PropTypes.bool,
    supportEmail: PropTypes.string,
    className: PropTypes.string,
};

export default StateDisplay;
