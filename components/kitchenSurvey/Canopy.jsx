// components\kitchenSurvey\Canopy.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import "primeicons/primeicons.css";

// Import sub-components (manageable parts)
import CanopyEntryForm from "./canopy/CanopyForm";
import CanopyEntryList from "./canopy/CanopyList";

export default function Canopy({
    onCanopyTotalChange,
    structureIds = [],
    onCanopyIdChange,
    initialCanopyTotal = 0,
    initialCanopyId = "",
    initialEntries = [],
    onEntriesChange,
}) {
    // State for holding fetched items for the "Canopy" subcategory.
    const [canopyItems, setCanopyItems] = useState([]); // Array of canopy items
    // State for holding fetched items for the "Filter" subcategory.
    const [filterItems, setFilterItems] = useState([]); // Array of filter items

    // State for the entry form.
    // For numeric fields, default values are now null so that no numbers are displayed until data is entered.
    const [form, setForm] = useState({
        canopy: {
            type: "Canopy", // Fixed type for canopy row
            item: "",
            grade: "",
            length: null,
            width: null,
            height: null,
        },
        filter: {
            type: "Filter", // Fixed type for filter row
            item: "",
            grade: "",
            number: null,
            length: null,
            width: null,
            height: null,
        },
    });

    // State for the list of added entries.
    const [entryList, setEntryList] = useState(initialEntries || []); // Array holding survey entries

    // Reference to previous initialEntries to prevent unnecessary updates
    const prevInitialEntriesRef = useRef(null);

    // Helper function to check if arrays are deeply equal
    const areArraysEqual = (arr1, arr2) => {
        if (!arr1 || !arr2) return arr1 === arr2;
        if (arr1.length !== arr2.length) return false;

        return JSON.stringify(arr1) === JSON.stringify(arr2);
    };

    // Initialize from saved data with proper memoization
    useEffect(() => {
        // Only update if initialEntries has actually changed
        if (
            initialEntries &&
            initialEntries.length > 0 &&
            !areArraysEqual(initialEntries, prevInitialEntriesRef.current)
        ) {
            console.log("Canopy: Updating entryList from initialEntries");
            setEntryList(initialEntries);
            prevInitialEntriesRef.current = initialEntries;
        }

        // Notify parent about initial canopy ID if needed
        if (initialCanopyId && typeof onCanopyIdChange === "function") {
            onCanopyIdChange(initialCanopyId);
        }
    }, [initialEntries, initialCanopyId, onCanopyIdChange]);

    // Fetch items from the API when the component mounts.
    useEffect(() => {
        async function fetchItems() {
            try {
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
                } else {
                    console.error("Failed to fetch items:", json);
                }
            } catch (error) {
                console.error("Error fetching items:", error);
            }
        }
        fetchItems();
    }, []);

    // For numeric fields, converts the value to a number (or sets to null if empty).
    const handleChange = (row, field, value) => {
        const numericFields = ["length", "width", "height", "number"]; // Array of numeric field names
        let newValue = value;
        if (numericFields.includes(field)) {
            newValue = value === "" ? null : Number(value);
        }
        setForm((prev) => ({
            ...prev,
            [row]: { ...prev[row], [field]: newValue },
        }));
    };

    // Get grade options for a given row based on the selected item.
    const getGradeOptions = (row) => {
        const items = row === "canopy" ? canopyItems : filterItems; // Determine items array based on row
        const selected = items.find((item) => item.item === form[row].item);
        if (selected && selected.prices) {
            return Object.keys(selected.prices).sort((a, b) =>
                a.localeCompare(b)
            );
        }
        return [];
    };

    // Handler for adding an entry.
    const handleAddEntry = (e) => {
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
        const newEntry = { ...form, id: Date.now() };
        setEntryList((prev) => [...prev, newEntry]);
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
    };

    // Calculate total price based on entryList and notify parent about changes
    useEffect(() => {
        // Notify parent about entry changes
        if (typeof onEntriesChange === "function") {
            onEntriesChange(entryList);
        }
        const total = entryList.reduce((sum, entry) => {
            let canopyRowTotal = 0;
            let filterRowTotal = 0;

            const canopyItem = canopyItems.find(
                (itm) =>
                    itm.item === entry.canopy.item &&
                    itm.subcategory === "Canopy"
            );
            if (canopyItem && canopyItem.prices && entry.canopy.grade) {
                const canopyPrice =
                    Number(canopyItem.prices[entry.canopy.grade]) || 0;
                const lengthVal =
                    entry.canopy.length !== null && entry.canopy.length !== ""
                        ? Number(entry.canopy.length)
                        : 1;
                const effectiveLength = lengthVal < 1 ? 1 : lengthVal;
                const widthVal =
                    entry.canopy.width !== null && entry.canopy.width !== ""
                        ? Number(entry.canopy.width)
                        : 1;
                const effectiveWidth = widthVal < 1 ? 1 : widthVal;
                const heightVal =
                    entry.canopy.height !== null && entry.canopy.height !== ""
                        ? Number(entry.canopy.height)
                        : 1;
                const effectiveHeight = heightVal < 1 ? 1 : heightVal;
                const canopyDimensions =
                    effectiveLength * effectiveWidth * effectiveHeight;
                canopyRowTotal = canopyPrice * canopyDimensions;
            }

            const filterItem = filterItems.find(
                (itm) =>
                    itm.item === entry.filter.item &&
                    itm.subcategory === "Filter"
            );
            if (filterItem && filterItem.prices && entry.filter.grade) {
                const filterPrice =
                    Number(filterItem.prices[entry.filter.grade]) || 0;
                const quantity =
                    entry.filter.number !== null && entry.filter.number !== ""
                        ? Number(entry.filter.number)
                        : 1;
                filterRowTotal = filterPrice * quantity;
            }

            return sum + canopyRowTotal + filterRowTotal;
        }, 0);

        if (typeof onCanopyTotalChange === "function") {
            onCanopyTotalChange(total);
        }
    }, [entryList, canopyItems, filterItems, onCanopyTotalChange]);

    // Compute unique subcategories from canopyItems and filterItems.
    const uniqueSubcategories = Array.from(
        new Set([
            ...canopyItems.map((item) => item.subcategory),
            ...filterItems.map((item) => item.subcategory),
        ])
    ).sort((a, b) => a.localeCompare(b));

    return (
        <div className="survey-container">
            {/* <h2>Canopy</h2> */}
            {/* Removed the CanopyIDSelector component - no longer needed */}

            {/* Render the entry forms (Canopy and Filter) via the sub-component */}
            <CanopyEntryForm
                form={form}
                handleChange={handleChange}
                canopyItems={canopyItems}
                filterItems={filterItems}
                getGradeOptions={getGradeOptions}
                handleAddEntry={handleAddEntry}
            />
            {/* Render the list of added entries via the sub-component */}
            <CanopyEntryList
                entryList={entryList}
                canopyItems={canopyItems}
                filterItems={filterItems}
                setEntryList={setEntryList}
                uniqueSubcategories={uniqueSubcategories}
            />
            <datalist id="subcategorySuggestions">
                {uniqueSubcategories.map((sug, idx) => (
                    <option key={idx} value={sug} />
                ))}
            </datalist>
        </div>
    );
}
