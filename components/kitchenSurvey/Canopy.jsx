// components\kitchenSurvey\Canopy.jsx
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import "primeicons/primeicons.css";

// Import sub-components
import CanopyEntryForm from "./canopy/CanopyForm";
import CanopyEntryList from "./canopy/CanopyList";

/**
 * Canopy component that handles canopy entries and comments.
 * This version acts as a passthrough for comments rather than storing them locally.
 */
export default function Canopy({
    onCanopyTotalChange,
    structureIds = [],
    onCanopyIdChange,
    initialCanopyTotal = 0,
    initialCanopyId = "",
    initialEntries = [],
    onEntriesChange,
    initialComments = {},
    onCommentsChange,
}) {
    // State for holding fetched items for the "Canopy" subcategory.
    const [canopyItems, setCanopyItems] = useState([]);
    // State for holding fetched items for the "Filter" subcategory.
    const [filterItems, setFilterItems] = useState([]);

    // State for the entry form.
    const [form, setForm] = useState({
        canopy: {
            type: "Canopy",
            item: "",
            grade: "",
            length: null,
            width: null,
            height: null,
        },
        filter: {
            type: "Filter",
            item: "",
            grade: "",
            number: null,
            length: null,
            width: null,
            height: null,
        },
    });

    // State for the list of added entries.
    const [entryList, setEntryList] = useState(initialEntries || []);

    // Simple refs for tracking
    const canopyTotalRef = useRef(initialCanopyTotal);
    const prevEntriesRef = useRef(initialEntries || []);
    const computingPriceRef = useRef(false);
    const initializedRef = useRef(false);

    // Helper function to check if arrays are deeply equal
    const areArraysEqual = useCallback((arr1, arr2) => {
        if (!arr1 || !arr2) return arr1 === arr2;
        if (arr1.length !== arr2.length) return false;
        return JSON.stringify(arr1) === JSON.stringify(arr2);
    }, []);

    // Initialize from saved data
    useEffect(() => {
        // Only run this once
        if (initializedRef.current) return;

        console.log("Canopy: Initializing component with data");

        // Update initial entries if provided
        if (initialEntries && initialEntries.length > 0) {
            console.log(
                "Canopy: Setting initial entries:",
                initialEntries.length
            );
            setEntryList(initialEntries);
            prevEntriesRef.current = initialEntries;
        }

        // Notify parent about initial canopy ID if needed
        if (initialCanopyId && typeof onCanopyIdChange === "function") {
            onCanopyIdChange(initialCanopyId);
        }

        // Initialize the canopyTotalRef
        canopyTotalRef.current = initialCanopyTotal;

        // Mark initialization complete
        initializedRef.current = true;
    }, [
        initialEntries,
        initialCanopyId,
        onCanopyIdChange,
        areArraysEqual,
        initialCanopyTotal,
    ]);

    // Fetch items from the API when the component mounts.
    useEffect(() => {
        async function fetchItems() {
            try {
                console.log("Canopy: Fetching price list items");
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    // Convert price strings to numbers.
                    const items = json.data.map((item) => {
                        const newPrices = {}; // newPrices holds numeric prices for each grade
                        if (item.prices) {
                            Object.keys(item.prices).forEach((grade) => {
                                newPrices[grade] = Number(item.prices[grade]);
                            });
                        }
                        return { ...item, prices: newPrices };
                    });

                    // Filter items by subcategory.
                    const canopy = items.filter(
                        (item) => item.subcategory === "Canopy"
                    );
                    const filter = items.filter(
                        (item) => item.subcategory === "Filter"
                    );

                    // Sort alphabetically by item name.
                    setCanopyItems(
                        canopy.sort((a, b) => a.item.localeCompare(b.item))
                    );
                    setFilterItems(
                        filter.sort((a, b) => a.item.localeCompare(b.item))
                    );

                    console.log(
                        `Canopy: Loaded ${canopy.length} canopy items and ${filter.length} filter items`
                    );
                } else {
                    console.error("Failed to fetch items:", json);
                }
            } catch (error) {
                console.error("Error fetching items:", error);
            }
        }
        fetchItems();
    }, []);

    // Create memoized lookup maps for canopy and filter items for faster price calculations
    const canopyItemsMap = useMemo(() => {
        const map = new Map();
        canopyItems.forEach((item) => {
            map.set(item.item, item);
        });
        return map;
    }, [canopyItems]);

    const filterItemsMap = useMemo(() => {
        const map = new Map();
        filterItems.forEach((item) => {
            map.set(item.item, item);
        });
        return map;
    }, [filterItems]);

    // For numeric fields, converts the value to a number (or sets to null if empty).
    const handleChange = useCallback((row, field, value) => {
        const numericFields = ["length", "width", "height", "number"]; // Array of numeric field names
        let newValue = value;
        if (numericFields.includes(field)) {
            newValue = value === "" ? null : Number(value);
        }
        setForm((prev) => ({
            ...prev,
            [row]: { ...prev[row], [field]: newValue },
        }));
    }, []);

    // Memoized calculate total price function with optimized lookups
    const calculateCanopyTotal = useCallback(() => {
        // Skip if we're already computing to prevent recursive updates
        if (computingPriceRef.current) {
            return canopyTotalRef.current;
        }

        // Set computing flag
        computingPriceRef.current = true;

        try {
            // Calculate total based on entryList with optimized lookups
            let total = 0;

            entryList.forEach((entry) => {
                let canopyRowTotal = 0;
                let filterRowTotal = 0;

                // Use map lookup instead of find() for better performance
                const canopyItem = canopyItemsMap.get(entry.canopy.item);
                if (canopyItem && canopyItem.prices && entry.canopy.grade) {
                    const canopyPrice =
                        Number(canopyItem.prices[entry.canopy.grade]) || 0;
                    const lengthVal =
                        entry.canopy.length !== null &&
                        entry.canopy.length !== ""
                            ? Number(entry.canopy.length)
                            : 1;
                    const effectiveLength = lengthVal < 1 ? 1 : lengthVal;
                    const widthVal =
                        entry.canopy.width !== null && entry.canopy.width !== ""
                            ? Number(entry.canopy.width)
                            : 1;
                    const effectiveWidth = widthVal < 1 ? 1 : widthVal;
                    const heightVal =
                        entry.canopy.height !== null &&
                        entry.canopy.height !== ""
                            ? Number(entry.canopy.height)
                            : 1;
                    const effectiveHeight = heightVal < 1 ? 1 : heightVal;
                    const canopyDimensions =
                        effectiveLength * effectiveWidth * effectiveHeight;
                    canopyRowTotal = canopyPrice * canopyDimensions;
                }

                // Use map lookup for filter items too
                const filterItem = filterItemsMap.get(entry.filter.item);
                if (filterItem && filterItem.prices && entry.filter.grade) {
                    const filterPrice =
                        Number(filterItem.prices[entry.filter.grade]) || 0;
                    const quantity =
                        entry.filter.number !== null &&
                        entry.filter.number !== ""
                            ? Number(entry.filter.number)
                            : 1;
                    filterRowTotal = filterPrice * quantity;
                }

                total += canopyRowTotal + filterRowTotal;
            });

            return total;
        } finally {
            // Always reset computing flag
            computingPriceRef.current = false;
        }
    }, [entryList, canopyItemsMap, filterItemsMap]);

    // Notify parent about entry changes
    const notifyEntriesChange = useCallback(() => {
        if (typeof onEntriesChange === "function") {
            onEntriesChange(entryList);
        }
    }, [entryList, onEntriesChange]);

    // Notify parent about total price changes
    const notifyTotalChange = useCallback(
        (newTotal) => {
            if (typeof onCanopyTotalChange === "function") {
                // Only notify if the total actually changed
                if (Math.abs(newTotal - canopyTotalRef.current) > 0.001) {
                    canopyTotalRef.current = newTotal;
                    onCanopyTotalChange(newTotal);
                }
            }
        },
        [onCanopyTotalChange]
    );

    // SIMPLIFIED: Handle comments changes - direct propagation to parent
    const handleCommentsChange = useCallback(
        (commentKey, value) => {
            // Direct propagation to parent - no local state
            if (typeof onCommentsChange === "function") {
                // Create updated comments object to pass to parent
                const updatedComments = {
                    ...initialComments,
                    [commentKey]: value,
                };
                onCommentsChange(updatedComments);
            }
        },
        [initialComments, onCommentsChange]
    );

    // Calculate total price and notify parent when entryList changes
    useEffect(() => {
        // Skip if entries haven't actually changed
        if (areArraysEqual(entryList, prevEntriesRef.current)) {
            return;
        }

        // Update previous entries reference
        prevEntriesRef.current = entryList;

        // Notify about entries change
        notifyEntriesChange();

        // Calculate and notify about total price change
        const newTotal = calculateCanopyTotal();
        notifyTotalChange(newTotal);
    }, [
        entryList,
        calculateCanopyTotal,
        notifyTotalChange,
        notifyEntriesChange,
        areArraysEqual,
    ]);

    // Handler for adding an entry with validation
    const handleAddEntry = useCallback(
        (e) => {
            e.preventDefault();
            const { canopy, filter } = form;

            // Validate required fields for both rows.
            if (
                !canopy.item ||
                !canopy.grade ||
                canopy.length === null ||
                canopy.width === null ||
                canopy.height === null
            ) {
                alert("Please fill in all fields for the Canopy row.");
                return;
            }

            if (!filter.item || !filter.grade || filter.number === null) {
                alert("Please fill in all fields for the Filter row.");
                return;
            }

            // Create a new entry with a unique id.
            const entryId = Date.now();
            const newEntry = { ...form, id: entryId };

            // Add the entry to the list
            setEntryList((prev) => [...prev, newEntry]);

            // Create a new comment key for this entry
            const commentKey = `${canopy.item}-${filter.item}-${entryId}`;

            // Initialize empty comment and send to parent
            if (typeof onCommentsChange === "function") {
                const updatedComments = {
                    ...initialComments,
                    [commentKey]: "",
                };
                onCommentsChange(updatedComments);
            }

            // Reset the form (preserving fixed type values).
            setForm({
                canopy: {
                    type: "Canopy",
                    item: "",
                    grade: "",
                    length: null,
                    width: null,
                    height: null,
                },
                filter: {
                    type: "Filter",
                    item: "",
                    grade: "",
                    number: null,
                    length: null,
                    width: null,
                    height: null,
                },
            });
        },
        [form, initialComments, onCommentsChange]
    );

    // Compute unique subcategories from canopyItems and filterItems.
    const uniqueSubcategories = useMemo(() => {
        return Array.from(
            new Set([
                ...canopyItems.map((item) => item.subcategory),
                ...filterItems.map((item) => item.subcategory),
            ])
        ).sort((a, b) => a.localeCompare(b));
    }, [canopyItems, filterItems]);

    return (
        <div className="survey-container">
            <h2>Canopy</h2>

            {/* Render the entry forms (Canopy and Filter) */}
            <CanopyEntryForm
                form={form}
                handleChange={handleChange}
                canopyItems={canopyItems}
                filterItems={filterItems}
                handleAddEntry={handleAddEntry}
            />

            {/* Render the list of added entries - passing comments from props */}
            <CanopyEntryList
                entryList={entryList}
                canopyItems={canopyItems}
                filterItems={filterItems}
                setEntryList={setEntryList}
                uniqueSubcategories={uniqueSubcategories}
                canopyComments={initialComments} // Pass comments directly from props
                onCommentsChange={handleCommentsChange}
            />

            <datalist id="subcategorySuggestions">
                {uniqueSubcategories.map((sug, idx) => (
                    <option key={idx} value={sug} />
                ))}
            </datalist>
        </div>
    );
}
