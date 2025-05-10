// components\kitchenSurvey\Equipment.jsx
"use client";

import React, { useEffect, useRef } from "react";
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
    // Debug: Log received props on mount to verify what data is coming in
    useEffect(() => {
        console.log("Equipment component received props:", {
            initialSubcategoryComments,
            equipmentSubcategoryComments: equipment?.subcategoryComments,
            initialNotes,
            equipmentNotes: equipment?.notes,
        });
    }, []);

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

    // Special items set
    const specialItems = new Set([
        "Condiment - Cutlery Counter",
        "Tray Rail",
        "Work Surface",
    ]);

    // Initialization tracking
    const [initialized, setInitialized] = React.useState(false);

    // Enhanced refs for update tracking and prevention
    const isInternalStateUpdateRef = useRef(false);
    const initialRenderCompletedRef = useRef(false);
    const isHandlingNotesChangeRef = useRef(false);
    const isHandlingSubcategoryCommentsChangeRef = useRef(false);

    // Track previous values for deep comparison
    const prevNotesRef = useRef(initialNotes || "");
    const prevSubcategoryCommentsRef = useRef(initialSubcategoryComments || {});

    // One-time initialization to log what we got from props
    useEffect(() => {
        if (!initialized) {
            console.log("Equipment component initialization:");
            console.log("- Initial notes:", initialNotes);
            console.log("- Equipment object notes:", equipment?.notes);
            console.log(
                "- Initial subcategory comments:",
                initialSubcategoryComments
            );
            console.log(
                "- Equipment subcategory comments:",
                equipment?.subcategoryComments
            );
            console.log(
                "- Using subcategory comments:",
                equipment?.subcategoryComments || initialSubcategoryComments
            );
            console.log("- Using notes:", equipment?.notes || initialNotes);

            setInitialized(true);
        }
    }, [initialized, initialNotes, equipment, initialSubcategoryComments]);

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
            console.log(
                "Initializing from saved survey data:",
                initialSurveyData
            );
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

                    // MODIFIED: Only set subcategory if current value is empty
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

                        // Set the initial subcategory to the first available one
                        setSurveyForm((prev) => ({
                            ...prev,
                            subcategory: equipment[0].subcategory.trim(),
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

        // Set flag if this is a subcategory change
        if (name === "subcategory") {
            isInternalStateUpdateRef.current = true;
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

    // FIXED: Handler for subcategory comments changes with proper circular update protection
    const handleSubcategoryCommentsChange = (comments) => {
        // Skip if we're already handling an update
        if (isHandlingSubcategoryCommentsChangeRef.current) {
            return;
        }

        // Skip if no actual change
        const commentsStr = JSON.stringify(comments);
        const prevCommentsStr = JSON.stringify(
            prevSubcategoryCommentsRef.current
        );
        if (commentsStr === prevCommentsStr) {
            return;
        }

        console.log("Equipment: Subcategory comments changed:", comments);

        // Set flag to prevent circular updates
        isHandlingSubcategoryCommentsChangeRef.current = true;

        // Update reference
        prevSubcategoryCommentsRef.current = JSON.parse(commentsStr);

        // Update parent component with the new comments
        if (typeof onEquipmentChange === "function") {
            // Create a new equipment object with updated subcategoryComments
            onEquipmentChange({
                ...equipment,
                subcategoryComments: comments,
            });
        }

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingSubcategoryCommentsChangeRef.current = false;
        }, 0);
    };

    // FIXED: Handler for equipment notes changes with proper circular update protection
    const handleNotesChange = (newNotes) => {
        // Skip if we're already handling an update
        if (isHandlingNotesChangeRef.current) {
            return;
        }

        // Skip if no actual change
        if (newNotes === prevNotesRef.current) {
            return;
        }

        console.log("Equipment: Notes changed:", newNotes);

        // Set flag to prevent circular updates
        isHandlingNotesChangeRef.current = true;

        // Update reference
        prevNotesRef.current = newNotes;

        // Update parent component directly
        if (typeof onNotesChange === "function") {
            onNotesChange(newNotes);
        }

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingNotesChangeRef.current = false;
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
                subcategoryComments={
                    equipment?.subcategoryComments || initialSubcategoryComments
                }
                onSubcategoryCommentsChange={handleSubcategoryCommentsChange}
            />
            <EquipmentNotes
                notes={equipment?.notes || initialNotes}
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
