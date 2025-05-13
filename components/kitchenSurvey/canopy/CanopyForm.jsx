"use client";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import DropItemGrade from "../DropItemGrade"; // Combined item/grade selector component
import { memo, useMemo, useState, useCallback } from "react";

/**
 * Enhanced CanopyForm component that's optimized for performance
 * with memoization and preventing unnecessary re-renders
 */
const CanopyForm = memo(
    ({ form, handleChange, canopyItems, filterItems, handleAddEntry }) => {
        // Local state for input validation
        const [validationState, setValidationState] = useState({
            canopy: {
                item: true,
                grade: true,
                length: true,
                width: true,
                height: true,
            },
            filter: {
                item: true,
                grade: true,
                number: true,
                length: true,
                width: true,
                height: true,
            },
        });

        // Memoized helper function to check if a field has data
        const fieldHasData = useCallback(
            (section, field) => {
                return (
                    form[section][field] !== null &&
                    form[section][field] !== undefined &&
                    form[section][field] !== ""
                );
            },
            [form]
        );

        // Memoized handler for dimension input validation
        const handleDimensionChange = useCallback(
            (section, field, value) => {
                // Update validation state for this field
                setValidationState((prev) => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]:
                            value !== null && value !== "" && Number(value) > 0,
                    },
                }));

                // Call the parent handler
                handleChange(section, field, value);
            },
            [handleChange]
        );

        // Handle adding entry with extra validation
        const handleFormSubmit = useCallback(
            (e) => {
                e.preventDefault();

                // Validate all required fields have values
                const canopyValid =
                    fieldHasData("canopy", "item") &&
                    fieldHasData("canopy", "grade") &&
                    fieldHasData("canopy", "length") &&
                    fieldHasData("canopy", "width") &&
                    fieldHasData("canopy", "height");

                const filterValid =
                    fieldHasData("filter", "item") &&
                    fieldHasData("filter", "grade") &&
                    fieldHasData("filter", "number");

                // Update validation state to show indicators
                setValidationState({
                    canopy: {
                        item: fieldHasData("canopy", "item"),
                        grade: fieldHasData("canopy", "grade"),
                        length: fieldHasData("canopy", "length"),
                        width: fieldHasData("canopy", "width"),
                        height: fieldHasData("canopy", "height"),
                    },
                    filter: {
                        item: fieldHasData("filter", "item"),
                        grade: fieldHasData("filter", "grade"),
                        number: fieldHasData("filter", "number"),
                        length: true, // Optional for filter
                        width: true, // Optional for filter
                        height: true, // Optional for filter
                    },
                });

                // If valid, call the parent handler
                if (canopyValid && filterValid) {
                    handleAddEntry(e);

                    // Reset validation state after successful submission
                    setValidationState({
                        canopy: {
                            item: true,
                            grade: true,
                            length: true,
                            width: true,
                            height: true,
                        },
                        filter: {
                            item: true,
                            grade: true,
                            number: true,
                            length: true,
                            width: true,
                            height: true,
                        },
                    });
                }
            },
            [fieldHasData, handleAddEntry, form]
        );

        // Memoized handler for item/grade selection
        const handleItemGradeChange = useCallback(
            (section, values) => {
                handleChange(section, "item", values.item);
                handleChange(section, "grade", values.grade);

                // Update validation state
                setValidationState((prev) => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        item: !!values.item,
                        grade: !!values.grade,
                    },
                }));
            },
            [handleChange]
        );

        // Input error style for invalid fields
        const getInputErrorStyle = useCallback(
            (section, field) => {
                return !validationState[section][field]
                    ? {
                          borderColor: "red",
                          boxShadow: "0 0 0 1px red",
                      }
                    : {};
            },
            [validationState]
        );

        // Add a CSS class if field has data (for styling)
        const getFieldStyle = useCallback(
            (section, field) => {
                const hasData = fieldHasData(section, field);
                const isValid = validationState[section][field];

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
            <div className="canopy-entry-form" style={{ marginBottom: "2rem" }}>
                {/* Cards Container - Flex row on large screens, column on small */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: "1rem",
                        width: "100%",
                    }}
                >
                    {/* Canopy Card */}
                    <div
                        className="p-card"
                        style={{
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            border: "1px solid #e0e0e0",
                            flex: "1 1 300px", // Flex grow, shrink and basis
                            minWidth: "300px", // Minimum width before wrapping
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
                            Canopy
                        </h2>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginRight: "1rem",
                            }}
                        >
                            {/* All inputs directly in the same row */}
                            <DropItemGrade
                                items={canopyItems}
                                value={{
                                    item: form.canopy.item,
                                    grade: form.canopy.grade,
                                }}
                                onChange={(val) =>
                                    handleItemGradeChange("canopy", val)
                                }
                                placeholder="Material & Grade"
                                style={
                                    !validationState.canopy.item ||
                                    !validationState.canopy.grade
                                        ? {
                                              border: "1px solid red",
                                              boxShadow: "0 0 0 1px red",
                                          }
                                        : {}
                                }
                            />
                        </div>
                        <br />
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                            }}
                        >
                            {/* Length */}
                            <InputText
                                type="number"
                                name="length"
                                value={form.canopy.length ?? ""}
                                onChange={(e) =>
                                    handleDimensionChange(
                                        "canopy",
                                        "length",
                                        e.target.value
                                    )
                                }
                                placeholder="Length"
                                required
                                style={getFieldStyle("canopy", "length")}
                            />

                            {/* Width */}
                            <InputText
                                type="number"
                                name="width"
                                value={form.canopy.width ?? ""}
                                onChange={(e) =>
                                    handleDimensionChange(
                                        "canopy",
                                        "width",
                                        e.target.value
                                    )
                                }
                                placeholder="Width"
                                required
                                style={getFieldStyle("canopy", "width")}
                            />

                            {/* Height */}
                            <InputText
                                type="number"
                                name="height"
                                value={form.canopy.height ?? ""}
                                onChange={(e) =>
                                    handleDimensionChange(
                                        "canopy",
                                        "height",
                                        e.target.value
                                    )
                                }
                                placeholder="Height"
                                required
                                style={getFieldStyle("canopy", "height")}
                            />
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div
                        className="p-card"
                        style={{
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            border: "1px solid #e0e0e0",
                            flex: "1 1 300px", // Flex grow, shrink and basis
                            minWidth: "300px", // Minimum width before wrapping
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
                            Filter
                        </h2>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem", // Consistent 0.5rem gap throughout
                            }}
                        >
                            {/* All inputs directly in the same row */}
                            <DropItemGrade
                                items={filterItems}
                                value={{
                                    item: form.filter.item,
                                    grade: form.filter.grade,
                                }}
                                onChange={(val) =>
                                    handleItemGradeChange("filter", val)
                                }
                                placeholder="Filter & Grade"
                                style={
                                    !validationState.filter.item ||
                                    !validationState.filter.grade
                                        ? {
                                              border: "1px solid red",
                                              boxShadow: "0 0 0 1px red",
                                          }
                                        : {}
                                }
                            />
                            {/* Number */}
                            <InputText
                                type="number"
                                name="number"
                                value={form.filter.number ?? ""}
                                onChange={(e) =>
                                    handleDimensionChange(
                                        "filter",
                                        "number",
                                        e.target.value
                                    )
                                }
                                placeholder="Number"
                                required
                                style={getFieldStyle("filter", "number")}
                            />
                        </div>

                        <br />

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem", // Consistent 0.5rem gap throughout
                            }}
                        >
                            {/* Length */}
                            <InputText
                                type="number"
                                name="length"
                                value={form.filter.length ?? ""}
                                onChange={(e) =>
                                    handleChange(
                                        "filter",
                                        "length",
                                        e.target.value
                                    )
                                }
                                placeholder="Length"
                                style={{
                                    width: "92px",
                                    height: "40px",
                                    border: fieldHasData("filter", "length")
                                        ? "1px solid var(--primary-color)"
                                        : "",
                                }}
                            />

                            {/* Width */}
                            <InputText
                                type="number"
                                name="width"
                                value={form.filter.width ?? ""}
                                onChange={(e) =>
                                    handleChange(
                                        "filter",
                                        "width",
                                        e.target.value
                                    )
                                }
                                placeholder="Width"
                                style={{
                                    width: "92px",
                                    height: "40px",
                                    border: fieldHasData("filter", "width")
                                        ? "1px solid var(--primary-color)"
                                        : "",
                                }}
                            />

                            {/* Height */}
                            <InputText
                                type="number"
                                name="height"
                                value={form.filter.height ?? ""}
                                onChange={(e) =>
                                    handleChange(
                                        "filter",
                                        "height",
                                        e.target.value
                                    )
                                }
                                placeholder="Height"
                                style={{
                                    width: "92px",
                                    height: "40px",
                                    border: fieldHasData("filter", "height")
                                        ? "1px solid var(--primary-color)"
                                        : "",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "1rem",
                    }}
                >
                    <Button
                        icon="pi pi-plus"
                        label="Add Entry"
                        onClick={handleFormSubmit}
                        style={{ height: "40px" }}
                    />
                </div>
            </div>
        );
    }
);

// Set display name for debugging
CanopyForm.displayName = "CanopyEntryForm";

export default CanopyForm;
