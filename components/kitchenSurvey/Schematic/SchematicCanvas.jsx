// components\kitchenSurvey\Schematic\SchematicCanvas.jsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import Specials from "./Specials";

function SchematicCanvas(props) {
    const {
        gridSpaces,
        cellSize, // new prop for dynamic cell size
        selectedItem,
        deleteMode,
        isPlacing,
        setIsPlacing,
        isDeleting,
        setIsDeleting,
        specialItems,
        setSpecialItems,
        selectedSpecialObject,
        specialStartCell,
        setSpecialStartCell,
        specialRotation,
        placedItems,
        setPlacedItems,
        panMode, // new prop to indicate if pan mode is active
    } = props;

    const canvasRef = useRef(null);
    // NEW: containerRef to enable panning of the canvas container
    const containerRef = useRef(null);
    const [pointerDownCaptured, setPointerDownCaptured] = useState(false);
    // NEW: state and refs for panning behavior
    const [isPanning, setIsPanning] = useState(false);
    const panStartX = useRef(0);
    const initialScrollLeft = useRef(0);

    const lastPlacedCell = useRef({ cellX: -1, cellY: -1 });

    // Updated getCellFromEvent with boundary check
    const getCellFromEvent = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        // Return null if the pointer is outside the grid bounds
        if (
            cellX < 0 ||
            cellX >= gridSpaces ||
            cellY < 0 ||
            cellY >= gridSpaces
        ) {
            return null;
        }
        return { cellX, cellY };
    };

    const placeItemInCell = ({ cellX, cellY }) => {
        if (!selectedItem) {
            console.log("No selectedItem, cannot place anything.");
            return;
        }
        let newType = "piece";
        const loweredName = (selectedItem.name || "").toLowerCase();
        if (
            loweredName.includes("access panel") ||
            loweredName.includes("existing access") ||
            loweredName.includes("replace existing access")
        ) {
            newType = "panel";
        } else if (
            loweredName.includes("fan") ||
            loweredName.includes("ahu") ||
            loweredName.includes("damper") ||
            loweredName.includes("silencer")
        ) {
            newType = "fixture";
        }
        setPlacedItems((prev) =>
            prev.filter((it) => !(it.cellX === cellX && it.cellY === cellY))
        );
        const newItem = {
            id: Date.now(),
            originalId: selectedItem.id || Date.now(),
            type: newType,
            category: selectedItem.category || "",
            name: selectedItem.name,
            image: selectedItem.image,
            prices: selectedItem.prices || null,
            aggregateEntry: Boolean(selectedItem.aggregateEntry),
            requiresDimensions: Boolean(selectedItem.requiresDimensions),
            calculationType: selectedItem.calculationType,
            cellX,
            cellY,
            length: "",
            width: "",
            height: "",
        };
        setPlacedItems((prev) => [...prev, newItem]);
        lastPlacedCell.current = { cellX, cellY };
    };

    // Updated removeItemInCell to also delete special items (labels/measurements)
    const removeItemInCell = ({ cellX, cellY }) => {
        const cell = { cellX, cellY };

        // Check if a connector exists at the cell
        if (
            placedItems.find(
                (it) =>
                    it.cellX === cellX &&
                    it.cellY === cellY &&
                    it.type === "connectors"
            )
        ) {
            if (specialsRef.current) {
                specialsRef.current.removeSpecialItems(cell);
                return;
            }
        }
        // Also check if any special item (label or measurement) exists at the cell.
        if (
            specialItems.find((sp) => {
                if (sp.type === "label") {
                    return sp.cellX === cellX && sp.cellY === cellY;
                } else if (sp.type === "measurement") {
                    return (
                        (sp.startCellX === cellX && sp.startCellY === cellY) ||
                        (sp.endCellX === cellX && sp.endCellY === cellY)
                    );
                }
                return false;
            })
        ) {
            if (specialsRef.current) {
                specialsRef.current.removeSpecialItems(cell);
                return;
            }
        }
        // Fallback: remove from placedItems.
        setPlacedItems((prev) =>
            prev.filter((it) => !(it.cellX === cellX && it.cellY === cellY))
        );
        lastPlacedCell.current = cell;
    };

    // Ref for Specials component
    const specialsRef = useRef(null);

    const handlePointerDown = (e) => {
        // If pan mode is active, disable canvas pointer events.
        if (panMode) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setPointerDownCaptured(true);
        const cell = getCellFromEvent(e);
        if (!cell) return; // Do nothing if pointer is outside grid bounds
        console.log("SchematicCanvas -> handlePointerDown -> cell:", cell);

        // If delete mode is active, immediately delete item and return.
        if (deleteMode) {
            setIsDeleting(true);
            removeItemInCell(cell);
            return;
        }

        // Otherwise, check for special object selections.
        if (selectedSpecialObject) {
            if (selectedSpecialObject.type === "connectors") {
                if (specialsRef.current) {
                    specialsRef.current.handleConnectorsPlacement(cell);
                }
                return;
            } else if (
                selectedSpecialObject.type === "measurement" ||
                selectedSpecialObject.type === "label"
            ) {
                if (specialsRef.current) {
                    specialsRef.current.handleSpecialCellClick(
                        cell,
                        selectedSpecialObject,
                        specialRotation
                    );
                }
                return;
            }
        }

        setIsPlacing(true);
        placeItemInCell(cell);
    };

    const handlePointerMove = (e) => {
        if (!pointerDownCaptured) return;
        e.preventDefault();
        const cell = getCellFromEvent(e);
        if (!cell) return; // Ignore if outside grid bounds
        if (isDeleting) {
            if (
                cell.cellX !== lastPlacedCell.current.cellX ||
                cell.cellY !== lastPlacedCell.current.cellY
            ) {
                removeItemInCell(cell);
            }
            return;
        }
        if (isPlacing) {
            if (
                cell.cellX !== lastPlacedCell.current.cellX ||
                cell.cellY !== lastPlacedCell.current.cellY
            ) {
                placeItemInCell(cell);
            }
        }
    };

    const handlePointerUp = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setPointerDownCaptured(false);
        setIsPlacing(false);
        setIsDeleting(false);
        lastPlacedCell.current = { cellX: -1, cellY: -1 };
    };

    const handlePointerCancel = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setPointerDownCaptured(false);
        setIsPlacing(false);
        setIsDeleting(false);
        lastPlacedCell.current = { cellX: -1, cellY: -1 };
    };

    // NEW: Container panning event handlers when panMode is active.
    // These allow you to click and drag the container to scroll left/right.
    const handleContainerPointerDown = (e) => {
        if (!panMode) return;
        setIsPanning(true);
        panStartX.current = e.clientX;
        initialScrollLeft.current = containerRef.current.scrollLeft;
    };

    const handleContainerPointerMove = (e) => {
        if (!isPanning) return;
        const deltaX = e.clientX - panStartX.current;
        containerRef.current.scrollLeft = initialScrollLeft.current - deltaX;
    };

    const handleContainerPointerUp = (e) => {
        if (!isPanning) return;
        setIsPanning(false);
    };

    const handleContainerPointerLeave = (e) => {
        if (!isPanning) return;
        setIsPanning(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener("pointerdown", handlePointerDown, {
            passive: false,
        });
        canvas.addEventListener("pointermove", handlePointerMove, {
            passive: false,
        });
        canvas.addEventListener("pointerup", handlePointerUp, {
            passive: false,
        });
        canvas.addEventListener("pointercancel", handlePointerCancel, {
            passive: false,
        });

        return () => {
            canvas.removeEventListener("pointerdown", handlePointerDown);
            canvas.removeEventListener("pointermove", handlePointerMove);
            canvas.removeEventListener("pointerup", handlePointerUp);
            canvas.removeEventListener("pointercancel", handlePointerCancel);
        };
    }, [
        deleteMode,
        isPlacing,
        isDeleting,
        selectedItem,
        selectedSpecialObject,
        specialRotation,
        specialStartCell,
        cellSize,
        panMode,
    ]);

    // NEW: Attach container panning event handlers when panMode is active.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (!panMode) return; // Only attach these when pan mode is active

        container.addEventListener("pointerdown", handleContainerPointerDown);
        container.addEventListener("pointermove", handleContainerPointerMove);
        container.addEventListener("pointerup", handleContainerPointerUp);
        container.addEventListener("pointerleave", handleContainerPointerLeave);

        return () => {
            container.removeEventListener(
                "pointerdown",
                handleContainerPointerDown
            );
            container.removeEventListener(
                "pointermove",
                handleContainerPointerMove
            );
            container.removeEventListener(
                "pointerup",
                handleContainerPointerUp
            );
            container.removeEventListener(
                "pointerleave",
                handleContainerPointerLeave
            );
        };
    }, [panMode, isPanning]);

    const canvasPixelSize = gridSpaces * cellSize;

    return (
        <div>
            <Specials
                ref={specialsRef}
                placedItems={placedItems}
                setPlacedItems={setPlacedItems}
                specialItems={specialItems}
                setSpecialItems={setSpecialItems}
                specialStartCell={specialStartCell}
                setSpecialStartCell={setSpecialStartCell}
            />
            {/* Note: The container div now has a ref for panning */}
            <div
                style={{ overflowX: "auto", maxWidth: "100%" }}
                ref={containerRef}
            >
                <div style={{ width: canvasPixelSize, margin: "0 auto" }}>
                    <div
                        ref={canvasRef}
                        className="canvas"
                        style={{
                            width: canvasPixelSize,
                            height: canvasPixelSize,
                            border: "2px solid #3B3B3B",
                            position: "relative",
                            touchAction: panMode ? "auto" : "none",
                            userSelect: "none",
                            marginTop: "1rem",
                            backgroundPosition: "-0.5px -0.5px",
                            backgroundImage:
                                "linear-gradient(to right, #ccc 1px, transparent 1px)," +
                                " linear-gradient(to bottom, #ccc 1px, transparent 1px)",
                            backgroundSize: `${cellSize}px ${cellSize}px`,
                            pointerEvents: panMode ? "none" : "auto",
                        }}
                    >
                        {placedItems.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    position: "absolute",
                                    left: item.cellX * cellSize,
                                    top: item.cellY * cellSize,
                                    width: cellSize,
                                    height: cellSize,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "100%",
                                                border:
                                                    item.type === "connectors"
                                                        ? `4px solid ${item.borderColor}`
                                                        : "none",
                                            }}
                                        />
                                    ) : item.type === "connectors" ? (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                border: `4px solid ${item.borderColor}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "12px",
                                                color: item.borderColor,
                                                background: "#fff",
                                            }}
                                        >
                                            {item.pairNumber}
                                        </div>
                                    ) : item.type === "label" ? (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "10px",
                                                background:
                                                    "rgba(255,255,255,0.8)",
                                                padding: "2px 4px",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                            }}
                                        >
                                            {item.labelText}
                                        </div>
                                    ) : item.type === "measurement" ? null : ( // measurement rendering...
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "10px",
                                                color: "#000",
                                            }}
                                        >
                                            {item.name}
                                        </div>
                                    )}
                                    {item.category &&
                                        item.category.toLowerCase() ===
                                            "access doors" && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "2px",
                                                    right: "2px",
                                                    background:
                                                        "rgba(255,255,255,0.8)",
                                                    padding: "2px 4px",
                                                    borderRadius: "4px",
                                                    fontSize: "10px",
                                                }}
                                            >
                                                {placedItems
                                                    .filter(
                                                        (it) =>
                                                            it.category &&
                                                            it.category.toLowerCase() ===
                                                                "access doors" &&
                                                            it.name.toLowerCase() ===
                                                                item.name.toLowerCase()
                                                    )
                                                    .findIndex(
                                                        (it) =>
                                                            it.id === item.id
                                                    ) + 1}
                                            </div>
                                        )}
                                </div>
                            </div>
                        ))}
                        {specialItems.map((spec) => {
                            if (spec.type === "label") {
                                const left = spec.cellX * cellSize;
                                const top = spec.cellY * cellSize;
                                return (
                                    <div
                                        key={spec.id}
                                        style={{
                                            position: "absolute",
                                            left,
                                            top,
                                            transform: "translate(-50%, -50%)",
                                            background: "rgba(255,255,255,0.8)",
                                            padding: "2px 4px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            pointerEvents: "none",
                                            fontSize: "1.1rem",
                                        }}
                                    >
                                        {spec.labelText}
                                    </div>
                                );
                            }
                            const {
                                startCellX,
                                startCellY,
                                endCellX,
                                endCellY,
                                numericValue,
                                startImage,
                                endImage,
                                rotation,
                                id,
                            } = spec;
                            const startLeft = startCellX * cellSize;
                            const startTop = startCellY * cellSize;
                            const endLeft = endCellX * cellSize;
                            const endTop = endCellY * cellSize;
                            const leftX = Math.min(startLeft, endLeft);
                            const rightX =
                                Math.max(startLeft, endLeft) + cellSize;
                            const topY = Math.min(startTop, endTop);
                            const bottomY =
                                Math.max(startTop, endTop) + cellSize;
                            const midX = (leftX + rightX) / 2;
                            const midY = (topY + bottomY) / 2;
                            return (
                                <React.Fragment key={id}>
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: startLeft,
                                            top: startTop,
                                            width: cellSize,
                                            height: cellSize,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <img
                                            src={startImage}
                                            alt="Start"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                transform: `rotate(${rotation}deg)`,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: endLeft,
                                            top: endTop,
                                            width: cellSize,
                                            height: cellSize,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <img
                                            src={endImage}
                                            alt="End"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                transform: `rotate(${rotation}deg)`,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: midX,
                                            top: midY,
                                            transform: "translate(-50%, -50%)",
                                            background: "rgba(255,255,255,0.8)",
                                            padding: "2px 4px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {numericValue}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SchematicCanvas;
