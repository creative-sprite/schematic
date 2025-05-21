// components/kitchenSurvey/Structure.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import "../../styles/surveyForm.css";
import StructureForm from "./structure/StructureForm";
import StructureList from "./structure/StructureList";

export default function Structure({
    onStructureTotalChange,
    onStructureIdChange,
    initialStructureTotal = 0,
    initialStructureId = "",
    initialStructureEntries = [],
    onStructureEntriesChange,
}) {
    // Reference to the overlay panel for the info icon
    const op = useRef(null);

    // State for storing the computed StructureTotal
    const [structureTotal, setStructureTotal] = useState(
        initialStructureTotal || 0
    );

    // State for holding structure items fetched from the API
    const [structureItems, setStructureItems] = useState([]);

    // MAIN STATE: Array of structure entries - the primary data structure
    const [structureEntries, setStructureEntries] = useState([]);

    // For preventing initial callback cycles
    const isInitializedRef = useRef(false);

    // Initialization effect that runs only once on mount
    useEffect(() => {
        // Skip if already initialized
        if (isInitializedRef.current) return;

        // Fetch structure items when the component mounts
        const fetchStructureItems = async () => {
            try {
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    const items = json.data
                        .filter((itm) => itm.category === "Structure")
                        .map((item) => {
                            const newPrices = {};
                            if (item.prices) {
                                Object.keys(item.prices).forEach((grade) => {
                                    newPrices[grade] = Number(
                                        item.prices[grade]
                                    );
                                });
                            }
                            return { ...item, prices: newPrices };
                        });
                    console.log(
                        "Structure: Loaded structure items:",
                        items.length
                    );
                    setStructureItems(items);

                    // Process structure entries as primary data source
                    if (
                        Array.isArray(initialStructureEntries) &&
                        initialStructureEntries.length > 0
                    ) {
                        console.log(
                            "Structure: Initializing with provided entries:",
                            initialStructureEntries.length
                        );

                        // Ensure entries have all required fields
                        const validatedEntries = initialStructureEntries.map(
                            (entry) => ({
                                id:
                                    entry.id ||
                                    `entry-${Date.now()}-${Math.random()
                                        .toString(36)
                                        .substr(2, 9)}`,
                                selectionData: Array.isArray(
                                    entry.selectionData
                                )
                                    ? entry.selectionData.map((row) => ({
                                          type: row.type || "Ceiling",
                                          item: row.item || "",
                                          grade: row.grade || "",
                                      }))
                                    : [],
                                dimensions: entry.dimensions
                                    ? {
                                          length:
                                              Number(entry.dimensions.length) ||
                                              0,
                                          width:
                                              Number(entry.dimensions.width) ||
                                              0,
                                          height:
                                              Number(entry.dimensions.height) ||
                                              0,
                                      }
                                    : {
                                          length: 0,
                                          width: 0,
                                          height: 0,
                                      },
                                comments: entry.comments || "",
                            })
                        );

                        setStructureEntries(validatedEntries);
                        console.log(
                            "Structure: Validated entries:",
                            validatedEntries
                        );
                    } else {
                        // Start with an empty array if no data provided
                        setStructureEntries([]);
                    }
                } else {
                    console.error("Failed to fetch structure items:", json);
                }
            } catch (error) {
                console.error("Error fetching structure items:", error);
            }
        };

        fetchStructureItems();
        isInitializedRef.current = true;
    }, [initialStructureEntries]); // Add initialStructureEntries to dependency array

    // Function to calculate price for a single structure entry
    const calculateStructurePrice = useCallback(
        (entry) => {
            if (!entry || !entry.selectionData || !entry.dimensions) return 0;

            // Type temp is the sum of prices for each selection row
            const typeTemp = entry.selectionData.reduce((acc, row) => {
                let price = 0;
                if (row.item && row.grade) {
                    const found = structureItems.find(
                        (itm) =>
                            itm.subcategory === row.type &&
                            itm.item === row.item
                    );
                    if (
                        found &&
                        found.prices &&
                        found.prices[row.grade] != null
                    ) {
                        price = Number(found.prices[row.grade]);
                    }
                }
                return acc + price;
            }, 0);

            // Size temp is the product of dimensions
            const sizeTemp =
                (entry.dimensions.length || 1) *
                (entry.dimensions.width || 1) *
                (entry.dimensions.height || 1);

            // Total price is type temp times size temp
            return typeTemp * sizeTemp;
        },
        [structureItems]
    );

    // Effect to recompute total when entries or structure items change
    useEffect(() => {
        if (!isInitializedRef.current || structureItems.length === 0) return;

        // Calculate total price from all entries
        const totalPrice = structureEntries.reduce((total, entry) => {
            return total + calculateStructurePrice(entry);
        }, 0);

        // Update state and notify parent
        setStructureTotal(totalPrice);
        if (typeof onStructureTotalChange === "function") {
            onStructureTotalChange(totalPrice);
        }

        // Notify parent of all entries
        if (typeof onStructureEntriesChange === "function") {
            console.log(
                "Structure: Notifying parent of entries update:",
                structureEntries.length
            );
            onStructureEntriesChange(structureEntries);
        }
    }, [
        structureEntries,
        structureItems,
        calculateStructurePrice,
        onStructureTotalChange,
        onStructureEntriesChange,
    ]);

    // Handle adding a new structure entry
    const handleAddEntry = useCallback((newEntry) => {
        console.log("Structure: Adding new entry:", newEntry);
        setStructureEntries((prev) => [...prev, newEntry]);
    }, []);

    // Handle removing a structure entry
    const handleRemoveEntry = useCallback((id) => {
        console.log("Structure: Removing entry:", id);
        setStructureEntries((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    // Handle updating a structure entry
    const handleUpdateEntry = useCallback((id, updates) => {
        console.log("Structure: Updating entry:", id, updates);
        setStructureEntries((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, ...updates } : entry
            )
        );
    }, []);

    return (
        <>
            <div
                className="structure-container structure-data"
                style={{ position: "relative" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    <h2 style={{ marginRight: "10px" }}>Structure Survey</h2>
                    <i
                        className="pi pi-info-circle"
                        style={{ cursor: "pointer", fontSize: "1.2rem" }}
                        onClick={(e) => op.current.toggle(e)}
                    />
                    <OverlayPanel ref={op} style={{ width: "300px" }}>
                        <div className="p-2">
                            Add structures for the survey by filling out the
                            form and clicking "Add Structure". Each structure
                            consists of ceiling, wall, and floor specifications
                            with dimensions. You can add multiple structures.
                        </div>
                    </OverlayPanel>
                </div>

                {/* Structure Form Component */}
                <StructureForm
                    structureItems={structureItems}
                    handleAddEntry={handleAddEntry}
                />

                {/* Structure List Component */}
                <StructureList
                    entries={structureEntries}
                    structureItems={structureItems}
                    onRemoveEntry={handleRemoveEntry}
                    onUpdateEntry={handleUpdateEntry}
                    calculatePrice={calculateStructurePrice}
                />
            </div>
        </>
    );
}
