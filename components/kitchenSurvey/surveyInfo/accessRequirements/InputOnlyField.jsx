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
                    }}
                />
            ) : (
                <InputText
                    type={item.inputType ? item.inputType : "text"}
                    value={access[item.inputField] ?? ""}
                    onChange={handleChange}
                    placeholder={item.inputPlaceholder}
                    style={{ height: "40px", width: "100%" }}
                />
            )}
        </CardWrapper>
    );
}
