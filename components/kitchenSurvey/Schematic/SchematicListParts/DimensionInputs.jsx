// components\kitchenSurvey\Schematic\SchematicListParts\DimensionInputs.jsx

"use client";
import React, { useEffect, useState } from "react";

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

    // Update local state when props change, always ensuring we use strings
    useEffect(() => {
        if (item) {
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
    }, [item, lengthValue, widthValue, heightValue]);

    // Handle dimension input changes - ensuring consistent string handling
    const handleLengthChange = (value) => {
        // Ensure we're working with strings to prevent controlled/uncontrolled issues
        const stringValue = value ? value.toString() : "";
        setLengthValue(stringValue);
        handleDimensionChange(item, "length", stringValue);
    };

    const handleWidthChange = (value) => {
        const stringValue = value ? value.toString() : "";
        setWidthValue(stringValue);
        handleDimensionChange(item, "width", stringValue);
    };

    const handleHeightChange = (value) => {
        const stringValue = value ? value.toString() : "";
        setHeightValue(stringValue);
        handleDimensionChange(item, "height", stringValue);
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
                    onChange={(e) => handleLengthChange(e.target.value)}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="length"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        if (lengthValue !== String(item.length)) {
                            handleDimensionChange(item, "length", lengthValue);
                        }
                    }}
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
                    onChange={(e) => handleWidthChange(e.target.value)}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="width"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        if (widthValue !== String(item.width)) {
                            handleDimensionChange(item, "width", widthValue);
                        }
                    }}
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
                    onChange={(e) => handleHeightChange(e.target.value)}
                    // Add data attributes for direct item ID
                    data-item-id={item.id || item._id}
                    data-dimension-field="height"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        if (heightValue !== String(item.height)) {
                            handleDimensionChange(item, "height", heightValue);
                        }
                    }}
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
