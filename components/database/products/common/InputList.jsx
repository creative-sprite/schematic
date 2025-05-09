// components\database\products\common\InputList.jsx

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useDroppable } from "@dnd-kit/core";
import DraggableField from "./DraggableField";
import { Tooltip } from "primereact/tooltip";

/**
 * Component to display a list of available input fields that can be dragged to the product creator
 * and reordered using up/down buttons
 */
const InputList = ({
    forms = [],
    availableFields = [],
    selectedForm,
    onFormChange,
    isOverInputList = false,
    onFieldsReordered,
}) => {
    // Local state for fields to allow reordering
    const [fields, setFields] = useState([]);

    // Update local state when props change
    useEffect(() => {
        setFields([...availableFields]);
    }, [availableFields]);

    // Set up droppable attributes
    const { setNodeRef } = useDroppable({
        id: "availableFields",
    });

    // Border color based on drag state
    const borderColor = isOverInputList ? "#ff5252" : "#ccc";

    // Function to move a field up in the list
    const moveUp = (index) => {
        if (index <= 0) return;

        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[index - 1];
        newFields[index - 1] = temp;

        // Update field order properties
        newFields.forEach((field, i) => {
            field.order = i;
        });

        setFields(newFields);

        // Call API to update the order in the database
        updateFieldOrder(newFields);

        if (onFieldsReordered) {
            onFieldsReordered(newFields);
        }
    };

    // Function to move a field down in the list
    const moveDown = (index) => {
        if (index >= fields.length - 1) return;

        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[index + 1];
        newFields[index + 1] = temp;

        // Update field order properties
        newFields.forEach((field, i) => {
            field.order = i;
        });

        setFields(newFields);

        // Call API to update the order in the database
        updateFieldOrder(newFields);

        if (onFieldsReordered) {
            onFieldsReordered(newFields);
        }
    };

    // Function to update field order in the database
    const updateFieldOrder = async (orderedFields) => {
        try {
            // Filter out fields without _id (they haven't been saved to DB yet)
            const fieldsToUpdate = orderedFields.filter((field) => field._id);

            // Create array of updates with _id and order
            const updates = fieldsToUpdate.map((field, index) => ({
                id: field._id,
                order: index,
            }));

            // Only make the API call if there are fields to update
            if (updates.length > 0) {
                const response = await fetch(
                    "/api/database/products/customFields/updateOrder",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fields: updates }),
                    }
                );

                if (!response.ok) {
                    console.error(
                        "Failed to update field order:",
                        await response.text()
                    );
                }
            }
        } catch (error) {
            console.error("Error updating field order:", error);
        }
    };

    // Function to start drag only on handle
    const handleMouseDown = (e, dragHandleProps) => {
        // Only start dragging if clicking on the drag handle
        if (e.target.closest(".drag-handle")) {
            if (dragHandleProps.onMouseDown) {
                dragHandleProps.onMouseDown(e);
            }
        }
    };

    // Function to start touch drag only on handle
    const handleTouchStart = (e, dragHandleProps) => {
        // Only start dragging if touching the drag handle
        if (e.target.closest(".drag-handle")) {
            if (dragHandleProps.onTouchStart) {
                dragHandleProps.onTouchStart(e);
            }
        }
    };

    return (
        <div style={{ width: "220px" }}>
            {/* Title with Info Icon for Select Form */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    fontWeight: "bold",
                }}
            >
                <span>Forms</span>
                <i
                    className="pi pi-info-circle"
                    style={{
                        marginLeft: "8px",
                        color: "#007ad9",
                        cursor: "help",
                    }}
                    data-pr-tooltip="Select a form category to pre populate the Product Creator with inputs that are used for those categories"
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center"
                />
                <Tooltip target=".pi-info-circle" />
            </div>
            {/* Form selection dropdown for Input List*/}
            <Dropdown
                value={selectedForm}
                options={forms}
                optionLabel="category"
                placeholder="Select Form"
                onChange={(e) => onFormChange && onFormChange(e.value)}
                style={{ width: "100%", marginBottom: "10px" }}
            />
            {/* Title with Info Icon */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    fontWeight: "bold",
                }}
            >
                <span>Input List</span>
                <i
                    className="pi pi-info-circle"
                    style={{
                        marginLeft: "8px",
                        color: "#007ad9",
                        cursor: "help",
                    }}
                    data-pr-tooltip="Drag inputs from this list and place in the product creator window to the right"
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center"
                />
                <Tooltip target=".pi-info-circle" />
            </div>

            {/* Droppable container with explicit styling */}
            <div
                ref={setNodeRef}
                className="custom-fields-list"
                style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: "4px",
                    height: "409px",
                    overflowY: "auto",
                    overflowX: "hidden" /* Prevent horizontal scrolling */,
                    padding: "8px",
                    backgroundColor: isOverInputList
                        ? "rgba(255, 82, 82, 0.05)"
                        : "transparent",
                    WebkitOverflowScrolling:
                        "touch" /* Smooth scrolling on iOS */,
                }}
            >
                {/* Map over available fields to create draggable items with reordering buttons */}
                {fields.map((field, index) => {
                    // Format display text with prefix/suffix for number fields
                    const displayText =
                        field.fieldType === "number"
                            ? `${field.prefix ? field.prefix + " " : ""}${
                                  field.label
                              }${field.suffix ? " " + field.suffix : ""}`
                            : field.label;

                    return (
                        <DraggableField
                            key={field.id || field._id || `field-${index}`}
                            field={field}
                            index={index}
                            list="availableFields"
                        >
                            {({
                                innerRef,
                                draggableProps,
                                dragHandleProps,
                            }) => {
                                // Create modified drag props to handle touch properly
                                const modifiedDragProps = {
                                    ...draggableProps,
                                    onMouseDown: (e) =>
                                        handleMouseDown(e, dragHandleProps),
                                    onTouchStart: (e) =>
                                        handleTouchStart(e, dragHandleProps),
                                };

                                return (
                                    <div
                                        ref={innerRef}
                                        {...modifiedDragProps}
                                        style={{
                                            ...draggableProps.style,
                                            position: "relative",
                                            userSelect: "none",
                                            padding: "0 10px",
                                            paddingRight: "60px", // Space for buttons
                                            backgroundColor: "#fff",
                                            border: "1px solid #aaa",
                                            boxSizing: "border-box",
                                            width: "100%", // Full width
                                            height: "40px", // Fixed height of 40px
                                            minHeight: "40px", // Prevent compression
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "flex",
                                            alignItems: "center", // Vertically center content
                                            marginBottom: "8px",
                                            touchAction: "pan-y", // Enable vertical touch scrolling
                                        }}
                                    >
                                        {/* Drag handle on the left */}
                                        <div
                                            className="drag-handle"
                                            style={{
                                                cursor: "grab",
                                                marginRight: "8px",
                                                color: "#999",
                                                display: "flex",
                                                alignItems: "center",
                                                touchAction: "none", // Prevent touch scrolling on the drag handle
                                                padding: "5px", // Larger touch target
                                            }}
                                        >
                                            <i
                                                className="pi pi-bars"
                                                style={{ fontSize: "12px" }}
                                            ></i>
                                        </div>

                                        {/* Field name */}
                                        <span
                                            className="field-label"
                                            style={{
                                                flex: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {displayText}
                                        </span>

                                        {/* Up/down buttons on the right */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: "5px",
                                                top: "5px",
                                                display: "flex",
                                                gap: "4px",
                                            }}
                                        >
                                            <Button
                                                icon="pi pi-chevron-up"
                                                className="p-button-rounded p-button-text p-button-sm"
                                                disabled={index === 0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveUp(index);
                                                }}
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    padding: 0,
                                                }}
                                            />
                                            <Button
                                                icon="pi pi-chevron-down"
                                                className="p-button-rounded p-button-text p-button-sm"
                                                disabled={
                                                    index === fields.length - 1
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveDown(index);
                                                }}
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    padding: 0,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            }}
                        </DraggableField>
                    );
                })}
            </div>
        </div>
    );
};

export default InputList;
