// components\kitchenSurvey\equipment\EquipmentList.jsx

import React, { useState, useEffect, useRef, memo } from "react";
import { Button } from "primereact/button"; // Button component for remove actions
import { InputTextarea } from "primereact/inputtextarea"; // InputTextarea component for comment boxes

// Helper function for deep equality check
function isEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
            if (!isEqual(obj1[key], obj2[key])) return false;
        } else if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

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
        initialSubcategoryComments = {}, // Initial comments for loading saved data
        onSubcategoryCommentsChange, // Callback for saving comments
    } = props;

    // State to store comments per subcategory
    const [comments, setComments] = useState(initialSubcategoryComments || {});

    // Ref to track the previous initial comments to prevent unnecessary updates
    const prevInitialCommentsRef = useRef({});
    const isUpdatingCommentsRef = useRef(false);

    // Update local state whenever initialSubcategoryComments prop changes
    useEffect(() => {
        // Skip if we initiated the update ourselves
        if (isUpdatingCommentsRef.current) {
            isUpdatingCommentsRef.current = false;
            return;
        }

        // Check if there's an actual change in comments before updating
        if (
            !isEqual(initialSubcategoryComments, prevInitialCommentsRef.current)
        ) {
            console.log(
                "[EquipmentList] initialSubcategoryComments changed - updating local state"
            );
            setComments(initialSubcategoryComments);
            prevInitialCommentsRef.current = initialSubcategoryComments;
        }
    }, [initialSubcategoryComments]);

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

    // Improved handleCommentChange with debouncing and equality check
    const handleCommentChange = (subcategory, value) => {
        console.log(`[EquipmentList] Comment for "${subcategory}" changed`);

        // Skip if the value is the same (quick equality check)
        if (comments[subcategory] === value) {
            return;
        }

        // Create a new comments object with all existing comments plus the updated one
        const newComments = {
            ...comments,
            [subcategory]: value,
        };

        // Mark that we're initiating an update to prevent circular updates
        isUpdatingCommentsRef.current = true;

        // Update local state
        setComments(newComments);
        prevInitialCommentsRef.current = newComments;

        // Notify parent component with debouncing
        if (typeof onSubcategoryCommentsChange === "function") {
            onSubcategoryCommentsChange(newComments);
        }
    };

    const renderSection = (entries, type) => {
        const grouped = groupBySubcategory(entries);
        return Object.keys(grouped).map((subcategory) => {
            return (
                <div key={subcategory} style={{ marginBottom: "1rem" }}>
                    <h4>{subcategory}</h4>
                    {renderSubcategoryTable(grouped[subcategory], type)}

                    <InputTextarea
                        value={comments[subcategory] || ""}
                        onChange={(e) =>
                            handleCommentChange(subcategory, e.target.value)
                        }
                        autoResize
                        rows={3}
                        style={{ width: "100%", marginTop: "0.5rem" }}
                        placeholder={`Add comment for ${subcategory}...`}
                    />
                </div>
            );
        });
    };

    // Render comments for subcategories without matching equipment items
    const renderOrphanedComments = () => {
        // Get all subcategories that have comments
        const commentSubcategories = Object.keys(comments);

        // Get all subcategories that are in the surveyList
        const surveySubcategories = new Set(
            surveyList.map((entry) => entry.subcategory)
        );

        // Find subcategories that have comments but no entries in surveyList
        const orphanedSubcategories = commentSubcategories.filter(
            (subcategory) =>
                !surveySubcategories.has(subcategory) && comments[subcategory]
        );

        if (orphanedSubcategories.length === 0) {
            return null;
        }

        return (
            <div style={{ marginTop: "2rem" }}>
                {orphanedSubcategories.map((subcategory) => (
                    <div key={subcategory} style={{ marginBottom: "1rem" }}>
                        <h4>{subcategory}</h4>
                        <InputTextarea
                            value={comments[subcategory] || ""}
                            onChange={(e) =>
                                handleCommentChange(subcategory, e.target.value)
                            }
                            autoResize
                            rows={3}
                            style={{ width: "100%", marginTop: "0.5rem" }}
                            placeholder={`Add comment for ${subcategory}...`}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {volumeEntries.length > 0 && renderSection(volumeEntries, "volume")}
            {areaEntries.length > 0 && renderSection(areaEntries, "area")}
            {normalEntries.length > 0 && renderSection(normalEntries, "normal")}
            {renderOrphanedComments()}
            {surveyList.length === 0 && Object.keys(comments).length === 0 && (
                <p>Added equipment will display here.</p>
            )}
        </>
    );
});

EquipmentList.displayName = "EquipmentList";

export default EquipmentList;
