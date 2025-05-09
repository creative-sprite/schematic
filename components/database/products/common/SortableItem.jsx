// components\database\products\common\SortableItem.jsx

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import FieldInput from "./FieldInput";

/**
 * A sortable item component that renders a field card with input control
 *
 * @param {Object} props - Component props
 * @param {Object} props.field - The field configuration object
 * @param {any} props.value - The current value of the field
 * @param {Function} props.onChange - Function to call when value changes
 * @param {Array} props.suppliers - Array of suppliers for supplier fields
 * @returns {JSX.Element} Sortable field component
 */
const SortableItem = ({ field, value, onChange, suppliers = [] }) => {
    // Set up sortable attributes using dnd-kit
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: field.id || field._id,
        data: {
            type: "selectedField",
            field,
        },
    });

    // Calculate transform style
    const style = {
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1, // Make the original item semi-transparent during drag
        touchAction: "none", // Prevents touch scrolling during drag on mobile
        height: "auto",
        width: "50%",
    };

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
            <div
                style={{
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    margin: "0.5rem",
                    backgroundColor: "#fff",
                    height: "calc(100% - 1rem)",
                    boxSizing: "border-box",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: field.locked ? "default" : "grab",
                    overflow: "auto", // Added to handle overflow content
                    position: "relative", // For locked indicator
                }}
            >
                {/* Locked indicator for core fields */}
                {field.locked && (
                    <div
                        style={{
                            position: "absolute",
                            top: "0.25rem",
                            right: "0.25rem",
                            fontSize: "0.75rem",
                            color: "#888",
                        }}
                    >
                        <i
                            className="pi pi-lock"
                            style={{ fontSize: "0.75rem" }}
                        ></i>
                    </div>
                )}

                {/* Field label with prefix/suffix for number fields */}
                <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                    {field.fieldType === "number"
                        ? `${field.prefix ? field.prefix + " " : ""}${
                              field.label
                          }${field.suffix ? " " + field.suffix : ""}`
                        : field.label}
                </div>

                {/* Render the appropriate field input component */}
                <FieldInput
                    field={field}
                    value={value}
                    onChange={onChange}
                    suppliers={suppliers}
                />
            </div>
        </div>
    );
};

export default SortableItem;
