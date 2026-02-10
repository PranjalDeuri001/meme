import React from 'react';
import ReactDOM from 'react-dom'; // 1. Import ReactDOM
import propTypes from 'prop-types';

const predefinedAvatars = [
  { id: '1', url: 'https://placehold.co/96x96/60a5fa/ffffff?text=AV1' },
  { id: '2', url: 'https://placehold.co/96x96/f87171/ffffff?text=AV2' },
  { id: '3', url: 'https://placehold.co/96x96/4ade80/ffffff?text=AV3' },
  { id: '4', url: 'https://placehold.co/96x96/fbbf24/ffffff?text=AV4' },
  { id: '5', url: 'https://placehold.co/96x96/c084fc/ffffff?text=AV5' },
  { id: '6', url: 'https://placehold.co/96x96/34d399/ffffff?text=AV6' },
];

const AvatarModal = ({ open, onSelect, onClose }) => {
    if (!open) return null;

    // 2. Wrap the JSX in ReactDOM.createPortal
    return ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '420px'}}>
                <div className="modal-h">Choose an Avatar</div>
                <div className="modal-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {predefinedAvatars.map((avatar) => (
                        <img 
                            key={avatar.id}
                            src={avatar.url}
                            alt={`Avatar ${avatar.id}`}
                            onClick={() => onSelect(avatar)}
                            style={{ width: '80px', height: '80px', borderRadius: '50%', cursor: 'pointer' }}
                        />
                    ))}
                </div>
            </div>
        </div>,
        document.getElementById('modal-portal') // 3. Tell it where to render
    );
};
AvatarModal.propTypes = {
    open: propTypes.bool.isRequired,
    onSelect: propTypes.func.isRequired,
    onClose: propTypes.func.isRequired,
};


export default React.memo(AvatarModal);