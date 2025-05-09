// components\database\products\customFields\CustomFieldCreator.jsx

import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Chip } from "primereact/chip";
import { useCustomFields } from "../hooks/useCustomFields";
import { Tooltip } from "primereact/tooltip";

/**
 * Component for creating new custom fields with various types and options
 *
 * @param {Object} props - Component props
 * @param {Function} props.onFieldCreated - Callback when a field is successfully created
 * @returns {JSX.Element} Custom field creation interface
 */
const CustomFieldCreator = ({ onFieldCreated }) => {
    // Use custom hook for field operations
    const { createCustomField, loading, error } = useCustomFields();

    // Field creation state
    const [currentField, setCurrentField] = useState(null);
    const [optionInput, setOptionInput] = useState("");

    // Available field types
    const fieldTypeOptions = [
        { label: "Text Input", value: "text" },
        { label: "Number Input", value: "number" },
        { label: "Dropdown Select", value: "dropdown" },
        { label: "Radio Buttons", value: "radio" },
        { label: "Checkboxes", value: "checkbox" },
        { label: "Date Picker", value: "date" },
        { label: "File Upload", value: "file" },
        { label: "URL Input", value: "url" },
    ];

    // Field types that require options
    const optionsFieldTypes = ["dropdown", "radio", "checkbox", "select"];

    // Initialize a new field of the selected type
    const handleAddField = (fieldType) => {
        const newField = {
            id: new Date().getTime().toString(),
            label: "", // Empty label by default
            fieldType,
            order: 0,
        };

        // Add specific properties for field types that need them
        if (fieldType === "number") {
            newField.prefix = "";
            newField.suffix = "";
        }

        if (optionsFieldTypes.includes(fieldType)) {
            newField.options = [];
        }

        setCurrentField(newField);
    };

    // Update a property of the current field
    const updateField = (property, value) => {
        if (!currentField) return;
        setCurrentField({ ...currentField, [property]: value });
    };

    // Handle adding an option to fields that need options
    const handleAddOption = () => {
        if (!optionInput.trim() || !currentField) return;

        // Initialize options array if it doesn't exist
        const currentOptions = currentField.options || [];

        // Add the new option
        const updatedOptions = [...currentOptions, optionInput.trim()];

        // Update the field with new options
        updateField("options", updatedOptions);

        // Clear input field
        setOptionInput("");
    };

    // Remove an option from the current field
    const handleRemoveOption = (optionToRemove) => {
        if (!currentField) return;

        const currentOptions = currentField.options || [];
        const updatedOptions = currentOptions.filter(
            (option) => option !== optionToRemove
        );

        updateField("options", updatedOptions);
    };

    // Handle pressing Enter on option input
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddOption();
        }
    };

    // Save the custom field
    const handleSaveField = async () => {
        if (!currentField) {
            return;
        }

        // Validate label
        if (!currentField.label.trim()) {
            return;
        }

        // Validate options for field types that need them
        if (
            optionsFieldTypes.includes(currentField.fieldType) &&
            (!currentField.options || currentField.options.length === 0)
        ) {
            return;
        }

        try {
            // Call the hook function to save the field
            const savedField = await createCustomField(currentField);

            // Clear the current field
            setCurrentField(null);

            // Call the callback
            if (onFieldCreated) {
                onFieldCreated(savedField);
            }

            // No alert - removed
        } catch (error) {
            console.error("Error saving custom field:", error);
        }
    };

    return (
        <div>
            {/* Display any errors */}
            {error && (
                <div
                    className="p-message p-message-error"
                    style={{ marginBottom: "1rem" }}
                >
                    <div className="p-message-text">{error}</div>
                </div>
            )}

            {/* Field Type Selection */}
            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ minWidth: "250px", flex: 1 }}>
                    {/* Title with Info Icon */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "10px",
                            fontWeight: "bold",
                        }}
                    >
                        <span>Input Type</span>
                        <i
                            className="pi pi-info-circle"
                            style={{
                                marginLeft: "8px",
                                color: "#007ad9",
                                cursor: "help",
                            }}
                            data-pr-tooltip="Select an input type you would like to create from the dropdown below"
                            data-pr-position="right"
                            data-pr-at="right+5 top"
                            data-pr-my="left center"
                        />
                        <Tooltip target=".pi-info-circle" />
                    </div>
                    <Dropdown
                        id="field-type"
                        value={currentField?.fieldType}
                        options={fieldTypeOptions}
                        onChange={(e) => handleAddField(e.value)}
                        placeholder="What input type do you need?"
                        style={{ width: "100%" }}
                        optionLabel="label"
                        optionValue="value"
                    />
                </div>

                {currentField && (
                    <div style={{ minWidth: "250px", flex: 1 }}>
                        <label
                            htmlFor="field-label"
                            style={{
                                display: "block",
                                marginBottom: "0.6rem",
                            }}
                        >
                            <strong>Label</strong>
                        </label>
                        <InputText
                            id="field-label"
                            value={currentField.label || ""}
                            onChange={(e) =>
                                updateField("label", e.target.value)
                            }
                            placeholder="What do you want to call your input? e.g. Price / Length etc"
                            style={{ width: "100%" }}
                        />
                    </div>
                )}

                {/* Number field specific inputs */}
                {currentField && currentField.fieldType === "number" && (
                    <>
                        <div style={{ minWidth: "150px" }}>
                            <label
                                htmlFor="field-prefix"
                                style={{
                                    display: "block",
                                    marginBottom: "0.6rem",
                                }}
                            >
                                <strong>Prefix e.g. £</strong>
                            </label>
                            <InputText
                                id="field-prefix"
                                value={currentField.prefix || ""}
                                onChange={(e) =>
                                    updateField("prefix", e.target.value)
                                }
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div style={{ minWidth: "150px" }}>
                            <label
                                htmlFor="field-suffix"
                                style={{
                                    display: "block",
                                    marginBottom: "0.6rem",
                                }}
                            >
                                <strong>Suffix e.g. kg, m</strong>
                            </label>
                            <InputText
                                id="field-suffix"
                                value={currentField.suffix || ""}
                                onChange={(e) =>
                                    updateField("suffix", e.target.value)
                                }
                                style={{ width: "100%" }}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Options section for fields that need them */}
            {currentField &&
                optionsFieldTypes.includes(currentField.fieldType) && (
                    <div style={{ marginTop: "1.5rem" }}>
                        <h3>Options</h3>

                        {/* Current options */}
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                                minHeight: "2rem",
                            }}
                        >
                            {currentField.options &&
                            currentField.options.length > 0 ? (
                                currentField.options.map((option, index) => (
                                    <Chip
                                        key={index}
                                        label={option}
                                        removable
                                        onRemove={() =>
                                            handleRemoveOption(option)
                                        }
                                    />
                                ))
                            ) : (
                                <span style={{ color: "#6c757d" }}>
                                    Option/s will display here when you create
                                    them
                                </span>
                            )}
                        </div>

                        {/* Add new option */}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <InputText
                                value={optionInput}
                                onChange={(e) => setOptionInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add an option..."
                                style={{ flex: 1 }}
                            />
                            <Button
                                label="Add Option"
                                icon="pi pi-plus"
                                onClick={handleAddOption}
                                disabled={!optionInput.trim()}
                            />
                        </div>
                        <small
                            style={{
                                color: "#6c757d",
                                display: "block",
                                marginTop: "0.5rem",
                            }}
                        >
                            Press Enter to add options quickly
                        </small>
                    </div>
                )}

            {/* Save button */}
            <div style={{ marginTop: "1.5rem" }}>
                <Button
                    label="Save Custom Field"
                    onClick={handleSaveField}
                    disabled={!currentField || !currentField.label || loading}
                    className="p-button-success"
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default CustomFieldCreator;
