import React from 'react';
import '../styles/Modal.css';

const InfoModal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h5 className="modal-title fat-text">{title}</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default InfoModal; 