// components/kitchenSurvey/specialistEquipment/SpecialistCommentTextarea.jsx
"use client";
import { useState, useEffect } from "react";
import { InputTextarea } from "primereact/inputtextarea";

/**
 * A specialized comment textarea component for specialist equipment.
 * This component maintains local state for responsive typing and passes
 * changes directly to the parent component.
 *
 * @param {string} id - Unique identifier for the comment field
 * @param {string} value - The comment text value
 * @param {function} onChange - Callback function when comment changes (id, value) => void
 * @param {string} label - Label for the comment field
 * @param {string} placeholder - Placeholder text
 */
const SpecialistCommentTextarea = ({
    id,
    value = "",
    onChange,
    label,
    placeholder = "Add comment...",
}) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Update local state when prop value changes
    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    // Handle text input with direct parent notification
    const handleChange = (e) => {
        const newValue = e.target.value;

        // Update local state immediately for responsive typing
        setLocalValue(newValue);

        // Notify parent component with ID and value
        if (typeof onChange === "function") {
            onChange(id, newValue);
        }
    };

    // Helper function to determine if the textarea has content
    const hasContent = localValue && localValue.trim().length > 0;

    return (
        <div className="field" style={{ marginTop: "1rem" }}>
            {label && (
                <label htmlFor={id} className="block">
                    {label}
                </label>
            )}
            <InputTextarea
                id={id}
                name={id}
                value={localValue}
                onChange={handleChange}
                autoResize
                rows={3}
                style={{
                    width: "100%",
                    marginTop: "0.5rem",
                    border: hasContent ? "1px solid var(--primary-color)" : "",
                }}
                placeholder={placeholder}
                aria-label={label || "Comment field"}
            />
        </div>
    );
};

export default SpecialistCommentTextarea;
