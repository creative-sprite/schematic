// components/kitchenSurvey/equipment/CommentTextarea.jsx
"use client";
import { useState, useEffect } from "react";
import { InputTextarea } from "primereact/inputtextarea";

/**
 * A simple, lightweight component for handling text input with direct updates.
 * This component maintains a local state for responsive typing but propagates
 * changes directly to the parent without complex debouncing.
 *
 * @param {string} id - Unique identifier for the comment field
 * @param {string} value - The comment text value
 * @param {function} onChange - Callback function when comment changes (id, value) => void
 * @param {string} label - Optional label for the comment field
 * @param {string} placeholder - Optional placeholder text
 */
const CommentTextarea = ({
    id,
    value = "",
    onChange,
    label,
    placeholder = "Add comments...",
}) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Update local state when prop value changes
    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    // Handle text input directly without complex debouncing
    const handleChange = (e) => {
        const newValue = e.target.value;

        // Update local state immediately for responsive typing
        setLocalValue(newValue);

        // Notify parent component directly with ID and value (matching CanopyComments pattern)
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
                style={{ width: "100%", marginTop: "0.5rem" }}
                placeholder={placeholder}
                aria-label={label || "Comment field"}
            />
        </div>
    );
};

export default CommentTextarea;
