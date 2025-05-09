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
                        }}
                    />
                </div>
            )}
        </CardWrapper>
    );
}
