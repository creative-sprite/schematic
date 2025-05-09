// components\Modal.jsx

"use client";

import React from "react";
import "../styles/database.css"; // Reuse database CSS for modal styling

export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-button" onClick={onClose}>
                    Close
                </button>
                {children}
            </div>
        </div>
    );
}
