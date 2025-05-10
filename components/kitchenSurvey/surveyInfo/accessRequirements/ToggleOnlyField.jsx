// components\kitchenSurvey\surveyInfo\accessRequirements\ToggleOnlyField.jsx
import React from "react";
import { ToggleButton } from "primereact/togglebutton";
import CardWrapper from "./CardWrapper";

export default function ToggleOnlyField({ item, access, setAccess }) {
    const handleToggleChange = (e) => {
        setAccess({
            ...access,
            [item.toggleField]: e.value ? "Yes" : "No",
        });
    };

    // Check if toggle is set to "Yes"
    const isToggleEnabled = () => {
        return access[item.toggleField] === "Yes";
    };

    return (
        <CardWrapper>
            <label
                style={{
                    marginBottom: "10px",
                    width: "100%",
                    textAlign: "left",
                }}
            >
                {item.label}
            </label>
            <ToggleButton
                checked={isToggleEnabled()}
                onChange={handleToggleChange}
                onLabel="Yes"
                offLabel="No"
                style={{
                    width: "100%",
                    height: "40px",
                    border: isToggleEnabled()
                        ? "1px solid var(--primary-color)"
                        : "",
                }}
            />
        </CardWrapper>
    );
}
