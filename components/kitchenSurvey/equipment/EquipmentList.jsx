// components\kitchenSurvey\equipment\EquipmentList.jsx

import React, { memo } from "react";
import { Button } from "primereact/button"; // Button component for remove actions
import { InputTextarea } from "primereact/inputtextarea"; // InputTextarea component for comment boxes

// Helper function to group entries by subcategory
const groupBySubcategory = (entries) => {
    return entries.reduce((acc, entry) => {
        const sub = entry.subcategory;
        if (!acc[sub]) acc[sub] = [];
        acc[sub].push(entry);
        return acc;
    }, {});
};

// EquipmentList renders separate tables for volume, area, and normal items.
const EquipmentList = memo((props) => {
    const {
        surveyList,
        specialItems,
        isVolumeItem,
        handleRemoveEntry,
        subcategoryComments = {}, // Comments passed from parent
        onSubcategoryCommentsChange, // Callback for saving comments
    } = props;

    const volumeEntries = surveyList.filter((entry) =>
        isVolumeItem(entry.item)
    );
    const areaEntries = surveyList.filter((entry) =>
        specialItems.has(entry.item)
    );
    const normalEntries = surveyList.filter(
        (entry) => !isVolumeItem(entry.item) && !specialItems.has(entry.item)
    );

    const renderSubcategoryTable = (entries, type) => {
        let headers;
        if (type === "volume") {
            headers = (
                <>
                    <th>Equipment</th>
                    <th>Length</th>
                    <th>Width</th>
                    <th>Height</th>
                    <th>Grade</th>
                    <th>Remove</th>
                </>
            );
        } else if (type === "area") {
            headers = (
                <>
                    <th>Equipment</th>
                    <th>Length</th>
                    <th>Width</th>
                    <th>Grade</th>
                    <th>Remove</th>
                </>
            );
        } else {
            headers = (
                <>
                    <th>Equipment</th>
                    <th>Number</th>
                    <th>Grade</th>
                    <th>Remove</th>
                </>
            );
        }
        return (
            <table className="equipment-list-table common-table">
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.id}>
                            <td>{entry.item}</td>
                            {type === "volume" ? (
                                <>
                                    <td>{entry.length}</td>
                                    <td>{entry.width}</td>
                                    <td>{entry.height}</td>
                                </>
                            ) : type === "area" ? (
                                <>
                                    <td>{entry.length}</td>
                                    <td>{entry.width}</td>
                                </>
                            ) : (
                                <td>{entry.number}</td>
                            )}
                            <td>{entry.grade}</td>
                            <td>
                                <Button
                                    className="pi pi-minus"
                                    onClick={() => handleRemoveEntry(entry.id)}
                                    style={{
                                        paddingLeft: "19px",
                                        height: "40px",
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // FIXED: Direct parent update without local state
    const handleCommentChange = (subcategory, value) => {
        console.log(`[EquipmentList] Comment for "${subcategory}" changed`);

        // Skip if the value is the same
        if (subcategoryComments[subcategory] === value) {
            return;
        }

        // Create a new comments object with updated value
        const newComments = {
            ...subcategoryComments,
            [subcategory]: value,
        };

        // Notify parent component directly
        if (typeof onSubcategoryCommentsChange === "function") {
            onSubcategoryCommentsChange(newComments);
        }
    };

    const renderSection = (entries, type) => {
        const grouped = groupBySubcategory(entries);
        return Object.keys(grouped).map((subcategory) => {
            // Create ID-safe version of subcategory for labels
            const subcategoryId = subcategory
                .replace(/\s+/g, "-")
                .toLowerCase();

            return (
                <div key={subcategory} style={{ marginBottom: "1rem" }}>
                    <h4>{subcategory}</h4>
                    {renderSubcategoryTable(grouped[subcategory], type)}

                    <div className="field" style={{ marginTop: "1rem" }}>
                        <label
                            htmlFor={`subcategory-comment-${subcategoryId}`}
                            className="block"
                        >
                            Comments for {subcategory}
                        </label>
                        <InputTextarea
                            id={`subcategory-comment-${subcategoryId}`}
                            name={`subcategory-comment-${subcategoryId}`}
                            value={subcategoryComments[subcategory] || ""}
                            onChange={(e) =>
                                handleCommentChange(subcategory, e.target.value)
                            }
                            autoResize
                            rows={3}
                            style={{ width: "100%", marginTop: "0.5rem" }}
                            placeholder={`Add comment for ${subcategory}...`}
                            aria-label={`Comments for ${subcategory}`}
                        />
                    </div>
                </div>
            );
        });
    };

    // Render comments for subcategories without matching equipment items
    const renderOrphanedComments = () => {
        // Get all subcategories that have comments
        const commentSubcategories = Object.keys(subcategoryComments);

        // Get all subcategories that are in the surveyList
        const surveySubcategories = new Set(
            surveyList.map((entry) => entry.subcategory)
        );

        // Find subcategories that have comments but no entries in surveyList
        const orphanedSubcategories = commentSubcategories.filter(
            (subcategory) =>
                !surveySubcategories.has(subcategory) &&
                subcategoryComments[subcategory]
        );

        if (orphanedSubcategories.length === 0) {
            return null;
        }

        return (
            <div style={{ marginTop: "2rem" }}>
                {orphanedSubcategories.map((subcategory) => {
                    // Create ID-safe version of subcategory for labels
                    const subcategoryId = subcategory
                        .replace(/\s+/g, "-")
                        .toLowerCase();

                    return (
                        <div key={subcategory} style={{ marginBottom: "1rem" }}>
                            <h4>{subcategory}</h4>
                            <div className="field">
                                <label
                                    htmlFor={`orphaned-comment-${subcategoryId}`}
                                    className="block"
                                >
                                    Comments for {subcategory}
                                </label>
                                <InputTextarea
                                    id={`orphaned-comment-${subcategoryId}`}
                                    name={`orphaned-comment-${subcategoryId}`}
                                    value={
                                        subcategoryComments[subcategory] || ""
                                    }
                                    onChange={(e) =>
                                        handleCommentChange(
                                            subcategory,
                                            e.target.value
                                        )
                                    }
                                    autoResize
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        marginTop: "0.5rem",
                                    }}
                                    placeholder={`Add comment for ${subcategory}...`}
                                    aria-label={`Comments for ${subcategory}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {volumeEntries.length > 0 && renderSection(volumeEntries, "volume")}
            {areaEntries.length > 0 && renderSection(areaEntries, "area")}
            {normalEntries.length > 0 && renderSection(normalEntries, "normal")}
            {renderOrphanedComments()}
            {surveyList.length === 0 &&
                Object.keys(subcategoryComments).length === 0 && (
                    <p>Added equipment will display here.</p>
                )}
        </>
    );
});

EquipmentList.displayName = "EquipmentList";

export default EquipmentList;
