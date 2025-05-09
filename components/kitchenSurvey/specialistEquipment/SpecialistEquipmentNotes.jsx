// components/kitchenSurvey/specialistEquipment/SpecialistEquipmentNotes.jsx
import React, { useState, useEffect } from "react";
import { InputTextarea } from "primereact/inputtextarea"; // Import PrimeReact InputTextarea

export default function SpecialistEquipmentNotes({
    initialNotes = "",
    onNotesChange,
}) {
    const [notes, setNotes] = useState(initialNotes);

    // Debug logging for props on mount
    useEffect(() => {
        console.log(
            "[SpecialistEquipmentNotes] Component mounted with initialNotes:",
            initialNotes
        );
        console.log(
            "[SpecialistEquipmentNotes] onNotesChange is a function:",
            typeof onNotesChange === "function"
        );
    }, []);

    // Update local state when initialNotes changes (for loading saved data)
    useEffect(() => {
        if (initialNotes !== notes) {
            console.log(
                "[SpecialistEquipmentNotes] Loading specialist equipment notes:",
                initialNotes
            );
            setNotes(initialNotes);
        }
    }, [initialNotes, notes]);

    // Handle input change
    const handleChange = (e) => {
        const value = e.target.value;
        console.log("[SpecialistEquipmentNotes] Notes changed to:", value);

        // Update local state
        setNotes(value);

        // Notify parent component if callback exists
        if (typeof onNotesChange === "function") {
            console.log(
                "[SpecialistEquipmentNotes] Sending updated notes to parent"
            );
            onNotesChange(value);
        } else {
            console.error(
                "[SpecialistEquipmentNotes] ERROR: onNotesChange is not a function!"
            );
        }
    };

    return (
        <div className="notes-container" style={{ marginTop: "1.5rem" }}>
            <label htmlFor="specialist-equipment-notes" className="block">
                Specialist Equipment Notes
            </label>
            <InputTextarea
                id="specialist-equipment-notes"
                name="specialist-equipment-notes"
                value={notes}
                onChange={handleChange}
                placeholder="Specialist equipment other notes"
                className="notes-textarea"
                rows={3}
                autoResize
                style={{
                    width: "100%",
                    marginTop: "1rem",
                }}
                aria-label="Specialist equipment notes"
            />
        </div>
    );
}
