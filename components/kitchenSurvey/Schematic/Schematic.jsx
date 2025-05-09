// components\kitchenSurvey\Schematic\Schematic.jsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import SchematicCanvas from "./SchematicCanvas";
import SchematicList from "./SchematicList";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import TreeSelectFilter from "../TreeSelectFilter";
import "../../../styles/schematic.css";

const SPECIAL_START_IMAGE = "/start.svg";
const SPECIAL_END_IMAGE = "/end.svg";

/**
 * Schematic component:
 * - Renders the top control row (TreeSelect, InputNumber, Pan, Rotate, Delete)
 * - Contains the canvas (wrapped in a scrollable, square container) and the list of placed items.
 */
function Schematic({
    onAccessDoorPriceChange,
    onVentilationPriceChange,
    onAirPriceChange,
    onFanPartsPriceChange,
    onAirInExPriceChange,
    onSchematicItemsTotalChange,
    structureIds,
    groupingId,
    onGroupIdChange,
    initialAccessDoorPrice = 0,
    initialVentilationPrice = 0,
    initialAirPrice = 0,
    initialFanPartsPrice = 0,
    initialAirInExTotal = 0,
    initialSchematicItemsTotal = 0,
    initialPlacedItems = [],
    initialSpecialItems = [],
    initialGridSpaces = 26,
    initialCellSize = 40,
    initialSelectedGroupId = "",
    initialFlexiDuctSelections = {},
    initialGroupDimensions = {}, // Add prop for saved dimensions
    // New shared state props
    placedItems,
    setPlacedItems,
    specialItems,
    setSpecialItems,
    gridSpaces,
    setGridSpaces,
    cellSize,
    setCellSize,
    flexiDuctSelections,
    setFlexiDuctSelections,
    accessDoorSelections,
    setAccessDoorSelections,
    groupDimensions,
    setGroupDimensions,
    fanGradeSelections,
    setFanGradeSelections,
}) {
    // Local state for UI interaction
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedSpecialObject, setSelectedSpecialObject] = useState(null);
    const [deleteMode, setDeleteMode] = useState(false);
    const [isPlacing, setIsPlacing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [specialStartCell, setSpecialStartCell] = useState(null);
    const [specialRotation, setSpecialRotation] = useState(0);
    // Using shared groupDimensions instead of local state
    // const [localGroupDimensions, setLocalGroupDimensions] = useState({});
    const [panMode, setPanMode] = useState(false); // State for pan mode
    const [resetSelection, setResetSelection] = useState(false);

    // Flag to track initialization from saved data
    const [initialized, setInitialized] = useState(false);
    // Ref to track when prices have been sent to parent
    const pricesSentRef = useRef(false);

    // Store local ventilation price from Flexi-Duct/Flexi Hose items
    const [flexiDuctVentilationPrice, setFlexiDuctVentilationPrice] = useState(
        initialVentilationPrice || 0
    );

    // Store local prices for different components
    const [accessDoorPrice, setAccessDoorPrice] = useState(
        initialAccessDoorPrice || 0
    );
    const [ventilationPrice, setVentilationPrice] = useState(
        initialVentilationPrice || 0
    );
    const [airPrice, setAirPrice] = useState(initialAirPrice || 0);
    const [fanPartsPrice, setFanPartsPrice] = useState(
        initialFanPartsPrice || 0
    );
    const [airInExTotal, setAirInExTotal] = useState(initialAirInExTotal || 0);
    const [schematicItemsTotal, setSchematicItemsTotal] = useState(
        initialSchematicItemsTotal || 0
    );

    // Using shared accessDoorSelections instead of local state
    // const [localAccessDoorSelections, setLocalAccessDoorSelections] = useState({});

    // Pan mode handling states and refs
    const containerRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const scrollStart = useRef({ left: 0, top: 0 });

    // Use refs to store callbacks to avoid dependency issues
    const ventilationPriceChangeRef = useRef(onVentilationPriceChange);
    useEffect(() => {
        ventilationPriceChangeRef.current = onVentilationPriceChange;
    }, [onVentilationPriceChange]);

    // NEW: Use a ref for selectedGroupId to avoid dependency issues
    const selectedGroupIdRef = useRef(initialSelectedGroupId);

    // FIXED: Initialize only once and preserve existing state
    useEffect(() => {
        if (initialized) return;

        console.log("Initializing Schematic from saved data");

        // Check for any existing data to preserve
        if (placedItems.length === 0 && initialPlacedItems?.length > 0) {
            setPlacedItems(initialPlacedItems);
        }

        if (specialItems.length === 0 && initialSpecialItems?.length > 0) {
            setSpecialItems(initialSpecialItems);
        }

        // Only set these if they're not already set
        if (gridSpaces === 26 && initialGridSpaces) {
            setGridSpaces(initialGridSpaces);
        }

        if (cellSize === 40 && initialCellSize) {
            setCellSize(initialCellSize);
        }

        // Initialize group dimensions from saved data with improved handling
        if (Object.keys(initialGroupDimensions).length > 0) {
            console.log(
                "[Schematic] Initializing group dimensions from saved data:",
                initialGroupDimensions
            );

            // First make a deep copy to avoid reference issues
            const dimensionsCopy = JSON.parse(
                JSON.stringify(initialGroupDimensions)
            );

            // Then update state - use functional update to ensure we preserve any existing values
            setGroupDimensions((prev) => ({
                ...prev,
                ...dimensionsCopy,
            }));

            console.log("[Schematic] Dimension initialization complete");
        }

        // Set prices only if they're not already set
        if (accessDoorPrice === 0 && initialAccessDoorPrice > 0) {
            setAccessDoorPrice(initialAccessDoorPrice);
        }

        if (ventilationPrice === 0 && initialVentilationPrice > 0) {
            setVentilationPrice(initialVentilationPrice);
            setFlexiDuctVentilationPrice(initialVentilationPrice);
        }

        if (airPrice === 0 && initialAirPrice > 0) {
            setAirPrice(initialAirPrice);
        }

        if (fanPartsPrice === 0 && initialFanPartsPrice > 0) {
            setFanPartsPrice(initialFanPartsPrice);
        }

        if (airInExTotal === 0 && initialAirInExTotal > 0) {
            setAirInExTotal(initialAirInExTotal);
        }

        if (schematicItemsTotal === 0 && initialSchematicItemsTotal > 0) {
            setSchematicItemsTotal(initialSchematicItemsTotal);
        }

        // Initialize flexi-duct selections
        if (
            Object.keys(flexiDuctSelections).length === 0 &&
            Object.keys(initialFlexiDuctSelections || {}).length > 0
        ) {
            setFlexiDuctSelections(initialFlexiDuctSelections);
        }

        // Initialize selected group ID
        if (initialSelectedGroupId && !selectedGroupIdRef.current) {
            selectedGroupIdRef.current = initialSelectedGroupId;
            if (typeof onGroupIdChange === "function") {
                onGroupIdChange(initialSelectedGroupId);
            }
        }

        setInitialized(true);
        console.log("Schematic initialization complete");
    }, [initialized]);

    // Listen for structure ID changes
    useEffect(() => {
        // If there's no initial group ID but there are structure IDs available,
        // use the first one and inform the parent component
        if (
            (!selectedGroupIdRef.current ||
                selectedGroupIdRef.current === "") &&
            structureIds.length > 0 &&
            typeof onGroupIdChange === "function"
        ) {
            selectedGroupIdRef.current = structureIds[0];
            onGroupIdChange(structureIds[0]);
        }
    }, [structureIds, onGroupIdChange]);

    // FIXED: Pass prices to parent component without causing re-renders
    // Handle access door price updates
    useEffect(() => {
        if (
            onAccessDoorPriceChange &&
            accessDoorPrice !== initialAccessDoorPrice
        ) {
            onAccessDoorPriceChange(accessDoorPrice);
        }
    }, [accessDoorPrice, initialAccessDoorPrice, onAccessDoorPriceChange]);

    // Handle ventilation price updates - critical fix
    useEffect(() => {
        // Only update if there's a meaningful change AND there's at least one placed item
        if (
            ventilationPriceChangeRef.current &&
            Math.abs(ventilationPrice - initialVentilationPrice) > 0.001 &&
            !pricesSentRef.current
        ) {
            console.log(`Updating ventilation price: ${ventilationPrice}`);
            ventilationPriceChangeRef.current(ventilationPrice);
            pricesSentRef.current = true;
        }
    }, [ventilationPrice, initialVentilationPrice]);

    // Reset price sent flag when ventilation price changes significantly
    useEffect(() => {
        if (Math.abs(ventilationPrice - initialVentilationPrice) > 5) {
            pricesSentRef.current = false;
        }
    }, [ventilationPrice, initialVentilationPrice]);

    // Handle other price updates
    useEffect(() => {
        if (onAirPriceChange && airPrice !== initialAirPrice) {
            onAirPriceChange(airPrice);
        }
    }, [airPrice, initialAirPrice, onAirPriceChange]);

    useEffect(() => {
        if (onFanPartsPriceChange && fanPartsPrice !== initialFanPartsPrice) {
            onFanPartsPriceChange(fanPartsPrice);
        }
    }, [fanPartsPrice, initialFanPartsPrice, onFanPartsPriceChange]);

    useEffect(() => {
        if (onAirInExPriceChange && airInExTotal !== initialAirInExTotal) {
            onAirInExPriceChange(airInExTotal);
        }
    }, [airInExTotal, initialAirInExTotal, onAirInExPriceChange]);

    useEffect(() => {
        if (
            onSchematicItemsTotalChange &&
            schematicItemsTotal !== initialSchematicItemsTotal
        ) {
            onSchematicItemsTotalChange(schematicItemsTotal);
        }
    }, [
        schematicItemsTotal,
        initialSchematicItemsTotal,
        onSchematicItemsTotalChange,
    ]);

    // Make sure we have a structure ID selected if we have placed items
    useEffect(() => {
        if (placedItems.length > 0 && typeof onGroupIdChange === "function") {
            // If we have structure IDs available, ensure one is selected
            if (structureIds.length > 0 && !groupingId) {
                selectedGroupIdRef.current = structureIds[0];
                onGroupIdChange(structureIds[0]);
            }
        }
    }, [placedItems, structureIds, groupingId, onGroupIdChange]);

    // NEW: Effect to calculate access door price from selections
    useEffect(() => {
        if (Object.keys(accessDoorSelections).length === 0) return;

        // Calculate total price of all selected access doors
        let totalAccessDoorPrice = 0;
        Object.values(accessDoorSelections).forEach((door) => {
            if (door && door.price) {
                totalAccessDoorPrice += Number(door.price);
            }
        });

        // Update local state and propagate to parent
        if (Math.abs(accessDoorPrice - totalAccessDoorPrice) > 0.001) {
            setAccessDoorPrice(totalAccessDoorPrice);

            if (onAccessDoorPriceChange) {
                onAccessDoorPriceChange(totalAccessDoorPrice);
            }
        }
    }, [accessDoorSelections, accessDoorPrice, onAccessDoorPriceChange]);

    const handlePanPointerDown = (e) => {
        if (!panMode) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        if (containerRef.current) {
            scrollStart.current = {
                left: containerRef.current.scrollLeft,
                top: containerRef.current.scrollTop,
            };
        }
    };

    const handlePanPointerMove = (e) => {
        if (!isPanning || !panMode) return;
        if (containerRef.current) {
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            containerRef.current.scrollLeft = scrollStart.current.left - dx;
            containerRef.current.scrollTop = scrollStart.current.top - dy;
        }
    };

    const handlePanPointerUp = (e) => {
        if (!panMode) return;
        setIsPanning(false);
    };

    // Toggle delete mode without clearing the TreeSelect selection.
    const handleDeleteMode = () => {
        setDeleteMode((prev) => !prev);
        // Do not clear selectedItem, selectedSpecialObject, or specialStartCell.
    };

    const handleRotateSpecial = () => {
        setSpecialRotation((prev) => (prev + 90) % 360);
    };

    // Add effect to track dimension changes for debugging
    useEffect(() => {
        console.log(
            "[Schematic] Current groupDimensions state:",
            groupDimensions
        );
    }, [groupDimensions]);

    const handleDimensionChange = (groupKey, field, rawValue) => {
        console.log(
            `[Schematic] Dimension change for ${groupKey}.${field} = ${rawValue}`
        );

        setGroupDimensions((prev) => {
            const newDims = { ...prev };
            if (!newDims[groupKey]) {
                newDims[groupKey] = {};
            }

            // Ensure we're handling the value correctly
            let valueToStore;
            if (rawValue === "") {
                valueToStore = "";
            } else {
                const parsed = parseInt(rawValue, 10);
                valueToStore = Number.isNaN(parsed) ? "" : parsed;
            }

            newDims[groupKey][field] = valueToStore;

            // Log the updated dimensions for this item for debugging
            console.log(
                `[Schematic] Updated dimensions for ${groupKey}:`,
                newDims[groupKey]
            );

            return newDims;
        });
    };

    // Handle full access door selection object updates
    const handleAccessDoorSelect = (itemId, selectedDoor) => {
        if (!selectedDoor) return;

        // Store selected door for this item
        setAccessDoorSelections((prev) => ({
            ...prev,
            [itemId]: selectedDoor,
        }));
    };

    // IMPROVED: Handler for ventilation price changes from Flexi-Duct/Flexi Hose items
    const handleVentilationPriceChange = (price) => {
        // Only update if there's a real change in price to prevent update loops
        if (Math.abs(flexiDuctVentilationPrice - price) > 0.001) {
            console.log(`Schematic -> handleVentilationPriceChange: ${price}`);
            setFlexiDuctVentilationPrice(price);
            setVentilationPrice(price);
            // Reset the flag so the price can be sent to parent
            pricesSentRef.current = false;
        }
    };

    // Handler for Tree Select reset completion
    const handleResetComplete = () => {
        setResetSelection(false);
    };

    return (
        <div>
            <h1 style={{ textAlign: "left" }}>Schematic</h1>

            {/* Top control row */}
            <div
                style={{
                    width: "100%",
                    marginLeft: "auto",
                    marginRight: "auto",
                    marginTop: "0",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    position: "sticky",
                    top: "0.5rem",
                    zIndex: 600,
                    background: "#E6E6E6",
                    padding: "0.5rem 1.5rem",
                }}
            >
                {/* TreeSelect */}
                <div style={{ width: "100%" }}>
                    <TreeSelectFilter
                        onSelectItem={(nodeValue) => {
                            if (deleteMode) handleDeleteMode();
                            // Clear special selections if any
                            setSelectedSpecialObject(null);
                            setSpecialStartCell(null);
                            // Set the selected item from the tree
                            setSelectedItem(nodeValue || null);
                        }}
                        onSelectSpecial={(nodeValue) => {
                            if (deleteMode) handleDeleteMode();
                            // Clear normal selection if any
                            setSelectedItem(null);
                            // Set the selected special object
                            setSelectedSpecialObject(nodeValue);
                        }}
                        resetSelection={resetSelection}
                        onResetComplete={handleResetComplete}
                    />
                </div>
                {/* Removed Structure ID Dropdown */}

                {/* Grid Size Input */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <label
                        style={{
                            fontSize: "12px",
                            marginRight: "5px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Grid:
                    </label>
                    <InputNumber
                        value={gridSpaces}
                        onValueChange={(e) => setGridSpaces(e.value || 0)}
                        style={{
                            height: "40px",
                        }}
                        inputStyle={{
                            width: "50px",
                        }}
                        onFocus={(ev) => ev.target.select()}
                    />
                </div>
                {/* Cell Size Input */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: "20px",
                    }}
                >
                    <label
                        style={{
                            fontSize: "12px",
                            marginRight: "5px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Cell:
                    </label>
                    <InputNumber
                        value={cellSize}
                        onValueChange={(e) => setCellSize(e.value || 0)}
                        style={{
                            height: "40px",
                        }}
                        inputStyle={{
                            width: "50px",
                        }}
                        onFocus={(ev) => ev.target.select()}
                    />
                </div>
                {/* Right aligned controls */}
                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    {/* Pan Button */}
                    <Button
                        label="Pan"
                        onClick={() => setPanMode((prev) => !prev)}
                        style={{
                            width: "70px",
                            height: "40px",
                            backgroundColor: panMode ? "#bbdefb" : "",
                        }}
                        className={`p-button-rounded ${
                            panMode ? "p-button-secondary" : "p-button-outlined"
                        }`}
                    />
                    {/* Rotate Button */}
                    <Button
                        icon="pi pi-refresh"
                        onClick={handleRotateSpecial}
                        style={{
                            width: "70px",
                            height: "40px",
                        }}
                        className="p-button-rounded p-button-secondary"
                    />
                    {/* Delete Button */}
                    <Button
                        icon="pi pi-trash"
                        onClick={handleDeleteMode}
                        style={{
                            width: "70px",
                            height: "40px",
                            backgroundColor: deleteMode ? "#b71c1c" : "#f44336",
                            borderColor: deleteMode ? "#b71c1c" : "#f44336",
                        }}
                        className={`p-button-rounded p-button-danger ${
                            deleteMode ? "active" : ""
                        }`}
                    />
                    {/* Selected Item / Special Images */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {selectedItem && selectedItem.image && (
                            <img
                                src={selectedItem.image}
                                alt={selectedItem.name || "Selected item"}
                                width="40"
                                height="40"
                            />
                        )}
                        {selectedSpecialObject &&
                            selectedSpecialObject.type === "measurement" && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "4px",
                                        textAlign: "right",
                                    }}
                                >
                                    <img
                                        src={selectedSpecialObject.startImage}
                                        alt="Start"
                                        width="40"
                                        height="40"
                                        style={{
                                            transform: `rotate(${specialRotation}deg)`,
                                        }}
                                    />
                                    <img
                                        src={selectedSpecialObject.endImage}
                                        alt="End"
                                        width="40"
                                        height="40"
                                        style={{
                                            transform: `rotate(${specialRotation}deg)`,
                                        }}
                                    />
                                </div>
                            )}
                        {selectedSpecialObject &&
                            selectedSpecialObject.type === "label" && (
                                <span
                                    style={{
                                        fontSize: "1.1rem",
                                        padding: "4px",
                                    }}
                                >
                                    Label
                                </span>
                            )}
                    </div>
                </div>
            </div>

            {/* Container around canvas */}
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    aspectRatio: "1",
                    overflowX: "scroll",
                    overflowY: "scroll",
                    border: "1px solid #ccc",
                    position: "relative",
                    touchAction: panMode ? "none" : "auto",
                }}
                onPointerDown={panMode ? handlePanPointerDown : undefined}
                onPointerMove={panMode ? handlePanPointerMove : undefined}
                onPointerUp={panMode ? handlePanPointerUp : undefined}
                onPointerCancel={panMode ? handlePanPointerUp : undefined}
            >
                <SchematicCanvas
                    gridSpaces={gridSpaces}
                    cellSize={cellSize}
                    selectedItem={selectedItem}
                    deleteMode={deleteMode}
                    isPlacing={isPlacing}
                    setIsPlacing={setIsPlacing}
                    isDeleting={isDeleting}
                    setIsDeleting={setIsDeleting}
                    specialItems={specialItems}
                    setSpecialItems={setSpecialItems}
                    selectedSpecialObject={selectedSpecialObject}
                    specialStartCell={specialStartCell}
                    setSpecialStartCell={setSpecialStartCell}
                    specialRotation={specialRotation}
                    placedItems={placedItems}
                    setPlacedItems={setPlacedItems}
                    panMode={panMode}
                    initialPlacedItems={initialPlacedItems}
                    initialSpecialItems={initialSpecialItems}
                />
            </div>

            <SchematicList
                placedItems={placedItems}
                groupDimensions={groupDimensions}
                setGroupDimensions={setGroupDimensions}
                handleDimensionChange={handleDimensionChange}
                onAccessDoorSelect={handleAccessDoorSelect} // Renamed for better naming consistency
                onVentilationPriceChange={handleVentilationPriceChange}
                onFanPartsPriceChange={setFanPartsPrice}
                onAirInExPriceChange={setAirInExTotal}
                onSchematicItemsTotalChange={setSchematicItemsTotal}
                structureIds={structureIds}
                setPlacedItems={setPlacedItems}
                flexiDuctSelections={flexiDuctSelections}
                setFlexiDuctSelections={setFlexiDuctSelections}
                initialAccessDoorPrice={initialAccessDoorPrice}
                initialVentilationPrice={initialVentilationPrice}
                initialFanPartsPrice={initialFanPartsPrice}
                initialAirInExTotal={initialAirInExTotal}
                initialSchematicItemsTotal={initialSchematicItemsTotal}
                initialFlexiDuctSelections={initialFlexiDuctSelections}
                accessDoorSelections={accessDoorSelections} // Pass shared selections to child
                setAccessDoorSelections={setAccessDoorSelections} // Pass setter to child
                fanGradeSelections={fanGradeSelections} // Pass fan grade selections to child
                setFanGradeSelections={setFanGradeSelections} // Pass setter to child
            />
        </div>
    );
}

export default Schematic;
