// components\kitchenSurvey\surveyInfo\accessRequirements\InputOnlyField.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import CardWrapper from "./CardWrapper";

export default function InputOnlyField({ item, access, setAccess }) {
    const handleChange = (e) => {
        setAccess({
            ...access,
            [item.inputField]: e.target.value,
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
            {item.multiline ? (
                <InputTextarea
                    value={access[item.inputField] ?? ""}
                    onChange={handleChange}
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
            ) : (
                <InputText
                    type={item.inputType ? item.inputType : "text"}
                    value={access[item.inputField] ?? ""}
                    onChange={handleChange}
                    placeholder={item.inputPlaceholder}
                    style={{
                        height: "40px",
                        width: "100%",
                        border: inputHasData()
                            ? "1px solid var(--primary-color)"
                            : "",
                    }}
                />
            )}
        </CardWrapper>
    );
}
