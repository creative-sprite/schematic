// components\kitchenSurvey\specialistEquipment\SpecialistEquipmentList.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button"; // Button component for remove actions
import { InputTextarea } from "primereact/inputtextarea"; // InputTextarea component for comment boxes
import { Card } from "primereact/card"; // Card component for better display
import { Divider } from "primereact/divider"; // Divider for visual separation

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

    // State to store comments per category
    const [comments, setComments] = useState(initialCategoryComments || {});
    // Store complete custom field objects keyed by ID
    const [customFields, setCustomFields] = useState({});
    const [loadingFields, setLoadingFields] = useState(false);

    // Add refs to prevent repeated fetches and track component lifecycle
    const didFetchCustomFieldsRef = useRef(false);
    const fetchErrorRef = useRef(false);
    const isMountedRef = useRef(true);

    // ADDED: Ref to track category comments update status
    const updatingCommentsRef = useRef(false);
    const prevCommentsRef = useRef({});

    // Helper function to check if a comment field has data
    const commentHasData = (category) => {
        return (
            comments[category] !== undefined &&
            comments[category] !== null &&
            comments[category] !== ""
        );
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Initialize comments from saved data if provided
    useEffect(() => {
        // FIXED: Skip if already updating to prevent circular updates
        if (updatingCommentsRef.current) return;

        // Only update if there's an actual change
        if (
            initialCategoryComments &&
            Object.keys(initialCategoryComments).length > 0 &&
            JSON.stringify(initialCategoryComments) !==
                JSON.stringify(prevCommentsRef.current)
        ) {
            console.log(
                "Loading category comments in SpecialistEquipmentList:",
                initialCategoryComments
            );
            // Update tracking refs
            prevCommentsRef.current = { ...initialCategoryComments };
            setComments(initialCategoryComments);
        }
    }, [initialCategoryComments]);

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

    // Render entry function - NOT using useCallback
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

    // FIXED: Updated section rendering function with better debugging
    const renderSection = (entries, type) => {
        const grouped = groupByCategory(entries);

        // ADDED: Better debug logging for categories and comments
        console.log(
            "Rendering sections with categories:",
            Object.keys(grouped),
            "Comments available:",
            Object.keys(comments)
        );

        return Object.keys(grouped).map((category) => (
            <div key={category} style={{ marginBottom: "2rem" }}>
                <h2
                    id={`category-${category
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                >
                    {category}
                </h2>
                <Divider />

                {grouped[category].map((entry) => renderEntry(entry))}

                {/* Comment box for the category */}
                <div className="field">
                    <label
                        htmlFor={`category-comment-${category
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        className="block"
                    >
                        Comments for {category}
                    </label>
                    {/* ADDED: Debug value display to check what's coming from state */}
                    {/* <div style={{fontSize: '10px', color: 'gray'}}>
                        Debug: Comments value: "{comments[category] || ""}"
                    </div> */}
                    <InputTextarea
                        id={`category-comment-${category
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        name={`category-comment-${category
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        value={comments[category] || ""}
                        onChange={(e) => {
                            const newValue = e.target.value;

                            // ADDED: Skip if no actual change
                            if (newValue === comments[category]) {
                                return;
                            }

                            // Create new comments object with the updated value
                            const newComments = {
                                ...comments,
                                [category]: newValue,
                            };

                            // ADDED: Set update flag to prevent circular updates
                            updatingCommentsRef.current = true;

                            // Update local state
                            setComments(newComments);

                            // Update tracking reference
                            prevCommentsRef.current = newComments;

                            // Notify parent component
                            if (
                                typeof onCategoryCommentsChange === "function"
                            ) {
                                console.log(
                                    "Category comment changed:",
                                    category,
                                    newValue.slice(0, 20) +
                                        (newValue.length > 20 ? "..." : "")
                                );
                                onCategoryCommentsChange(newComments);
                            }

                            // Reset flag after a short delay
                            setTimeout(() => {
                                updatingCommentsRef.current = false;
                            }, 0);
                        }}
                        autoResize
                        rows={3}
                        style={{
                            width: "100%",
                            marginTop: "0.5rem",
                            border: commentHasData(category)
                                ? "1px solid var(--primary-color)"
                                : "",
                        }}
                        placeholder={`Add comment for ${category}...`}
                        aria-label={`Comments for ${category}`}
                    />
                </div>
            </div>
        ));
    };

    // Get entries by type
    const volumeEntries = getEntriesByType(surveyList, "volume");
    const areaEntries = getEntriesByType(surveyList, "area");
    const normalEntries = getEntriesByType(surveyList, "normal");

    // Filter entries by type - NOT using useCallback
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
            {/* ADDED: Better debug info for comments */}
            {/* <div style={{fontSize: '10px', color: 'gray', marginBottom: '10px'}}>
                Debug: Loaded comments: {JSON.stringify(comments)}
            </div> */}
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
