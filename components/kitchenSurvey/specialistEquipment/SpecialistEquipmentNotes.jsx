// components/kitchenSurvey/specialistEquipment/SpecialistEquipmentNotes.jsx
import React, { useState, useEffect, useRef } from "react";
import { InputTextarea } from "primereact/inputtextarea"; // Import PrimeReact InputTextarea

export default function SpecialistEquipmentNotes({
    initialNotes = "",
    onNotesChange,
}) {
    const [notes, setNotes] = useState(initialNotes);

    // ADDED: Refs to track update status and prevent circular updates
    const updatingNotesRef = useRef(false);
    const prevNotesRef = useRef("");
    const initializedRef = useRef(false);

    // Helper function to check if notes field has data
    const notesHasData = () => {
        return notes !== undefined && notes !== null && notes !== "";
    };

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

        // ADDED: Set initial value in ref
        prevNotesRef.current = initialNotes;
        initializedRef.current = true;
    }, []);

    // Update local state when initialNotes changes (for loading saved data)
    useEffect(() => {
        // FIXED: Skip if already updating to prevent circular updates
        if (updatingNotesRef.current) {
            return;
        }

        // IMPROVED: Only update if there's an actual change and not in initial render
        if (initialNotes !== notes && initializedRef.current) {
            console.log(
                "[SpecialistEquipmentNotes] Loading specialist equipment notes:",
                initialNotes
            );

            // Update ref to prevent circular updates
            prevNotesRef.current = initialNotes;

            // Update state
            setNotes(initialNotes);
        }
    }, [initialNotes, notes]);

    // FIXED: Handle input change with better circular protection
    const handleChange = (e) => {
        const value = e.target.value;

        // Skip if no actual change
        if (value === notes) {
            return;
        }

        console.log("[SpecialistEquipmentNotes] Notes changed to:", value);

        // Set flag to prevent circular updates
        updatingNotesRef.current = true;

        // Update tracking ref
        prevNotesRef.current = value;

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

        // Reset flag after a short delay
        setTimeout(() => {
            updatingNotesRef.current = false;
        }, 0);
    };

    return (
        <div className="notes-container" style={{ marginTop: "1.5rem" }}>
            <label htmlFor="specialist-equipment-notes" className="block">
                Specialist Equipment Notes
            </label>
            {/* ADDED: Debug display to verify note value */}
            {/* <div style={{fontSize: '10px', color: 'gray'}}>
                Debug: Notes value: "{notes || ""}"
            </div> */}
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
                    border: notesHasData()
                        ? "1px solid var(--primary-color)"
                        : "",
                }}
                aria-label="Specialist equipment notes"
            />
        </div>
    );
}
