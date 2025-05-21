// components\kitchenSurvey\specialistEquipment\SpecialistEquipmentForm.jsx
"use client"; // Added because this component uses React hooks
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview"; // Import TabView components like in EquipmentForm
import { InputText } from "primereact/inputtext"; // InputText component for numeric inputs
import { Button } from "primereact/button"; // Button component
import { DataView } from "primereact/dataview"; // DataView component for grid layout display
import "primeicons/primeicons.css";

export default function SpecialistEquipmentForm(props) {
    const {
        surveyForm,
        categories, // Array of categories to use as tabs
        sortedFilteredItems,
        specialItems,
        isVolumeItem,
        handleSurveyChange,
        handleNumberFocus,
        handleNumberBlur,
        handleAddSurvey,
        surveyList,
    } = props;

    // Match the pattern from EquipmentForm
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [dimensionInputs, setDimensionInputs] = useState({});
    const [customFields, setCustomFields] = useState({});
    const [loadingFields, setLoadingFields] = useState(false); // Start with false to avoid showing loading state if fetch fails

    // Enhanced refs to prevent circular updates and loops
    const didFetchCustomFieldsRef = useRef(false);
    const fetchErrorRef = useRef(false);
    const isMountedRef = useRef(true);
    const initialRenderCompletedRef = useRef(false);
    const updatingTabRef = useRef(false);
    const ignoreNextCategoryUpdateRef = useRef(false);
    const prevCategoryRef = useRef("");

    // Helper function to check if dimension field has data
    const dimensionHasData = (itemName, field) => {
        return (
            dimensionInputs[itemName] &&
            dimensionInputs[itemName][field] !== undefined &&
            dimensionInputs[itemName][field] !== null &&
            dimensionInputs[itemName][field] !== ""
        );
    };

    // Debug logging for products with customData
    useEffect(() => {
        if (sortedFilteredItems && sortedFilteredItems.length > 0) {
            // Check if any items have customData
            const itemsWithCustomData = sortedFilteredItems.filter(
                (item) => item.customData && item.customData.length > 0
            );

            console.log(
                `[SpecialistEquipmentForm] Found ${itemsWithCustomData.length} items with customData out of ${sortedFilteredItems.length} total items`
            );

            // Log a sample item with customData for debugging
            // if (itemsWithCustomData.length > 0) {
            //     console.log(
            //         "[SpecialistEquipmentForm] Sample item with customData:",
            //         itemsWithCustomData[0].name,
            //         JSON.stringify(itemsWithCustomData[0].customData, null, 2)
            //     );
            // }
        }
    }, [sortedFilteredItems]);

    // Initialize activeTabIndex when component mounts
    useEffect(() => {
        // console.log("[SpecialistEquipmentForm] Component mounted with:");
        // console.log(`- ${categories?.length || 0} categories`);
        // console.log(`- ${sortedFilteredItems?.length || 0} filtered items`);
        // console.log(`- ${surveyList?.length || 0} existing survey items`);

        if (!categories || categories.length === 0) return;

        // Set initial active tab index based on current category
        if (!initialRenderCompletedRef.current) {
            const categoryIndex = Math.max(
                0,
                categories.indexOf(surveyForm.category)
            );
            setActiveTabIndex(categoryIndex);
            prevCategoryRef.current = surveyForm.category || "";
            initialRenderCompletedRef.current = true;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // FIXED: Update the survey's category with safer approach
    useEffect(() => {
        // Skip if we're handling an update or categories not loaded
        if (updatingTabRef.current || !categories || categories.length === 0) {
            return;
        }

        // Skip if we've been told to ignore this update
        if (ignoreNextCategoryUpdateRef.current) {
            ignoreNextCategoryUpdateRef.current = false;
            return;
        }

        const selectedCategory = categories[activeTabIndex] || "";

        // Skip if the category hasn't actually changed
        if (surveyForm.category === selectedCategory) {
            return;
        }

        // Mark that we're handling this update
        updatingTabRef.current = true;

        // Update the reference value
        prevCategoryRef.current = selectedCategory;

        // Update the parent's state
        handleSurveyChange({
            target: { name: "category", value: selectedCategory },
        });

        // Reset flag after a delay
        setTimeout(() => {
            updatingTabRef.current = false;
        }, 50);
    }, [activeTabIndex, categories, surveyForm.category, handleSurveyChange]);

    // FIXED: Handle parent category changes with better sync protection
    useEffect(() => {
        // Skip if we're already handling an update
        if (updatingTabRef.current || !categories || categories.length === 0) {
            return;
        }

        // Only update if category has actually changed
        if (
            surveyForm.category &&
            surveyForm.category !== prevCategoryRef.current
        ) {
            // Find the matching tab index
            const index = categories.indexOf(surveyForm.category);

            // Only update if the index is valid and different
            if (index !== -1 && index !== activeTabIndex) {
                // Mark that we're handling this update
                updatingTabRef.current = true;

                // Update tracking refs
                prevCategoryRef.current = surveyForm.category;

                // Update the tab index
                setActiveTabIndex(index);

                // Reset update flag after a delay
                setTimeout(() => {
                    updatingTabRef.current = false;
                }, 50);
            }
        }
    }, [surveyForm.category, categories, activeTabIndex]);

    // Fetch custom fields to map fieldId to all field properties including prefix/suffix
    useEffect(() => {
        // Only fetch once and don't retry if we've had an error
        if (didFetchCustomFieldsRef.current || fetchErrorRef.current) return;

        const fetchCustomFields = async () => {
            try {
                setLoadingFields(true);
                didFetchCustomFieldsRef.current = true; // Mark as fetched

                // Try fetching
                console.log(
                    "[SpecialistEquipmentForm] Fetching custom fields..."
                );
                const res = await fetch("/api/database/products/customFields");

                // Check for HTTP errors
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                // Parse JSON response
                const json = await res.json();

                // Check for API success flag
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
                            "[SpecialistEquipmentForm] Custom fields fetched successfully:",
                            json.data.length
                        );
                    }
                } else {
                    // Handle API error response
                    console.error(
                        "[SpecialistEquipmentForm] Failed to fetch custom fields:",
                        json || "No data returned"
                    );
                    fetchErrorRef.current = true; // Mark as error to prevent retries
                }
            } catch (error) {
                // Handle network or parsing errors
                console.error(
                    "[SpecialistEquipmentForm] Error fetching custom fields:",
                    error
                );
                fetchErrorRef.current = true; // Mark as error to prevent retries
            } finally {
                // Only update state if component is still mounted
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

    // FIXED: Tab change handler with better protection
    const handleTabChange = (e) => {
        // Skip if we're already handling an update
        if (updatingTabRef.current) {
            return;
        }

        const newIndex = e.index;

        // Skip if no actual change
        if (newIndex === activeTabIndex) {
            return;
        }

        // Get the category for the new tab
        const selectedCategory = categories[newIndex] || "";

        // Skip if it's the same as current category
        if (selectedCategory === surveyForm.category) {
            // Just update the tab index without changing category
            setActiveTabIndex(newIndex);
            return;
        }

        // Mark that we're handling an update
        updatingTabRef.current = true;

        // Update tracking refs
        prevCategoryRef.current = selectedCategory;

        // First update the tab index for immediate feedback
        setActiveTabIndex(newIndex);

        // Tell the category effect to ignore next update
        ignoreNextCategoryUpdateRef.current = true;

        // Update parent's state
        handleSurveyChange({
            target: { name: "category", value: selectedCategory },
        });

        // Reset the update flag after a delay
        setTimeout(() => {
            updatingTabRef.current = false;
        }, 50);
    };

    // The item template remains the same
    const itemTemplate = (item) => {
        // Log item data for debugging
        if (!item) {
            console.log("[SpecialistEquipmentForm] Item is undefined or null");
            return null;
        }

        let effectiveIsVolume = isVolumeItem(item.name);
        let effectiveIsArea = specialItems.has(item.name) && !effectiveIsVolume;
        const isDimension = effectiveIsVolume || effectiveIsArea;

        const dims = dimensionInputs[item.name] || {
            length: "",
            width: "",
            height: "",
        };

        let computedQuantity = 0;
        if (isDimension) {
            const length = parseFloat(dims.length) || 0;
            const width = parseFloat(dims.width) || 0;
            const height = parseFloat(dims.height) || 0;
            computedQuantity = effectiveIsVolume
                ? length * width * height
                : length * width;
        }

        const handleDimensionChange = (e, field) => {
            const { value } = e.target;
            setDimensionInputs((prev) => ({
                ...prev,
                [item.name]: { ...dims, [field]: value },
            }));
        };

        const onAddClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (
                e.nativeEvent &&
                typeof e.nativeEvent.stopImmediatePropagation === "function"
            ) {
                e.nativeEvent.stopImmediatePropagation();
            }

            // Create a new entry with all item data
            const newEntry = {
                id: Date.now() + Math.random(),
                ...item, // Include all product data
                item: item.name, // Keep the item name for compatibility
                category: surveyForm.category,
                productId: item._id, // Store the product ID for reference
            };

            if (isDimension) {
                newEntry.number = computedQuantity;
                newEntry.length = dims.length;
                newEntry.width = dims.width;
                if (effectiveIsVolume) {
                    newEntry.height = dims.height;
                }
            } else {
                newEntry.number = 1;
            }

            handleAddSurvey(newEntry);
        };

        // Calculate how many of this item (with matching category) are in the surveyList
        const itemCount = (surveyList || []).reduce((acc, entry) => {
            // Use productId instead of item name for the match
            if (
                entry.productId === item._id &&
                entry.category === item.category
            ) {
                return acc + (entry.number || 1);
            }
            return acc;
        }, 0);

        // Check if customData exists and has content
        const hasCustomData =
            item.customData &&
            Array.isArray(item.customData) &&
            item.customData.length > 0;

        // Generate unique IDs for form elements
        const itemId = `item-${
            item._id || item.name.replace(/\s+/g, "-").toLowerCase()
        }`;

        return (
            <div
                style={{
                    width: "calc(33% - 1rem)",
                    margin: "0.5rem",
                    boxSizing: "border-box",
                }}
            >
                <div
                    className="p-card"
                    style={{
                        width: "100%",
                        height: "auto",
                        padding: "1rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        backgroundColor: itemCount > 0 ? "#f1f1f1" : "#fff", // Highlight cards that have items
                    }}
                >
                    <div>
                        <div
                            style={{
                                minHeight: "40px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            {/* Item name on the left and count (if any) right aligned */}
                            <h4 style={{ margin: "0 0 0.2rem 0" }}>
                                {item.name}
                            </h4>
                            {itemCount > 0 && (
                                <h4
                                    style={{
                                        margin: "0 0 0.2rem 0",
                                        backgroundColor: "#F9C400",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {itemCount}
                                </h4>
                            )}
                        </div>

                        {/* Display type if available */}
                        {item.type && (
                            <div
                                style={{
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                }}
                            >
                                <strong>Type: </strong>
                                <span>{item.type}</span>
                            </div>
                        )}

                        {/* Display customData fields with improved logic */}
                        {hasCustomData && (
                            <>
                                {item.customData.map((field, idx) => {
                                    // Skip if field is invalid
                                    if (!field || typeof field !== "object") {
                                        return null;
                                    }

                                    // Skip if no value
                                    if (
                                        field.value === null ||
                                        field.value === undefined ||
                                        field.value === ""
                                    ) {
                                        return null;
                                    }

                                    try {
                                        // Skip system fields
                                        if (
                                            field.fieldName === "__v" ||
                                            field.fieldName === "_id"
                                        ) {
                                            return null;
                                        }

                                        // Skip price/cost fields
                                        const fieldLabel =
                                            field.fieldName || "";
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

                                        // Get field ID as string
                                        const fieldIdStr = getFieldIdString(
                                            field.fieldId
                                        );

                                        // Get the custom field definition
                                        const customField =
                                            customFields[fieldIdStr];

                                        // Get prefix/suffix with fallbacks
                                        const prefix =
                                            field.prefix ||
                                            customField?.prefix ||
                                            "";
                                        const suffix =
                                            field.suffix ||
                                            customField?.suffix ||
                                            "";

                                        // Get label with fallbacks
                                        const label =
                                            field.fieldName ||
                                            customField?.label ||
                                            field.label ||
                                            `Field ${idx + 1}`;

                                        return (
                                            <div
                                                key={`${itemId}-field-${idx}`}
                                                style={{
                                                    marginBottom: "0.2rem",
                                                    fontSize: "0.9rem",
                                                }}
                                            >
                                                <strong>{label}: </strong>
                                                <span>
                                                    {prefix}
                                                    {field.value}
                                                    {suffix}
                                                </span>
                                            </div>
                                        );
                                    } catch (err) {
                                        console.error(
                                            "[SpecialistEquipmentForm] Error rendering custom field:",
                                            err
                                        );
                                        return null;
                                    }
                                })}
                            </>
                        )}

                        {isDimension && (
                            <div>
                                <div className="field">
                                    <label
                                        htmlFor={`${itemId}-length`}
                                        className="block"
                                    >
                                        Length
                                    </label>
                                    <InputText
                                        id={`${itemId}-length`}
                                        name={`${itemId}-length`}
                                        type="number"
                                        value={dims.length}
                                        onChange={(e) =>
                                            handleDimensionChange(e, "length")
                                        }
                                        placeholder="Enter Length"
                                        required
                                        style={{
                                            width: "100%",
                                            height: "40px",
                                            marginBottom: "0.2rem",
                                            border: dimensionHasData(
                                                item.name,
                                                "length"
                                            )
                                                ? "1px solid var(--primary-color)"
                                                : "",
                                        }}
                                    />
                                </div>
                                <div className="field">
                                    <label
                                        htmlFor={`${itemId}-width`}
                                        className="block"
                                    >
                                        Width
                                    </label>
                                    <InputText
                                        id={`${itemId}-width`}
                                        name={`${itemId}-width`}
                                        type="number"
                                        value={dims.width}
                                        onChange={(e) =>
                                            handleDimensionChange(e, "width")
                                        }
                                        placeholder="Enter Width"
                                        required
                                        style={{
                                            width: "100%",
                                            height: "40px",
                                            marginBottom: "0.2rem",
                                            border: dimensionHasData(
                                                item.name,
                                                "width"
                                            )
                                                ? "1px solid var(--primary-color)"
                                                : "",
                                        }}
                                    />
                                </div>
                                {effectiveIsVolume && (
                                    <div className="field">
                                        <label
                                            htmlFor={`${itemId}-height`}
                                            className="block"
                                        >
                                            Height
                                        </label>
                                        <InputText
                                            id={`${itemId}-height`}
                                            name={`${itemId}-height`}
                                            type="number"
                                            value={dims.height}
                                            onChange={(e) =>
                                                handleDimensionChange(
                                                    e,
                                                    "height"
                                                )
                                            }
                                            placeholder="Enter Height"
                                            required
                                            style={{
                                                width: "100%",
                                                height: "40px",
                                                marginBottom: "0.2rem",
                                                border: dimensionHasData(
                                                    item.name,
                                                    "height"
                                                )
                                                    ? "1px solid var(--primary-color)"
                                                    : "",
                                            }}
                                        />
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontWeight: "bold",
                                        marginTop: "0.5rem",
                                        visibility:
                                            computedQuantity > 0
                                                ? "visible"
                                                : "hidden",
                                    }}
                                >
                                    Total: {computedQuantity.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    <span
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            marginTop: "0.5rem",
                        }}
                    >
                        <Button
                            id={`add-item-${itemId}`}
                            name={`add-item-${itemId}`}
                            type="button"
                            aria-label={`Add ${item.name}`}
                            className="pi pi-plus"
                            onClick={onAddClick}
                            style={{
                                width: "70px",
                                height: "40px",
                                paddingRight: "12px",
                            }}
                        />
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Use PrimeReact TabView component exactly like in EquipmentForm */}
            <TabView
                activeIndex={activeTabIndex}
                onTabChange={handleTabChange}
                style={{ overflowX: "auto" }}
                id="specialist-equipment-tabs"
            >
                {categories && categories.map
                    ? categories.map((category) => (
                          <TabPanel
                              key={category}
                              header={category}
                              id={`tab-${category
                                  .replace(/\s+/g, "-")
                                  .toLowerCase()}`}
                          >
                              {/* Tab content can be left empty */}
                          </TabPanel>
                      ))
                    : null}
            </TabView>

            <div
                style={{
                    marginTop: "1rem",
                    height: "287px",
                    overflowY: "auto",
                }}
                id="specialist-equipment-items"
                aria-labelledby="specialist-equipment-tabs"
            >
                <DataView
                    value={sortedFilteredItems}
                    itemTemplate={itemTemplate}
                    layout="grid"
                    style={{ margin: "0", width: "100%" }}
                />
            </div>
        </div>
    );
}
