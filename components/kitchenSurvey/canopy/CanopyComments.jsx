// components/kitchenSurvey/canopy/CanopyComments.jsx
"use client";
import { useState, useEffect } from "react";
import { InputTextarea } from "primereact/inputtextarea";

/**
 * A dedicated component for handling canopy comments with simplified state management.
 * This component maintains a local state for responsive typing but propagates
 * changes directly to the parent without complex debouncing.
 *
 * @param {string} id - Unique identifier for the comment field
 * @param {string} value - The comment text value
 * @param {function} onChange - Callback function when comment changes (id, value) => void
 * @param {string} label - Optional label for the comment field
 * @param {string} placeholder - Optional placeholder text
 */
const CanopyComments = ({
    id,
    value = "",
    onChange,
    label,
    placeholder = "Add comments...",
}) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Track if the field has content
    const hasContent = localValue && localValue.trim().length > 0;

    // Update local state when prop value changes
    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    // Handle text input directly without complex debouncing
    const handleChange = (e) => {
        const newValue = e.target.value;

        // Update local state immediately for responsive typing
        setLocalValue(newValue);

        // Notify parent component directly
        onChange(id, newValue);
    };

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
                className={hasContent ? "p-filled" : ""}
                style={{
                    width: "100%",
                    marginTop: "0.5rem",
                    ...(hasContent && { borderColor: "var(--primary-color)" }),
                }}
                placeholder={placeholder}
                aria-label={label || "Comment field"}
            />
        </div>
    );
};

export default CanopyComments;
