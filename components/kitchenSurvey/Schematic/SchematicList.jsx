// components\kitchenSurvey\Schematic\SchematicList.jsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SchematicListGrid from "./SchematicListParts/SchematicListGrid";
import { calculateItemPrice } from "../../../lib/priceCalculator";
// Add new import for ventilation calculations
import { calculateVentilationPrice } from "../../../lib/ventCalculations";

/**
 * Helper function to generate a unique key for an individual placed item.
 * Used for non-aggregated items.
 */
function getItemKey(item) {
    return item.id || item._id || "";
}

/**
 * Helper function to generate a display aggregation key.
 * For both pricing and parts items, if aggregateEntry is true,
 * we group items by a composite key. We use item.item if available,
 * otherwise fallback to item.name, concatenated with the originalId.
 * If aggregateEntry is false, we return null.
 */
function getDisplayAggregationKey(item) {
    if (item.aggregateEntry) {
        const keyPart = item.item ? item.item : item.name;
        if (keyPart) {
            return keyPart.trim().toLowerCase() + "-" + item.originalId;
        }
        return getItemKey(item);
    }
    return null;
}

/**
 * Helper function to generate a price aggregation key for pricing items.
 * This applies only to pricing items (items with a prices object) that have:
 * - aggregateEntry true,
 * - a nonempty calculationType,
 * - requiresDimensions true.
 * If so, return a composite key (using item.item if available, otherwise item.name, plus originalId);
 * otherwise, return null.
 */
function getPriceAggregationKey(item) {
    if (
        item.prices &&
        item.aggregateEntry &&
        item.calculationType &&
        item.calculationType.trim() !== "" &&
        item.requiresDimensions
    ) {
        const keyPart = item.item ? item.item : item.name;
        if (keyPart) {
            return keyPart.trim().toLowerCase() + "-" + item.originalId;
        }
    }
    return null;
}

/**
 * Helper function to identify ventilation or grease extract items
 */
function isVentilationOrGreaseItem(item) {
    if (!item) return false;

    // Check category
    if (item.category) {
        const category = item.category.toLowerCase();
        if (
            category.includes("grease") ||
            category.includes("ventilation") ||
            category.includes("air intake") ||
            category.includes("extract")
        ) {
            return true;
        }
    }

    // Check subcategory
    if (item.subcategory) {
        const subcategory = item.subcategory.toLowerCase();
        if (
            subcategory.includes("grease") ||
            subcategory.includes("ventilation") ||
            subcategory.includes("air intake") ||
            subcategory.includes("extract")
        ) {
            return true;
        }
    }

    // Check item name
    if (item.name || item.item) {
        const name = (item.name || item.item).toLowerCase();
        if (
            name.includes("grease") ||
            name.includes("vent") ||
            name.includes("air intake") ||
            name.includes("extract")
        ) {
            return true;
        }
    }

    return false;
}

