// components/kitchenSurvey/surveyInfo/primaryContactDetails/ContactCard.jsx
import React from "react";
import { Button } from "primereact/button";

export default function ContactCard({
    contact,
    isPrimarySelected,
    isWalkAroundSelected,
    onRemove,
    isSaving,
}) {
    let cardStyle = {
        padding: "1rem",
        margin: "0.5rem",
        borderRadius: "4px",
        textAlign: "center",
        position: "relative",
    };

    if (isPrimarySelected && isWalkAroundSelected) {
        cardStyle.borderTop = "2px solid rgba(0, 255, 0, 0.91)";
        cardStyle.borderLeft = "2px solid rgba(0, 255, 0, 0.91)";
        cardStyle.borderBottom = "2px solid rgba(0, 0, 255, 0.91)";
        cardStyle.borderRight = "2px solid rgba(0, 0, 255, 0.91)";
        cardStyle.boxShadow = "0 0 10px rgba(128, 128, 255, 0.5)";
    } else if (isPrimarySelected) {
        cardStyle.border = "2px solid rgba(0, 255, 0, 0.91)";
        cardStyle.boxShadow = "0 0 10px rgba(0, 255, 0, 0.91)";
    } else if (isWalkAroundSelected) {
        cardStyle.border = "2px solid rgba(0, 0, 255, 0.91)";
        cardStyle.boxShadow = "0 0 10px rgba(0, 0, 255, 0.91)";
    } else {
        cardStyle.border = "1px solid #ccc";
    }

    return (
        <div className="p-shadow-3" style={cardStyle}>
            <Button
                icon="pi pi-times"
                className="p-button-rounded p-button-text p-button-danger"
                style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    cursor: "pointer",
                    width: "20px",
                    height: "20px",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                disabled={isSaving}
            />
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                {contact.contactFirstName} {contact.contactLastName}
            </div>
            <div>{contact.email}</div>
            <div>{contact.position}</div>
            <div>{contact.number}</div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                {isPrimarySelected && (
                    <span style={{ color: "green", marginRight: "0.5rem" }}>
                        Primary
                    </span>
                )}
                {isWalkAroundSelected && (
                    <span style={{ color: "blue" }}>Walk Around</span>
                )}
            </div>
        </div>
    );
}
