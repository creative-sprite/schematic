// components\kitchenSurvey\surveyInfo\accessRequirements\CardWrapper.jsx
import React from "react";

const cardStyle = {
    border: "1px solid #ccc",
    padding: "20px",
    margin: "0.25rem",
    boxSizing: "border-box",
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
};

export default function CardWrapper({ children }) {
    return <div style={cardStyle}>{children}</div>;
}
