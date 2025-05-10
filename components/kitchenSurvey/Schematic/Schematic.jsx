// components\kitchenSurvey\Schematic\Schematic.jsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
    const [panMode, setPanMode] = useState(false); // State for pan mode
    const [resetSelection, setResetSelection] = useState(false);

    // Flag to track initialization from saved data
    const [initialized, setInitialized] = useState(false);

    // ADDED: Refs to track update status and prevent circular updates
    const updatingStateRef = useRef(false);
    const pricesSentRef = useRef({
        accessDoor: false,
        ventilation: false,
        air: false,
        fanParts: false,
        airInEx: false,
        schematic: false,
    });

    // ADDED: Track previous values for deep comparison
    const prevValuesRef = useRef({
        accessDoorPrice: initialAccessDoorPrice || 0,
        ventilationPrice: initialVentilationPrice || 0,
        airPrice: initialAirPrice || 0,
        fanPartsPrice: initialFanPartsPrice || 0,
        airInExTotal: initialAirInExTotal || 0,
        schematicItemsTotal: initialSchematicItemsTotal || 0,
        accessDoorSelections: {},
    });

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

    // Pan mode handling states and refs
    const containerRef = useRef(null);
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const scrollStart = useRef({ left: 0, top: 0 });

    // ADDED: Debounce timers for price updates
    const debounceTimersRef = useRef({
        accessDoor: null,
        ventilation: null,
        air: null,
        fanParts: null,
        airInEx: null,
        schematic: null,
    });

    // Use refs to store callbacks to avoid dependency issues
    const callbackRefsRef = useRef({
        onAccessDoorPriceChange,
        onVentilationPriceChange,
        onAirPriceChange,
        onFanPartsPriceChange,
        onAirInExPriceChange,
        onSchematicItemsTotalChange,
        onGroupIdChange,
    });

    // Update callback refs when props change
    useEffect(() => {
        callbackRefsRef.current = {
            onAccessDoorPriceChange,
            onVentilationPriceChange,
            onAirPriceChange,
            onFanPartsPriceChange,
            onAirInExPriceChange,
            onSchematicItemsTotalChange,
            onGroupIdChange,
        };
    }, [
        onAccessDoorPriceChange,
        onVentilationPriceChange,
        onAirPriceChange,
        onFanPartsPriceChange,
        onAirInExPriceChange,
        onSchematicItemsTotalChange,
        onGroupIdChange,
    ]);

    // NEW: Use a ref for selectedGroupId to avoid dependency issues
    const selectedGroupIdRef = useRef(initialSelectedGroupId);

    // Initialize accessDoorSelections deep copy
    useEffect(() => {
        if (
            Object.keys(accessDoorSelections).length > 0 &&
            Object.keys(prevValuesRef.current.accessDoorSelections).length === 0
        ) {
            prevValuesRef.current.accessDoorSelections = JSON.parse(
                JSON.stringify(accessDoorSelections)
            );
        }
    }, [accessDoorSelections]);

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
            prevValuesRef.current.accessDoorPrice = initialAccessDoorPrice;
        }

        if (ventilationPrice === 0 && initialVentilationPrice > 0) {
            setVentilationPrice(initialVentilationPrice);
            setFlexiDuctVentilationPrice(initialVentilationPrice);
            prevValuesRef.current.ventilationPrice = initialVentilationPrice;
        }

        if (airPrice === 0 && initialAirPrice > 0) {
            setAirPrice(initialAirPrice);
            prevValuesRef.current.airPrice = initialAirPrice;
        }

        if (fanPartsPrice === 0 && initialFanPartsPrice > 0) {
            setFanPartsPrice(initialFanPartsPrice);
            prevValuesRef.current.fanPartsPrice = initialFanPartsPrice;
        }

        if (airInExTotal === 0 && initialAirInExTotal > 0) {
            setAirInExTotal(initialAirInExTotal);
            prevValuesRef.current.airInExTotal = initialAirInExTotal;
        }

        if (schematicItemsTotal === 0 && initialSchematicItemsTotal > 0) {
            setSchematicItemsTotal(initialSchematicItemsTotal);
            prevValuesRef.current.schematicItemsTotal =
                initialSchematicItemsTotal;
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
            if (typeof callbackRefsRef.current.onGroupIdChange === "function") {
                callbackRefsRef.current.onGroupIdChange(initialSelectedGroupId);
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
            typeof callbackRefsRef.current.onGroupIdChange === "function"
        ) {
            selectedGroupIdRef.current = structureIds[0];
            callbackRefsRef.current.onGroupIdChange(structureIds[0]);
        }
    }, [structureIds]);

    // IMPROVED: Memoized safe handler for access door price changes
    const safeUpdateAccessDoorPrice = useCallback((newPrice) => {
        // Skip if already updating
        if (updatingStateRef.current) return;

        // Skip if no actual change
        if (Math.abs(prevValuesRef.current.accessDoorPrice - newPrice) < 0.001)
            return;

        // Clear any existing debounce timer
        if (debounceTimersRef.current.accessDoor) {
            clearTimeout(debounceTimersRef.current.accessDoor);
        }

        // Debounce the update
        debounceTimersRef.current.accessDoor = setTimeout(() => {
            // Set flag to prevent circular updates
            updatingStateRef.current = true;

            console.log(`[Schematic] Updating access door price: ${newPrice}`);

            // Update local state
            setAccessDoorPrice(newPrice);

            // Update reference value
            prevValuesRef.current.accessDoorPrice = newPrice;

            // Notify parent component
            if (callbackRefsRef.current.onAccessDoorPriceChange) {
                callbackRefsRef.current.onAccessDoorPriceChange(newPrice);
            }

            // Reset flag
            pricesSentRef.current.accessDoor = true;

            // Reset update flag after a short delay
            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    // FIXED: Pass prices to parent component without causing re-renders
    // Handle access door price updates
    useEffect(() => {
        if (pricesSentRef.current.accessDoor) return;

        if (
            Math.abs(accessDoorPrice - prevValuesRef.current.accessDoorPrice) >
            0.001
        ) {
            safeUpdateAccessDoorPrice(accessDoorPrice);
        }
    }, [accessDoorPrice, safeUpdateAccessDoorPrice]);

    // IMPROVED: Memoized safe handler for ventilation price changes
    const safeUpdateVentilationPrice = useCallback((newPrice) => {
        // Skip if already updating
        if (updatingStateRef.current) return;

        // Skip if no actual change
        if (Math.abs(prevValuesRef.current.ventilationPrice - newPrice) < 0.001)
            return;

        // Clear any existing debounce timer
        if (debounceTimersRef.current.ventilation) {
            clearTimeout(debounceTimersRef.current.ventilation);
        }

        // Debounce the update
        debounceTimersRef.current.ventilation = setTimeout(() => {
            // Set flag to prevent circular updates
            updatingStateRef.current = true;

            console.log(`[Schematic] Updating ventilation price: ${newPrice}`);

            // Update local state
            setVentilationPrice(newPrice);

            // Update reference value
            prevValuesRef.current.ventilationPrice = newPrice;

            // Notify parent component
            if (callbackRefsRef.current.onVentilationPriceChange) {
                callbackRefsRef.current.onVentilationPriceChange(newPrice);
            }

            // Reset flag
            pricesSentRef.current.ventilation = true;

            // Reset update flag after a short delay
            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    // Handle ventilation price updates
    useEffect(() => {
        if (pricesSentRef.current.ventilation) return;

        if (
            Math.abs(
                ventilationPrice - prevValuesRef.current.ventilationPrice
            ) > 0.001
        ) {
            safeUpdateVentilationPrice(ventilationPrice);
        }
    }, [ventilationPrice, safeUpdateVentilationPrice]);

    // Reset price sent flags when prices change significantly
    useEffect(() => {
        // For access door price
        if (
            Math.abs(accessDoorPrice - prevValuesRef.current.accessDoorPrice) >
            1
        ) {
            pricesSentRef.current.accessDoor = false;
        }

        // For ventilation price
        if (
            Math.abs(
                ventilationPrice - prevValuesRef.current.ventilationPrice
            ) > 1
        ) {
            pricesSentRef.current.ventilation = false;
        }
    }, [accessDoorPrice, ventilationPrice]);

    // IMPROVED: Memoized safe handlers for other price changes
    const safeUpdateAirPrice = useCallback((newPrice) => {
        // Skip if already updating or no change
        if (
            updatingStateRef.current ||
            Math.abs(prevValuesRef.current.airPrice - newPrice) < 0.001
        )
            return;

        // Clear any existing timer
        if (debounceTimersRef.current.air) {
            clearTimeout(debounceTimersRef.current.air);
        }

        // Debounce the update
        debounceTimersRef.current.air = setTimeout(() => {
            updatingStateRef.current = true;

            setAirPrice(newPrice);
            prevValuesRef.current.airPrice = newPrice;

            if (callbackRefsRef.current.onAirPriceChange) {
                callbackRefsRef.current.onAirPriceChange(newPrice);
            }

            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    const safeUpdateFanPartsPrice = useCallback((newPrice) => {
        // Skip if already updating or no change
        if (
            updatingStateRef.current ||
            Math.abs(prevValuesRef.current.fanPartsPrice - newPrice) < 0.001
        )
            return;

        // Clear any existing timer
        if (debounceTimersRef.current.fanParts) {
            clearTimeout(debounceTimersRef.current.fanParts);
        }

        // Debounce the update
        debounceTimersRef.current.fanParts = setTimeout(() => {
            updatingStateRef.current = true;

            setFanPartsPrice(newPrice);
            prevValuesRef.current.fanPartsPrice = newPrice;

            if (callbackRefsRef.current.onFanPartsPriceChange) {
                callbackRefsRef.current.onFanPartsPriceChange(newPrice);
            }

            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    const safeUpdateAirInExTotal = useCallback((newPrice) => {
        // Skip if already updating or no change
        if (
            updatingStateRef.current ||
            Math.abs(prevValuesRef.current.airInExTotal - newPrice) < 0.001
        )
            return;

        // Clear any existing timer
        if (debounceTimersRef.current.airInEx) {
            clearTimeout(debounceTimersRef.current.airInEx);
        }

        // Debounce the update
        debounceTimersRef.current.airInEx = setTimeout(() => {
            updatingStateRef.current = true;

            setAirInExTotal(newPrice);
            prevValuesRef.current.airInExTotal = newPrice;

            if (callbackRefsRef.current.onAirInExPriceChange) {
                callbackRefsRef.current.onAirInExPriceChange(newPrice);
            }

            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    const safeUpdateSchematicItemsTotal = useCallback((newTotal) => {
        // Skip if already updating or no change
        if (updatingStateRef.current) return;

        let totalToCompare;
        if (typeof newTotal === "object" && newTotal !== null) {
            totalToCompare = newTotal.overall || 0;
        } else {
            totalToCompare = Number(newTotal) || 0;
        }

        // If no meaningful change, skip update
        if (
            Math.abs(
                prevValuesRef.current.schematicItemsTotal - totalToCompare
            ) < 0.001
        )
            return;

        // Clear any existing timer
        if (debounceTimersRef.current.schematic) {
            clearTimeout(debounceTimersRef.current.schematic);
        }

        // Debounce the update
        debounceTimersRef.current.schematic = setTimeout(() => {
            updatingStateRef.current = true;

            setSchematicItemsTotal(newTotal);
            prevValuesRef.current.schematicItemsTotal = totalToCompare;

            if (callbackRefsRef.current.onSchematicItemsTotalChange) {
                callbackRefsRef.current.onSchematicItemsTotalChange(newTotal);
            }

            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }, 50);
    }, []);

    // Handle other price updates
    useEffect(() => {
        if (airPrice !== prevValuesRef.current.airPrice) {
            safeUpdateAirPrice(airPrice);
        }
    }, [airPrice, safeUpdateAirPrice]);

    useEffect(() => {
        if (fanPartsPrice !== prevValuesRef.current.fanPartsPrice) {
            safeUpdateFanPartsPrice(fanPartsPrice);
        }
    }, [fanPartsPrice, safeUpdateFanPartsPrice]);

    useEffect(() => {
        if (airInExTotal !== prevValuesRef.current.airInExTotal) {
            safeUpdateAirInExTotal(airInExTotal);
        }
    }, [airInExTotal, safeUpdateAirInExTotal]);

    useEffect(() => {
        if (schematicItemsTotal !== prevValuesRef.current.schematicItemsTotal) {
            safeUpdateSchematicItemsTotal(schematicItemsTotal);
        }
    }, [schematicItemsTotal, safeUpdateSchematicItemsTotal]);

    // Make sure we have a structure ID selected if we have placed items
    useEffect(() => {
        if (
            placedItems.length > 0 &&
            typeof callbackRefsRef.current.onGroupIdChange === "function"
        ) {
            // If we have structure IDs available, ensure one is selected
            if (structureIds.length > 0 && !groupingId) {
                selectedGroupIdRef.current = structureIds[0];
                callbackRefsRef.current.onGroupIdChange(structureIds[0]);
            }
        }
    }, [placedItems, structureIds, groupingId]);

    // IMPROVED: Safe memoized handler for access door selection changes
    const safeUpdateAccessDoorSelections = useCallback(
        (itemId, selectedDoor) => {
            // Skip if already updating
            if (updatingStateRef.current) return;

            // Set flag to prevent circular updates
            updatingStateRef.current = true;

            try {
                // Make deep copies for comparison
                const currentSelections = JSON.parse(
                    JSON.stringify(accessDoorSelections || {})
                );
                const prevSelections = JSON.parse(
                    JSON.stringify(
                        prevValuesRef.current.accessDoorSelections || {}
                    )
                );

                // Check if this is removing a selection
                if (!selectedDoor) {
                    // Skip if not actually present
                    if (!currentSelections[itemId]) {
                        return;
                    }

                    // Create a new object without the deleted selection
                    const newSelections = { ...currentSelections };
                    delete newSelections[itemId];

                    // Update parent state
                    setAccessDoorSelections(newSelections);

                    // Update reference
                    prevValuesRef.current.accessDoorSelections = newSelections;

                    console.log(
                        `[Schematic] Removed door selection for item ${itemId}`
                    );
                    return;
                }

                // Format the door selection data consistently
                const doorSelection = {
                    mongoId:
                        selectedDoor._id ||
                        selectedDoor.mongoId ||
                        selectedDoor.id ||
                        "",
                    id:
                        selectedDoor._id ||
                        selectedDoor.mongoId ||
                        selectedDoor.id ||
                        "",
                    name: selectedDoor.name || "",
                    type: selectedDoor.type || "",
                    dimensions: selectedDoor.dimensions || "",
                    price: Number(
                        selectedDoor.price || selectedDoor.accessDoorPrice || 0
                    ),
                };

                // Check if there's an actual change
                const currentDoor = currentSelections[itemId];
                if (
                    currentDoor &&
                    currentDoor.id === doorSelection.id &&
                    currentDoor.price === doorSelection.price
                ) {
                    return;
                }

                // Update door selections
                const newSelections = {
                    ...currentSelections,
                    [itemId]: doorSelection,
                };

                // Update parent state
                setAccessDoorSelections(newSelections);

                // Update reference
                prevValuesRef.current.accessDoorSelections = newSelections;

                console.log(
                    `[Schematic] Updated door selection for item ${itemId}:`,
                    doorSelection
                );
            } finally {
                // Reset update flag after a short delay
                setTimeout(() => {
                    updatingStateRef.current = false;
                }, 10);
            }
        },
        [accessDoorSelections]
    );

    // NEW: Effect to calculate access door price from selections
    useEffect(() => {
        if (updatingStateRef.current) return;
        if (Object.keys(accessDoorSelections).length === 0) return;

        // Calculate total price of all selected access doors
        let totalAccessDoorPrice = 0;
        Object.values(accessDoorSelections).forEach((door) => {
            if (door && door.price) {
                totalAccessDoorPrice += Number(door.price);
            }
        });

        // Update local state if there's a change
        if (Math.abs(accessDoorPrice - totalAccessDoorPrice) > 0.001) {
            setAccessDoorPrice(totalAccessDoorPrice);
            prevValuesRef.current.accessDoorPrice = totalAccessDoorPrice;
            pricesSentRef.current.accessDoor = false; // Reset flag to trigger parent update
        }
    }, [accessDoorSelections, accessDoorPrice]);

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
        if (!initialized) return;

        console.log(
            "[Schematic] Current groupDimensions state:",
            Object.keys(groupDimensions).length
        );
    }, [groupDimensions, initialized]);

    // IMPROVED: Safe memoized handler for dimension changes
    const handleDimensionChange = useCallback((groupKey, field, rawValue) => {
        // Skip if already updating
        if (updatingStateRef.current) return;

        console.log(
            `[Schematic] Dimension change for ${groupKey}.${field} = ${rawValue}`
        );

        // Set flag to prevent circular updates
        updatingStateRef.current = true;

        try {
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
                return newDims;
            });
        } finally {
            // Reset update flag after a short delay
            setTimeout(() => {
                updatingStateRef.current = false;
            }, 10);
        }
    }, []);

    // IMPROVED: Memoized ventilation price change handler
    const handleVentilationPriceChange = useCallback(
        (price) => {
            // Skip if already updating
            if (updatingStateRef.current) return;

            // Only update if there's a real change in price to prevent update loops
            if (Math.abs(flexiDuctVentilationPrice - price) > 0.001) {
                setFlexiDuctVentilationPrice(price);
                setVentilationPrice(price);
                prevValuesRef.current.ventilationPrice = price;
                pricesSentRef.current.ventilation = false; // Reset flag to trigger parent update
            }
        },
        [flexiDuctVentilationPrice]
    );

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
                onAccessDoorSelect={safeUpdateAccessDoorSelections}
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
                accessDoorSelections={accessDoorSelections}
                setAccessDoorSelections={setAccessDoorSelections}
                fanGradeSelections={fanGradeSelections}
                setFanGradeSelections={setFanGradeSelections}
            />
        </div>
    );
}

export default Schematic;
