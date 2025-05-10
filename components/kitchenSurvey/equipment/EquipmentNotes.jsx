// components/kitchenSurvey/equipment/EquipmentNotes.jsx
import React, { useRef, memo, useState, useEffect } from "react";
import { InputTextarea } from "primereact/inputtextarea"; // Import PrimeReact InputTextarea

// Use memo to prevent unnecessary re-renders
const EquipmentNotes = memo(({ notes = "", onNotesChange }) => {
    const textareaRef = useRef(null);
    // Add local state to immediately capture user input
    const [localNotes, setLocalNotes] = useState(notes);
    // Add debounce timer reference
    const debounceTimerRef = useRef(null);

    // Update local state when prop changes (from parent)
    useEffect(() => {
        if (notes !== localNotes) {
            setLocalNotes(notes);
        }
    }, [notes]);

    // Function to adjust textarea height based on content
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = "auto";
            // Set the height to scrollHeight to fit all content
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    // Adjust height when component mounts or notes change
    React.useEffect(() => {
        adjustHeight();
    }, [localNotes]);

    // Handle input change
    const handleChange = (e) => {
        const value = e.target.value;

        // Immediately update local state for responsive typing
        setLocalNotes(value);

        // Clear any existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set debounce timer to notify parent after typing pauses
        debounceTimerRef.current = setTimeout(() => {
            // Only notify parent if actually changed
            if (value !== notes && typeof onNotesChange === "function") {
                onNotesChange(value);
            }
        }, 300); // Longer debounce time (300ms) for better typing experience
    };

    return (
        <div className="notes-container" style={{ marginTop: "1.5rem" }}>
            <label htmlFor="equipment-notes" className="block">
                Equipment Notes
            </label>
            <InputTextarea
                ref={textareaRef}
                id="equipment-notes"
                name="equipment-notes"
                value={localNotes} // Use local state for immediate feedback
                onChange={handleChange}
                placeholder="Equipment other notes"
                className="notes-textarea"
                rows={3}
                autoResize
                style={{
                    width: "100%",
                    marginTop: "1rem",
                }}
                aria-label="Equipment notes"
            />
        </div>
    );
});

EquipmentNotes.displayName = "EquipmentNotes";

export default EquipmentNotes;
