// components\kitchenSurvey\Schematic\SchematicListParts\DimensionInputs.jsx

"use client";
import React, { useEffect, useState } from "react";

// DimensionInputs: renders the three input rows for Length, Width, and Height
// Props:
// - dimensionKey: the key identifier to pass to the change handler
// - dims: an object containing the current dimension values {length, width, height}
// - handleDimensionChange: function to call when an input value changes
const DimensionInputs = ({ dimensionKey, dims, handleDimensionChange }) => {
    // Create controlled state for each dimension to prevent uncontrolled/controlled warnings
    // and ensure values are properly preserved during save - always as strings
    const [lengthValue, setLengthValue] = useState(
        dims?.length !== undefined ? String(dims.length) : ""
    );
    const [widthValue, setWidthValue] = useState(
        dims?.width !== undefined ? String(dims.width) : ""
    );
    const [heightValue, setHeightValue] = useState(
        dims?.height !== undefined ? String(dims.height) : ""
    );

    // Update local state when props change, always ensuring we use strings
    useEffect(() => {
        if (dims) {
            // Only update if the values have changed to prevent unnecessary re-renders
            // Convert all values to strings for consistent comparisons
            const dimLengthStr =
                dims.length !== undefined && dims.length !== null
                    ? String(dims.length)
                    : "";
            const dimWidthStr =
                dims.width !== undefined && dims.width !== null
                    ? String(dims.width)
                    : "";
            const dimHeightStr =
                dims.height !== undefined && dims.height !== null
                    ? String(dims.height)
                    : "";

            if (dimLengthStr !== lengthValue) {
                setLengthValue(dimLengthStr);
            }
            if (dimWidthStr !== widthValue) {
                setWidthValue(dimWidthStr);
            }
            if (dimHeightStr !== heightValue) {
                setHeightValue(dimHeightStr);
            }
        }
    }, [dims, lengthValue, widthValue, heightValue]);

    // Handle dimension input changes - ensuring consistent string handling
    const handleLengthChange = (value) => {
        // Ensure we're working with strings to prevent controlled/uncontrolled issues
        const stringValue = value ? value.toString() : "";
        setLengthValue(stringValue);
        handleDimensionChange(dimensionKey, "length", stringValue);
    };

    const handleWidthChange = (value) => {
        const stringValue = value ? value.toString() : "";
        setWidthValue(stringValue);
        handleDimensionChange(dimensionKey, "width", stringValue);
    };

    const handleHeightChange = (value) => {
        const stringValue = value ? value.toString() : "";
        setHeightValue(stringValue);
        handleDimensionChange(dimensionKey, "height", stringValue);
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
                    // Add data attributes for direct DOM access from SaveSurvey
                    data-dimension-key={dimensionKey}
                    data-dimension-field="length"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        // Compare as strings to avoid type mismatches
                        const dimLengthStr =
                            dims?.length !== undefined && dims?.length !== null
                                ? String(dims.length)
                                : "";
                        if (lengthValue !== dimLengthStr) {
                            handleDimensionChange(
                                dimensionKey,
                                "length",
                                lengthValue
                            );
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
                    // Add data attributes for direct DOM access from SaveSurvey
                    data-dimension-key={dimensionKey}
                    data-dimension-field="width"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        // Compare as strings to avoid type mismatches
                        const dimWidthStr =
                            dims?.width !== undefined && dims?.width !== null
                                ? String(dims.width)
                                : "";
                        if (widthValue !== dimWidthStr) {
                            handleDimensionChange(
                                dimensionKey,
                                "width",
                                widthValue
                            );
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
                    // Add data attributes for direct DOM access from SaveSurvey
                    data-dimension-key={dimensionKey}
                    data-dimension-field="height"
                    onBlur={() => {
                        // On blur, ensure value is committed to parent and stored
                        // Compare as strings to avoid type mismatches
                        const dimHeightStr =
                            dims?.height !== undefined && dims?.height !== null
                                ? String(dims.height)
                                : "";
                        if (heightValue !== dimHeightStr) {
                            handleDimensionChange(
                                dimensionKey,
                                "height",
                                heightValue
                            );
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
