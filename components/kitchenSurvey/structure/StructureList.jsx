// components/kitchenSurvey/StructureList.jsx
"use client";
import { memo, useCallback } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

/**
 * Component for a single structure entry row with comment
 */
const StructureEntryRow = memo(
    ({ entry, onRemove, onCommentChange, structureItems, calculatePrice }) => {
        // Handle remove click with useCallback to prevent unnecessary recreation
        const handleRemoveClick = useCallback(() => {
            onRemove(entry.id);
        }, [entry.id, onRemove]);

        // Handle comment change
        const handleCommentChange = useCallback(
            (e) => {
                onCommentChange(entry.id, e.target.value);
            },
            [entry.id, onCommentChange]
        );

        // Calculate the price for this structure
        const price = calculatePrice(entry);

        // Ensure selectionData is an array, default to empty array if not
        const selectionData = Array.isArray(entry.selectionData)
            ? entry.selectionData
            : [];
        // Ensure dimensions exists, default to empty object if not
        const dimensions = entry.dimensions || {};

        return (
            <div
                className="survey-subgroup"
                style={{
                    marginBottom: "2rem",
                    paddingLeft: "1rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    padding: "1rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                    }}
                >
                    <h3 style={{ margin: 0 }}>Structure</h3>
                    <div>
                        <Button
                            icon="pi pi-times"
                            className="p-button-danger p-button-rounded p-button-sm"
                            onClick={handleRemoveClick}
                            style={{ width: "30px", height: "30px" }}
                        />
                    </div>
                </div>

                <table className="structure-list-table common-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Material</th>
                            <th>Grade</th>
                            <th>Length</th>
                            <th>Width</th>
                            <th>Height</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectionData.map((row, rowIndex) => (
                            <tr key={`${entry.id}-row-${rowIndex}`}>
                                <td>{row.type || ""}</td>
                                <td>{row.item || ""}</td>
                                <td>{row.grade || ""}</td>
                                {rowIndex === 0 ? (
                                    <>
                                        <td rowSpan={3}>
                                            {dimensions.length || ""}
                                        </td>
                                        <td rowSpan={3}>
                                            {dimensions.width || ""}
                                        </td>
                                        <td rowSpan={3}>
                                            {dimensions.height || ""}
                                        </td>
                                    </>
                                ) : null}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Comments section */}
                <div style={{ marginTop: "1rem" }}>
                    <InputTextarea
                        value={entry.comments || ""}
                        onChange={handleCommentChange}
                        placeholder="Comments for this structure..."
                        rows={2}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: entry.comments
                                ? "1px solid var(--primary-color)"
                                : "1px solid #ced4da",
                        }}
                    />
                </div>
            </div>
        );
    }
);

// Set display name for debugging
StructureEntryRow.displayName = "StructureEntryRow";

/**
 * Main component for displaying the list of structure entries
 */
const StructureList = memo(
    ({
        entries = [],
        structureItems = [],
        onRemoveEntry,
        onUpdateEntry,
        calculatePrice,
    }) => {
        // Handle removing a structure entry
        const handleRemove = useCallback(
            (id) => {
                onRemoveEntry(id);
            },
            [onRemoveEntry]
        );

        // Handle updating a comment for a structure
        const handleCommentChange = useCallback(
            (id, comment) => {
                onUpdateEntry(id, { comments: comment });
            },
            [onUpdateEntry]
        );

        // If no entries, show a placeholder message
        if (!entries || entries.length === 0) {
            return <p>Added structures will display here.</p>;
        }

        // Calculate total price of all structures
        const totalPrice = entries.reduce((total, entry) => {
            return total + calculatePrice(entry);
        }, 0);

        return (
            <div className="structure-list-container">
                {entries.map((entry) => (
                    <StructureEntryRow
                        key={entry.id}
                        entry={entry}
                        onRemove={handleRemove}
                        onCommentChange={handleCommentChange}
                        structureItems={structureItems}
                        calculatePrice={calculatePrice}
                    />
                ))}
            </div>
        );
    }
);

// Set display name for debugging
StructureList.displayName = "StructureEntryList";

export default StructureList;
