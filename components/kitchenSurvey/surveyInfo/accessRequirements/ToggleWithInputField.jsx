// components\kitchenSurvey\surveyInfo\accessRequirements\ToggleWithInputField.jsx
import React from "react";
import { ToggleButton } from "primereact/togglebutton";
import { InputTextarea } from "primereact/inputtextarea";
import CardWrapper from "./CardWrapper";

export default function ToggleWithInputField({ item, access, setAccess }) {
    const handleToggleChange = (e) => {
        setAccess({
            ...access,
            [item.toggleField]: e.value ? "Yes" : "No",
        });
    };

    // Check if the input field has data
    const inputHasData = () => {
        return (
            access[item.inputField] !== undefined &&
            access[item.inputField] !== null &&
            access[item.inputField] !== ""
        );
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
            {isToggleEnabled() && (
                <div style={{ marginTop: "10px" }}>
                    <InputTextarea
                        value={access[item.inputField] ?? ""}
                        onChange={(e) =>
                            setAccess({
                                ...access,
                                [item.inputField]: e.target.value,
                            })
                        }
                        placeholder={item.inputPlaceholder}
                        autoResize
                        rows={1}
                        style={{
                            width: "100%",
                            overflow: "hidden",
                            minHeight: "40px",
                            border: inputHasData()
                                ? "1px solid var(--primary-color)"
                                : "",
                        }}
                    />
                </div>
            )}
        </CardWrapper>
    );
}
