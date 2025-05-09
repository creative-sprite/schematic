// components\kitchenSurvey\Equipment.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "../../styles/surveyForm.css";

// Import subcomponents
import EquipmentForm from "./equipment/EquipmentForm";
import EquipmentList from "./equipment/EquipmentList";
import EquipmentNotes from "./equipment/EquipmentNotes";

export default function Equipment({
    onSurveyListChange,
    structureIds = [],
    onEquipmentIdChange,
    initialSurveyData = [],
    initialEquipmentId = "",
    equipment = {},
    initialNotes = "",
    onNotesChange,
    onEquipmentChange,
    initialSubcategoryComments = {},
}) {
    // State for equipment items fetched from the API
    const [equipmentItems, setEquipmentItems] = useState([]);

    // Survey form state
    const [surveyForm, setSurveyForm] = useState({
        subcategory: "",
        item: "",
        number: 1,
        length: 0,
        grade: "",
        width: 0,
        height: 0,
    });

    // Survey list state
    const [surveyList, setSurveyList] = useState(initialSurveyData || []);

    // Special items set
    const specialItems = new Set([
        "Condiment - Cutlery Counter",
        "Tray Rail",
        "Work Surface",
    ]);

    // Initialization tracking
    const [initialized, setInitialized] = useState(false);

    // State for subcategory comments - initialize properly
    const [subcategoryComments, setSubcategoryComments] = useState(
        initialSubcategoryComments || {}
    );

    // State for notes - initialize properly
    const [notes, setNotes] = useState(initialNotes || "");

    // Enhanced refs for update tracking and prevention
    const updatingSubcategoryRef = useRef(false);
    const prevSubcategoryValueRef = useRef("");
    const isInternalStateUpdateRef = useRef(false);
    const initialRenderCompletedRef = useRef(false);

    // One-time initialization for notes and comments
    useEffect(() => {
        if (!initialized) {
            // Initialize notes
            if (initialNotes) {
                setNotes(initialNotes);
            } else if (equipment?.notes) {
                setNotes(equipment.notes);
            }

            // Initialize subcategory comments
            if (
                initialSubcategoryComments &&
                Object.keys(initialSubcategoryComments).length > 0
            ) {
                setSubcategoryComments(initialSubcategoryComments);
            } else if (
                equipment?.subcategoryComments &&
                Object.keys(equipment.subcategoryComments).length > 0
            ) {
                setSubcategoryComments(equipment.subcategoryComments);
            }

            setInitialized(true);
        }
    }, [
        initialized,
        initialNotes,
        equipment?.notes,
        initialSubcategoryComments,
        equipment?.subcategoryComments,
    ]);

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

    // Initialize with saved data if provided
    useEffect(() => {
        if (initialSurveyData && initialSurveyData.length > 0 && !initialized) {
            setSurveyList(initialSurveyData);

            // Even though we've removed the UI selector, we still need to pass the ID to parent
            if (typeof onEquipmentIdChange === "function") {
                // Use the initialEquipmentId if provided, otherwise use the first structureId if available
                const idToUse =
                    initialEquipmentId ||
                    (structureIds.length > 0 ? structureIds[0] : "");
                onEquipmentIdChange(idToUse);
            }

            // FIXED: Initialize subcategory with guards to prevent loops
            if (
                initialSurveyData.length > 0 &&
                initialSurveyData[0].subcategory &&
                !isInternalStateUpdateRef.current
            ) {
                // Mark we're in internal update
                isInternalStateUpdateRef.current = true;

                // Set the subcategory value reference
                prevSubcategoryValueRef.current =
                    initialSurveyData[0].subcategory;

                // Update form state
                setSurveyForm((prev) => ({
                    ...prev,
                    subcategory: initialSurveyData[0].subcategory,
                }));

                // Reset flag after state update
                setTimeout(() => {
                    isInternalStateUpdateRef.current = false;
                }, 0);
            }

            setInitialized(true);
        }
    }, [
        initialSurveyData,
        initialEquipmentId,
        onEquipmentIdChange,
        structureIds,
        initialized,
    ]);

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

                    // FIXED: Initialize subcategory with guards
                    if (
                        !surveyForm.subcategory &&
                        equipment.length > 0 &&
                        !isInternalStateUpdateRef.current &&
                        !initialRenderCompletedRef.current
                    ) {
                        // Mark we're updating internally
                        isInternalStateUpdateRef.current = true;

                        // Track that initial render has completed
                        initialRenderCompletedRef.current = true;

                        // Store the new value
                        const newSubcategory = equipment[0].subcategory.trim();
                        prevSubcategoryValueRef.current = newSubcategory;

                        // Set the initial subcategory to the first available one
                        setSurveyForm((prev) => ({
                            ...prev,
                            subcategory: newSubcategory,
                        }));

                        // Reset flag after state update
                        setTimeout(() => {
                            isInternalStateUpdateRef.current = false;
                        }, 0);
                    }
                } else {
                    console.error("Failed to fetch equipment items:", json);
                }
            } catch (error) {
                console.error("Error fetching equipment items:", error);
            }
        };

        fetchEquipmentItems();
    }, []); // Fixed: Empty dependency array to load only once

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
    const lastAddedRef = useRef({});

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

    // FIXED: Modified handleSurveyChange with circular update protection
    const handleSurveyChange = (e) => {
        const { name, value } = e.target;

        // If this is a subcategory change and we're already updating it, skip to avoid circular updates
        if (name === "subcategory" && isInternalStateUpdateRef.current) {
            return;
        }

        // Check if subcategory has actually changed
        if (
            name === "subcategory" &&
            value === prevSubcategoryValueRef.current
        ) {
            return; // Skip if value hasn't actually changed
        }

        // Set flag if this is a subcategory change
        if (name === "subcategory") {
            isInternalStateUpdateRef.current = true;
            prevSubcategoryValueRef.current = value;
        }

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

        // Reset subcategory update flag after a short delay
        if (name === "subcategory") {
            setTimeout(() => {
                isInternalStateUpdateRef.current = false;
            }, 0);
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

    // FIXED: Refs to prevent update loops in comments and notes
    const updatingCommentsRef = useRef(false);
    const updatingNotesRef = useRef(false);
    const prevCommentsRef = useRef({});
    const prevNotesRef = useRef("");

    // Handler for subcategory comments changes - ENHANCED
    const handleSubcategoryCommentsChange = (comments) => {
        // Skip if already updating to prevent circular calls
        if (updatingCommentsRef.current) return;

        // Skip if no actual change (deep comparison)
        const currentStr = JSON.stringify(comments);
        const prevStr = JSON.stringify(prevCommentsRef.current);
        if (currentStr === prevStr) return;

        // Set flag to prevent circular updates
        updatingCommentsRef.current = true;
        prevCommentsRef.current = JSON.parse(currentStr);

        // Update local state
        setSubcategoryComments(comments);

        // Update equipment data with new comments
        if (typeof onEquipmentChange === "function") {
            const updatedEquipment = {
                ...(equipment || {}), // Ensure we have an object
                subcategoryComments: comments,
                notes: notes || "", // Include notes for completeness
            };

            // Call the parent's callback with the updated equipment object
            onEquipmentChange(updatedEquipment);
        }

        // Reset flag with slight delay
        setTimeout(() => {
            updatingCommentsRef.current = false;
        }, 0);
    };

    // Handler for notes changes - ENHANCED
    const handleNotesChange = (newNotes) => {
        // Skip if already updating or no change
        if (updatingNotesRef.current || newNotes === prevNotesRef.current)
            return;

        // Set flag to prevent circular updates
        updatingNotesRef.current = true;
        prevNotesRef.current = newNotes;

        // Update local state
        setNotes(newNotes);

        // Update parent component if callback exists
        if (typeof onNotesChange === "function") {
            onNotesChange(newNotes);
        }

        // If equipment change handler exists, update the notes in the equipment object
        if (typeof onEquipmentChange === "function") {
            const updatedEquipment = {
                ...(equipment || {}), // Ensure we have an object
                notes: newNotes,
                subcategoryComments: subcategoryComments || {}, // Include comments for completeness
            };

            // Call the parent's callback with the updated equipment object
            onEquipmentChange(updatedEquipment);
        }

        // Reset flag with slight delay
        setTimeout(() => {
            updatingNotesRef.current = false;
        }, 0);
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
                initialSubcategoryComments={subcategoryComments}
                onSubcategoryCommentsChange={handleSubcategoryCommentsChange}
            />
            <EquipmentNotes
                initialNotes={notes}
                onNotesChange={handleNotesChange}
            />
            <datalist id="subcategorySuggestions">
                {uniqueSubcategories.map((sug, idx) => (
                    <option key={idx} value={sug} />
                ))}
            </datalist>
        </div>
    );
}
