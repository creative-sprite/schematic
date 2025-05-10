// components\kitchenSurvey\equipment\EquipmentList.jsx

import React, { memo, useState, useEffect, useRef } from "react";
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

// CommentTextarea component for better input performance
const CommentTextarea = memo(({ id, value, onChange, label, placeholder }) => {
    const [localValue, setLocalValue] = useState(value || "");
    const debounceTimerRef = useRef(null);

    // Sync with parent when props change
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value || "");
        }
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;

        // Update local state immediately for responsive typing
        setLocalValue(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce the parent update
        debounceTimerRef.current = setTimeout(() => {
            if (newValue !== value) {
                onChange(newValue);
            }
        }, 300);
    };

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor={id} className="block">
                {label}
            </label>
            <InputTextarea
                id={id}
                name={id}
                value={localValue}
                onChange={handleChange}
                autoResize
                rows={3}
                style={{ width: "100%", marginTop: "0.5rem" }}
                placeholder={placeholder}
                aria-label={label}
            />
        </div>
    );
});

CommentTextarea.displayName = "CommentTextarea";

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

    // Track current comments locally to avoid lag
    const [localCommentsMap, setLocalCommentsMap] = useState({});
    const isInitializedRef = useRef(false);

    // Update local comments map when props change
    useEffect(() => {
        if (
            !isInitializedRef.current ||
            Object.keys(localCommentsMap).length === 0
        ) {
            setLocalCommentsMap(subcategoryComments);
            isInitializedRef.current = true;
        }
    }, [subcategoryComments]);

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

    // IMPROVED: Handle comment change with better performance
    const handleCommentChange = (subcategory, value) => {
        // Update local state first for responsive UI
        setLocalCommentsMap((prev) => ({
            ...prev,
            [subcategory]: value,
        }));

        // Create a new comments object with updated value
        const newComments = {
            ...subcategoryComments,
            [subcategory]: value,
        };

        // Notify parent component
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

            // Get current value - prefer local state for responsiveness
            const commentValue =
                localCommentsMap[subcategory] !== undefined
                    ? localCommentsMap[subcategory]
                    : subcategoryComments[subcategory] || "";

            return (
                <div key={subcategory} style={{ marginBottom: "1rem" }}>
                    <h4>{subcategory}</h4>
                    {renderSubcategoryTable(grouped[subcategory], type)}

                    <CommentTextarea
                        id={`subcategory-comment-${subcategoryId}`}
                        value={commentValue}
                        onChange={(value) =>
                            handleCommentChange(subcategory, value)
                        }
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

                    // Get current value - prefer local state for responsiveness
                    const commentValue =
                        localCommentsMap[subcategory] !== undefined
                            ? localCommentsMap[subcategory]
                            : subcategoryComments[subcategory] || "";

                    return (
                        <div key={subcategory} style={{ marginBottom: "1rem" }}>
                            <h4>{subcategory}</h4>
                            <CommentTextarea
                                id={`orphaned-comment-${subcategoryId}`}
                                value={commentValue}
                                onChange={(value) =>
                                    handleCommentChange(subcategory, value)
                                }
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