export default function SchematicListContainer(props) {
    const {
        placedItems,
        onAccessDoorSelect, // For price updates only
        onVentilationPriceChange,
        onFanPartsPriceChange,
        onAirInExPriceChange,
        structureIds = [],
        onSchematicItemsTotalChange, // Callback to pass the computed totals (object with overall and breakdown)
        setPlacedItems, // Add this to update items when access door selection changes
        flexiDuctSelections = {},
        setFlexiDuctSelections,
        initialFlexiDuctSelections = {},
        // Add proper props for access door selections
        accessDoorSelections = {},
        setAccessDoorSelections,
        // Add prop for initial dimensions from saved data
        initialGroupDimensions = {},
    } = props;

    // For display, we group items based on aggregateEntry (display grouping)
    const [displayList, setDisplayList] = useState([]);
    const [groupDimensions, setGroupDimensions] = useState({});
    const [fanGradeSelections, setFanGradeSelections] = useState({});

    // State to track ventilation price from Flexi-Duct/Flexi Hose items
    const [flexiDuctVentilationPrice, setFlexiDuctVentilationPrice] =
        useState(0);
    // Flag to track if ventilation price was already set to prevent duplicates
    const ventilationPriceSetRef = useRef(false);

    // Track access door price separately to avoid reconciliation issues
    const [accessDoorPriceState, setAccessDoorPriceState] = useState(0);

    // Track access door selections and prices locally, but use parent's state for persistence
    const [localAccessDoorSelections, setLocalAccessDoorSelections] = useState(
        accessDoorSelections || {}
    );

    // Debug logging to track if access door selections are present on mount
    useEffect(() => {
        if (
            accessDoorSelections &&
            Object.keys(accessDoorSelections).length > 0
        ) {
            console.log(
                "SchematicList initialized with accessDoorSelections:",
                Object.keys(accessDoorSelections)
            );
        }
    }, []);

    // Use a ref to hold the parent's callback so that our dependency array remains constant.
    const schematicTotalCallbackRef = useRef(onSchematicItemsTotalChange);

    // Use a ref for the parent's access door selections setter to avoid dependency issues
    const accessDoorSelectionsRef = useRef(accessDoorSelections);
    const setAccessDoorSelectionsRef = useRef(setAccessDoorSelections);

    // Update refs when props change
    useEffect(() => {
        accessDoorSelectionsRef.current = accessDoorSelections;
        setAccessDoorSelectionsRef.current = setAccessDoorSelections;

        // Log any changes to parent accessDoorSelections for debugging
        if (Object.keys(accessDoorSelections).length > 0) {
            console.log(
                "SchematicList received updated accessDoorSelections:",
                Object.keys(accessDoorSelections)
            );
        }
    }, [accessDoorSelections, setAccessDoorSelections]);
    useEffect(() => {
        schematicTotalCallbackRef.current = onSchematicItemsTotalChange;
    }, [onSchematicItemsTotalChange]);

    // Use refs for price change callbacks to avoid dependency changes
    const ventilationPriceCallbackRef = useRef(onVentilationPriceChange);
    useEffect(() => {
        ventilationPriceCallbackRef.current = onVentilationPriceChange;
    }, [onVentilationPriceChange]);

    const accessDoorSelectCallbackRef = useRef(onAccessDoorSelect); // Renamed ref for consistency
    useEffect(() => {
        accessDoorSelectCallbackRef.current = onAccessDoorSelect;
    }, [onAccessDoorSelect]);

    // Initialize flexiDuctSelections from props if available
    useEffect(() => {
        if (
            initialFlexiDuctSelections &&
            Object.keys(initialFlexiDuctSelections).length > 0 &&
            Object.keys(flexiDuctSelections).length === 0
        ) {
            console.log(
                "Initializing flexiDuctSelections from props:",
                initialFlexiDuctSelections
            );
            setFlexiDuctSelections(initialFlexiDuctSelections);

            // Calculate initial ventilation price
            let initialVentPrice = 0;
            Object.values(initialFlexiDuctSelections).forEach((selections) => {
                selections.forEach((selection) => {
                    initialVentPrice +=
                        (Number(selection.price) || 0) *
                        (Number(selection.quantity) || 0);
                });
            });

            if (initialVentPrice > 0 && !ventilationPriceSetRef.current) {
                setFlexiDuctVentilationPrice(initialVentPrice);
                ventilationPriceSetRef.current = true;
            }
        }
    }, [initialFlexiDuctSelections, flexiDuctSelections]);

    // Log placedItems for debugging.
    useEffect(() => {
        console.log("SchematicListContainer - placedItems:", placedItems);
    }, [placedItems]);

    // Compute displayList: for connectors, only one card per pair; for others, use existing grouping.
    useEffect(() => {
        const aggregated = {};
        const nonAggregated = [];
        const seenConnectors = new Set();
        placedItems.forEach((item) => {
            if (item.type === "connectors") {
                if (seenConnectors.has(item.pairNumber)) {
                    return;
                }
                seenConnectors.add(item.pairNumber);
                nonAggregated.push(item);
                return;
            }
            const aggKey = getDisplayAggregationKey(item);
            if (aggKey) {
                // Group items with the same aggregation key.
                if (!aggregated[aggKey]) {
                    aggregated[aggKey] = item;
                }
            } else {
                nonAggregated.push(item);
            }
        });
        const newDisplayList = [...Object.values(aggregated), ...nonAggregated];
        console.log("Display list computed. Count:", newDisplayList.length);
        setDisplayList(newDisplayList);
    }, [placedItems]);

    // Initialize groupDimensions from saved data when component mounts or initialGroupDimensions changes
    useEffect(() => {
        if (
            initialGroupDimensions &&
            Object.keys(initialGroupDimensions).length > 0
        ) {
            console.log(
                "Initializing dimensions from saved data:",
                initialGroupDimensions
            );
            setGroupDimensions(initialGroupDimensions);
        }
    }, [initialGroupDimensions]);

    // DIMENSIONS AGGREGATION: Merge new dimensions from placedItems with existing state.
    useEffect(() => {
        setGroupDimensions((prev) => {
            const newDims = { ...prev };
            placedItems.forEach((item) => {
                const key = getItemKey(item);

                // Get current dimensions (if any)
                const currentDims = newDims[key] || {
                    length: "",
                    width: "",
                    height: "",
                };

                // Get dimensions from item
                const itemDims = {
                    length: item.length || "",
                    width: item.width || "",
                    height: item.height || "",
                };

                // Merge dimensions, prioritizing non-empty values from current state
                const mergedDims = {
                    length: currentDims.length || itemDims.length,
                    width: currentDims.width || itemDims.width,
                    height: currentDims.height || itemDims.height,
                };

                // Only update if something changed
                if (
                    JSON.stringify(currentDims) !== JSON.stringify(mergedDims)
                ) {
                    newDims[key] = mergedDims;
                    console.log(
                        `Setting dimensions for key "${key}":`,
                        mergedDims
                    );
                }
            });

            console.log("Dimensions aggregation complete:", newDims);
            return newDims;
        });
    }, [placedItems]);

    // Initialize local state from props when they change
    useEffect(() => {
        if (
            accessDoorSelections &&
            Object.keys(accessDoorSelections).length > 0
        ) {
            setLocalAccessDoorSelections(accessDoorSelections);
        }
    }, [accessDoorSelections]);

    // Calculate total access door price from selections
    useEffect(() => {
        const calculateTotalAccessDoorPrice = () => {
            let totalPrice = 0;

            // Sum up all door prices using accessDoorSelections (properly propagated from props)
            const selections =
                accessDoorSelections || localAccessDoorSelections;

            Object.values(selections).forEach((door) => {
                if (door && door.price) {
                    totalPrice += Number(door.price);
                }
            });

            return totalPrice;
        };

        const totalAccessDoorPrice = calculateTotalAccessDoorPrice();

        // Only update if there's a meaningful change
        if (Math.abs(accessDoorPriceState - totalAccessDoorPrice) > 0.001) {
            console.log(
                `Total access door price updated: ${totalAccessDoorPrice}`
            );
            setAccessDoorPriceState(totalAccessDoorPrice);

            // Pass to parent component
            if (accessDoorSelectCallbackRef.current) {
                accessDoorSelectCallbackRef.current(totalAccessDoorPrice);
            }
        }
    }, [accessDoorSelections, accessDoorPriceState]);

    // Compute a breakdown by category and an overall total.
    // This effect now depends only on placedItems and groupDimensions.
    // UPDATED: Added special handling for ventilation/grease items
    useEffect(() => {
        console.log("Starting grouped price calculation...");
        let overallTotal = 0;
        const groupedTotals = {}; // e.g., { "Access Door": 123, "Air": 456 }
        const aggregatedPriceMap = {};

        // Process non-aggregated pricing items:
        placedItems.forEach((item) => {
            if (item.prices) {
                const priceAggKey = getPriceAggregationKey(item);
                if (priceAggKey) {
                    if (!aggregatedPriceMap[priceAggKey]) {
                        aggregatedPriceMap[priceAggKey] = item;
                    }
                } else {
                    const key = getItemKey(item);
                    const dims = groupDimensions[key] || {};

                    // Special handling for ventilation and grease extract items
                    let price = 0;
                    if (isVentilationOrGreaseItem(item)) {
                        console.log(
                            `Using specialized calculation for item "${item.name}"`
                        );
                        price = calculateVentilationPrice(item, dims);
                    } else {
                        price = calculateItemPrice(item, dims) || 0;
                    }

                    const category = item.category || "Other";
                    console.log(
                        `Calculated price for non-aggregated item "${item.name}" in category "${category}" with dimensions`,
                        dims,
                        ":",
                        price
                    );
                    groupedTotals[category] =
                        (groupedTotals[category] || 0) + price;
                    overallTotal += price;
                }
            }
        });

        // Process aggregated pricing groups:
        for (const aggKey in aggregatedPriceMap) {
            const item = aggregatedPriceMap[aggKey];
            const key = getItemKey(item);
            const dims = groupDimensions[key] || {};

            // Special handling for ventilation and grease extract items
            let price = 0;
            if (isVentilationOrGreaseItem(item)) {
                console.log(
                    `Using specialized calculation for aggregated item "${item.name}"`
                );
                price = calculateVentilationPrice(item, dims);
            } else {
                price = calculateItemPrice(item, dims) || 0;
            }

            const category = item.category || "Other";
            console.log(
                `Calculated price for aggregated pricing group "${item.name}" in category "${category}" (agg key: "${aggKey}") with dimensions`,
                dims,
                ":",
                price
            );
            groupedTotals[category] = (groupedTotals[category] || 0) + price;
            overallTotal += price;
        }

        // Include access door prices in the groupedTotals and overallTotal
        if (accessDoorPriceState > 0) {
            groupedTotals["Access Door"] =
                (groupedTotals["Access Door"] || 0) + accessDoorPriceState;
            overallTotal += accessDoorPriceState;
        }

        // IMPORTANT FIX: Do NOT include flexiDuctVentilationPrice in schematicItemsTotal
        // This price is already being passed separately via onVentilationPriceChange

        console.log(
            "SchematicList -> computed grouped schematic items totals:",
            groupedTotals,
            "Overall total:",
            overallTotal
        );
        // Ensure we pass a consistent object (overall: number, breakdown: object)
        const result = { overall: overallTotal, breakdown: groupedTotals };
        // Call the parent's callback if provided.
        if (schematicTotalCallbackRef.current) {
            schematicTotalCallbackRef.current(result);
        }
    }, [placedItems, groupDimensions, accessDoorPriceState]);

    // Calculate total ventilation price from all flexi-duct/hose selections
    // IMPROVED: Prevent double counting and ensure proper updates
    useEffect(() => {
        // Skip if selections were already processed
        if (
            ventilationPriceSetRef.current &&
            Object.keys(flexiDuctSelections).length === 0
        ) {
            return;
        }

        // Skip completely if canvas is empty but keep price if already set
        if (placedItems.length === 0 && flexiDuctVentilationPrice === 0) {
            return;
        }

        // Memoize the calculation of ventilation price
        const calculateTotalVentilationPrice = () => {
            let totalPrice = 0;

            Object.values(flexiDuctSelections).forEach((itemSelections) => {
                itemSelections.forEach((selection) => {
                    const itemPrice = Number(selection.price) || 0;
                    const quantity = Number(selection.quantity) || 0;
                    totalPrice += itemPrice * quantity;
                });
            });

            return totalPrice;
        };

        const totalPrice = calculateTotalVentilationPrice();

        // Only update if there's a meaningful change to prevent infinite loops
        if (Math.abs(flexiDuctVentilationPrice - totalPrice) > 0.001) {
            console.log(
                `Ventilation price from Flexi-Duct/Flexi Hose: ${totalPrice}`
            );
            setFlexiDuctVentilationPrice(totalPrice);
            ventilationPriceSetRef.current = true;

            // Pass the ventilation price up to parent component
            if (ventilationPriceCallbackRef.current) {
                ventilationPriceCallbackRef.current(totalPrice);
            }
        }
    }, [flexiDuctSelections, flexiDuctVentilationPrice, placedItems.length]);

    const handleDimensionChange = (key, field, value) => {
        setGroupDimensions((prev) => ({
            ...prev,
            [key]: { ...prev[key], [field]: value },
        }));
        console.log(`Changing dimension for key "${key}": ${field} = ${value}`);
    };

    // Helper function to update access door price based on selections
    const updateAccessDoorPrice = useCallback(
        (selections) => {
            let totalPrice = 0;

            // Sum up all door prices
            Object.values(selections).forEach((door) => {
                if (door && door.price) {
                    totalPrice += Number(door.price);
                }
            });

            // Only update if there's a meaningful change
            if (Math.abs(accessDoorPriceState - totalPrice) > 0.001) {
                console.log(
                    `[SchematicList] Total access door price updated: ${totalPrice}`
                );
                setAccessDoorPriceState(totalPrice);

                // Pass to parent component if callback exists
                if (accessDoorSelectCallbackRef.current) {
                    accessDoorSelectCallbackRef.current(totalPrice);
                }
            }
        },
        [accessDoorPriceState]
    );

    // Enhanced to ensure door selections are properly saved and tracked - FIXED to address saving issues
    const handleAccessDoorSelect = useCallback(
        (itemId, selectedDoor) => {
            if (!selectedDoor) {
                console.warn(
                    `[SchematicList] Ignoring null door selection for item ${itemId}`
                );
                return;
            }

            // Log the selection for debugging
            console.log(
                `[SchematicList] Processing door selection for item ${itemId}:`,
                selectedDoor
            );

            // Extract MongoDB ID, ensuring we get a consistent ID
            const mongoId =
                selectedDoor._id ||
                selectedDoor.mongoId ||
                selectedDoor.id ||
                "";

            if (!mongoId) {
                console.error(
                    `[SchematicList] Door selection missing ID for item ${itemId}`
                );
                return;
            }

            // Get the price, prioritizing different possible sources
            const doorPrice = Number(
                selectedDoor.price || selectedDoor.accessDoorPrice || 0
            );

            // Format the door selection data consistently
            const doorSelection = {
                mongoId: mongoId, // Explicitly store MongoDB ID
                id: mongoId, // For backward compatibility
                name: selectedDoor.name || "",
                type: selectedDoor.type || "",
                dimensions: selectedDoor.dimensions || "",
                price: doorPrice,
            };

            console.log(
                `[SchematicList] Formatted door selection for ${itemId}:`,
                doorSelection
            );

            // 1. Update local state for UI and price calculations - SINGLE SOURCE OF TRUTH PATTERN
            const updatedLocalSelections = {
                ...localAccessDoorSelections,
                [itemId]: doorSelection,
            };

            setLocalAccessDoorSelections(updatedLocalSelections);
            console.log(
                "[SchematicList] Updated local selections. Total doors:",
                Object.keys(updatedLocalSelections).length
            );

            // CRITICAL FIX: Prioritize direct prop update for parent state
            if (typeof setAccessDoorSelections === "function") {
                try {
                    // Direct assignment for immediate effect - GUARANTEED UPDATE PATTERN
                    const updatedParentSelections = {
                        ...accessDoorSelections,
                        [itemId]: doorSelection,
                    };

                    // Using function form to guarantee we get latest state
                    setAccessDoorSelections(updatedParentSelections);

                    console.log(
                        "[SchematicList] Updated parent state directly with selections:",
                        Object.keys(updatedParentSelections)
                    );
                } catch (error) {
                    console.error(
                        "[SchematicList] Error updating parent directly:",
                        error
                    );

                    // Fallback to ref method if direct update fails
                    if (setAccessDoorSelectionsRef.current) {
                        try {
                            setAccessDoorSelectionsRef.current((prev) => ({
                                ...prev,
                                [itemId]: doorSelection,
                            }));

                            console.log(
                                "[SchematicList] Used fallback method to update parent state"
                            );
                        } catch (innerError) {
                            console.error(
                                "[SchematicList] Both update methods failed:",
                                innerError
                            );
                        }
                    }
                }
            } else if (setAccessDoorSelectionsRef.current) {
                // Try ref as backup if direct prop is not available
                try {
                    setAccessDoorSelectionsRef.current((prev) => ({
                        ...prev,
                        [itemId]: doorSelection,
                    }));

                    console.log(
                        "[SchematicList] Used ref method to update parent state"
                    );
                } catch (error) {
                    console.error(
                        "[SchematicList] Error updating parent via ref:",
                        error
                    );
                }
            } else {
                console.error(
                    "[SchematicList] No method available to update parent state!"
                );
            }

            // 3. Update access door price with the latest selections
            updateAccessDoorPrice(updatedLocalSelections);

            // 4. VERIFY STATE UPDATE
            setTimeout(() => {
                console.log(
                    "[SchematicList] VERIFICATION CHECK - Current states:"
                );
                console.log(
                    "- Local selections:",
                    Object.keys(localAccessDoorSelections).length
                );
                console.log(
                    "- Parent selections:",
                    accessDoorSelections
                        ? Object.keys(accessDoorSelections).length
                        : 0
                );
            }, 100);
        },
        [
            setAccessDoorSelections,
            accessDoorSelections, // Added dependency to ensure we use latest parent state
            localAccessDoorSelections,
            updateAccessDoorPrice,
        ]
    );

    return (
        <div className="schematic-list-container">
            <SchematicListGrid
                combinedList={displayList}
                groupDimensions={groupDimensions}
                handleDimensionChange={handleDimensionChange}
                placedItems={placedItems}
                handleAccessDoorSelect={handleAccessDoorSelect} // Pass the local handler directly
                accessDoorSelections={accessDoorSelections} // Use the properly destructured prop
                onVentilationPriceChange={(price) => {
                    // Only update if there's a meaningful change to prevent infinite loops
                    if (Math.abs(flexiDuctVentilationPrice - price) > 0.001) {
                        setFlexiDuctVentilationPrice(price);
                        ventilationPriceSetRef.current = true;
                        if (ventilationPriceCallbackRef.current) {
                            ventilationPriceCallbackRef.current(price);
                        }
                    }
                }}
                fanGradeSelections={fanGradeSelections}
                setFanGradeSelections={setFanGradeSelections}
                flexiDuctSelections={flexiDuctSelections}
                setFlexiDuctSelections={setFlexiDuctSelections}
            />
        </div>
    );
}
