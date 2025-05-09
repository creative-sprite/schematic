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

    // State for category comments - ensure proper initialization from saved data
    const [categoryComments, setCategoryComments] = useState(
        initialCategoryComments || {}
    );

    // State for notes - properly initialized
    const [notes, setNotes] = useState(initialNotes || "");

    // Debug log the initial data on mount
    useEffect(() => {
        console.log("SpecialistEquipment mounted with initialData:", {
            initialSpecialistEquipmentData:
                initialSpecialistEquipmentData?.length || 0,
            initialNotes: initialNotes?.length || 0,
            initialCategoryComments:
                Object.keys(initialCategoryComments || {}).length || 0,
        });
    }, []);

    // Update category comments when initialCategoryComments changes
    useEffect(() => {
        if (
            initialCategoryComments &&
            Object.keys(initialCategoryComments).length > 0
        ) {
            console.log("Loading category comments:", initialCategoryComments);
            setCategoryComments(initialCategoryComments);
        }
    }, [initialCategoryComments]);

    // Initialize from saved data
    useEffect(() => {
        if (
            initialSpecialistEquipmentData &&
            initialSpecialistEquipmentData.length > 0 &&
            !initialized
        ) {
            console.log(
                "Loading initial specialist equipment data:",
                initialSpecialistEquipmentData
            );
            setSurveyList(initialSpecialistEquipmentData);
            setInitialized(true);
        }
    }, [initialSpecialistEquipmentData, initialized]);

    // Initialize notes state when equipment changes
    useEffect(() => {
        // Only update if equipment has notes property
        if (
            equipment &&
            equipment.hasOwnProperty("notes") &&
            equipment.notes !== undefined
        ) {
            console.log(
                "Loading notes from equipment object:",
                equipment.notes
            );
            setNotes(equipment.notes);
        }
    }, [equipment]);

    // Update notes when initialNotes changes
    useEffect(() => {
        if (initialNotes !== notes && initialNotes) {
            console.log("Loading notes:", initialNotes);
            setNotes(initialNotes);
        }
    }, [initialNotes, notes]);

    // Fetch product items on mount with improved error handling
    useEffect(() => {
        // Only fetch once
        if (didFetchRef.current) return;

        const fetchProductItems = async () => {
            try {
                setLoading(true);
                didFetchRef.current = true; // Mark as fetched to prevent duplicates

                console.log("Fetching product items...");
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
                        `Fetched ${filteredProducts.length} products in predefined categories`
                    );

                    // Debug log if any products have customData
                    const productsWithCustomData = filteredProducts.filter(
                        (p) => p.customData && p.customData.length > 0
                    );

                    console.log(
                        `Found ${productsWithCustomData.length} products with customData`
                    );

                    if (productsWithCustomData.length > 0) {
                        // Log the first product with customData for debugging
                        console.log(
                            "Sample product with customData:",
                            productsWithCustomData[0].name,
                            JSON.stringify(
                                productsWithCustomData[0].customData,
                                null,
                                2
                            )
                        );
                    }

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
        console.log("Adding specialist equipment entry:", newEntry);

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
        console.log("Removing entry with ID:", id);

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

    // Handle equipment toggle changes - CHANGED TO REGULAR FUNCTION
    const handleEquipmentChange = (updatedEquipment) => {
        console.log(
            "Equipment updated in SpecialistEquipment:",
            updatedEquipment
        );

        // Combine the existing notes with the updated equipment fields
        const combinedEquipment = {
            ...updatedEquipment,
            notes:
                updatedEquipment.notes ||
                equipment?.notes ||
                initialNotes ||
                "",
            categoryComments: categoryComments,
        };

        console.log("Combined equipment to save:", combinedEquipment);

        // Notify parent component
        if (typeof onEquipmentChange === "function") {
            onEquipmentChange(combinedEquipment);
        }

        // Also update notes if notes change handler exists
        if (
            typeof onNotesChange === "function" &&
            combinedEquipment.notes !== initialNotes
        ) {
            onNotesChange(combinedEquipment.notes);
        }
    };

    // Handler for category comments changes - CHANGED TO REGULAR FUNCTION
    const handleCategoryCommentsChange = (comments) => {
        console.log("Category comments updated:", comments);
        setCategoryComments(comments);

        // Update equipment data with new comments
        if (typeof onEquipmentChange === "function") {
            const updatedEquipment = {
                ...(equipment || {}), // Ensure we have an object
                categoryComments: comments,
            };
            console.log(
                "Sending equipment with updated category comments:",
                updatedEquipment
            );
            onEquipmentChange(updatedEquipment);
        }
    };

    // Handler for notes changes - CHANGED TO REGULAR FUNCTION
    const handleNotesChange = (notes) => {
        console.log("Specialist equipment notes updated:", notes);
        setNotes(notes);

        // Update parent component if callback exists
        if (typeof onNotesChange === "function") {
            onNotesChange(notes);
        }

        // If equipment change handler exists, update the notes in the equipment object
        if (typeof onEquipmentChange === "function") {
            const updatedEquipment = {
                ...(equipment || {}), // Ensure we have an object
                notes: notes,
            };
            console.log(
                "Sending equipment with updated notes:",
                updatedEquipment
            );
            onEquipmentChange(updatedEquipment);
        }
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
                        initialCategoryComments={initialCategoryComments}
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
