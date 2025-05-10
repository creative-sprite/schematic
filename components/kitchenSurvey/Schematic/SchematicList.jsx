// components\kitchenSurvey\Schematic\SchematicList.jsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SchematicListGrid from "./SchematicListParts/SchematicListGrid";
import { calculateItemPrice } from "../../../lib/priceCalculator";
// Add new import for ventilation calculations
import { calculateVentilationPrice } from "../../../lib/ventCalculations";

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
            category.includes("extract") ||
            category === "air"
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
            name.includes("extract") ||
            name.includes("duct") ||
            name.includes("flexi")
        ) {
            return true;
        }
    }

    // Also check for requiresDimensions flag
    return !!item.requiresDimensions;
}

export default function SchematicListContainer(props) {
    const {
        placedItems,
        setPlacedItems, // We'll modify this to update item dimensions directly
        onAccessDoorSelect,
        onVentilationPriceChange,
        onFanPartsPriceChange,
        onAirInExPriceChange,
        structureIds = [],
        onSchematicItemsTotalChange, // Callback to pass the computed totals
        flexiDuctSelections = {},
        setFlexiDuctSelections,
        accessDoorSelections = {},
        setAccessDoorSelections,
        fanGradeSelections = {},
        setFanGradeSelections,
    } = props;

    // For display, we group items based on aggregateEntry (display grouping)
    const [displayList, setDisplayList] = useState([]);

    // State to track ventilation price from Flexi-Duct/Flexi Hose items
    const [flexiDuctVentilationPrice, setFlexiDuctVentilationPrice] =
        useState(0);

    // Flag to track if ventilation price was already set to prevent duplicates
    const ventilationPriceSetRef = useRef(false);

    // Track access door price separately to avoid reconciliation issues
    const [accessDoorPriceState, setAccessDoorPriceState] = useState(0);

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

    const accessDoorSelectCallbackRef = useRef(onAccessDoorSelect);
    useEffect(() => {
        accessDoorSelectCallbackRef.current = onAccessDoorSelect;
    }, [onAccessDoorSelect]);

    // Log placedItems for debugging.
    useEffect(() => {
        console.log(
            "SchematicListContainer - placedItems:",
            placedItems.length
        );
    }, [placedItems]);

    // Compute displayList: for connectors, only one card per pair; for others, group by aggregateEntry
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

            // Group items with the same aggregation key if aggregateEntry is true
            if (item.aggregateEntry) {
                // Use item name and original ID as a composite key
                const key = item.name?.toLowerCase() + "-" + item.originalId;

                if (!aggregated[key]) {
                    aggregated[key] = item;
                }
            } else {
                nonAggregated.push(item);
            }
        });

        const newDisplayList = [...Object.values(aggregated), ...nonAggregated];
        console.log("Display list computed. Count:", newDisplayList.length);
        setDisplayList(newDisplayList);
    }, [placedItems]);

    // UPDATED: Modified to update dimensions directly on items
    const handleDimensionChange = (item, field, value) => {
        if (!item || !item.id) {
            console.error("Invalid item for dimension change:", item);
            return;
        }

        console.log(
            `Changing dimension for item "${item.name}" (${item.id}): ${field} = ${value}`
        );

        // Update the item's dimension directly
        setPlacedItems((prevItems) =>
            prevItems.map((prevItem) => {
                if (prevItem.id === item.id) {
                    return {
                        ...prevItem,
                        [field]: value,
                    };
                }
                return prevItem;
            })
        );
    };

    // Calculate total access door price from selections
    useEffect(() => {
        const calculateTotalAccessDoorPrice = () => {
            let totalPrice = 0;

            // Sum up all door prices using accessDoorSelections directly
            Object.values(accessDoorSelections || {}).forEach((door) => {
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
    // UPDATED: Get dimensions directly from items instead of groupDimensions
    useEffect(() => {
        console.log("Starting price calculation from items...");
        let overallTotal = 0;
        const groupedTotals = {}; // e.g., { "Access Door": 123, "Air": 456 }

        // For aggregated pricing, track by item name + original ID
        const aggregatedItems = {};

        // First pass: identify which items should be aggregated for pricing
        placedItems.forEach((item) => {
            if (item.prices && item.aggregateEntry && item.requiresDimensions) {
                const key = item.name?.toLowerCase() + "-" + item.originalId;
                if (!aggregatedItems[key]) {
                    aggregatedItems[key] = item;
                }
            }
        });

        // Calculate prices for non-aggregated items
        placedItems.forEach((item) => {
            if (!item.prices) return;

            // Skip aggregated items in this loop
            if (item.aggregateEntry && item.requiresDimensions) {
                const key = item.name?.toLowerCase() + "-" + item.originalId;
                if (aggregatedItems[key] !== item) {
                    return;
                }
            }

            // Get dimensions directly from the item
            const dims = {
                length: item.length || "",
                width: item.width || "",
                height: item.height || "",
            };

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
                `Calculated price for item "${item.name}" in category "${category}" with dimensions`,
                dims,
                ":",
                price
            );

            groupedTotals[category] = (groupedTotals[category] || 0) + price;
            overallTotal += price;
        });

        // Include access door prices in the groupedTotals and overallTotal
        if (accessDoorPriceState > 0) {
            groupedTotals["Access Door"] =
                (groupedTotals["Access Door"] || 0) + accessDoorPriceState;
            overallTotal += accessDoorPriceState;
        }

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
    }, [placedItems, accessDoorPriceState]);

    // Calculate total ventilation price from all flexi-duct/hose selections
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

    // State and ref for handling door selections
    const isUpdatingRef = useRef(false);

    // Updated to ensure door selections are properly saved - modified to be simpler
    const handleAccessDoorSelect = useCallback(
        (itemId, selectedDoor) => {
            // Prevent duplicate/recursive updates
            if (isUpdatingRef.current) return;
            isUpdatingRef.current = true;

            try {
                if (!selectedDoor) {
                    console.log(
                        `[SchematicList] Clearing door for item ${itemId}`
                    );

                    // Update parent state directly using setAccessDoorSelections
                    if (setAccessDoorSelections) {
                        setAccessDoorSelections((prev) => {
                            const newSelections = { ...prev };
                            delete newSelections[itemId];
                            return newSelections;
                        });
                    }
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

                // Update ONLY the parent state directly
                if (setAccessDoorSelections) {
                    setAccessDoorSelections((prev) => ({
                        ...prev,
                        [itemId]: doorSelection,
                    }));
                }
            } finally {
                // Reset update flag after a short delay to allow React to process updates
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
        },
        [setAccessDoorSelections]
    );

    return (
        <div className="schematic-list-container">
            <SchematicListGrid
                combinedList={displayList}
                handleDimensionChange={handleDimensionChange}
                placedItems={placedItems}
                handleAccessDoorSelect={handleAccessDoorSelect}
                accessDoorSelections={accessDoorSelections}
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
