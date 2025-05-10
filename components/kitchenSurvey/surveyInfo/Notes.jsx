// components\kitchenSurvey\surveyInfo\Notes.jsx

"use client";
import React from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataView } from "primereact/dataview";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Chip } from "primereact/chip";

export default function NotesAccordion({ notes, setNotes }) {
    // Define fields for all notes sections except obstructions which we'll handle separately.
    const otherFields = [
        {
            id: 2,
            label: "Comments",
            field: "comments",
            placeholder: "Enter comments",
        },
        {
            id: 3,
            label: "Previous Issues",
            field: "previousIssues",
            placeholder: "Enter previous issues",
        },
        {
            id: 4,
            label: "Damage",
            field: "damage",
            placeholder: "Enter damage details",
        },
        {
            id: 5,
            label: "Inaccessible Areas",
            field: "inaccessibleAreas",
            placeholder: "Enter inaccessible areas",
        },
        {
            id: 6,
            label: "Client Actions",
            field: "clientActions",
            placeholder: "Enter client actions",
        },
        {
            id: 7,
            label: "Access Locations",
            field: "accessLocations",
            placeholder: "Enter access locations",
        },
    ];

    // Create a new array for DataView that starts with the obstructions field.
    const fields = [
        {
            id: 1,
            label: "Obstructions",
            field: "obstructions",
            placeholder: "Select obstructions",
        },
        ...otherFields,
    ];

    // Options for the obstructions MultiSelect.
    const obstructionOptions = [
        { label: "Remove Fan", value: "Remove Fan" },
        {
            label: "Atmosphere Point Located on Pitched Roof",
            value: "Atmosphere Point Located on Pitched Roof",
        },
    ];

    // Function to determine if a field has data
    const fieldHasData = (field) => {
        if (field === "obstructions") {
            return Array.isArray(notes[field]) && notes[field].length > 0;
        }
        return notes[field] && notes[field].trim() !== "";
    };

    // Render function for each card.
    const renderField = (item) => {
        // Standard card style without highlighting the card border
        const cardStyle = {
            border: "1px solid #ccc",
            padding: "20px",
            margin: "0.25rem",
            boxSizing: "border-box",
            flex: "1 1 400px",
            height: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: "center",
        };

        // For the "Obstructions" card, render a MultiSelect and then display chips below.
        if (item.field === "obstructions") {
            // Ensure obstructions is always an array
            const obstructionValues = Array.isArray(notes[item.field])
                ? notes[item.field]
                : notes[item.field]
                ? notes[item.field]
                      .split(",")
                      .map((item) => item.trim())
                      .filter((item) => item !== "")
                : [];

            console.log("Current obstructions values:", obstructionValues);

            return (
                <div key={item.id} style={cardStyle}>
                    <label style={{ marginBottom: "10px", width: "100%" }}>
                        {item.label}
                    </label>
                    <MultiSelect
                        value={obstructionValues}
                        options={obstructionOptions}
                        onChange={(e) => {
                            console.log("MultiSelect changed to:", e.value);
                            setNotes({ ...notes, [item.field]: e.value });
                        }}
                        placeholder={item.placeholder}
                        style={{
                            width: "100%",
                            border: fieldHasData(item.field)
                                ? "1px solid var(--primary-color)"
                                : "",
                        }}
                        className={
                            fieldHasData(item.field)
                                ? "p-inputtext-highlight"
                                : ""
                        }
                        display="comma"
                    />
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginTop: "10px",
                        }}
                    >
                        {obstructionValues.map((val, idx) => (
                            <Chip key={idx} label={val} />
                        ))}
                    </div>
                </div>
            );
        }

        // For other fields, render a standard InputTextarea.
        return (
            <div key={item.id} style={cardStyle}>
                <label style={{ marginBottom: "10px", width: "100%" }}>
                    {item.label}
                </label>
                <InputTextarea
                    value={notes[item.field]}
                    onChange={(e) =>
                        setNotes({ ...notes, [item.field]: e.target.value })
                    }
                    placeholder={item.placeholder}
                    style={{
                        height: "100px",
                        width: "100%",
                        border: fieldHasData(item.field)
                            ? "1px solid var(--primary-color)"
                            : "",
                    }}
                    className={
                        fieldHasData(item.field) ? "p-inputtext-highlight" : ""
                    }
                    autoResize
                />
            </div>
        );
    };

    return (
        <Accordion multiple>
            <AccordionTab header="Notes">
                <DataView
                    value={fields}
                    layout="grid"
                    itemTemplate={renderField}
                />
            </AccordionTab>
        </Accordion>
    );
}
