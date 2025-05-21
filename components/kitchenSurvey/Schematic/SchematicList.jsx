// components\kitchenSurvey\Schematic\SchematicList.jsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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

/**
 * Standardize category names to ensure consistent naming
 */
function standardizeCategory(category) {
    if (!category) return "Other";

    // Normalize to lowercase for comparison
    const normalizedCategory = category.toLowerCase();

    // Check for system-related categories and standardize to "Fan Unit"
    if (
        normalizedCategory === "system" ||
        normalizedCategory === "system components" ||
        normalizedCategory.includes("system") ||
        normalizedCategory.includes("component")
    ) {
        return "Fan Unit";
    }

    // Check for ventilation and standardize to "Flexi-Duct"
    if (
        normalizedCategory === "ventilation" ||
        normalizedCategory.includes("ventil")
    ) {
        return "Flexi-Duct";
    }

    // Return the original category if no standardization needed
    return category;
}

export default function SchematicListContainer(props) {
    const {
        placedItems,
        setPlacedItems, // We'll modify this to update item dimensions directly
        onAccessDoorSelect,
        onVentilationPriceChange, // NOT USED ANYMORE - Keep for backward compatibility
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
    // RENAMED: from flexiDuctVentilationPrice to flexiDuctPrice to avoid confusion
    const [flexiDuctPrice, setFlexiDuctPrice] = useState(0);

    // REMOVED: ventilationPriceSetRef - no longer needed as we don't track ventilation separately

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
            // console.log(
            //     "SchematicList received updated accessDoorSelections:",
            //     Object.keys(accessDoorSelections)
            // );
        }
    }, [accessDoorSelections, setAccessDoorSelections]);

    useEffect(() => {
        schematicTotalCallbackRef.current = onSchematicItemsTotalChange;
    }, [onSchematicItemsTotalChange]);

    // IMPORTANT: DO NOT USE ventilationPriceCallback AT ALL
    // Completely ignore the ventilation callback to prevent any ventilation category from appearing
    const ventilationPriceCallbackRef = useRef(null); // Set to null to ensure it's never called

    const accessDoorSelectCallbackRef = useRef(onAccessDoorSelect);
    useEffect(() => {
        accessDoorSelectCallbackRef.current = onAccessDoorSelect;
    }, [onAccessDoorSelect]);

    // Log placedItems for debugging.
    useEffect(() => {
        // console.log(
        //     "SchematicListContainer - placedItems:",
        //     placedItems.length
        // );
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
        // console.log("Display list computed. Count:", newDisplayList.length);
        setDisplayList(newDisplayList);
    }, [placedItems]);

    // UPDATED: Modified to update dimensions directly on items and ensure recalculation
    const handleDimensionChange = (item, field, value) => {
        if (!item || !item.id) {
            console.warn("Invalid item for dimension change:", item);
            return;
        }

        // Add first console log here for debugging
        console.log(
            `Dimension change: ${field} = ${value} for item ${item.id}`
        );

        // Update the item's dimension directly with a modified timestamp to ensure change detection
        setPlacedItems((prevItems) =>
            prevItems.map((prevItem) => {
                if (prevItem.id === item.id) {
                    const updatedItem = {
                        ...prevItem,
                        [field]: value,
                        _lastModified: Date.now(), // Add timestamp to ensure React detects the change
                    };

                    // Add second console log here to show the updated item
                    console.log(
                        "Updated item:",
                        JSON.stringify({
                            id: updatedItem.id,
                            length: updatedItem.length,
                            width: updatedItem.width,
                            height: updatedItem.height,
                            inaccessible: updatedItem.inaccessible,
                            field: field,
                            value: value,
                        })
                    );

                    return updatedItem;
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

    // CORRECTLY FIXED: Compute prices by category with no ventilation duplication
    useEffect(() => {
        console.log("Starting price calculation from items...");
        let overallTotal = 0;
        const groupedTotals = {}; // e.g., { "Air": 456, "Grease": 789, "Flexi-Duct": 101 }

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
                inaccessible: item.inaccessible,
            };

            // Special handling for ventilation and grease extract items
            let price = 0;
            if (isVentilationOrGreaseItem(item)) {
                // console.log(
                //     `Using specialized calculation for item "${item.name}"`
                // );
                price = calculateVentilationPrice(item, dims);
            } else {
                price = calculateItemPrice(item, dims) || 0;
            }

            // Use the standardizeCategory function to ensure consistent naming
            let category = standardizeCategory(item.category || "Other");

            // console.log(
            //     `Calculated price for item "${item.name}" in category "${category}" with dimensions`,
            //     dims,
            //     ":",
            //     price
            // );

            groupedTotals[category] = (groupedTotals[category] || 0) + price;
            overallTotal += price;
        });

        // FIXED: Don't include access door prices in groupedTotals to prevent duplication
        // The accessDoorPrice is already tracked separately and will be added directly
        // in the PriceTables component

        // FIXED: Do NOT include accessDoorPriceState in the overall total
        // It will be displayed separately in PriceTables component
        // This prevents the duplicated entry in both Access Door and Schematic sections

        // Add Flexi-Duct selections to the proper Flexi-Duct category
        // NOTE: Ventilation and Flexi-Duct are the same thing, only count once
        if (flexiDuctPrice > 0) {
            groupedTotals["Flexi-Duct"] =
                (groupedTotals["Flexi-Duct"] || 0) + flexiDuctPrice;

            // Add to overall total
            overallTotal += flexiDuctPrice;
        }

        // AGGRESSIVE CHECK: Ensure no Ventilation category exists in final output
        // Delete the Ventilation category if it somehow got created
        if (groupedTotals["Ventilation"]) {
            // Move any remaining value to Flexi-Duct and delete Ventilation
            if (groupedTotals["Ventilation"] > 0) {
                groupedTotals["Flexi-Duct"] =
                    (groupedTotals["Flexi-Duct"] || 0) +
                    groupedTotals["Ventilation"];
            }
            delete groupedTotals["Ventilation"]; // Always delete Ventilation category
        }

        // FINAL CHECK: Scan all keys and rename any containing "Ventilation"
        Object.keys(groupedTotals).forEach((key) => {
            if (key.includes("Ventilation") || key.includes("ventilation")) {
                const value = groupedTotals[key];
                delete groupedTotals[key];
                groupedTotals["Flexi-Duct"] =
                    (groupedTotals["Flexi-Duct"] || 0) + value;
            }
        });

        // FINAL CHECK: Also rename any "System Components" to "Fan Unit" if they still exist
        if (groupedTotals["System Components"]) {
            const value = groupedTotals["System Components"];
            delete groupedTotals["System Components"];
            groupedTotals["Fan Unit"] =
                (groupedTotals["Fan Unit"] || 0) + value;
        }

        // ADDITIONAL CHECK: Check for any keys containing "System" or "Components" and rename
        Object.keys(groupedTotals).forEach((key) => {
            if (
                key.includes("System") ||
                key.includes("Components") ||
                key.includes("system") ||
                key.includes("components")
            ) {
                const value = groupedTotals[key];
                delete groupedTotals[key];
                groupedTotals["Fan Unit"] =
                    (groupedTotals["Fan Unit"] || 0) + value;
            }
        });

        // console.log(
        //     "SchematicList -> computed grouped schematic items totals:",
        //     groupedTotals,
        //     "Overall total:",
        //     overallTotal
        // );

        // Ensure we pass a consistent object (overall: number, breakdown: object)
        const result = { overall: overallTotal, breakdown: groupedTotals };

        // Call the parent's callback if provided.
        if (schematicTotalCallbackRef.current) {
            schematicTotalCallbackRef.current(result);
        }
    }, [placedItems, accessDoorPriceState, flexiDuctPrice]);

    // FIXED: Calculate total Flexi-Duct price from selections (renamed from ventilation)
    useEffect(() => {
        // Skip completely if canvas is empty but keep price if already set
        if (placedItems.length === 0 && flexiDuctPrice === 0) {
            return;
        }

        // Calculate total price from Flexi-Duct selections
        const calculateTotalFlexiDuctPrice = () => {
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

        const totalPrice = calculateTotalFlexiDuctPrice();

        // Only update if there's a meaningful change to prevent infinite loops
        if (Math.abs(flexiDuctPrice - totalPrice) > 0.001) {
            // console.log(`Flexi-Duct price: ${totalPrice}`);
            setFlexiDuctPrice(totalPrice);

            // DO NOT call ventilation callback at all to completely avoid
            // any possibility of creating a ventilation category
            // This completely removes the ventilation logic
        }
    }, [flexiDuctSelections, flexiDuctPrice, placedItems.length]);

    // REMOVED: Unused helper function that could cause duplicate updates

    // State and ref for handling door selections - extended timeout to prevent race conditions
    const isUpdatingRef = useRef(false);
    const doorUpdateTimeoutRef = useRef(null);

    // Updated to ensure door selections are properly saved without duplicates
    const handleAccessDoorSelect = useCallback(
        (itemId, selectedDoor) => {
            // Clear any pending update timeouts
            if (doorUpdateTimeoutRef.current) {
                clearTimeout(doorUpdateTimeoutRef.current);
                doorUpdateTimeoutRef.current = null;
            }

            // Prevent duplicate/recursive updates
            if (isUpdatingRef.current) return;
            isUpdatingRef.current = true;

            // Log the current selections to help debug duplicates
            // console.log(
            //     `[SchematicList] Current access door count before update: ${
            //         Object.keys(accessDoorSelections || {}).length
            //     }`
            // );

            try {
                if (!selectedDoor) {
                    // console.log(
                    //     `[SchematicList] Clearing door for item ${itemId}`
                    // );

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

                // Log the selection for debugging with more details
                // console.log(
                //     `[SchematicList] Processing door selection for item ${itemId}:`,
                //     selectedDoor,
                //     `- Will ${
                //         !selectedDoor ? "remove" : "add/update"
                //     } selection`
                // );

                // Extract MongoDB ID, ensuring we get a consistent ID
                const mongoId =
                    selectedDoor._id ||
                    selectedDoor.mongoId ||
                    selectedDoor.id ||
                    "";

                if (!mongoId) {
                    // console.error(
                    //     `[SchematicList] Door selection missing ID for item ${itemId}`
                    // );
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

                // console.log(
                //     `[SchematicList] Formatted door selection for ${itemId}:`,
                //     doorSelection
                // );

                // Deduplicate by explicitly checking if this exact door is already selected
                if (setAccessDoorSelections) {
                    setAccessDoorSelections((prev) => {
                        // Check if this exact door is already in selections to prevent duplication
                        const existing = prev[itemId];
                        if (
                            existing &&
                            existing.mongoId === doorSelection.mongoId &&
                            existing.price === doorSelection.price
                        ) {
                            // console.log(
                            //     `[SchematicList] Door ${doorSelection.mongoId} already exists for item ${itemId}, skipping duplicate`
                            // );
                            return prev; // No change needed, return previous state
                        }

                        // Otherwise update with the new selection
                        // console.log(
                        //     `[SchematicList] Adding/updating door for item ${itemId}:`,
                        //     doorSelection
                        // );
                        return {
                            ...prev,
                            [itemId]: doorSelection,
                        };
                    });
                }
            } finally {
                // Use a ref to track the timeout so it can be cleared if needed
                doorUpdateTimeoutRef.current = setTimeout(() => {
                    isUpdatingRef.current = false;
                    doorUpdateTimeoutRef.current = null;

                    // After update completes, log the final state for debugging
                    // console.log(
                    //     `[SchematicList] Access door count after update: ${
                    //         Object.keys(accessDoorSelections || {}).length
                    //     }`
                    // );
                }, 100); // Longer timeout to ensure React has fully processed the update
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
                    // ONLY update Flexi-Duct price, do NOT call ventilation callback
                    if (Math.abs(flexiDuctPrice - price) > 0.001) {
                        setFlexiDuctPrice(price);
                        // NO ventilation callback to ensure it never appears in price tables
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
