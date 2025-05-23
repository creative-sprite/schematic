// components\kitchenSurvey\SpecialistEquipment.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import "../../styles/surveyForm.css"; // Import external CSS

// Import subcomponents from specialistEquipment folder
import SpecialistEquipmentForm from "./specialistEquipment/SpecialistEquipmentForm";
import SpecialistEquipmentList from "./specialistEquipment/SpecialistEquipmentList";

// Move predefinedCategories outside the component to prevent recreation
const PREDEFINED_CATEGORIES = [
    "Safety Equipment",
    "Powered Equipment",
    "Waste Disposal",
    "Access Equipment",
    "Fuel",
];

// FIXED: Helper function to normalize category names consistently
const normalizeCategoryName = (categoryName) => {
    return categoryName ? categoryName.trim() : "";
};

// FIXED: Helper function to ensure all category comments use consistent keys
const normalizeCategoryComments = (comments) => {
    if (!comments || typeof comments !== 'object') {
        return {};
    }
    
    const normalizedComments = {};
    Object.entries(comments).forEach(([key, value]) => {
        const normalizedKey = normalizeCategoryName(key);
        if (normalizedKey) {
            normalizedComments[normalizedKey] = value;
        }
    });
    
    return normalizedComments;
};

export default function SpecialistEquipment({
    onSurveyListChange,
    structureIds = [],
    onEquipmentIdChange,
    initialSpecialistEquipmentData = [],
    initialSpecialistEquipmentId = "",
    equipment = {},
    initialCategoryComments = {},
    onEquipmentChange,
}) {
    // Enhanced debug logging for initial props
    useEffect(() => {
        console.log("SPECIALIST: Component received props:", {
            initialSpecialistEquipmentData:
                initialSpecialistEquipmentData?.length || 0,
            initialCategoryComments: initialCategoryComments
                ? `Object with ${
                      Object.keys(initialCategoryComments || {}).length
                  } keys`
                : "undefined/null",
            equipmentCategoryComments: equipment?.categoryComments
                ? `Object with ${
                      Object.keys(equipment?.categoryComments || {}).length
                  } keys`
                : "undefined/null",
            commentsContent: JSON.stringify(normalizeCategoryComments(initialCategoryComments) || {}),
        });
    }, [initialSpecialistEquipmentData, initialCategoryComments, equipment]);

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

    // FIXED: State for category comments with enhanced initialization and normalization
    const [categoryComments, setCategoryComments] = useState(() => {
        // First priority: use initialCategoryComments if it has keys
        if (
            initialCategoryComments &&
            typeof initialCategoryComments === "object" &&
            Object.keys(initialCategoryComments).length > 0
        ) {
            const normalizedComments = normalizeCategoryComments(initialCategoryComments);
            console.log(
                "SPECIALIST: Initializing with initialCategoryComments:",
                Object.keys(normalizedComments).length,
                "items",
                JSON.stringify(normalizedComments)
            );
            return normalizedComments;
        }
        // Second priority: use equipment.categoryComments if it has keys
        else if (
            equipment?.categoryComments &&
            typeof equipment.categoryComments === "object" &&
            Object.keys(equipment.categoryComments).length > 0
        ) {
            const normalizedComments = normalizeCategoryComments(equipment.categoryComments);
            console.log(
                "SPECIALIST: Initializing with equipment.categoryComments:",
                Object.keys(normalizedComments).length,
                "items",
                JSON.stringify(normalizedComments)
            );
            return normalizedComments;
        }

        console.log(
            "SPECIALIST: No category comments found, using empty object"
        );
        return {};
    });

    // Track component mounted state to avoid update after unmounting
    const isMountedRef = useRef(true);

    // For area-based items.
    const specialItems = new Set([
        "Lifting Platform",
        "Scaffolding",
        "Safety Barrier",
    ]);

    // Add a ref to track fetch status to prevent multiple fetches
    const didFetchRef = useRef(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Track previous states in refs to avoid dependency array issues
    const prevCommentsRef = useRef(categoryComments);
    const prevInitialCommentsRef = useRef(initialCategoryComments);
    const prevEquipmentCommentsRef = useRef(equipment?.categoryComments);

    // FIXED: Watch for prop changes to update comments - with stable dependencies and normalization
    useEffect(() => {
        // Store current values for comparison with normalization
        const currentComments = JSON.stringify(categoryComments);
        const initialComments = JSON.stringify(normalizeCategoryComments(initialCategoryComments));
        const equipmentComments = JSON.stringify(normalizeCategoryComments(equipment?.categoryComments));

        // Store previous values for comparison with normalization
        const prevComments = JSON.stringify(prevCommentsRef.current);
        const prevInitialComments = JSON.stringify(normalizeCategoryComments(prevInitialCommentsRef.current));
        const prevEquipmentComments = JSON.stringify(normalizeCategoryComments(prevEquipmentCommentsRef.current));

        // Update refs to current values
        prevCommentsRef.current = categoryComments;
        prevInitialCommentsRef.current = initialCategoryComments;
        prevEquipmentCommentsRef.current = equipment?.categoryComments;

        // Check if initialCategoryComments changed and has data
        if (
            initialCategoryComments &&
            typeof initialCategoryComments === "object" &&
            Object.keys(initialCategoryComments).length > 0 &&
            initialComments !== prevComments
        ) {
            const normalizedComments = normalizeCategoryComments(initialCategoryComments);
            console.log(
                "SPECIALIST: Updating from initialCategoryComments change:",
                Object.keys(normalizedComments).length,
                "items"
            );
            setCategoryComments(normalizedComments);
        }
        // If no initialCategoryComments, check if equipment.categoryComments changed and has data
        else if (
            equipment?.categoryComments &&
            typeof equipment.categoryComments === "object" &&
            Object.keys(equipment.categoryComments).length > 0 &&
            equipmentComments !== prevComments
        ) {
            const normalizedComments = normalizeCategoryComments(equipment.categoryComments);
            console.log(
                "SPECIALIST: Updating from equipment.categoryComments change:",
                Object.keys(normalizedComments).length,
                "items"
            );
            setCategoryComments(normalizedComments);
        }
        // Empty dependency array since we're using refs for comparison
    }, []);

    // FIXED: Initialize from saved data with consistent dependency
    useEffect(() => {
        if (
            initialSpecialistEquipmentData &&
            initialSpecialistEquipmentData.length > 0
        ) {
            console.log(
                "SPECIALIST: Loading initial data:",
                initialSpecialistEquipmentData.length,
                "items"
            );
            setSurveyList(initialSpecialistEquipmentData);
        }
        // Use string length as dependency to keep array size consistent
    }, [initialSpecialistEquipmentData?.length]);

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

    // FIXED: Add watches for changes in initialCategoryComments and equipment with normalization
    useEffect(() => {
        if (
            initialCategoryComments &&
            typeof initialCategoryComments === "object" &&
            Object.keys(initialCategoryComments).length > 0
        ) {
            const normalizedIncoming = normalizeCategoryComments(initialCategoryComments);
            const normalizedCurrent = normalizeCategoryComments(categoryComments);
            
            const commentStr = JSON.stringify(normalizedIncoming);
            const currentStr = JSON.stringify(normalizedCurrent);

            if (commentStr !== currentStr) {
                console.log(
                    "SPECIALIST: initialCategoryComments updated, syncing..."
                );
                setCategoryComments(normalizedIncoming);
            }
        }
    }, [initialCategoryComments]);

    useEffect(() => {
        if (
            equipment?.categoryComments &&
            typeof equipment.categoryComments === "object" &&
            Object.keys(equipment.categoryComments).length > 0
        ) {
            const normalizedEquipment = normalizeCategoryComments(equipment.categoryComments);
            const normalizedCurrent = normalizeCategoryComments(categoryComments);
            
            const commentStr = JSON.stringify(normalizedEquipment);
            const currentStr = JSON.stringify(normalizedCurrent);

            if (commentStr !== currentStr) {
                console.log(
                    "SPECIALIST: equipment.categoryComments updated, syncing..."
                );
                setCategoryComments(normalizedEquipment);
            }
        }
    }, [equipment]);

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
        // FIXED: Normalize the category name in the new entry
        if (newEntry.category) {
            newEntry.category = normalizeCategoryName(newEntry.category);
        }
        
        console.log("SPECIALIST: Adding entry:", newEntry.name, "to category:", newEntry.category);

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
            // FIXED: Normalize category name when setting
            const normalizedCategory = normalizeCategoryName(value);
            setSurveyForm((prev) => ({
                ...prev,
                category: normalizedCategory,
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

    // FIXED: Improved category comments handler with normalization
    const handleCategoryCommentsChange = (updatedComments) => {
        // FIXED: Normalize all comment keys to ensure consistency
        const normalizedComments = normalizeCategoryComments(updatedComments);
        
        console.log(
            "SPECIALIST: Category comments changed:",
            Object.keys(normalizedComments).length,
            "items",
            JSON.stringify(normalizedComments)
        );

        // Update local state
        setCategoryComments(normalizedComments);

        // Update the parent with combined updates
        notifyParentOfChanges({
            categoryComments: normalizedComments,
        });
    };

    // Helper function to notify parent of changes
    const notifyParentOfChanges = (updates) => {
        if (typeof onEquipmentChange === "function" && isMountedRef.current) {
            // FIXED: Ensure the comments are normalized before sending to parent
            const combinedUpdate = {
                // Always include current values with normalization
                categoryComments: normalizeCategoryComments(updates.categoryComments || categoryComments),
            };

            console.log(
                "SPECIALIST: Sending combined updates to parent:",
                Object.keys(combinedUpdate).join(", "),
                JSON.stringify(combinedUpdate.categoryComments)
            );

            onEquipmentChange(combinedUpdate);
        }
    };

    // FIXED: Public method to force sync changes - can be called from SaveSurvey with normalization
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.specialistEquipmentInstance = {
                syncChanges: () => {
                    console.log(
                        "SPECIALIST: Force syncing all pending changes",
                        JSON.stringify(categoryComments)
                    );

                    // Send current state to parent with normalization
                    if (typeof onEquipmentChange === "function") {
                        const normalizedComments = normalizeCategoryComments(categoryComments);
                        onEquipmentChange({
                            categoryComments: normalizedComments,
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
                window.specialistEquipmentInstance
            ) {
                delete window.specialistEquipmentInstance;
            }
        };
    }, [categoryComments, onEquipmentChange]);

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
                </>
            )}
        </div>
    );
}