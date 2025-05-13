// components\kitchenSurvey\Equipment.jsx
"use client";

import React, { useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "../../styles/surveyForm.css";

// Import subcomponents
import EquipmentForm from "./equipment/EquipmentForm";
import EquipmentList from "./equipment/EquipmentList";

export default function Equipment({
    onSurveyListChange,
    structureIds = [],
    onEquipmentIdChange,
    initialSurveyData = [],
    initialEquipmentId = "",
    equipment = {},
    onEquipmentChange,
    initialSubcategoryComments = {},
}) {
    // State for equipment items fetched from the API
    const [equipmentItems, setEquipmentItems] = React.useState([]);

    // Survey form state - Set initial subcategory to "Hot"
    const [surveyForm, setSurveyForm] = React.useState({
        subcategory: "Hot",
        item: "",
        number: 1,
        length: 0,
        grade: "",
        width: 0,
        height: 0,
    });

    // Survey list state
    const [surveyList, setSurveyList] = React.useState(initialSurveyData || []);

    // NEW: Add a state for subcategory comments
    const [subcategoryComments, setSubcategoryComments] = React.useState(
        initialSubcategoryComments || {}
    );

    // DEBUG: Add a ref to track updates to subcategory comments
    const commentsUpdateRef = useRef({
        lastUpdated: Date.now(),
        count: 0,
        lastValue: {},
    });

    // Special items set
    const specialItems = new Set([
        "Condiment - Cutlery Counter",
        "Tray Rail",
        "Work Surface",
    ]);

    // Track initialization state
    const [initialized, setInitialized] = React.useState(false);

    // One-time initialization
    useEffect(() => {
        if (!initialized) {
            // Initialize from survey data if available
            if (initialSurveyData && initialSurveyData.length > 0) {
                setSurveyList(initialSurveyData);

                // Set equipment ID using the first structure ID if available
                if (typeof onEquipmentIdChange === "function") {
                    const idToUse =
                        initialEquipmentId ||
                        (structureIds.length > 0 ? structureIds[0] : "");
                    onEquipmentIdChange(idToUse);
                }

                // Initialize subcategory from the first item if available
                if (
                    initialSurveyData.length > 0 &&
                    initialSurveyData[0].subcategory
                ) {
                    setSurveyForm((prev) => ({
                        ...prev,
                        subcategory: initialSurveyData[0].subcategory,
                    }));
                }
            }

            // Initialize subcategory comments if available
            if (
                initialSubcategoryComments &&
                Object.keys(initialSubcategoryComments).length > 0
            ) {
                console.log(
                    "Equipment: Initializing with",
                    Object.keys(initialSubcategoryComments).length,
                    "subcategory comments"
                );
                setSubcategoryComments(initialSubcategoryComments);

                // Also update debug ref
                commentsUpdateRef.current = {
                    lastUpdated: Date.now(),
                    count: 1,
                    lastValue: { ...initialSubcategoryComments },
                };
            } else if (
                equipment?.subcategoryComments &&
                Object.keys(equipment.subcategoryComments).length > 0
            ) {
                console.log(
                    "Equipment: Initializing with",
                    Object.keys(equipment.subcategoryComments).length,
                    "comments from equipment prop"
                );
                setSubcategoryComments(equipment.subcategoryComments);

                // Also update debug ref
                commentsUpdateRef.current = {
                    lastUpdated: Date.now(),
                    count: 1,
                    lastValue: { ...equipment.subcategoryComments },
                };
            }

            setInitialized(true);
        }
    }, [
        initialSurveyData,
        initialEquipmentId,
        onEquipmentIdChange,
        structureIds,
        initialized,
        initialSubcategoryComments,
        equipment,
    ]);

    // ADDED: Expose a method to synchronize subcategory comments
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.equipmentComponentInstance = {
                syncSubcategoryComments: () => {
                    console.log(
                        "Equipment: Force syncing subcategory comments",
                        Object.keys(subcategoryComments).length > 0
                            ? `(${
                                  Object.keys(subcategoryComments).length
                              } comments)`
                            : "(empty)"
                    );

                    if (
                        Object.keys(subcategoryComments).length > 0 &&
                        typeof onEquipmentChange === "function"
                    ) {
                        onEquipmentChange({
                            subcategoryComments: { ...subcategoryComments },
                        });
                        return true;
                    }
                    return false;
                },
            };
        }

        // Cleanup on unmount
        return () => {
            if (
                typeof window !== "undefined" &&
                window.equipmentComponentInstance
            ) {
                delete window.equipmentComponentInstance;
            }
        };
    }, [subcategoryComments, onEquipmentChange]);

    // Listen for structure ID changes from parent
    useEffect(() => {
        // If there's no initial equipment ID but there are structure IDs available,
        // use the first one and inform the parent component
        if (
            (!initialEquipmentId || initialEquipmentId === "") &&
            structureIds.length > 0 &&
            typeof onEquipmentIdChange === "function"
        ) {
            onEquipmentIdChange(structureIds[0]);
        }
    }, [structureIds, initialEquipmentId, onEquipmentIdChange]);

    // Fetch equipment items on mount.
    useEffect(() => {
        const fetchEquipmentItems = async () => {
            try {
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    const equipment = json.data
                        .filter((item) => item.category === "Equipment")
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
                    setEquipmentItems(equipment);

                    // Set subcategory if current value is empty and we have equipment items
                    if (!surveyForm.subcategory && equipment.length > 0) {
                        setSurveyForm((prev) => ({
                            ...prev,
                            subcategory: equipment[0].subcategory.trim(),
                        }));
                    }
                } else {
                    console.error("Failed to fetch equipment items:", json);
                }
            } catch (error) {
                console.error("Error fetching equipment items:", error);
            }
        };

        fetchEquipmentItems();
    }, []); // Load only once

    // Notify parent when surveyList changes.
    useEffect(() => {
        if (typeof onSurveyListChange === "function") {
            onSurveyListChange(surveyList);
        }

        // If there are entries, make sure we have an ID selected
        if (
            surveyList.length > 0 &&
            typeof onEquipmentIdChange === "function"
        ) {
            // If we have structure IDs available, ensure one is selected
            if (structureIds.length > 0) {
                onEquipmentIdChange(structureIds[0]);
            }
        }
    }, [surveyList, onSurveyListChange, onEquipmentIdChange, structureIds]);

    // ADDED: Effect to forward subcategory comments to parent when they change
    useEffect(() => {
        // Skip first render
        if (!initialized) return;

        // Debounce timer for comments updates
        const timer = setTimeout(() => {
            if (
                typeof onEquipmentChange === "function" &&
                Object.keys(subcategoryComments).length > 0
            ) {
                console.log(
                    "Equipment: Sending subcategory comments to parent:",
                    Object.keys(subcategoryComments).length > 0
                        ? `(${
                              Object.keys(subcategoryComments).length
                          } comments)`
                        : "(empty)"
                );

                // Track updates in debug ref
                commentsUpdateRef.current = {
                    lastUpdated: Date.now(),
                    count: commentsUpdateRef.current.count + 1,
                    lastValue: { ...subcategoryComments },
                };

                // Send to parent
                onEquipmentChange({
                    subcategoryComments: { ...subcategoryComments },
                });
            }
        }, 300);

        // Cleanup timer
        return () => clearTimeout(timer);
    }, [subcategoryComments, onEquipmentChange, initialized]);

    // Build unique subcategories (trimmed).
    const uniqueSubcategories = Array.from(
        new Set(equipmentItems.map((itm) => itm.subcategory.trim()))
    ).sort((a, b) => a.localeCompare(b));

    // Filter and sort items based on surveyForm.subcategory.
    const filteredItems = equipmentItems.filter(
        (itm) => itm.subcategory.trim() === surveyForm.subcategory.trim()
    );
    const sortedFilteredItems = [...filteredItems].sort((a, b) =>
        a.item.localeCompare(b.item)
    );

    // Use a ref to guard against duplicate additions for normal items.
    const lastAddedRef = React.useRef({});

    // Helper functions
    function isWalkIn(subcategory, item) {
        if (subcategory.trim().toLowerCase() === "cold (int)") {
            const lowerItem = item.trim().toLowerCase();
            return (
                lowerItem === "freezer - walk-in" ||
                lowerItem === "fridge - walk-in"
            );
        }
        return false;
    }

    function isVolumeItem(item) {
        const lowerItem = item.trim().toLowerCase();
        return (
            lowerItem === "fridge - walk-in" ||
            lowerItem === "freezer - walk-in" ||
            lowerItem === "cupboard wall / floor"
        );
    }

    // handleAddSurvey: For dimension items (nonzero dimensions) always add a new row.
    // For normal items, if an entry exists, increment its count by 1 per click.
    const handleAddSurvey = (newEntry) => {
        setSurveyList((prev) => {
            const isDimension =
                newEntry.length || newEntry.width || newEntry.height;
            if (isDimension) {
                return [...prev, newEntry];
            } else {
                const key = `${newEntry.subcategory}-${newEntry.item}-${newEntry.grade}`;
                const now = Date.now();
                // If the same key was added within the last 300ms, ignore this call.
                if (
                    lastAddedRef.current[key] &&
                    now - lastAddedRef.current[key] < 300
                ) {
                    return prev;
                }
                lastAddedRef.current[key] = now;
                const existingIndex = prev.findIndex(
                    (entry) =>
                        entry.item === newEntry.item &&
                        entry.grade === newEntry.grade &&
                        entry.subcategory === newEntry.subcategory
                );
                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex].number =
                        (updated[existingIndex].number || 0) + 1;
                    return updated;
                } else {
                    return [...prev, newEntry];
                }
            }
        });
    };

    // Simplified handleSurveyChange function
    const handleSurveyChange = (e) => {
        const { name, value } = e.target;

        // Handle different field types
        if (["number", "length", "width", "height"].includes(name)) {
            setSurveyForm((prev) => ({
                ...prev,
                [name]: value === "" ? "" : Number(value),
            }));
        } else if (name === "subcategory") {
            setSurveyForm((prev) => ({
                ...prev,
                subcategory: value,
                item: "",
                grade: "",
                number: 1,
                length: 0,
                width: 0,
                height: 0,
            }));
        } else if (name === "item") {
            setSurveyForm((prev) => ({
                ...prev,
                item: value,
                grade: "",
                number: 1,
                length: 0,
                width: 0,
                height: 0,
            }));
        } else {
            setSurveyForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleNumberFocus = (e) => {
        if (surveyForm.number === 1) {
            setSurveyForm((prev) => ({ ...prev, number: "" }));
        }
    };

    const handleNumberBlur = (e) => {
        if (e.target.value === "") {
            setSurveyForm((prev) => ({ ...prev, number: 1 }));
        }
    };

    // Remove one unit at a time for normal items; remove entire entry for dimension items.
    const handleRemoveEntry = (id) => {
        setSurveyList((prev) =>
            prev
                .map((entry) => {
                    const isDimension =
                        entry.length || entry.width || entry.height;
                    if (entry.id === id) {
                        if (isDimension) {
                            return null;
                        }
                        if (entry.number > 1) {
                            return { ...entry, number: entry.number - 1 };
                        } else {
                            return null;
                        }
                    }
                    return entry;
                })
                .filter((entry) => entry !== null)
        );
    };

    // IMPROVED: Handler for subcategory comments changes with better state management
    const handleSubcategoryCommentsChange = (updatedComments) => {
        // Log the update
        console.log(
            "Equipment: Updating subcategory comments",
            Object.keys(updatedComments).length > 0
                ? `(${Object.keys(updatedComments).length} comments)`
                : "(empty)"
        );

        // Update local state
        setSubcategoryComments(updatedComments);

        // Directly update parent too with a dedicated update
        if (typeof onEquipmentChange === "function") {
            onEquipmentChange({
                subcategoryComments: updatedComments,
            });
        }
    };

    // ---------------------------------------------------------------------
    // Single place to define subcategory order
    // ---------------------------------------------------------------------
    const customSubcategoryOrder = [
        "Hot",
        "Other",
        "Cold (ext)",
        "Other (ext)",
        "Dishwasher",
        "Servery",
        "Surface",
        "Cold (int)",
        "Other (int)",
        "Special",
    ];
    // ---------------------------------------------------------------------

    // Determine which comments to use - with preference to local state
    const currentComments =
        subcategoryComments ||
        equipment?.subcategoryComments ||
        initialSubcategoryComments ||
        {};

    return (
        <div className="survey-container">
            <h2>Equipment</h2>
            <EquipmentForm
                surveyForm={surveyForm}
                uniqueSubcategories={uniqueSubcategories}
                sortedFilteredItems={sortedFilteredItems}
                gradeOptions={[]}
                specialItems={specialItems}
                isWalkIn={isWalkIn}
                isVolumeItem={isVolumeItem}
                handleSurveyChange={handleSurveyChange}
                handleNumberFocus={handleNumberFocus}
                handleNumberBlur={handleNumberBlur}
                handleAddSurvey={handleAddSurvey}
                subcategoryOrder={customSubcategoryOrder}
                surveyList={surveyList}
            />
            <EquipmentList
                surveyList={surveyList}
                isWalkIn={isWalkIn}
                specialItems={specialItems}
                isVolumeItem={isVolumeItem}
                handleRemoveEntry={handleRemoveEntry}
                subcategoryComments={currentComments}
                onSubcategoryCommentsChange={handleSubcategoryCommentsChange}
            />
            <datalist id="subcategorySuggestions">
                {uniqueSubcategories.map((sug, idx) => (
                    <option key={idx} value={sug} />
                ))}
            </datalist>
        </div>
    );
}
