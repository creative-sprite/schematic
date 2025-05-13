// components\kitchenSurvey\equipment\EquipmentList.jsx

import React, { memo, useCallback } from "react";
import { Button } from "primereact/button"; // Button component for remove actions
import CommentTextarea from "./CommentTextarea"; // Import our updated component

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

    // Filter entries by type
    const volumeEntries = surveyList.filter((entry) =>
        isVolumeItem(entry.item)
    );
    const areaEntries = surveyList.filter((entry) =>
        specialItems.has(entry.item)
    );
    const normalEntries = surveyList.filter(
        (entry) => !isVolumeItem(entry.item) && !specialItems.has(entry.item)
    );

    // Track which subcategories have been rendered
    const renderedSubcategories = new Set();

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

    // Handle comment change with direct parent notification and robust ID parsing
    const handleCommentChange = useCallback(
        (commentId, value) => {
            // Guard against invalid IDs
            if (!commentId) return;

            // Extract subcategory from the comment ID
            let subcategory = "";

            // Handle subcategory-comment-{subcategoryId} format
            if (commentId.startsWith("subcategory-comment-")) {
                subcategory = commentId
                    .substring("subcategory-comment-".length)
                    .replace(/-/g, " ");
            }
            // Handle orphaned-comment-{subcategoryId} format
            else if (commentId.startsWith("orphaned-comment-")) {
                subcategory = commentId
                    .substring("orphaned-comment-".length)
                    .replace(/-/g, " ");
            }

            // Only update if we have a valid subcategory and the callback exists
            if (
                subcategory &&
                typeof onSubcategoryCommentsChange === "function"
            ) {
                console.log(
                    `Equipment: Updating comment for subcategory "${subcategory}"`
                );

                const updatedComments = {
                    ...subcategoryComments,
                    [subcategory]: value,
                };

                onSubcategoryCommentsChange(updatedComments);
            }
        },
        [subcategoryComments, onSubcategoryCommentsChange]
    );

    const renderSection = (entries, type) => {
        const grouped = groupBySubcategory(entries);
        return Object.keys(grouped).map((subcategory) => {
            // Add to rendered set - both exact case and lowercase
            renderedSubcategories.add(subcategory);
            renderedSubcategories.add(subcategory.toLowerCase());

            // Create ID-safe version of subcategory for labels
            const subcategoryId = subcategory
                .replace(/\s+/g, "-")
                .toLowerCase();

            // Get current comment value from props - check both exact and case variations
            const commentValue =
                subcategoryComments[subcategory] ||
                subcategoryComments[subcategory.toLowerCase()] ||
                subcategoryComments[subcategory.toUpperCase()] ||
                "";

            return (
                <div key={subcategory} style={{ marginBottom: "1rem" }}>
                    <h4>{subcategory}</h4>
                    {renderSubcategoryTable(grouped[subcategory], type)}

                    <CommentTextarea
                        id={`subcategory-comment-${subcategoryId}`}
                        value={commentValue}
                        onChange={handleCommentChange}
                        label={`Comments for ${subcategory}`}
                        placeholder={`Add comment for ${subcategory}...`}
                    />
                </div>
            );
        });
    };

    // Render comments for subcategories without matching equipment items
    const renderOrphanedComments = () => {
        // Get all subcategories that have comments
        const commentSubcategories = Object.keys(subcategoryComments);

        // Find subcategories that have comments but haven't been rendered already
        const orphanedSubcategories = commentSubcategories.filter(
            (subcategory) => {
                // FIXED: Check if this subcategory has already been rendered (in any case)
                if (
                    renderedSubcategories.has(subcategory) ||
                    renderedSubcategories.has(subcategory.toLowerCase())
                ) {
                    return false;
                }

                // Only include if it has a comment value
                return (
                    subcategoryComments[subcategory] &&
                    subcategoryComments[subcategory].trim() !== ""
                );
            }
        );

        if (orphanedSubcategories.length === 0) {
            return null;
        }

        return (
            <div style={{ marginTop: "2rem" }}>
                <h3>Additional Comments</h3>
                {orphanedSubcategories.map((subcategory) => {
                    // Create ID-safe version of subcategory for labels
                    const subcategoryId = subcategory
                        .replace(/\s+/g, "-")
                        .toLowerCase();

                    return (
                        <div key={subcategory} style={{ marginBottom: "1rem" }}>
                            <h4>{subcategory}</h4>
                            <CommentTextarea
                                id={`orphaned-comment-${subcategoryId}`}
                                value={subcategoryComments[subcategory] || ""}
                                onChange={handleCommentChange}
                                label={`Comments for ${subcategory}`}
                                placeholder={`Add comment for ${subcategory}...`}
                            />
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
