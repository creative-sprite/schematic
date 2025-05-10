// components\kitchenSurvey\SpecialistEquipment.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import "../../styles/surveyForm.css"; // Import external CSS

// Import subcomponents from specialistEquipment folder
import SpecialistEquipmentForm from "./specialistEquipment/SpecialistEquipmentForm";
import SpecialistEquipmentList from "./specialistEquipment/SpecialistEquipmentList";
import SpecialistEquipmentNotes from "./specialistEquipment/SpecialistEquipmentNotes";

// Move predefinedCategories outside the component to prevent recreation
const PREDEFINED_CATEGORIES = [
    "Safety Equipment",
    "Powered Equipment",
    "Waste Disposal",
    "Access Equipment",
    "Fuel",
];

export default function SpecialistEquipment({
    onSurveyListChange,
    structureIds = [],
    onEquipmentIdChange,
    initialSpecialistEquipmentData = [],
    initialSpecialistEquipmentId = "",
    equipment = {},
    initialNotes = "",
    onNotesChange,
    onEquipmentChange,
    initialCategoryComments = {},
}) {
    // Debug logging for initial props
    useEffect(() => {
        console.log("SPECIALIST: Component received props:", {
            initialNotesLength: initialNotes ? initialNotes.length : 0,
            equipmentNotesLength: equipment?.notes ? equipment.notes.length : 0,
            initialCategoryCommentsKeys: Object.keys(
                initialCategoryComments || {}
            ),
            equipmentCategoryCommentsKeys: Object.keys(
                equipment?.categoryComments || {}
            ),
        });
    }, []);

    // State for holding product items fetched from the API.
    const [productItems, setProductItems] = useState([]);

    // Add loading state
    const [loading, setLoading] = useState(false);

    // State for the survey form inputs.
    const [surveyForm, setSurveyForm] = useState({
        category: PREDEFINED_CATEGORIES[0] || "", // Default to first category
        item: "",
        number: 1,
        length: 0,
        width: 0,
        height: 0,
    });

    // State for holding survey entries.
    const [surveyList, setSurveyList] = useState(
        initialSpecialistEquipmentData || []
    );

    // For area-based items.
    const specialItems = new Set([
        "Lifting Platform",
        "Scaffolding",
        "Safety Barrier",
    ]);

    // Flag to track initialization from saved data
    const [initialized, setInitialized] = useState(false);

    // Add a ref to track fetch status to prevent multiple fetches
    const didFetchRef = useRef(false);

    // Refs to prevent update loops
    const updatingCommentsRef = useRef(false);
    const updatingNotesRef = useRef(false);
    const prevCommentsRef = useRef({});
    const prevNotesRef = useRef("");

    // FIXED: Better initialize category comments with strict source priority and debug logging
    const [categoryComments, setCategoryComments] = useState(() => {
        // First priority: initialCategoryComments prop
        if (
            initialCategoryComments &&
            typeof initialCategoryComments === "object" &&
            Object.keys(initialCategoryComments).length > 0
        ) {
            console.log(
                "SPECIALIST: Using initialCategoryComments:",
                initialCategoryComments
            );
            return { ...initialCategoryComments };
        }

        // Second priority: equipment.categoryComments
        if (
            equipment?.categoryComments &&
            typeof equipment.categoryComments === "object" &&
            Object.keys(equipment.categoryComments).length > 0
        ) {
            console.log(
                "SPECIALIST: Using equipment.categoryComments:",
                equipment.categoryComments
            );
            return { ...equipment.categoryComments };
        }

        // Fall back to empty object
        console.log(
            "SPECIALIST: No category comments found, using empty object"
        );
        return {};
    });

    // FIXED: Better notes initialization with strict source priority and debug logging
    const [notes, setNotes] = useState(() => {
        // First priority: initialNotes prop
        if (initialNotes && typeof initialNotes === "string") {
            console.log("SPECIALIST: Using initialNotes:", initialNotes);
            return initialNotes;
        }

        // Second priority: equipment.notes
        if (equipment?.notes && typeof equipment.notes === "string") {
            console.log("SPECIALIST: Using equipment.notes:", equipment.notes);
            return equipment.notes;
        }

        // Fall back to empty string
        console.log("SPECIALIST: No notes found, using empty string");
        return "";
    });

    // Initialize tracking refs with initial values
    useEffect(() => {
        if (!initialized) {
            prevCommentsRef.current = { ...categoryComments };
            prevNotesRef.current = notes;
        }
    }, [initialized, categoryComments, notes]);

    // Log state values on initialization or major changes
    useEffect(() => {
        if (!initialized) {
            console.log("SPECIALIST: Initializing with state:", {
                notes,
                categoryCommentsKeys: Object.keys(categoryComments),
            });
            setInitialized(true);
        }
    }, [initialized, notes, categoryComments]);

    // Initialize from saved data
    useEffect(() => {
        if (
            initialSpecialistEquipmentData &&
            initialSpecialistEquipmentData.length > 0 &&
            !initialized
        ) {
            console.log(
                "SPECIALIST: Loading initial data:",
                initialSpecialistEquipmentData.length
            );
            setSurveyList(initialSpecialistEquipmentData);
            setInitialized(true);
        }
    }, [initialSpecialistEquipmentData, initialized]);

    // Fetch product items on mount with improved error handling
    useEffect(() => {
        // Only fetch once
        if (didFetchRef.current) return;

        const fetchProductItems = async () => {
            try {
                setLoading(true);
                didFetchRef.current = true; // Mark as fetched to prevent duplicates

                console.log("SPECIALIST: Fetching product items...");
                const res = await fetch("/api/database/products");

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json = await res.json();

                if (json.success) {
                    // Filter products to only include those in our predefined categories
                    const filteredProducts = json.data.filter((product) =>
                        PREDEFINED_CATEGORIES.includes(product.category)
                    );

                    console.log(
                        `SPECIALIST: Fetched ${filteredProducts.length} products in predefined categories`
                    );

                    setProductItems(filteredProducts);
                } else {
                    console.error("Failed to fetch product items:", json);
                }
            } catch (error) {
                console.error("Error fetching product items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductItems();
    }, []); // Empty dependency array ensures this only runs once

    // Notify parent when surveyList changes.
    useEffect(() => {
        if (typeof onSurveyListChange === "function") {
            onSurveyListChange(surveyList);
        }
    }, [surveyList, onSurveyListChange]);

    // Filter and sort items based on surveyForm.category.
    const filteredItems = productItems.filter(
        (item) => item.category === surveyForm.category
    );

    const sortedFilteredItems = [...filteredItems].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    // Use a ref to guard against duplicate additions for normal items.
    const lastAddedRef = useRef({});

    // handleAddSurvey: For dimension items (nonzero dimensions) always add a new row.
    // For normal items, if an entry exists, increment its count by 1 per click.
    const handleAddSurvey = (newEntry) => {
        // Debug log the entry being added
        console.log("SPECIALIST: Adding entry:", newEntry);

        setSurveyList((prev) => {
            const isDimension =
                newEntry.length || newEntry.width || newEntry.height;
            if (isDimension) {
                return [...prev, newEntry];
            } else {
                // Use productId instead of item name in the key
                const key = `${newEntry.category}-${newEntry.productId}`;
                const now = Date.now();
                // If the same key was added within the last 300ms, ignore this call.
                if (
                    lastAddedRef.current[key] &&
                    now - lastAddedRef.current[key] < 300
                ) {
                    return prev;
                }
                lastAddedRef.current[key] = now;

                // Include productId in the check for existing entries
                const existingIndex = prev.findIndex(
                    (entry) =>
                        entry.productId === newEntry.productId &&
                        entry.category === newEntry.category
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

    const handleSurveyChange = (e) => {
        const { name, value } = e.target;
        if (["number", "length", "width", "height"].includes(name)) {
            setSurveyForm((prev) => ({
                ...prev,
                [name]: value === "" ? "" : Number(value),
            }));
        } else if (name === "category") {
            setSurveyForm((prev) => ({
                ...prev,
                category: value,
                item: "",
                number: 1,
                length: 0,
                width: 0,
                height: 0,
            }));
        } else if (name === "item") {
            setSurveyForm((prev) => ({
                ...prev,
                item: value,
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
        console.log("SPECIALIST: Removing entry with ID:", id);

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

    // CRITICAL FIX: Handler for category comments changes that ensures proper update to specialistEquipmentSurvey
    const handleCategoryCommentsChange = (comments) => {
        // Skip if already updating
        if (updatingCommentsRef.current) return;

        // Skip if nothing changed
        const commentsJSON = JSON.stringify(comments);
        const prevCommentsJSON = JSON.stringify(prevCommentsRef.current);
        if (commentsJSON === prevCommentsJSON) return;

        console.log("SPECIALIST: Category comments changed:", comments);

        // Set flag to prevent loops
        updatingCommentsRef.current = true;
        prevCommentsRef.current = JSON.parse(commentsJSON);

        // Update local state
        setCategoryComments(comments);

        // Update the equipment object with ONLY categoryComments
        if (typeof onEquipmentChange === "function") {
            // Create partial update with ONLY categoryComments
            const partialUpdate = {
                categoryComments: comments,
            };

            console.log(
                "SPECIALIST: Updating equipment with categoryComments:",
                partialUpdate
            );
            onEquipmentChange(partialUpdate);
        }

        // Reset flag after delay
        setTimeout(() => {
            updatingCommentsRef.current = false;
        }, 0);
    };

    // CRITICAL FIX: Handler for specialist equipment notes changes that ensures proper update to specialistEquipmentSurvey
    const handleNotesChange = (newNotes) => {
        // Skip if already updating or no change
        if (updatingNotesRef.current || newNotes === prevNotesRef.current)
            return;

        console.log("SPECIALIST: Notes changed:", newNotes);

        // Set flag to prevent loops
        updatingNotesRef.current = true;
        prevNotesRef.current = newNotes;

        // Update local state
        setNotes(newNotes);

        // First priority: Use direct callback if available
        if (typeof onNotesChange === "function") {
            console.log("SPECIALIST: Calling onNotesChange with:", newNotes);
            onNotesChange(newNotes);
        }

        // Second priority: Send partial update with ONLY notes
        if (typeof onEquipmentChange === "function") {
            // CRITICAL FIX: Create partial update with ONLY specialistNotes property to avoid conflicts
            const partialUpdate = {
                // Use a separate specialistNotes property to clearly separate from regular equipment notes
                specialistNotes: newNotes,
            };

            console.log(
                "SPECIALIST: Updating equipment with specialistNotes:",
                partialUpdate
            );
            onEquipmentChange(partialUpdate);
        }

        // Reset flag after delay
        setTimeout(() => {
            updatingNotesRef.current = false;
        }, 0);
    };

    // Helper function matching Equipment.jsx pattern
    const isVolumeItem = (item) => {
        if (!item) return false;

        const lowerItem = item.trim().toLowerCase();
        return (
            lowerItem === "storage container" ||
            lowerItem === "waste skip" ||
            lowerItem === "fuel tank"
        );
    };

    return (
        <div className="survey-container" id="specialist-equipment-container">
            <h2 id="specialist-equipment-heading">Specialist Equipment</h2>
            {loading ? (
                <div
                    style={{ textAlign: "center", padding: "2rem" }}
                    id="loading-indicator"
                >
                    Loading specialist equipment items...
                </div>
            ) : (
                <>
                    <SpecialistEquipmentForm
                        surveyForm={surveyForm}
                        categories={PREDEFINED_CATEGORIES}
                        sortedFilteredItems={sortedFilteredItems}
                        specialItems={specialItems}
                        isVolumeItem={isVolumeItem}
                        handleSurveyChange={handleSurveyChange}
                        handleNumberFocus={handleNumberFocus}
                        handleNumberBlur={handleNumberBlur}
                        handleAddSurvey={handleAddSurvey}
                        surveyList={surveyList}
                        equipment={equipment}
                    />
                    <SpecialistEquipmentList
                        surveyList={surveyList}
                        specialItems={specialItems}
                        isVolumeItem={isVolumeItem}
                        handleRemoveEntry={handleRemoveEntry}
                        initialCategoryComments={categoryComments}
                        onCategoryCommentsChange={handleCategoryCommentsChange}
                    />

                    <SpecialistEquipmentNotes
                        initialNotes={notes}
                        onNotesChange={handleNotesChange}
                    />
                </>
            )}
        </div>
    );
}
