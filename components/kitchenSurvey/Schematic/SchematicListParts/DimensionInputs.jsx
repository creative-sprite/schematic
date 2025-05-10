// components\kitchenSurvey\Schematic\SchematicListParts\DimensionInputs.jsx

"use client";
import React, { useEffect, useState, useRef } from "react";

// DimensionInputs: renders the three input rows for Length, Width, and Height
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

    // Add refs to track if input is currently being edited
    const lengthInputRef = useRef(null);
    const widthInputRef = useRef(null);
    const heightInputRef = useRef(null);

    // Track which field is being edited
    const [editingField, setEditingField] = useState(null);

    // Update local state when props change, but only if we're not actively editing
    useEffect(() => {
        if (item && !editingField) {
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

            if (itemLengthStr !== lengthValue) {
                setLengthValue(itemLengthStr);
            }
            if (itemWidthStr !== widthValue) {
                setWidthValue(itemWidthStr);
            }
            if (itemHeightStr !== heightValue) {
                setHeightValue(itemHeightStr);
            }
        }
    }, [item, lengthValue, widthValue, heightValue, editingField]);

    // Handle dimension input changes - ensuring consistent string handling
    const handleLengthChange = (e) => {
        // Ensure we're working with strings to prevent controlled/uncontrolled issues
        const stringValue = e.target.value ? e.target.value.toString() : "";
        setLengthValue(stringValue);
        handleDimensionChange(item, "length", stringValue);
    };

    const handleWidthChange = (e) => {
        const stringValue = e.target.value ? e.target.value.toString() : "";
        setWidthValue(stringValue);
        handleDimensionChange(item, "width", stringValue);
    };

    const handleHeightChange = (e) => {
        const stringValue = e.target.value ? e.target.value.toString() : "";
        setHeightValue(stringValue);
        handleDimensionChange(item, "height", stringValue);
    };

    // Handle focus on input fields
    const handleFocus = (field) => {
        setEditingField(field);
    };

    // Handle blur (losing focus) on input fields
    const handleBlur = (field, value) => {
        // When blurring, we want to update the parent and mark as no longer editing
        setEditingField(null);

        // Ensure value is committed to parent on blur
        if (field === "length" && value !== String(item.length)) {
            handleDimensionChange(item, "length", value);
        } else if (field === "width" && value !== String(item.width)) {
            handleDimensionChange(item, "width", value);
        } else if (field === "height" && value !== String(item.height)) {
            handleDimensionChange(item, "height", value);
        }
    };

    // Handle click to ensure text is selected when clicking into field
    const handleClick = (inputRef) => {
        if (inputRef && inputRef.current) {
            // Select all text when clicking on the field
            inputRef.current.select();
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                width: "100%",
            }}
        >
            {/* Length Row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    width: "100%",
                }}
            >
                <label
                    style={{
                        marginRight: "20px",
                        width: "50px",
                        textAlign: "right",
                        marginBottom: "5px",
                    }}
                >
                    Length:
                </label>
                <input
                    type="number"
                    value={lengthValue}
                    onChange={handleLengthChange}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="length"
                    ref={lengthInputRef}
                    onFocus={() => handleFocus("length")}
                    onBlur={() => handleBlur("length", lengthValue)}
                    onClick={() => handleClick(lengthInputRef)}
                    style={{
                        textAlign: "right",
                        width: "200px",
                    }}
                />
            </div>
            {/* Width Row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    width: "100%",
                }}
            >
                <label
                    style={{
                        marginRight: "20px",
                        width: "50px",
                        textAlign: "right",
                        marginBottom: "5px",
                    }}
                >
                    Width:
                </label>
                <input
                    type="number"
                    value={widthValue}
                    onChange={handleWidthChange}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="width"
                    ref={widthInputRef}
                    onFocus={() => handleFocus("width")}
                    onBlur={() => handleBlur("width", widthValue)}
                    onClick={() => handleClick(widthInputRef)}
                    style={{
                        textAlign: "right",
                        width: "200px",
                    }}
                />
            </div>
            {/* Height Row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    width: "100%",
                }}
            >
                <label
                    style={{
                        marginRight: "20px",
                        width: "50px",
                        textAlign: "right",
                        marginBottom: "5px",
                    }}
                >
                    Height:
                </label>
                <input
                    type="number"
                    value={heightValue}
                    onChange={handleHeightChange}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="height"
                    ref={heightInputRef}
                    onFocus={() => handleFocus("height")}
                    onBlur={() => handleBlur("height", heightValue)}
                    onClick={() => handleClick(heightInputRef)}
                    style={{
                        textAlign: "right",
                        width: "200px",
                    }}
                />
            </div>
        </div>
    );
};

export default DimensionInputs;
