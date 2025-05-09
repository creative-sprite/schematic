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
    const [dimensions, setDimensions] = useState({
        length: initialDimensions?.length || "",
        width: initialDimensions?.width || "",
        height: initialDimensions?.height || "",
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
            setSelectionData(initialSelectionData);
            prevInitialSelectionDataRef.current = JSON.parse(
                JSON.stringify(initialSelectionData)
            );
        }

        // Initialize dimensions if provided
        if (initialDimensions && Object.keys(initialDimensions).length > 0) {
            setDimensions({
                length: initialDimensions.length || "",
                width: initialDimensions.width || "",
                height: initialDimensions.height || "",
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

    // CRITICAL FIX: Use a debounced update mechanism for callbacks
    const updateTimeoutRef = useRef(null);

    // Combined callback to notify parent component of changes
    const notifyParent = () => {
        // Clear any existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Set a timeout to call parent callbacks
        updateTimeoutRef.current = setTimeout(() => {
            // Only call parent callbacks if initialized
            if (isInitializedRef.current) {
                if (typeof onStructureTotalChange === "function") {
                    onStructureTotalChange(structureTotal);
                }

                if (typeof onStructureCommentsChange === "function") {
                    onStructureCommentsChange(structureComments);
                }

                if (typeof onDimensionsChange === "function") {
                    onDimensionsChange(dimensions);
                }

                if (typeof onSelectionDataChange === "function") {
                    onSelectionDataChange(selectionData);
                }
            }
        }, 50);
    };

    // Single effect to handle parent callbacks and compute totals
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
        }

        // Notify parent of changes
        notifyParent();

        // Cleanup on unmount
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [selectionData, dimensions, structureComments, structureItems]);

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

    // Update selectionData for a given row.
    const updateSelectionData = (index, field, value) => {
        setSelectionData((prev) => {
            const newData = [...prev]; // Create a copy of the selectionData array
            newData[index] = { ...newData[index], [field]: value }; // Update the specified field for the row
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

    // Handle change in overall dimensions.
    const handleDimensionChange = (field, e) => {
        setDimensions((prev) => ({ ...prev, [field]: e.target.value }));
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

    // Compute StructureSizeTemp as the product of overall dimensions.
    const computeStructureSizeTemp = () => {
        const length = Number(dimensions.length) || 1;
        const width = Number(dimensions.width) || 1;
        const height = Number(dimensions.height) || 1;
        return length * width * height;
    };

    // Map each row index to its corresponding dimension key.
    const dimensionKey = ["length", "width", "height"];

    return (
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
                        }}
                        className=""
                    />
                    <DropItemGrade
                        items={structureItems
                            .filter((itm) => itm.subcategory === row.type)
                            .sort((a, b) => a.item.localeCompare(b.item))}
                        value={{ item: row.item, grade: row.grade }}
                        onChange={(val) => {
                            if (val.item !== row.item) {
                                // If item changed, update it and get appropriate default grade
                                updateSelectionData(index, "item", val.item);
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
                                updateSelectionData(index, "grade", val.grade);
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
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                    }}
                    tabIndex={0}
                />
            </div>
        </div>
    );
}
