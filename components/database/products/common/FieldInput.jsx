// components\database\products\common\FieldInput.jsx

import React from "react";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";

/**
 * A component that renders different form inputs based on field type
 *
 * @param {Object} field - The field configuration object
 * @param {any} value - The current value of the field
 * @param {Function} onChange - Function to call when value changes
 * @param {Array} suppliers - Optional array of suppliers for supplier fields
 * @returns {JSX.Element} The rendered input component
 */
const FieldInput = ({ field, value, onChange, suppliers = [] }) => {
    // For debugging missing options
    if (
        field.fieldType === "dropdown" ||
        field.fieldType === "radio" ||
        field.fieldType === "checkbox"
    ) {
        if (!field.options || field.options.length === 0) {
            console.log(`Field ${field.label} has no options:`, field);
        }
    }

    // Text, URL, and Date fields
    if (
        field.fieldType === "text" ||
        field.fieldType === "url" ||
        field.fieldType === "date"
    ) {
        return (
            <InputText
                value={value || ""}
                onChange={(e) =>
                    onChange && onChange(field.label, e.target.value)
                }
                placeholder={field.label}
                type={field.fieldType === "date" ? "date" : "text"}
                style={{ width: "100%", boxSizing: "border-box" }}
            />
        );
    }

    // Number field with optional prefix/suffix
    if (field.fieldType === "number") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                {field.prefix && (
                    <span style={{ marginRight: "0.25rem" }}>
                        {field.prefix}
                    </span>
                )}
                <InputText
                    value={value || ""}
                    onChange={(e) =>
                        onChange && onChange(field.label, e.target.value)
                    }
                    placeholder={field.label}
                    style={{ flex: 1, width: "100%", boxSizing: "border-box" }}
                    type="number"
                />
                {field.suffix && (
                    <span style={{ marginLeft: "0.25rem" }}>
                        {field.suffix}
                    </span>
                )}
            </div>
        );
    }

    // Dropdown/Select field
    if (field.fieldType === "dropdown" || field.fieldType === "select") {
        // Ensure options is an array
        const options = Array.isArray(field.options) ? field.options : [];

        // Convert options to the format needed by Dropdown
        const selectOptions = options.map((option) => ({
            label: option,
            value: option,
        }));

        return (
            <Dropdown
                value={value || ""}
                options={selectOptions}
                onChange={(e) => onChange && onChange(field.label, e.value)}
                placeholder={`Select ${field.label}`}
                style={{ width: "100%", boxSizing: "border-box" }}
                filter={options.length > 10} // Add filtering for long lists
            />
        );
    }

    // Radio buttons
    if (field.fieldType === "radio") {
        // Ensure options is an array
        const options = Array.isArray(field.options) ? field.options : [];

        return (
            <div
                className="field-radiobutton-wrapper"
                style={{ width: "100%" }}
            >
                {options.length === 0 ? (
                    <div style={{ color: "#6c757d" }}>No options available</div>
                ) : (
                    options.map((option, idx) => (
                        <div
                            key={idx}
                            className="field-radiobutton"
                            style={{
                                marginBottom: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <RadioButton
                                inputId={`${field.label}_${idx}`}
                                name={field.label}
                                value={option}
                                onChange={(e) =>
                                    onChange && onChange(field.label, e.value)
                                }
                                checked={value === option}
                            />
                            <label
                                htmlFor={`${field.label}_${idx}`}
                                style={{ marginLeft: "0.5rem" }}
                            >
                                {option}
                            </label>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // Checkboxes
    if (field.fieldType === "checkbox") {
        // Ensure options is an array
        const options = Array.isArray(field.options) ? field.options : [];

        // Ensure value is an array
        const selectedValues = Array.isArray(value) ? value : [];

        return (
            <div className="field-checkbox-wrapper" style={{ width: "100%" }}>
                {options.length === 0 ? (
                    <div style={{ color: "#6c757d" }}>No options available</div>
                ) : (
                    options.map((option, idx) => (
                        <div
                            key={idx}
                            className="field-checkbox"
                            style={{
                                marginBottom: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <Checkbox
                                inputId={`${field.label}_${idx}`}
                                name={field.label}
                                value={option}
                                onChange={(e) => {
                                    let newValues;
                                    if (e.checked) {
                                        newValues = [...selectedValues, option];
                                    } else {
                                        newValues = selectedValues.filter(
                                            (val) => val !== option
                                        );
                                    }
                                    onChange &&
                                        onChange(field.label, newValues);
                                }}
                                checked={selectedValues.includes(option)}
                            />
                            <label
                                htmlFor={`${field.label}_${idx}`}
                                style={{ marginLeft: "0.5rem" }}
                            >
                                {option}
                            </label>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // MultiSelect field (used for suppliers)
    if (field.fieldType === "multiselect") {
        // Convert suppliers to format needed by MultiSelect
        const supplierOptions = suppliers.map((supplier) => ({
            label: supplier.name || supplier.supplierName,
            value: supplier._id || supplier.id,
        }));

        // Custom item template for supplier
        const supplierItemTemplate = (option) => (
            <div className="supplier-item">
                <span>{option.label}</span>
            </div>
        );

        return (
            <MultiSelect
                value={value || []}
                options={supplierOptions}
                onChange={(e) => onChange && onChange(field.label, e.value)}
                placeholder={field.label}
                display="chip"
                style={{ width: "100%", boxSizing: "border-box" }}
                itemTemplate={supplierItemTemplate}
                filter={suppliers.length > 10} // Add filtering for long lists
            />
        );
    }

    // Default fallback for any other field type
    return (
        <InputText
            value={value || ""}
            onChange={(e) => onChange && onChange(field.label, e.target.value)}
            placeholder={field.label}
            style={{ width: "100%", boxSizing: "border-box" }}
        />
    );
};

export default FieldInput;
