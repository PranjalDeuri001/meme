import React, { useEffect } from 'react';
import propTypes from 'prop-types';

const FeedbackNotice = ({ message, type, onClear }) => {
    useEffect(() => {
        if (message && onClear) {
            const timer = setTimeout(() => {
                onClear();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message, onClear]);

    if (!message) return null;
    return <div className={`notice ${type}`}>{message}</div>;
};
FeedbackNotice.propTypes = {
    message: propTypes.string,
    type: propTypes.string,
    onClear: propTypes.func.isRequired,
};

export default React.memo(FeedbackNotice);