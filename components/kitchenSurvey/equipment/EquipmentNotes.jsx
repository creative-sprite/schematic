// components/kitchenSurvey/equipment/EquipmentNotes.jsx
import React, { useState, useEffect, useRef, memo } from "react";

// Use memo to prevent unnecessary re-renders
const EquipmentNotes = memo(({ initialNotes = "", onNotesChange }) => {
    const [notes, setNotes] = useState(initialNotes);
    const textareaRef = useRef(null);
    const prevNotesRef = useRef("");
    const isInternalUpdateRef = useRef(false);

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

    // Adjust height on notes change
    useEffect(() => {
        adjustHeight();
    }, [notes]);

    // Update local state when initialNotes changes (for loading saved data)
    useEffect(() => {
        // Skip if we initiated the update ourselves
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        // Only update if there's an actual change
        if (initialNotes !== prevNotesRef.current) {
            console.log("[EquipmentNotes] External notes update detected");
            setNotes(initialNotes);
            prevNotesRef.current = initialNotes;
        }
    }, [initialNotes]);

    // Handle input change with debouncing
    const handleChange = (e) => {
        const value = e.target.value;

        // Skip update if no actual change
        if (value === notes) {
            return;
        }

        // Mark that we're making an internal update
        isInternalUpdateRef.current = true;

        // Update local state
        setNotes(value);
        prevNotesRef.current = value;

        // Notify parent component if callback exists
        if (typeof onNotesChange === "function") {
            onNotesChange(value);
        }
    };

    return (
        <div className="notes-container" style={{ marginTop: "1.5rem" }}>
            <textarea
                ref={textareaRef}
                value={notes}
                onChange={handleChange}
                placeholder="Equipment other notes"
                className="notes-textarea"
                style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    resize: "none", // Disable manual resizing since we'll handle it
                    fontFamily: "inherit",
                    fontSize: "1rem",
                    lineHeight: "1.5",
                }}
            />
        </div>
    );
});

EquipmentNotes.displayName = "EquipmentNotes";

export default EquipmentNotes;
