// components/kitchenSurvey/equipment/EquipmentNotes.jsx
import React, { useRef, memo } from "react";
import { InputTextarea } from "primereact/inputtextarea"; // Import PrimeReact InputTextarea

// Use memo to prevent unnecessary re-renders
const EquipmentNotes = memo(({ notes = "", onNotesChange }) => {
    const textareaRef = useRef(null);

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
    }, [notes]);

    // Handle input change
    const handleChange = (e) => {
        const value = e.target.value;

        // Skip update if no actual change
        if (value === notes) {
            return;
        }

        // Notify parent component directly
        if (typeof onNotesChange === "function") {
            onNotesChange(value);
        }
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
                value={notes}
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
