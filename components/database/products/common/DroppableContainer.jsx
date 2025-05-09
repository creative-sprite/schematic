// components\database\products\common\DroppableContainer.jsx

import React from "react";
import { useDroppable } from "@dnd-kit/core";

/**
 * A droppable container component that can be used in drag and drop interfaces
 *
 * @param {Object} props - Component props
 * @param {string} props.droppableId - Identifier for this droppable area
 * @param {Object} props.children - Render function for the container content
 * @param {boolean} props.isOver - Optional external isOver state (can be used to override internal state)
 * @param {Object} props.style - Optional style overrides
 * @param {string} props.className - Optional className
 * @returns {JSX.Element} Droppable container component
 */
const DroppableContainer = ({
    droppableId,
    children,
    isOver: externalIsOver,
    style = {},
    className = "",
    highlightColor = "#3f51b5",
    highlightOnDragOver = true,
}) => {
    // Set up droppable attributes using dnd-kit
    const { setNodeRef, isOver: internalIsOver } = useDroppable({
        id: droppableId,
    });

    // Use external isOver if provided, otherwise use internal state
    const isOver =
        externalIsOver !== undefined ? externalIsOver : internalIsOver;

    // Apply highlighting if enabled and something is being dragged over
    const highlightStyles =
        highlightOnDragOver && isOver
            ? {
                  border: `2px dashed ${highlightColor}`,
                  position: "relative",
              }
            : {};

    // Call the render function with needed props
    // Forward the style directly to the outer div
    return (
        <div
            ref={setNodeRef}
            className={`droppable-container ${className} ${
                isOver ? "is-over" : ""
            }`}
            style={{
                ...style,
                ...highlightStyles,
            }}
        >
            {/* Add an overlay div that appears when dragging over */}
            {isOver && highlightOnDragOver && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: `${highlightColor}20`, // 20% opacity
                        zIndex: 10, // Ensure it's above other content
                        pointerEvents: "none", // Allow clicks to pass through
                        transition: "all 0.2s ease",
                    }}
                />
            )}
            {children({
                innerRef: () => {}, // No-op since we're handling the ref directly
                droppableProps: {},
                isOver,
            })}
        </div>
    );
};

export default DroppableContainer;
