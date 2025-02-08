import React, { useEffect, useState } from 'react';
import '../styles/Modal.css';

const InfoModal = ({ show, onClose, title, children }) => {
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        if (show) {
            setScrollPosition(window.scrollY);
            document.body.style.setProperty('--scroll-position', `-${window.scrollY}px`);
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('--scroll-position');
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'instant'
                });
            }, 0);
        }
        
        return () => {
            if (show) {
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('--scroll-position');
                setTimeout(() => {
                    window.scrollTo({
                        top: scrollPosition,
                        behavior: 'instant'
                    });
                }, 0);
            }
        };
    }, [show, scrollPosition]);

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