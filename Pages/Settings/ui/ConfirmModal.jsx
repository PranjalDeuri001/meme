import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // 1. Import ReactDOM
import propTypes from 'prop-types';

const ConfirmModal = ({ open, title, message, confirmText = "Confirm", confirmType = "primary", onCancel, onConfirm, inputMatch }) => {
    const [inputValue, setInputValue] = useState("");
    
    useEffect(() => {
      if (open) setInputValue("");
    }, [open]);

    if (!open) return null;

    const isMatchRequired = inputMatch && inputValue !== inputMatch;

    // 2. Wrap the JSX in ReactDOM.createPortal
    return ReactDOM.createPortal(
        <div className="modal-backdrop">
            <div className="modal">
                <div className="modal-h">{title}</div>
                <div className="modal-b">
                    <p className="modal-msg">{message}</p>
                    {inputMatch && (
                        <div className="modal-field">
                            <label htmlFor="confirm-input">Type <b>{inputMatch}</b> to continue</label>
                            <input id="confirm-input" className="input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                    )}
                </div>
                <div className="modal-f">
                    <button className="btn ghost" onClick={onCancel}>Cancel</button>
                    <button className={`btn ${confirmType}`} disabled={isMatchRequired} onClick={onConfirm}>
                      {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-portal') // 3. Tell it where to render
    );
};
ConfirmModal.propTypes = {
    open: propTypes.bool.isRequired,
    title: propTypes.string.isRequired,
    message: propTypes.string.isRequired,
    confirmText: propTypes.string,
    confirmType: propTypes.string,
    onCancel: propTypes.func.isRequired,
    onConfirm: propTypes.func.isRequired,
    inputMatch: propTypes.string,
};


export default React.memo(ConfirmModal);