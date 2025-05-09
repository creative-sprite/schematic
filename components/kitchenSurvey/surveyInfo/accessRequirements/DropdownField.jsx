// components\kitchenSurvey\surveyInfo\accessRequirements\DropdownField.jsx
import React from "react";
import { Dropdown } from "primereact/dropdown";
import CardWrapper from "./CardWrapper";

export default function DropdownField({ item, access, setAccess }) {
    const handleChange = (e) => {
        setAccess({
            ...access,
            [item.field]: e.value,
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
            <Dropdown
                value={access[item.field] ?? null}
                options={item.options}
                onChange={handleChange}
                placeholder={item.placeholder}
                style={{ height: "40px", width: "100%" }}
            />
        </CardWrapper>
    );
}
