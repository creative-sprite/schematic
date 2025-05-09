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
                checked={access[item.toggleField] === "Yes"}
                onChange={handleToggleChange}
                onLabel="Yes"
                offLabel="No"
                style={{ width: "100%", height: "40px" }}
            />
        </CardWrapper>
    );
}
