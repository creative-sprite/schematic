// components\kitchenSurvey\surveyInfo\accessRequirements\ToggleWithWasteTankField.jsx
import React from "react";
import { ToggleButton } from "primereact/togglebutton";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import CardWrapper from "./CardWrapper";

export default function ToggleWithWasteTankField({ item, access, setAccess }) {
    const handleToggleChange = (e) => {
        setAccess({
            ...access,
            [item.toggleField]: e.value ? "Yes" : "No",
        });
    };

    const handleDropdownChange = (e) => {
        setAccess({
            ...access,
            [item.dropdownField]: e.value,
        });
    };

    const handleInputChange = (e) => {
        setAccess({
            ...access,
            [item.inputField]: e.target.value,
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
            {access[item.toggleField] === "Yes" && (
                <div style={{ marginTop: "10px" }}>
                    <Dropdown
                        value={access[item.dropdownField] ?? null}
                        options={item.options}
                        onChange={handleDropdownChange}
                        placeholder={item.dropdownPlaceholder}
                        style={{ height: "40px", width: "100%" }}
                    />
                    <InputText
                        value={access[item.inputField] ?? ""}
                        onChange={handleInputChange}
                        placeholder={item.inputPlaceholder}
                        style={{
                            height: "40px",
                            width: "100%",
                            marginTop: "10px",
                        }}
                    />
                </div>
            )}
        </CardWrapper>
    );
}
