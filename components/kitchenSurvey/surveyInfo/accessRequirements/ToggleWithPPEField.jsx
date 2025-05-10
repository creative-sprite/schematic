// components\kitchenSurvey\surveyInfo\accessRequirements\ToggleWithPPEField.jsx
import React from "react";
import { ToggleButton } from "primereact/togglebutton";
import { MultiSelect } from "primereact/multiselect";
import { InputTextarea } from "primereact/inputtextarea";
import CardWrapper from "./CardWrapper";

export default function ToggleWithPPEField({ item, access, setAccess }) {
    const handleToggleChange = (e) => {
        setAccess({
            ...access,
            [item.toggleField]: e.value ? "Yes" : "No",
        });
    };

    const handleMultiSelectChange = (e) => {
        setAccess({
            ...access,
            [item.multiSelectField]: e.value,
        });
    };

    const handleInputChange = (e) => {
        setAccess({
            ...access,
            [item.inputField]: e.target.value,
        });
    };

    // Check if toggle is set to "Yes"
    const isToggleEnabled = () => {
        return access[item.toggleField] === "Yes";
    };

    // Check if multi-select has selections
    const multiSelectHasData = () => {
        return (
            Array.isArray(access[item.multiSelectField]) &&
            access[item.multiSelectField].length > 0
        );
    };

    // Check if input field has data
    const inputHasData = () => {
        return (
            access[item.inputField] !== undefined &&
            access[item.inputField] !== null &&
            access[item.inputField] !== ""
        );
    };

    // Memoize the multi-select value to avoid passing a new array on every render.
    const multiSelectValue = React.useMemo(() => {
        return access[item.multiSelectField] !== undefined
            ? access[item.multiSelectField]
            : [];
    }, [access[item.multiSelectField]]);

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
                    <MultiSelect
                        value={multiSelectValue}
                        options={item.options}
                        onChange={handleMultiSelectChange}
                        placeholder={item.multiSelectPlaceholder}
                        style={{
                            width: "100%",
                            height: "40px",
                            border: multiSelectHasData()
                                ? "1px solid var(--primary-color)"
                                : "",
                        }}
                    />
                    <InputTextarea
                        value={access[item.inputField] ?? ""}
                        onChange={handleInputChange}
                        placeholder={item.inputPlaceholder}
                        autoResize
                        rows={1}
                        style={{
                            width: "100%",
                            overflow: "hidden",
                            minHeight: "40px",
                            marginTop: "10px",
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
