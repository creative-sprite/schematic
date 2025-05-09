// components\database\products\common\DraggableField.jsx

import React from "react";
import { useDraggable } from "@dnd-kit/core";

/**
 * A draggable field component that can be used in drag and drop interfaces
 *
 * @param {Object} props - Component props
 * @param {Object} props.field - The field configuration object
 * @param {number} props.index - Index position of this field
 * @param {string} props.list - Identifier for the list this field belongs to
 * @param {Object} props.children - Render function for the field content
 * @returns {JSX.Element} Draggable field component
 */
const DraggableField = ({ field, index, list, children }) => {
    // Generate a consistent ID for draggable elements
    const draggableId = field.id || field._id || `${field.label}-${index}`;

    // Set up draggable attributes using dnd-kit
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useDraggable({
        id: draggableId,
        data: { list, field },
    });

    // Calculate transform style
    const style = {
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        touchAction: "none", // Prevents touch scrolling during drag on mobile
    };

    // Call the render function with needed props
    return children({
        innerRef: setNodeRef,
        draggableProps: { style, ...attributes },
        dragHandleProps: listeners,
        isDragging,
    });
};

export default DraggableField;
