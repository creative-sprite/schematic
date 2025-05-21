// components/kitchenSurvey/equipment/CommentTextarea.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { InputTextarea } from "primereact/inputtextarea";

const CommentTextarea = ({
    id,
    value = "",
    onChange,
    label,
    placeholder = "Add comments...",
}) => {
    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);
    const textareaRef = useRef(null);

    // Update local state when prop value changes
    useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    // Apply border highlight when content changes
    useEffect(() => {
        if (textareaRef.current) {
            const hasContent = localValue && localValue.trim().length > 0;
            const textareaElement =
                textareaRef.current.querySelector("textarea");

            if (textareaElement) {
                if (hasContent) {
                    textareaElement.style.setProperty(
                        "border-color",
                        "var(--primary-color)",
                        "important"
                    );
                } else {
                    textareaElement.style.removeProperty("border-color");
                }
            }
        }
    }, [localValue]);

    // Handle text input directly
    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(id, newValue);
    };

    return (
        <div className="field" style={{ marginTop: "1rem" }}>
            {label && (
                <label htmlFor={id} className="block">
                    {label}
                </label>
            )}
            <div ref={textareaRef}>
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
                    }}
                    placeholder={placeholder}
                    aria-label={label || "Comment field"}
                />
            </div>
        </div>
    );
};

export default CommentTextarea;
