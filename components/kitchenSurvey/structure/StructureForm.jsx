// components/kitchenSurvey/StructureForm.jsx
"use client";

import React, { useState, useCallback, memo } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import DropItemGrade from "../DropItemGrade";

/**
 * Enhanced StructureForm component for individual structure entries
 * Based on the pattern from CanopyForm
 */
const StructureForm = memo(({ structureItems, handleAddEntry }) => {
    // Fixed dropdown options for each row
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

    // Initialize form state
    const [form, setForm] = useState({
        selectionData: fixedOptions.map((row) => ({
            type: row.options[0],
            item: "",
            grade: "",
        })),
        dimensions: {
            length: "",
            width: "",
            height: "",
        },
        comments: "",
    });

    // Validation state
    const [validationState, setValidationState] = useState({
        selectionData: [
            { type: true, item: true, grade: true },
            { type: true, item: true, grade: true },
            { type: true, item: true, grade: true },
        ],
        dimensions: {
            length: true,
            width: true,
            height: true,
        },
    });

    // Helper function to check if a field has data
    const fieldHasData = useCallback(
        (section, index, field) => {
            if (section === "dimensions") {
                return (
                    form.dimensions[field] !== null &&
                    form.dimensions[field] !== undefined &&
                    form.dimensions[field] !== ""
                );
            } else if (section === "selectionData") {
                return (
                    form.selectionData[index][field] !== null &&
                    form.selectionData[index][field] !== undefined &&
                    form.selectionData[index][field] !== ""
                );
            }
            return false;
        },
        [form]
    );

    // Handle type change in dropdown
    const handleTypeChange = useCallback((index, value) => {
        setForm((prev) => {
            const newSelectionData = [...prev.selectionData];
            newSelectionData[index] = {
                type: value,
                item: "", // Reset item when type changes
                grade: "", // Reset grade when type changes
            };
            return {
                ...prev,
                selectionData: newSelectionData,
            };
        });

        // Update validation state
        setValidationState((prev) => {
            const newSelectionValidation = [...prev.selectionData];
            newSelectionValidation[index] = {
                ...newSelectionValidation[index],
                type: true,
                item: true, // Reset validation since we're clearing the value
                grade: true, // Reset validation since we're clearing the value
            };
            return {
                ...prev,
                selectionData: newSelectionValidation,
            };
        });
    }, []);

    // Handle item/grade change
    const handleItemGradeChange = useCallback((index, values) => {
        setForm((prev) => {
            const newSelectionData = [...prev.selectionData];
            newSelectionData[index] = {
                ...newSelectionData[index],
                item: values.item,
                grade: values.grade,
            };
            return {
                ...prev,
                selectionData: newSelectionData,
            };
        });

        // Update validation state
        setValidationState((prev) => {
            const newSelectionValidation = [...prev.selectionData];
            newSelectionValidation[index] = {
                ...newSelectionValidation[index],
                item: !!values.item,
                grade: !!values.grade,
            };
            return {
                ...prev,
                selectionData: newSelectionValidation,
            };
        });
    }, []);

    // Handle dimension change
    const handleDimensionChange = useCallback((field, value) => {
        setForm((prev) => ({
            ...prev,
            dimensions: {
                ...prev.dimensions,
                [field]: value,
            },
        }));

        // Update validation state
        setValidationState((prev) => ({
            ...prev,
            dimensions: {
                ...prev.dimensions,
                [field]: value !== null && value !== "" && Number(value) > 0,
            },
        }));
    }, []);

    // Handle comments change
    const handleCommentsChange = useCallback((value) => {
        setForm((prev) => ({
            ...prev,
            comments: value,
        }));
    }, []);

    // Get default grade for an item
    const getDefaultGrade = useCallback(
        (type, item) => {
            const selected = structureItems
                .filter((itm) => itm.subcategory === type)
                .find((itm) => itm.item === item);

            if (selected && selected.prices) {
                const grades = Object.keys(selected.prices).sort((a, b) =>
                    a.localeCompare(b)
                );
                if (grades.includes("B")) return "B";
                return grades[0] || "";
            }
            return "";
        },
        [structureItems]
    );

    // Handle form submission with validation
    const handleFormSubmit = useCallback(
        (e) => {
            e.preventDefault();

            // Validate all required fields
            const dimensionsValid =
                fieldHasData("dimensions", null, "length") &&
                fieldHasData("dimensions", null, "width") &&
                fieldHasData("dimensions", null, "height");

            const selectionDataValid = form.selectionData.every(
                (row, index) =>
                    fieldHasData("selectionData", index, "type") &&
                    fieldHasData("selectionData", index, "item") &&
                    fieldHasData("selectionData", index, "grade")
            );

            // Update validation state to show indicators
            setValidationState({
                selectionData: form.selectionData.map((row, index) => ({
                    type: fieldHasData("selectionData", index, "type"),
                    item: fieldHasData("selectionData", index, "item"),
                    grade: fieldHasData("selectionData", index, "grade"),
                })),
                dimensions: {
                    length: fieldHasData("dimensions", null, "length"),
                    width: fieldHasData("dimensions", null, "width"),
                    height: fieldHasData("dimensions", null, "height"),
                },
            });

            // If valid, call the parent handler
            if (dimensionsValid && selectionDataValid) {
                // Convert dimensions to numbers
                const numericDimensions = {
                    length: Number(form.dimensions.length),
                    width: Number(form.dimensions.width),
                    height: Number(form.dimensions.height),
                };

                // Create a new entry
                const newEntry = {
                    id: Date.now().toString(), // Unique ID
                    selectionData: [...form.selectionData],
                    dimensions: numericDimensions,
                    comments: form.comments,
                };

                // Call parent handler
                handleAddEntry(newEntry);

                // Reset form
                setForm({
                    selectionData: fixedOptions.map((row) => ({
                        type: row.options[0],
                        item: "",
                        grade: "",
                    })),
                    dimensions: {
                        length: "",
                        width: "",
                        height: "",
                    },
                    comments: "",
                });

                // Reset validation state
                setValidationState({
                    selectionData: [
                        { type: true, item: true, grade: true },
                        { type: true, item: true, grade: true },
                        { type: true, item: true, grade: true },
                    ],
                    dimensions: {
                        length: true,
                        width: true,
                        height: true,
                    },
                });
            }
        },
        [form, fieldHasData, handleAddEntry]
    );

    // Style for input fields
    const getFieldStyle = useCallback(
        (field) => {
            const hasData = fieldHasData("dimensions", null, field);
            const isValid = validationState.dimensions[field];

            const style = {
                width: "92px",
                height: "40px",
            };

            if (!isValid) {
                return {
                    ...style,
                    border: "1px solid red",
                    boxShadow: "0 0 0 1px red",
                };
            }

            if (hasData) {
                return {
                    ...style,
                    border: "1px solid var(--primary-color)",
                };
            }

            return style;
        },
        [fieldHasData, validationState]
    );

    return (
        <div className="structure-entry-form" style={{ marginBottom: "2rem" }}>
            <div
                className="p-card"
                style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: "1px solid #e0e0e0",
                }}
            >
                <h2
                    style={{
                        marginTop: 0,
                        marginBottom: "1rem",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "0.5rem",
                    }}
                >
                    Add Structure
                </h2>

                {/* Ceiling, Wall, Floor rows */}
                {form.selectionData.map((row, index) => (
                    <div
                        key={`row-${index}`}
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
                            onChange={(e) => handleTypeChange(index, e.value)}
                            placeholder="Select Type"
                            style={{
                                height: "40px",
                                width: "207px",
                                maxWidth: "400px",
                                border: !validationState.selectionData[index]
                                    .type
                                    ? "1px solid red"
                                    : fieldHasData(
                                          "selectionData",
                                          index,
                                          "type"
                                      )
                                    ? "1px solid var(--primary-color)"
                                    : "",
                            }}
                        />
                        <DropItemGrade
                            items={structureItems
                                .filter((itm) => itm.subcategory === row.type)
                                .sort((a, b) => a.item.localeCompare(b.item))}
                            value={{ item: row.item, grade: row.grade }}
                            onChange={(val) =>
                                handleItemGradeChange(index, val)
                            }
                            placeholder="Type & Grade"
                            style={
                                !validationState.selectionData[index].item ||
                                !validationState.selectionData[index].grade
                                    ? {
                                          border: "1px solid red",
                                          boxShadow: "0 0 0 1px red",
                                      }
                                    : {}
                            }
                        />
                    </div>
                ))}

                {/* Dimensions row */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                    }}
                >
                    <InputText
                        type="number"
                        placeholder="Length"
                        value={form.dimensions.length}
                        onChange={(e) =>
                            handleDimensionChange("length", e.target.value)
                        }
                        style={getFieldStyle("length")}
                        required
                    />
                    <InputText
                        type="number"
                        placeholder="Width"
                        value={form.dimensions.width}
                        onChange={(e) =>
                            handleDimensionChange("width", e.target.value)
                        }
                        style={getFieldStyle("width")}
                        required
                    />
                    <InputText
                        type="number"
                        placeholder="Height"
                        value={form.dimensions.height}
                        onChange={(e) =>
                            handleDimensionChange("height", e.target.value)
                        }
                        style={getFieldStyle("height")}
                        required
                    />
                </div>

                {/* Comments */}
                <div style={{ marginBottom: "1rem" }}>
                    <textarea
                        placeholder="Comments for this structure..."
                        value={form.comments}
                        onChange={(e) => handleCommentsChange(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ced4da",
                            minHeight: "80px",
                            border: form.comments
                                ? "1px solid var(--primary-color)"
                                : "",
                        }}
                    />
                </div>

                {/* Add Button */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <Button
                        icon="pi pi-plus"
                        label="Add Structure"
                        onClick={handleFormSubmit}
                        style={{ height: "40px" }}
                    />
                </div>
            </div>
        </div>
    );
});

// Set display name for debugging
StructureForm.displayName = "StructureEntryForm";

export default StructureForm;
