// components\kitchenSurvey\Schematic\SchematicListParts\DimensionInputs.jsx

"use client";
import React, { useEffect, useState, useRef } from "react";
import { InputNumber } from "primereact/inputnumber";

// DimensionInputs: renders the input rows for Length, Width, Height, and Inaccessible
// Props:
// - item: the actual item object containing dimension values
// - handleDimensionChange: function to call when an input value changes
const DimensionInputs = ({ item, handleDimensionChange }) => {
    // Create controlled state for each dimension to prevent uncontrolled/controlled warnings
    // and ensure values are properly preserved during save - always as strings
    const [lengthValue, setLengthValue] = useState(
        item?.length !== undefined ? String(item.length) : ""
    );
    const [widthValue, setWidthValue] = useState(
        item?.width !== undefined ? String(item.width) : ""
    );
    const [heightValue, setHeightValue] = useState(
        item?.height !== undefined ? String(item.height) : ""
    );
    // New state for inaccessible as a number input
    const [inaccessibleValue, setInaccessibleValue] = useState(
        item?.inaccessible !== undefined ? String(item.inaccessible) : ""
    );

    // Add refs to track if input is currently being edited
    const lengthInputRef = useRef(null);
    const widthInputRef = useRef(null);
    const heightInputRef = useRef(null);
    const inaccessibleInputRef = useRef(null);

    // Track which field is being edited
    const [editingField, setEditingField] = useState(null);

    // Ref to track if we're in a tab sequence between fields
    const isChangingFieldsRef = useRef(false);

    // Update local state when props change, but only if we're not actively editing
    useEffect(() => {
        if (item && !editingField && !isChangingFieldsRef.current) {
            // Only update if the values have changed to prevent unnecessary re-renders
            // Convert all values to strings for consistent comparisons
            const itemLengthStr =
                item.length !== undefined && item.length !== null
                    ? String(item.length)
                    : "";
            const itemWidthStr =
                item.width !== undefined && item.width !== null
                    ? String(item.width)
                    : "";
            const itemHeightStr =
                item.height !== undefined && item.height !== null
                    ? String(item.height)
                    : "";
            const itemInaccessibleStr =
                item.inaccessible !== undefined && item.inaccessible !== null
                    ? String(item.inaccessible)
                    : "";

            if (itemLengthStr !== lengthValue) {
                setLengthValue(itemLengthStr);
            }
            if (itemWidthStr !== widthValue) {
                setWidthValue(itemWidthStr);
            }
            if (itemHeightStr !== heightValue) {
                setHeightValue(itemHeightStr);
            }
            if (itemInaccessibleStr !== inaccessibleValue) {
                setInaccessibleValue(itemInaccessibleStr);
            }
        }
    }, [
        item,
        lengthValue,
        widthValue,
        heightValue,
        inaccessibleValue,
        editingField,
    ]);

    // Handle dimension input changes - ensuring consistent string handling
    const handleLengthChange = (e) => {
        const stringValue = e.value !== null ? String(e.value) : "";
        setLengthValue(stringValue);
        // Update parent immediately when value changes
        handleDimensionChange(item, "length", stringValue);
    };

    const handleWidthChange = (e) => {
        const stringValue = e.value !== null ? String(e.value) : "";
        setWidthValue(stringValue);
        // Update parent immediately when value changes
        handleDimensionChange(item, "width", stringValue);
    };

    const handleHeightChange = (e) => {
        const stringValue = e.value !== null ? String(e.value) : "";
        setHeightValue(stringValue);
        // Update parent immediately when value changes
        handleDimensionChange(item, "height", stringValue);
    };

    // Handler for inaccessible number input
    const handleInaccessibleChange = (e) => {
        const stringValue = e.value !== null ? String(e.value) : "";
        setInaccessibleValue(stringValue);
        // Update parent immediately when value changes
        handleDimensionChange(item, "inaccessible", stringValue);
    };

    // Handle focus on input fields
    const handleFocus = (field) => {
        // Clear the changing fields flag when a new field gets focus
        isChangingFieldsRef.current = false;
        setEditingField(field);
    };

    // Handle blur (losing focus) on input fields with a small delay
    const handleBlur = (field, value) => {
        // Set flag to indicate we might be changing between fields
        isChangingFieldsRef.current = true;

        // Use a small timeout to allow the next focus event to happen first
        // This prevents the component from resetting during field transitions
        setTimeout(() => {
            // Only clear editing state if no new field has focus
            if (isChangingFieldsRef.current) {
                setEditingField(null);
                isChangingFieldsRef.current = false;
            }
        }, 50);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "1.5rem",
                width: "100%",
                marginTop: "1rem",
            }}
        >
            {/* Length field */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "124px",
                }}
            >
                <label
                    htmlFor={`length-${item.id || item._id}`}
                    style={{
                        marginBottom: "8px",
                        textAlign: "center",
                    }}
                >
                    Length
                </label>
                <InputNumber
                    value={lengthValue === "" ? null : Number(lengthValue)}
                    onValueChange={handleLengthChange}
                    inputId={`length-${item.id || item._id}`}
                    inputRef={lengthInputRef}
                    onFocus={() => handleFocus("length")}
                    onBlur={() => handleBlur("length", lengthValue)}
                    useGrouping={false}
                    buttonLayout="none"
                    inputStyle={{
                        textAlign: "center",
                        width: "100%",
                    }}
                    style={{ width: "100%" }}
                />
            </div>

            {/* Width field */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "124px",
                }}
            >
                <label
                    htmlFor={`width-${item.id || item._id}`}
                    style={{
                        marginBottom: "8px",
                        textAlign: "center",
                    }}
                >
                    Width
                </label>
                <InputNumber
                    value={widthValue === "" ? null : Number(widthValue)}
                    onValueChange={handleWidthChange}
                    inputId={`width-${item.id || item._id}`}
                    inputRef={widthInputRef}
                    onFocus={() => handleFocus("width")}
                    onBlur={() => handleBlur("width", widthValue)}
                    useGrouping={false}
                    buttonLayout="none"
                    inputStyle={{
                        textAlign: "center",
                        width: "100%",
                    }}
                    style={{ width: "100%" }}
                />
            </div>

            {/* Height field */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "124px",
                }}
            >
                <label
                    htmlFor={`height-${item.id || item._id}`}
                    style={{
                        marginBottom: "8px",
                        textAlign: "center",
                    }}
                >
                    Height
                </label>
                <InputNumber
                    value={heightValue === "" ? null : Number(heightValue)}
                    onValueChange={handleHeightChange}
                    inputId={`height-${item.id || item._id}`}
                    inputRef={heightInputRef}
                    onFocus={() => handleFocus("height")}
                    onBlur={() => handleBlur("height", heightValue)}
                    useGrouping={false}
                    buttonLayout="none"
                    inputStyle={{
                        textAlign: "center",
                        width: "100%",
                    }}
                    style={{ width: "100%" }}
                />
            </div>

            {/* Inaccessible field */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "124px",
                }}
            >
                <label
                    htmlFor={`inaccessible-${item.id || item._id}`}
                    style={{
                        marginBottom: "8px",
                        textAlign: "center",
                    }}
                >
                    Inaccessible
                </label>
                <InputNumber
                    value={
                        inaccessibleValue === ""
                            ? null
                            : Number(inaccessibleValue)
                    }
                    onValueChange={handleInaccessibleChange}
                    inputId={`inaccessible-${item.id || item._id}`}
                    inputRef={inaccessibleInputRef}
                    onFocus={() => handleFocus("inaccessible")}
                    onBlur={() => handleBlur("inaccessible", inaccessibleValue)}
                    useGrouping={false}
                    buttonLayout="none"
                    inputStyle={{
                        textAlign: "center",
                        width: "100%",
                    }}
                    style={{ width: "100%" }}
                />
            </div>
        </div>
    );
};

export default DimensionInputs;
