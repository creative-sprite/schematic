// components\kitchenSurvey\Structure.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { OverlayPanel } from "primereact/overlaypanel";
import "../../styles/surveyForm.css";
import DropItemGrade from "./DropItemGrade";

export default function Structure({
    onStructureTotalChange,
    onStructureCommentsChange,
    onSelectionDataChange,
    onDimensionsChange,
    initialStructureTotal = 0,
    initialSelectionData = [],
    initialDimensions = {},
    initialStructureComments = "",
}) {
    // Reference to the overlay panel for the info icon
    const op = useRef(null);

    // Fixed dropdown options for each row.
    const fixedOptions = [
        {
            base: "Ceiling",
            options: [
                "Ceiling",
                "Ceiling < all Structure",
                "Ceiling - Don't Clean",
            ],
        },
        {
            base: "Wall",
            options: ["Wall", "Wall < all Structure", "Wall - Don't Clean"],
        },
        {
            base: "Floor",
            options: ["Floor", "Floor < all Structure", "Floor - Don't Clean"],
        },
    ];

    // Initialize selectionData for each row.
    const [selectionData, setSelectionData] = useState(
        initialSelectionData && initialSelectionData.length > 0
            ? initialSelectionData
            : fixedOptions.map((row) => ({
                  type: row.options[0],
                  item: "",
                  grade: "",
              }))
    );

    // State for overall dimensions.
    // FIXED: Better handling of null/undefined values with explicit conversion
    const [dimensions, setDimensions] = useState({
        length:
            initialDimensions?.length !== undefined &&
            initialDimensions?.length !== null
                ? String(initialDimensions.length)
                : "",
        width:
            initialDimensions?.width !== undefined &&
            initialDimensions?.width !== null
                ? String(initialDimensions.width)
                : "",
        height:
            initialDimensions?.height !== undefined &&
            initialDimensions?.height !== null
                ? String(initialDimensions.height)
                : "",
    });

    // State for holding structure items fetched from the API.
    const [structureItems, setStructureItems] = useState([]);

    // State for storing the computed StructureTotal.
    const [structureTotal, setStructureTotal] = useState(
        initialStructureTotal || 0
    );

    // State for Structure Comments.
    const [structureComments, setStructureComments] = useState(
        initialStructureComments || ""
    );

    // Helper function to check if a dimension field has data
    const dimensionHasData = (field) => {
        return dimensions[field] && dimensions[field].trim() !== "";
    };

    // Helper function to check if comments field has data
    const commentsHasData = () => {
        return structureComments && structureComments.trim() !== "";
    };

    // Custom CSS styles for highlighting fields with data
    const customStyles = `
        .p-dropdown-highlighted {
            border-color: var(--primary-color) !important;
        }
        .p-inputtext-highlighted {
            border-color: var(--primary-color) !important;
        }
    `;

    // ADDED: Debug logging for selection data when it changes
    useEffect(() => {
        console.log("Structure: selectionData updated:", selectionData);
    }, [selectionData]);

    // ADDED: Debug logging for dimensions when they change
    useEffect(() => {
        console.log("Structure: dimensions updated:", dimensions);
    }, [dimensions]);

    // Helper function to check deep equality between arrays of objects
    const areArraysEqual = (arr1, arr2) => {
        if (arr1.length !== arr2.length) return false;

        for (let i = 0; i < arr1.length; i++) {
            const obj1 = arr1[i];
            const obj2 = arr2[i];

            for (const key in obj1) {
                if (obj1[key] !== obj2[key]) return false;
            }
            for (const key in obj2) {
                if (obj1[key] !== obj2[key]) return false;
            }
        }

        return true;
    };

    // Refs to track previous values to prevent unnecessary updates
    const prevInitialSelectionDataRef = useRef(null);
    const prevInitialDimensionsRef = useRef(null);
    const prevInitialCommentsRef = useRef(null);

    // For preventing initial callback cycles
    const isInitializedRef = useRef(false);

    // CRITICAL FIX: Combined initialization effect that runs only once on mount
    useEffect(() => {
        // Skip if already initialized
        if (isInitializedRef.current) return;

        // Mark as initialized immediately to prevent multiple runs
        isInitializedRef.current = true;

        // Initialize selection data if provided
        if (initialSelectionData && initialSelectionData.length > 0) {
            console.log(
                "Structure: Initializing selection data:",
                initialSelectionData
            );
            setSelectionData(initialSelectionData);
            prevInitialSelectionDataRef.current = JSON.parse(
                JSON.stringify(initialSelectionData)
            );
        }

        // Initialize dimensions if provided
        if (initialDimensions && Object.keys(initialDimensions).length > 0) {
            console.log(
                "Structure: Initializing dimensions:",
                initialDimensions
            );
            // FIXED: Ensure dimensions are properly initialized with string conversion
            setDimensions({
                length:
                    initialDimensions.length !== undefined &&
                    initialDimensions.length !== null
                        ? String(initialDimensions.length)
                        : "",
                width:
                    initialDimensions.width !== undefined &&
                    initialDimensions.width !== null
                        ? String(initialDimensions.width)
                        : "",
                height:
                    initialDimensions.height !== undefined &&
                    initialDimensions.height !== null
                        ? String(initialDimensions.height)
                        : "",
            });
            prevInitialDimensionsRef.current = { ...initialDimensions };
        }

        // Initialize comments if provided
        if (initialStructureComments) {
            setStructureComments(initialStructureComments);
            prevInitialCommentsRef.current = initialStructureComments;
        }

        // Initialize structureTotal
        if (initialStructureTotal) {
            setStructureTotal(initialStructureTotal);
        }

        // Fetch structure items when the component mounts
        const fetchStructureItems = async () => {
            try {
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    const items = json.data
                        .filter((itm) => itm.category === "Structure")
                        .map((item) => {
                            const newPrices = {};
                            if (item.prices) {
                                Object.keys(item.prices).forEach((grade) => {
                                    newPrices[grade] = Number(
                                        item.prices[grade]
                                    );
                                });
                            }
                            return { ...item, prices: newPrices };
                        });
                    console.log(
                        "Structure: Loaded structure items:",
                        items.length
                    );
                    // ADDED: Debug logging to see what floor items are available
                    const floorItems = items.filter(
                        (item) => item.subcategory === "Floor"
                    );
                    console.log(
                        "Structure: Floor items available:",
                        floorItems.map((i) => i.item)
                    );
                    setStructureItems(items);
                } else {
                    console.error("Failed to fetch structure items:", json);
                }
            } catch (error) {
                console.error("Error fetching structure items:", error);
            }
        };

        fetchStructureItems();
    }, []); // Empty dependency array ensures this runs only once

    // CRITICAL FIX: Improved debounced update mechanism for callbacks
    const updateTimeoutRef = useRef(null);
    const pendingUpdatesRef = useRef({
        total: false,
        comments: false,
        dimensions: false,
        selectionData: false,
    });

    // IMPROVED: More reliable callback to notify parent component of changes
    const notifyParent = () => {
        // Clear any existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Immediate notification for critical data to prevent loss during save
        if (isInitializedRef.current) {
            // Always notify of selection data changes immediately
            if (typeof onSelectionDataChange === "function") {
                console.log(
                    "Structure: Immediately notifying parent of selection data:",
                    selectionData
                );
                onSelectionDataChange(selectionData);
                pendingUpdatesRef.current.selectionData = false;
            }

            // Always notify of dimensions changes immediately
            if (typeof onDimensionsChange === "function") {
                // Convert dimensions to numbers before sending to parent
                const numericDimensions = {
                    length:
                        dimensions.length !== ""
                            ? Number(dimensions.length)
                            : null,
                    width:
                        dimensions.width !== ""
                            ? Number(dimensions.width)
                            : null,
                    height:
                        dimensions.height !== ""
                            ? Number(dimensions.height)
                            : null,
                };
                console.log(
                    "Structure: Immediately notifying parent of dimensions:",
                    numericDimensions
                );
                onDimensionsChange(numericDimensions);
                pendingUpdatesRef.current.dimensions = false;
            }
        }

        // Use a short timeout for total and comments (less critical)
        updateTimeoutRef.current = setTimeout(() => {
            if (isInitializedRef.current) {
                if (
                    typeof onStructureTotalChange === "function" &&
                    pendingUpdatesRef.current.total
                ) {
                    console.log(
                        "Structure: Notifying parent of total change:",
                        structureTotal
                    );
                    onStructureTotalChange(structureTotal);
                    pendingUpdatesRef.current.total = false;
                }

                if (
                    typeof onStructureCommentsChange === "function" &&
                    pendingUpdatesRef.current.comments
                ) {
                    console.log(
                        "Structure: Notifying parent of comments change"
                    );
                    onStructureCommentsChange(structureComments);
                    pendingUpdatesRef.current.comments = false;
                }
            }
        }, 50); // Shorter timeout for better responsiveness
    };

    // Enhanced effect to handle parent callbacks and compute totals
    useEffect(() => {
        // Skip initial re-computation to avoid loops
        if (!isInitializedRef.current) return;

        // Compute new total
        const typeTemp = computeStructureTypeTemp();
        const sizeTemp = computeStructureSizeTemp();
        const total = typeTemp * sizeTemp;

        // Only update state if the value changed
        if (total !== structureTotal) {
            setStructureTotal(total);
            pendingUpdatesRef.current.total = true;
        }

        // Always mark selection data for immediate update
        pendingUpdatesRef.current.selectionData = true;

        // Notify parent of changes (includes immediate notification for selection data)
        notifyParent();

        // Cleanup on unmount
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [selectionData, structureItems]);

    // Enhanced effect for dimension changes with immediate notification
    useEffect(() => {
        // Skip initial re-computation to avoid loops
        if (!isInitializedRef.current) return;

        // Compute new total based on updated dimensions
        const typeTemp = computeStructureTypeTemp();
        const sizeTemp = computeStructureSizeTemp();
        const total = typeTemp * sizeTemp;

        // Only update state if the value changed
        if (total !== structureTotal) {
            setStructureTotal(total);
            pendingUpdatesRef.current.total = true;
        }

        // Always mark dimensions for immediate update
        pendingUpdatesRef.current.dimensions = true;

        // Force an immediate update for dimensions to ensure they're captured
        notifyParent();
    }, [dimensions]);

    // Enhanced effect for comments changes
    useEffect(() => {
        // Skip initial re-computation to avoid loops
        if (!isInitializedRef.current) return;

        // Mark comments for update
        pendingUpdatesRef.current.comments = true;

        // Update parent immediately
        notifyParent();
    }, [structureComments]);

    // Additional effect to ensure data is synced before component unmounts
    useEffect(() => {
        return () => {
            // Force final notification of any pending changes on unmount
            if (isInitializedRef.current) {
                console.log("Structure: Sending final update on unmount");

                // Immediately notify all changes
                if (typeof onSelectionDataChange === "function") {
                    onSelectionDataChange(selectionData);
                }

                if (typeof onDimensionsChange === "function") {
                    const numericDimensions = {
                        length:
                            dimensions.length !== ""
                                ? Number(dimensions.length)
                                : null,
                        width:
                            dimensions.width !== ""
                                ? Number(dimensions.width)
                                : null,
                        height:
                            dimensions.height !== ""
                                ? Number(dimensions.height)
                                : null,
                    };
                    onDimensionsChange(numericDimensions);
                }

                if (typeof onStructureTotalChange === "function") {
                    onStructureTotalChange(structureTotal);
                }

                if (typeof onStructureCommentsChange === "function") {
                    onStructureCommentsChange(structureComments);
                }
            }
        };
    }, [selectionData, dimensions, structureTotal, structureComments]);

    // Helper function to get the default grade, preferring "B" if available.
    const getDefaultGrade = (type, item) => {
        const selected = structureItems
            .filter((itm) => itm.subcategory === type) // Filter items matching the type
            .find((itm) => itm.item === item); // Find the item that matches the selected item
        if (selected && selected.prices) {
            const grades = Object.keys(selected.prices).sort((a, b) =>
                a.localeCompare(b)
            ); // Sorted array of grade keys
            if (grades.includes("B")) return "B";
            return grades[0] || "";
        }
        return "";
    };

    // FIXED: Improved update selection data function with validation
    const updateSelectionData = (index, field, value) => {
        console.log(
            `Structure: Updating selection[${index}].${field} to:`,
            value
        );

        setSelectionData((prev) => {
            const newData = [...prev]; // Create a copy of the selectionData array

            // Ensure the row exists
            if (!newData[index]) {
                console.warn(
                    `Structure: Row ${index} doesn't exist in selectionData`
                );
                return prev;
            }

            // Create updated row with validation
            const updatedRow = { ...newData[index], [field]: value };

            // For item field, ensure it's not empty unless it's allowed to be
            if (
                field === "item" &&
                value === "" &&
                updatedRow.type === "Floor"
            ) {
                console.log(
                    "Structure: Special handling for Floor item selection"
                );
                // Special handling for Floor can go here if needed
            }

            newData[index] = updatedRow;

            // Return the updated array
            return newData;
        });
    };

    // Handle change in the type dropdown.
    const handleTypeChange = (index, e) => {
        updateSelectionData(index, "type", e.value);
        updateSelectionData(index, "item", "");
        updateSelectionData(index, "grade", "");
    };

    // Handle change in the item dropdown.
    const handleItemChange = (index, e) => {
        console.log(`Structure: Item changed for row ${index} to:`, e.value);
        updateSelectionData(index, "item", e.value);
        // Set default grade to "B" if available, else to the first available grade.
        const defaultGrade = getDefaultGrade(
            selectionData[index].type,
            e.value
        );
        updateSelectionData(index, "grade", defaultGrade);
    };

    // Function to handle cycling through grade options when the button is pressed.
    const handleGradeCycle = (index) => {
        const row = selectionData[index];
        const selected = structureItems
            .filter((itm) => itm.subcategory === row.type) // Filter items matching the type
            .find((itm) => itm.item === row.item); // Find the item matching the selected item
        if (selected && selected.prices) {
            const grades = Object.keys(selected.prices).sort((a, b) =>
                a.localeCompare(b)
            ); // Sorted array of grade keys
            let currentIndex = grades.indexOf(row.grade);
            if (currentIndex === -1) {
                // If current grade is not found, try to set it to "B" or default to the first grade
                currentIndex = grades.indexOf("B");
                if (currentIndex === -1) currentIndex = 0;
            }
            const nextIndex = (currentIndex + 1) % grades.length;
            updateSelectionData(index, "grade", grades[nextIndex]);
        }
    };

    // FIXED: Improved dimension change handler with better validation
    const handleDimensionChange = (field, e) => {
        const value = e.target.value;
        console.log(`Structure: Dimension ${field} changing to:`, value);

        // Basic validation - ensure it's a valid number or empty string
        const numValue = value === "" ? "" : Number(value);

        // Check for NaN and handle appropriately
        if (value !== "" && isNaN(numValue)) {
            console.warn(`Structure: Invalid number for ${field}:`, value);
            return; // Don't update with invalid value
        }

        // Update dimensions with validated value
        setDimensions((prev) => {
            // Create a new object to avoid direct mutation
            const newDimensions = { ...prev };

            // Update the specific field with the validated value
            newDimensions[field] = value;

            return newDimensions;
        });
    };

    // Compute StructureTypeTemp by summing the grade prices.
    const computeStructureTypeTemp = () => {
        return selectionData.reduce((acc, row) => {
            let price = 0;
            if (row.item && row.grade) {
                const found = structureItems.find(
                    (itm) =>
                        itm.subcategory === row.type && itm.item === row.item
                );
                if (found && found.prices && found.prices[row.grade] != null) {
                    price = Number(found.prices[row.grade]);
                }
            }
            return acc + price;
        }, 0);
    };

    // FIXED: Improved dimension computation with better null/empty handling
    const computeStructureSizeTemp = () => {
        // Use default of 1 for empty dimensions to avoid multiplication by zero
        const length = dimensions.length ? Number(dimensions.length) : 1;
        const width = dimensions.width ? Number(dimensions.width) : 1;
        const height = dimensions.height ? Number(dimensions.height) : 1;

        // Ensure values are valid numbers, defaulting to 1 if NaN
        const safeLength = isNaN(length) ? 1 : length;
        const safeWidth = isNaN(width) ? 1 : width;
        const safeHeight = isNaN(height) ? 1 : height;

        return safeLength * safeWidth * safeHeight;
    };

    // Map each row index to its corresponding dimension key.
    const dimensionKey = ["length", "width", "height"];

    return (
        <>
            <style>{customStyles}</style>
            <div
                className="structure-container structure-data"
                style={{ position: "relative" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    <h2 style={{ marginRight: "10px" }}>Structure Survey</h2>
                    <i
                        className="pi pi-info-circle"
                        style={{
                            cursor: "pointer",
                            fontSize: "1.2rem",
                        }}
                        onClick={(e) => op.current.toggle(e)}
                    />
                    <OverlayPanel ref={op} style={{ width: "300px" }}>
                        <div className="p-2">Enter structure details below</div>
                    </OverlayPanel>
                </div>

                {selectionData.map((row, index) => (
                    <span
                        key={index}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginBottom: "1rem",
                            gap: "0.5rem",
                        }}
                    >
                        <Dropdown
                            value={row.type}
                            options={fixedOptions[index].options.map((opt) => ({
                                label: opt,
                                value: opt,
                            }))}
                            onChange={(e) => handleTypeChange(index, e)}
                            placeholder="Select Type"
                            style={{
                                height: "40px",
                                width: "207px",
                                maxWidth: "400px",
                                border: dimensionHasData(dimensionKey[index])
                                    ? "1px solid var(--primary-color)"
                                    : "",
                            }}
                        />
                        <DropItemGrade
                            items={structureItems
                                .filter((itm) => itm.subcategory === row.type)
                                .sort((a, b) => a.item.localeCompare(b.item))}
                            value={{ item: row.item, grade: row.grade }}
                            onChange={(val) => {
                                console.log(
                                    `Structure: DropItemGrade onChange for row ${index}:`,
                                    val
                                );
                                if (val.item !== row.item) {
                                    // If item changed, update it and get appropriate default grade
                                    updateSelectionData(
                                        index,
                                        "item",
                                        val.item
                                    );
                                    const defaultGrade = getDefaultGrade(
                                        row.type,
                                        val.item
                                    );
                                    updateSelectionData(
                                        index,
                                        "grade",
                                        val.grade || defaultGrade
                                    );
                                } else {
                                    // If only grade changed, just update that
                                    updateSelectionData(
                                        index,
                                        "grade",
                                        val.grade
                                    );
                                }
                            }}
                            placeholder="Type & Grade"
                            className=""
                        />
                        <InputText
                            type="number"
                            placeholder={
                                dimensionKey[index].charAt(0).toUpperCase() +
                                dimensionKey[index].slice(1)
                            }
                            value={dimensions[dimensionKey[index]]}
                            onChange={(e) =>
                                handleDimensionChange(dimensionKey[index], e)
                            }
                            style={{
                                height: "40px",
                                width: "93px",
                                border: dimensionHasData(dimensionKey[index])
                                    ? "1px solid var(--primary-color)"
                                    : "",
                            }}
                            className="structure-dimensions"
                        />
                    </span>
                ))}
                <div style={{ marginTop: "1rem" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontWeight: "bold",
                        }}
                    >
                        Structure Comments
                    </label>
                    <InputTextarea
                        value={structureComments}
                        onChange={(e) => setStructureComments(e.target.value)}
                        rows={3}
                        style={{
                            width: "100%",
                            minWidth: "250px",
                            padding: "0.5rem",
                            border: commentsHasData()
                                ? "1px solid var(--primary-color)"
                                : "1px solid #ced4da",
                            borderRadius: "4px",
                        }}
                        tabIndex={0}
                    />
                </div>
            </div>
        </>
    );
}
