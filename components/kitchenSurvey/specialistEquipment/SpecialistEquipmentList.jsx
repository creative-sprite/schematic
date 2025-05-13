// components\kitchenSurvey\specialistEquipment\SpecialistEquipmentList.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button"; // Button component for remove actions
import { Card } from "primereact/card"; // Card component for better display
import { Divider } from "primereact/divider"; // Divider for visual separation
import SpecialistCommentTextarea from "./SpecialistCommentTextarea"; // Import the specialist comment component

// Helper function to group entries by category
const groupByCategory = (entries) => {
    return entries.reduce((acc, entry) => {
        const category = entry.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(entry);
        return acc;
    }, {});
};

// SpecialistEquipmentList renders items with all their data
export default function SpecialistEquipmentList(props) {
    const {
        surveyList,
        specialItems,
        isVolumeItem,
        handleRemoveEntry,
        initialCategoryComments = {}, // Initial comments for loading saved data
        onCategoryCommentsChange, // Callback for saving comments
    } = props;

    // State to store comments per category - simplified approach
    const [comments, setComments] = useState({});
    // Store complete custom field objects keyed by ID
    const [customFields, setCustomFields] = useState({});
    const [loadingFields, setLoadingFields] = useState(false);

    // Debug ref to track comments updates
    const commentsDebugRef = useRef({
        lastUpdate: Date.now(),
        count: 0,
    });

    // Simplified refs - only track mount status for cleanup
    const isMountedRef = useRef(true);
    const fetchErrorRef = useRef(false);
    const didFetchCustomFieldsRef = useRef(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // IMPROVED: Initialize comments from initial props and keep synced with updates
    useEffect(() => {
        // Only update if we have comments data and it's different from current
        if (
            initialCategoryComments &&
            Object.keys(initialCategoryComments).length > 0
        ) {
            const currentKeys = Object.keys(comments);
            const incomingKeys = Object.keys(initialCategoryComments);

            // Check if different keys or values
            const needsUpdate =
                currentKeys.length !== incomingKeys.length ||
                incomingKeys.some(
                    (key) => comments[key] !== initialCategoryComments[key]
                );

            if (needsUpdate) {
                console.log(
                    "SpecialistEquipmentList: Updating comments from props:",
                    Object.keys(initialCategoryComments).length,
                    "comments"
                );

                // Update debug tracking
                commentsDebugRef.current = {
                    lastUpdate: Date.now(),
                    count: commentsDebugRef.current.count + 1,
                };

                // Set the comments state with the new data
                setComments({ ...initialCategoryComments });
            }
        }
    }, [initialCategoryComments]); // FIXED: Only depend on initialCategoryComments, not comments

    // Fetch custom fields to map fieldId to all field properties including prefix/suffix
    useEffect(() => {
        // Only fetch once and don't retry if we've had an error
        if (didFetchCustomFieldsRef.current || fetchErrorRef.current) return;

        const fetchCustomFields = async () => {
            try {
                setLoadingFields(true);
                didFetchCustomFieldsRef.current = true; // Mark as fetched

                console.log(
                    "Fetching custom fields in SpecialistEquipmentList..."
                );
                const res = await fetch("/api/database/products/customFields");

                // Check for HTTP errors
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                const json = await res.json();

                // Check for API success flag and data structure
                if (json && json.success && Array.isArray(json.data)) {
                    // Only update state if component is still mounted
                    if (isMountedRef.current) {
                        // Create a mapping of fieldId to complete field object
                        const fieldMap = {};
                        json.data.forEach((field) => {
                            if (field && field._id) {
                                fieldMap[field._id] = field;
                            }
                        });
                        setCustomFields(fieldMap);
                        console.log(
                            "Custom fields fetched successfully in SpecialistEquipmentList:",
                            json.data.length
                        );
                    }
                } else {
                    console.error(
                        "Failed to fetch custom fields in SpecialistEquipmentList:",
                        json || "No data returned"
                    );
                    fetchErrorRef.current = true; // Mark as error to prevent retries
                }
            } catch (error) {
                console.error(
                    "Error fetching custom fields in SpecialistEquipmentList:",
                    error
                );
                fetchErrorRef.current = true; // Mark as error to prevent retries
            } finally {
                if (isMountedRef.current) {
                    setLoadingFields(false);
                }
            }
        };

        fetchCustomFields();
    }, []); // Empty dependency array ensures this only runs once

    // Improved helper function for fieldId extraction
    const getFieldIdString = (fieldId) => {
        if (!fieldId) return "";

        // If it's already a string, return it
        if (typeof fieldId === "string") return fieldId;

        // Convert ObjectId to string - handle multiple formats
        try {
            // Handle ObjectId-like string format: ObjectId('xyz')
            const objIdString = String(fieldId);
            const match = objIdString.match(/ObjectId\(['"](.*)['"](?:\))?/);
            if (match) return match[1];

            // If it has a toString method (like real MongoDB ObjectId), use it
            if (typeof fieldId.toString === "function") {
                const str = fieldId.toString();
                // If the toString result looks like an ObjectId representation, extract just the ID
                const toStrMatch = str.match(/ObjectId\(['"](.*)['"](?:\))?/);
                return toStrMatch ? toStrMatch[1] : str;
            }

            // Last resort, just cast to string
            return String(fieldId);
        } catch (error) {
            console.error("Error processing fieldId:", error);
            return String(fieldId);
        }
    };

    // Enhanced comment change handler with better logging and structure
    const handleCommentChange = (id, value) => {
        // Extract category from comment ID
        const idParts = id.split("-");
        if (idParts.length >= 3) {
            const categoryId = idParts.slice(2).join("-");
            const category = categoryId.replace(/-/g, " ");

            // Log the change
            console.log(
                `SpecialistEquipmentList: Comment changed for "${category}":`,
                value.length > 20 ? value.slice(0, 20) + "..." : value
            );

            // Create new comments object with updated value
            const newComments = {
                ...comments,
                [category]: value,
            };

            // Update local state first for immediate feedback
            setComments(newComments);

            // Also update debug reference
            commentsDebugRef.current = {
                lastUpdate: Date.now(),
                count: commentsDebugRef.current.count + 1,
            };

            // Notify parent with all comments
            if (typeof onCategoryCommentsChange === "function") {
                onCategoryCommentsChange(newComments);
            }
        } else {
            console.warn(
                "SpecialistEquipmentList: Invalid comment ID format:",
                id
            );
        }
    };

    // Render entry function
    const renderEntry = (entry) => {
        const isDimension = entry.length || entry.width || entry.height;

        return (
            <Card key={entry.id} className="mb-3">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div style={{ width: "90%" }}>
                        <h3 style={{ margin: "0 0 0.5rem 0" }}>{entry.item}</h3>

                        {/* Display type if available */}
                        {entry.type && (
                            <div style={{ marginBottom: "0.5rem" }}>
                                <strong>Type: </strong>
                                <span>{entry.type}</span>
                            </div>
                        )}

                        {isDimension && (
                            <div style={{ marginBottom: "0.5rem" }}>
                                <strong>Dimensions: </strong>
                                {entry.length && (
                                    <span>Length: {entry.length} </span>
                                )}
                                {entry.width && (
                                    <span>Width: {entry.width} </span>
                                )}
                                {entry.height && (
                                    <span>Height: {entry.height} </span>
                                )}
                                <div>
                                    <strong>Total: </strong>
                                    {entry.number}
                                </div>
                            </div>
                        )}

                        {!isDimension && (
                            <div style={{ marginBottom: "0.5rem" }}>
                                <strong>Quantity: </strong>
                                {entry.number}
                            </div>
                        )}

                        {/* Display customData fields with MAXIMUM robustness for saved fields */}
                        {entry.customData &&
                            Array.isArray(entry.customData) && (
                                <>
                                    {entry.customData.map((field, idx) => {
                                        // Skip if field is invalid
                                        if (
                                            !field ||
                                            typeof field !== "object"
                                        ) {
                                            return null;
                                        }

                                        try {
                                            // CRITICAL: Skip ONLY null/undefined values, allow empty strings and zeroes
                                            if (
                                                field.value === null ||
                                                field.value === undefined
                                            ) {
                                                return null;
                                            }

                                            // Skip any system fields like __v
                                            if (
                                                field.fieldName === "__v" ||
                                                field.fieldName === "_id"
                                            ) {
                                                return null;
                                            }

                                            // Get field ID as string with robust fallback
                                            let fieldIdStr = "";
                                            try {
                                                fieldIdStr = getFieldIdString(
                                                    field.fieldId
                                                );
                                            } catch (error) {
                                                console.error(
                                                    "Error getting fieldId string:",
                                                    error
                                                );
                                            }

                                            // Get custom field with extreme caution
                                            let customField = null;
                                            if (!loadingFields && fieldIdStr) {
                                                customField =
                                                    customFields[fieldIdStr];
                                            }

                                            // Use the fieldName that's already in the customData directly
                                            const fieldLabel =
                                                field.fieldName ||
                                                customField?.label ||
                                                "";

                                            // Only skip price/cost fields - everything else shows
                                            if (
                                                fieldLabel
                                                    .toLowerCase()
                                                    .includes("price") ||
                                                fieldLabel
                                                    .toLowerCase()
                                                    .includes("cost")
                                            ) {
                                                return null;
                                            }

                                            // Prioritize prefix/suffix from the field itself, fall back to customField
                                            const prefix =
                                                field.prefix ||
                                                customField?.prefix ||
                                                "";
                                            const suffix =
                                                field.suffix ||
                                                customField?.suffix ||
                                                "";

                                            // Use the fieldName that's already in the customData directly
                                            const label =
                                                field.fieldName || // First priority: use fieldName from customData
                                                customField?.label || // Second: from fetched custom field
                                                field.label || // Third: any label property on the field
                                                fieldIdStr || // Fourth: show the ID as last resort
                                                `Field ${idx + 1}`; // Absolute last resort

                                            // Convert any value type to string for display
                                            const displayValue =
                                                field.value === 0
                                                    ? "0"
                                                    : field.value === ""
                                                    ? "(empty)"
                                                    : field.value?.toString() ||
                                                      "(no value)";

                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        marginBottom: "0.2rem",
                                                    }}
                                                >
                                                    <strong>{label}: </strong>
                                                    <span>
                                                        {prefix}
                                                        {displayValue}
                                                        {suffix}
                                                    </span>
                                                </div>
                                            );
                                        } catch (error) {
                                            // Catch any rendering errors and just skip the field
                                            console.error(
                                                "Error rendering field:",
                                                error
                                            );
                                            return null;
                                        }
                                    })}
                                </>
                            )}
                    </div>

                    <Button
                        id={`remove-item-${entry.id}`}
                        name={`remove-item-${entry.id}`}
                        aria-label={`Remove ${entry.item}`}
                        icon="pi pi-minus"
                        className="p-button-danger p-button-rounded"
                        onClick={() => handleRemoveEntry(entry.id)}
                    />
                </div>
            </Card>
        );
    };

    // Improved section rendering with better category comment handling
    const renderSection = (entries, type) => {
        const grouped = groupByCategory(entries);

        console.log(
            "Rendering sections with categories:",
            Object.keys(grouped)
        );

        return Object.keys(grouped).map((category) => {
            // Generate a safe category ID for DOM elements
            const categoryId = category.replace(/\s+/g, "-").toLowerCase();

            // FIXED: Get the comment value for this category - check all case variations
            const commentValue =
                comments[category] ||
                comments[category.toLowerCase()] ||
                comments[category.toUpperCase()] ||
                "";

            // Create the textarea ID that matches the pattern in SaveSurvey.jsx
            const textareaId = `category-comment-${categoryId}`;

            return (
                <div key={category} style={{ marginBottom: "2rem" }}>
                    <h2 id={`category-${categoryId}`}>{category}</h2>
                    <Divider />

                    {grouped[category].map((entry) => renderEntry(entry))}

                    {/* Use the SpecialistCommentTextarea component with careful ID matching */}
                    <SpecialistCommentTextarea
                        id={textareaId}
                        value={commentValue}
                        onChange={handleCommentChange}
                        label={`Comments for ${category}`}
                        placeholder={`Add comment for ${category}...`}
                    />
                </div>
            );
        });
    };

    // Get entries by type
    const volumeEntries = getEntriesByType(surveyList, "volume");
    const areaEntries = getEntriesByType(surveyList, "area");
    const normalEntries = getEntriesByType(surveyList, "normal");

    // Filter entries by type
    function getEntriesByType(entries, type) {
        if (type === "volume") {
            return entries.filter((entry) => isVolumeItem(entry.item));
        } else if (type === "area") {
            return entries.filter((entry) => specialItems.has(entry.item));
        } else {
            return entries.filter(
                (entry) =>
                    !isVolumeItem(entry.item) && !specialItems.has(entry.item)
            );
        }
    }

    return (
        <div className="mt-4">
            <h2 id="selected-items-heading">Selected Items</h2>
            {volumeEntries.length > 0 && renderSection(volumeEntries, "volume")}
            {areaEntries.length > 0 && renderSection(areaEntries, "area")}
            {normalEntries.length > 0 && renderSection(normalEntries, "normal")}
            {surveyList.length === 0 && (
                <p id="no-items-message">
                    Added specialist equipment will display here.
                </p>
            )}
        </div>
    );
}
