// components\database\clients\editDeleteParts\MultiEntryInput.jsx
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";

/**
 * Component for handling multiple entries (emails, phone numbers, etc.)
 * Displays a text input with an add button and shows existing entries as chips
 */
const MultiEntryInput = ({
    value = [],
    onChange,
    placeholder = "Enter value",
    label = "Entry",
    keyField = "entry",
}) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (!inputValue.trim()) return;

        const newValue = [...value];
        if (!newValue.includes(inputValue.trim())) {
            newValue.push(inputValue.trim());
            onChange(newValue);
        }
        setInputValue("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (index) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    return (
        <div className="multi-entry-input">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                }}
            >
                <InputText
                    id={keyField}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={handleKeyDown}
                    style={{
                        flexGrow: 1,
                        marginRight: "0.5rem",
                        height: "40px",
                    }}
                />
                <Button
                    icon="pi pi-plus"
                    onClick={handleAdd}
                    style={{
                        height: "40px",
                        width: "40px",
                    }}
                />
            </div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                }}
            >
                {value.map((item, index) => (
                    <Chip
                        key={index}
                        label={item}
                        removable
                        onRemove={() => handleRemove(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MultiEntryInput;
