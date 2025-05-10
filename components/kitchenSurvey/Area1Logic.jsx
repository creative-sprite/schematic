// components/kitchenSurvey/Area1Logic.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import Equipment from "@/components/kitchenSurvey/Equipment";
import Schematic from "@/components/kitchenSurvey/Schematic/Schematic.jsx";
import Structure from "@/components/kitchenSurvey/Structure";
import Canopy from "@/components/kitchenSurvey/Canopy";
import SpecialistEquipment from "@/components/kitchenSurvey/SpecialistEquipment";
import VentilationInformationAccordion from "@/components/kitchenSurvey/surveyInfo/VentilationInformation";
import AccessRequirementsAccordion from "@/components/kitchenSurvey/surveyInfo/AccessRequirements";
import Images from "@/components/kitchenSurvey/Images";

export default function Area1Logic({
    visibleSections,
    setVisibleSections,
    structureTotal,
    setStructureTotal,
    structureId,
    setStructureId,
    structureSelectionData,
    setStructureSelectionData,
    structureDimensions,
    setStructureDimensions,
    structureComments,
    setStructureComments,
    surveyData,
    setSurveyData,
    equipmentId,
    setEquipmentId,
    canopyTotal,
    setCanopyTotal,
    canopyId,
    setCanopyId,
    canopyEntries,
    setCanopyEntries,
    specialistEquipmentData,
    setSpecialistEquipmentData,
    specialistEquipmentId,
    setSpecialistEquipmentId,
    selectedGroupId,
    setSelectedGroupId,
    accessDoorPrice,
    setAccessDoorPrice,
    ventilationPrice,
    setVentilationPrice,
    airPrice,
    setAirPrice,
    fanPartsPrice,
    setFanPartsPrice,
    airInExTotal,
    setAirInExTotal,
    schematicItemsTotal,
    setSchematicItemsTotal,
    ventilation,
    setVentilation,
    access,
    setAccess,
    accordion,
    toggleAccordion,
    equipment,
    setEquipment,
    operations,
    setOperations,
    notes,
    setNotes,
    // Pass schematic visual data to Area1Logic
    placedItems,
    setPlacedItems,
    specialItems,
    setSpecialItems,
    gridSpaces,
    setGridSpaces,
    cellSize,
    setCellSize,
    flexiDuctSelections,
    setFlexiDuctSelections,
    accessDoorSelections,
    setAccessDoorSelections,
    fanGradeSelections,
    setFanGradeSelections,
    // Pass survey images for the Images component
    surveyImages,
    setSurveyImages,
    // Pass site details and reference for proper image organization
    siteDetails,
    refValue,
}) {
    // State to track if components are loaded with initial data
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    // State to track if Area ID has been filled
    const [areaIdFilled, setAreaIdFilled] = useState(!!structureId);

    // IMPROVED: Create separate update states for different data types
    const updatingStatesRef = useRef({
        surveyData: false,
        equipment: false,
        structure: false,
        schematic: false,
        ventilation: false,
        specialistEquipment: false,
        canopy: false,
    });

    // IMPROVED: Better debounce timers with longer, more reliable timeouts
    const debounceTimersRef = useRef({
        surveyData: null,
        equipment: null,
        subcategoryComments: null,
        categoryComments: null,
        specialistNotes: null,
        equipmentNotes: null,
        structure: null,
        notes: null,
    });

    // ENHANCED: Simplified and more efficient previous value tracking
    const prevStatesRef = useRef({
        surveyData: [],
        equipmentNotes: equipment?.notes || "",
        specialistNotes: equipment?.specialistNotes || "",
        subcategoryComments: equipment?.subcategoryComments || {},
        categoryComments: equipment?.categoryComments || {},
        structureTotal: structureTotal || 0,
        structureId: structureId || "",
        structureSelectionData: structureSelectionData || [],
        structureDimensions: structureDimensions || {},
        ventilationPrice: ventilationPrice || 0,
    });

    // Check if Area ID has been filled
    useEffect(() => {
        if (structureId && structureId.trim() !== "") {
            setAreaIdFilled(true);
        } else {
            setAreaIdFilled(false);
        }
    }, [structureId]);

    // Track when all necessary props have been set during initialization
    useEffect(() => {
        // Check if we have data in the structure, survey data, or ventilation
        // which would indicate we're loading from an existing survey
        if (
            (structureId ||
                structureTotal > 0 ||
                surveyData.length > 0 ||
                ventilation?.obstructionsToggle ||
                access?.inductionNeeded) &&
            !initialDataLoaded
        ) {
            console.log("Area1Logic: Initializing from existing survey data");

            // Initialize tracking refs with current data
            prevStatesRef.current = {
                surveyData: [...(surveyData || [])],
                equipmentNotes: equipment?.notes || "",
                specialistNotes: equipment?.specialistNotes || "",
                subcategoryComments: equipment?.subcategoryComments || {},
                categoryComments: equipment?.categoryComments || {},
                structureTotal: structureTotal || 0,
                structureId: structureId || "",
                structureSelectionData: structureSelectionData
                    ? [...structureSelectionData]
                    : [],
                structureDimensions: structureDimensions
                    ? { ...structureDimensions }
                    : {},
                ventilationPrice: ventilationPrice || 0,
            };

            setInitialDataLoaded(true);
        }
    }, [
        structureId,
        structureTotal,
        surveyData,
        ventilation,
        access,
        initialDataLoaded,
        equipment,
        structureSelectionData,
        structureDimensions,
        ventilationPrice,
    ]);

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            // Clear all debounce timers
            Object.values(debounceTimersRef.current).forEach((timer) => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []);

    // IMPROVED: Memoized handler for survey data changes with better debounce
    const handleSurveyDataChange = useCallback(
        (newData) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.surveyData) {
                return;
            }

            // Simple length check before deep comparison
            if (newData.length !== prevStatesRef.current.surveyData.length) {
                // Clear any existing timer
                if (debounceTimersRef.current.surveyData) {
                    clearTimeout(debounceTimersRef.current.surveyData);
                }

                // Debounce the update
                debounceTimersRef.current.surveyData = setTimeout(() => {
                    // Set flag to prevent circular updates
                    updatingStatesRef.current.surveyData = true;

                    // Update reference
                    prevStatesRef.current.surveyData = [...newData];

                    // Update state
                    setSurveyData(newData);

                    // Reset flag after a reasonable delay
                    setTimeout(() => {
                        updatingStatesRef.current.surveyData = false;
                    }, 50);
                }, 300); // Use a 300ms debounce timeout
                return;
            }

            // Only do detailed comparison if lengths match
            const hasChanges = newData.some((item, idx) => {
                const prevItem = prevStatesRef.current.surveyData[idx];
                // Skip if no corresponding previous item
                if (!prevItem) return true;

                // Compare essential properties directly
                return (
                    item.id !== prevItem.id ||
                    item.item !== prevItem.item ||
                    item.grade !== prevItem.grade ||
                    item.number !== prevItem.number ||
                    item.subcategory !== prevItem.subcategory ||
                    item.length !== prevItem.length ||
                    item.width !== prevItem.width ||
                    item.height !== prevItem.height
                );
            });

            if (hasChanges) {
                // Clear any existing timer
                if (debounceTimersRef.current.surveyData) {
                    clearTimeout(debounceTimersRef.current.surveyData);
                }

                // Debounce the update
                debounceTimersRef.current.surveyData = setTimeout(() => {
                    // Set flag to prevent circular updates
                    updatingStatesRef.current.surveyData = true;

                    // Update reference
                    prevStatesRef.current.surveyData = [...newData];

                    // Update state
                    setSurveyData(newData);

                    // Reset flag after a reasonable delay
                    setTimeout(() => {
                        updatingStatesRef.current.surveyData = false;
                    }, 50);
                }, 300); // Use a 300ms debounce timeout
            }
        },
        [setSurveyData]
    );

    // COMPLETELY REWRITTEN: More efficient equipment changes handler
    const handleEquipmentChange = useCallback(
        (newEquipment) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.equipment) {
                return;
            }

            // Track if any field needs updating
            let needsUpdate = false;
            let updatedFields = [];

            // Create a clean object to track what to update
            const fieldsToUpdate = {};

            // Check if notes field has changed
            if (
                newEquipment.hasOwnProperty("notes") &&
                newEquipment.notes !== prevStatesRef.current.equipmentNotes
            ) {
                // Clear any existing notes timer
                if (debounceTimersRef.current.equipmentNotes) {
                    clearTimeout(debounceTimersRef.current.equipmentNotes);
                }

                fieldsToUpdate.notes = newEquipment.notes;
                needsUpdate = true;
                updatedFields.push("notes");

                // Update reference immediately to avoid duplicate updates
                prevStatesRef.current.equipmentNotes = newEquipment.notes;
            }

            // Check if specialist notes field has changed
            if (
                newEquipment.hasOwnProperty("specialistNotes") &&
                newEquipment.specialistNotes !==
                    prevStatesRef.current.specialistNotes
            ) {
                // Clear any existing specialist notes timer
                if (debounceTimersRef.current.specialistNotes) {
                    clearTimeout(debounceTimersRef.current.specialistNotes);
                }

                fieldsToUpdate.specialistNotes = newEquipment.specialistNotes;
                needsUpdate = true;
                updatedFields.push("specialistNotes");

                // Update reference immediately to avoid duplicate updates
                prevStatesRef.current.specialistNotes =
                    newEquipment.specialistNotes;
            }

            // Check if subcategory comments have changed
            if (newEquipment.hasOwnProperty("subcategoryComments")) {
                // Do a simple key count comparison first for efficiency
                const oldKeys = Object.keys(
                    prevStatesRef.current.subcategoryComments || {}
                );
                const newKeys = Object.keys(
                    newEquipment.subcategoryComments || {}
                );

                let commentsChanged = oldKeys.length !== newKeys.length;

                // Only do detailed comparison if key counts match
                if (!commentsChanged) {
                    for (const key of newKeys) {
                        if (
                            prevStatesRef.current.subcategoryComments[key] !==
                            newEquipment.subcategoryComments[key]
                        ) {
                            commentsChanged = true;
                            break;
                        }
                    }
                }

                if (commentsChanged) {
                    // Clear any existing subcategory comments timer
                    if (debounceTimersRef.current.subcategoryComments) {
                        clearTimeout(
                            debounceTimersRef.current.subcategoryComments
                        );
                    }

                    fieldsToUpdate.subcategoryComments = {
                        ...newEquipment.subcategoryComments,
                    };
                    needsUpdate = true;
                    updatedFields.push("subcategoryComments");

                    // Update reference immediately to avoid duplicate updates
                    prevStatesRef.current.subcategoryComments = {
                        ...newEquipment.subcategoryComments,
                    };
                }
            }

            // Check if category comments have changed
            if (newEquipment.hasOwnProperty("categoryComments")) {
                // Do a simple key count comparison first for efficiency
                const oldKeys = Object.keys(
                    prevStatesRef.current.categoryComments || {}
                );
                const newKeys = Object.keys(
                    newEquipment.categoryComments || {}
                );

                let commentsChanged = oldKeys.length !== newKeys.length;

                // Only do detailed comparison if key counts match
                if (!commentsChanged) {
                    for (const key of newKeys) {
                        if (
                            prevStatesRef.current.categoryComments[key] !==
                            newEquipment.categoryComments[key]
                        ) {
                            commentsChanged = true;
                            break;
                        }
                    }
                }

                if (commentsChanged) {
                    // Clear any existing category comments timer
                    if (debounceTimersRef.current.categoryComments) {
                        clearTimeout(
                            debounceTimersRef.current.categoryComments
                        );
                    }

                    fieldsToUpdate.categoryComments = {
                        ...newEquipment.categoryComments,
                    };
                    needsUpdate = true;
                    updatedFields.push("categoryComments");

                    // Update reference immediately to avoid duplicate updates
                    prevStatesRef.current.categoryComments = {
                        ...newEquipment.categoryComments,
                    };
                }
            }

            // If nothing has changed, skip the update
            if (!needsUpdate) {
                return;
            }

            console.log(
                "Area1Logic: Equipment change detected with fields:",
                updatedFields.join(", ")
            );

            // Clear main equipment timer
            if (debounceTimersRef.current.equipment) {
                clearTimeout(debounceTimersRef.current.equipment);
            }

            // Debounce the update with a single timer
            debounceTimersRef.current.equipment = setTimeout(() => {
                // Set flag to prevent circular updates
                updatingStatesRef.current.equipment = true;

                // Create a merged equipment object that preserves all fields
                const updatedEquipment = equipment
                    ? { ...equipment, ...fieldsToUpdate }
                    : { ...fieldsToUpdate };

                // Log the fields being updated
                console.log(
                    "Area1Logic: Updating equipment with fields:",
                    updatedFields.join(", ")
                );

                // Update state
                setEquipment(updatedEquipment);

                // Reset flag after a reasonable delay
                setTimeout(() => {
                    updatingStatesRef.current.equipment = false;
                }, 50);
            }, 300); // Consistent 300ms debounce timeout
        },
        [equipment, setEquipment]
    );

    // IMPROVED: Direct handler for notes changes (used for regular equipment notes)
    const handleNotesChange = useCallback(
        (newNotes) => {
            // Skip if already handling equipment updates
            if (updatingStatesRef.current.equipment) {
                return;
            }

            // Skip if no actual change
            if (newNotes === prevStatesRef.current.equipmentNotes) {
                return;
            }

            // Call equipment change with just the notes field
            handleEquipmentChange({
                notes: newNotes,
            });
        },
        [handleEquipmentChange]
    );

    // IMPROVED: Memoized handler for specialist equipment changes
    const handleSpecialistEquipmentChange = useCallback(
        (newData) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.specialistEquipment) {
                return;
            }

            // Skip if no actual change (simple check)
            if (
                !newData ||
                (Array.isArray(newData) &&
                    Array.isArray(specialistEquipmentData) &&
                    newData.length === specialistEquipmentData.length &&
                    newData.every(
                        (item, idx) =>
                            item.id === specialistEquipmentData[idx]?.id &&
                            item.item === specialistEquipmentData[idx]?.item
                    ))
            ) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.specialistEquipment = true;

            // Update state
            setSpecialistEquipmentData(newData);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.specialistEquipment = false;
            }, 50);
        },
        [specialistEquipmentData, setSpecialistEquipmentData]
    );

    // IMPROVED: Memoized handlers for structure-related changes
    const handleStructureTotalChange = useCallback(
        (total) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.structure) {
                return;
            }

            // Skip if no actual change
            if (total === prevStatesRef.current.structureTotal) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.structure = true;

            // Update reference
            prevStatesRef.current.structureTotal = total;

            // Update state
            setStructureTotal(total);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.structure = false;
            }, 50);
        },
        [setStructureTotal]
    );

    // IMPROVED: Memoized handler for structure ID changes
    const handleStructureIdChange = useCallback(
        (id) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.structure) {
                return;
            }

            // Skip if no actual change
            if (id === prevStatesRef.current.structureId) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.structure = true;

            // Update reference
            prevStatesRef.current.structureId = id;

            // Update state
            setStructureId(id);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.structure = false;
            }, 50);
        },
        [setStructureId]
    );

    // IMPROVED: Memoized handler for structure selection data changes
    const handleStructureSelectionDataChange = useCallback(
        (data) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.structure) {
                return;
            }

            // Validate data
            if (!data || !Array.isArray(data)) {
                console.error(
                    "Area1Logic: Invalid selection data received:",
                    data
                );
                return;
            }

            // Perform deep validation of each selection object
            const validatedData = data.map((item) => {
                // Ensure all fields are present
                return {
                    type: item.type || "",
                    item: item.item || "", // Allow empty strings, MongoDB will handle null values
                    grade: item.grade || "",
                };
            });

            // Skip if no actual change - simple length check first
            if (
                validatedData.length !==
                prevStatesRef.current.structureSelectionData.length
            ) {
                // Set flag to prevent circular updates
                updatingStatesRef.current.structure = true;

                // Update reference
                prevStatesRef.current.structureSelectionData = [
                    ...validatedData,
                ];

                // Update state
                setStructureSelectionData(validatedData);

                // Reset flag after a reasonable delay
                setTimeout(() => {
                    updatingStatesRef.current.structure = false;
                }, 50);
                return;
            }

            // Only do detailed comparison if lengths match
            const hasChanges = validatedData.some((item, idx) => {
                const prevItem =
                    prevStatesRef.current.structureSelectionData[idx];
                return (
                    item.type !== prevItem.type ||
                    item.item !== prevItem.item ||
                    item.grade !== prevItem.grade
                );
            });

            if (hasChanges) {
                // Set flag to prevent circular updates
                updatingStatesRef.current.structure = true;

                // Update reference
                prevStatesRef.current.structureSelectionData = [
                    ...validatedData,
                ];

                // Update state
                setStructureSelectionData(validatedData);

                // Reset flag after a reasonable delay
                setTimeout(() => {
                    updatingStatesRef.current.structure = false;
                }, 50);
            }
        },
        [setStructureSelectionData]
    );

    // IMPROVED: Memoized handler for structure dimensions changes
    const handleStructureDimensionsChange = useCallback(
        (dimensions) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.structure) {
                return;
            }

            // Validate dimensions
            if (!dimensions) {
                console.error(
                    "Area1Logic: Invalid dimensions received:",
                    dimensions
                );
                return;
            }

            // Create a validated dimensions object with proper type conversion
            const validatedDimensions = {
                length:
                    dimensions.length !== undefined &&
                    dimensions.length !== null
                        ? Number(dimensions.length)
                        : null,
                width:
                    dimensions.width !== undefined && dimensions.width !== null
                        ? Number(dimensions.width)
                        : null,
                height:
                    dimensions.height !== undefined &&
                    dimensions.height !== null
                        ? Number(dimensions.height)
                        : null,
            };

            // Skip if no actual change - simple direct comparison
            if (
                validatedDimensions.length ===
                    prevStatesRef.current.structureDimensions.length &&
                validatedDimensions.width ===
                    prevStatesRef.current.structureDimensions.width &&
                validatedDimensions.height ===
                    prevStatesRef.current.structureDimensions.height
            ) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.structure = true;

            // Update reference
            prevStatesRef.current.structureDimensions = {
                ...validatedDimensions,
            };

            // Update state
            setStructureDimensions(validatedDimensions);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.structure = false;
            }, 50);
        },
        [setStructureDimensions]
    );

    // IMPROVED: Memoized handler for structure comments changes
    const handleStructureCommentsChange = useCallback(
        (comments) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.structure) {
                return;
            }

            // Skip if no actual change
            if (comments === structureComments) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.structure = true;

            // Update state
            setStructureComments(comments);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.structure = false;
            }, 50);
        },
        [structureComments, setStructureComments]
    );

    // IMPROVED: Memoized handlers for canopy-related changes
    const handleCanopyTotalChange = useCallback(
        (total) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.canopy) {
                return;
            }

            // Skip if no actual change
            if (total === canopyTotal) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.canopy = true;

            // Update state
            setCanopyTotal(total);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.canopy = false;
            }, 50);
        },
        [canopyTotal, setCanopyTotal]
    );

    // IMPROVED: Memoized handler for canopy entries changes
    const handleCanopyEntriesChange = useCallback(
        (entries) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.canopy) {
                return;
            }

            // Skip if no actual change (simple length check)
            if (entries.length === canopyEntries.length) {
                // Only proceed with more detailed check if needed
                let entriesChanged = false;
                for (let i = 0; i < entries.length; i++) {
                    if (entries[i].id !== canopyEntries[i].id) {
                        entriesChanged = true;
                        break;
                    }
                }

                if (!entriesChanged) {
                    return;
                }
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.canopy = true;

            // Update state
            setCanopyEntries(entries);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.canopy = false;
            }, 50);
        },
        [canopyEntries, setCanopyEntries]
    );

    // IMPROVED: Memoized handler for general notes changes
    const handleNotesUpdate = useCallback(
        (newNotes) => {
            // Skip if no actual change (simple check)
            if (newNotes === notes) {
                return;
            }

            // Use a debounced update without check for specific fields
            // since notes object might have various properties
            // Clear any existing timer
            if (debounceTimersRef.current.notes) {
                clearTimeout(debounceTimersRef.current.notes);
            }

            // Debounce the update
            debounceTimersRef.current.notes = setTimeout(() => {
                setNotes(newNotes);
            }, 300);
        },
        [notes, setNotes]
    );

    // IMPROVED: Memoized handler for ventilation price changes
    const handleVentilationPriceChange = useCallback(
        (price) => {
            // Skip if already handling an update
            if (updatingStatesRef.current.schematic) {
                return;
            }

            // Skip if no actual change (with small threshold for floating point comparison)
            if (
                Math.abs(price - prevStatesRef.current.ventilationPrice) < 0.001
            ) {
                return;
            }

            // Set flag to prevent circular updates
            updatingStatesRef.current.schematic = true;

            // Update reference
            prevStatesRef.current.ventilationPrice = price;

            // Update state
            setVentilationPrice(price);

            // Reset flag after a reasonable delay
            setTimeout(() => {
                updatingStatesRef.current.schematic = false;
            }, 50);
        },
        [setVentilationPrice]
    );

    // IMPROVED: Memoized handlers for UI state changes (less critical)
    const handleSelectedGroupIdChange = useCallback(
        (newId) => {
            if (newId === selectedGroupId) {
                return;
            }
            setSelectedGroupId(newId);
        },
        [selectedGroupId, setSelectedGroupId]
    );

    // IMPROVED: Memoized handler for visible sections changes
    const handleVisibleSectionsChange = useCallback(
        (newSections) => {
            // Simple length check first
            if (newSections.length !== visibleSections.length) {
                setVisibleSections(newSections);
                return;
            }

            // Only do detailed check if necessary
            const sectionsChanged = newSections.some(
                (section) => !visibleSections.includes(section)
            );
            if (sectionsChanged) {
                setVisibleSections(newSections);
            }
        },
        [visibleSections, setVisibleSections]
    );

    // CSS for area input animation
    const areaInputStyles = `
        @keyframes pulseGlow {
    0% {
        box-shadow: 0 0 2px 1px var(--primary-color);
        border-color: var(--primary-color);
    }
    50% {
        box-shadow: 0 0 15px 4px var(--primary-color);
        border-color: var(--primary-color);
    }
    100% {
        box-shadow: 0 0 2px 1px var(--primary-color);
        border-color: var(--primary-color);
        transform: scale(1);
    }
}

.area-id-animation {
    width: 100%;
    position: relative;
}

.area-id-animation .p-inputtext {
    width: 100%;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.area-id-animation:not(.filled) .p-inputtext {
    animation: pulseGlow 1.5s infinite;
    border-width: 2px;
    background-color: rgba(var(--primary-color-rgb, 25, 118, 210), 0.05);
}

.area-id-animation.filled .p-inputtext {
    border-color: var(--primary-color);
    border-width: 2px;
    box-shadow: 0 0 4px var(--primary-color);
}
    `;

    return (
        <>
            <style>{areaInputStyles}</style>
            <div
                style={{
                    marginBottom: "3rem",
                    marginTop: "2rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
                    {structureId || "Area 1"}
                </h1>

                <div
                    style={{
                        gap: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        fontSize: "0.5rem",
                        textAlign: "center",
                        marginBottom: "1rem",
                    }}
                >
                    <div
                        className={`area-id-animation ${
                            areaIdFilled ? "filled" : ""
                        }`}
                    >
                        <InputText
                            placeholder="Enter Area ID example: kitchen, survery."
                            value={structureId}
                            onChange={(e) => {
                                handleStructureIdChange(e.target.value);
                                handleSelectedGroupIdChange(e.target.value);
                            }}
                            onBlur={(e) =>
                                handleStructureIdChange(e.target.value.trim())
                            }
                        />
                    </div>
                </div>

                <div
                    style={{
                        gap: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        fontSize: "0.5rem",
                    }}
                >
                    <MultiSelect
                        id="area1-visible-sections"
                        name="area1-visible-sections"
                        value={visibleSections}
                        options={[
                            { label: "Structure", value: "structure" },
                            { label: "Equipment", value: "equipment" },
                            { label: "Canopy", value: "canopy" },
                            { label: "Schematic", value: "schematic" },
                            {
                                label: "Specialist Equipment",
                                value: "specialistEquipment",
                            },
                            { label: "Images", value: "images" },
                        ]}
                        onChange={(e) => handleVisibleSectionsChange(e.value)}
                        placeholder="choose sections"
                        style={{ width: "100%" }}
                    />
                </div>
            </div>

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {visibleSections.includes("structure") && (
                    <Structure
                        onStructureTotalChange={handleStructureTotalChange}
                        onStructureIdChange={handleStructureIdChange}
                        onSelectionDataChange={
                            handleStructureSelectionDataChange
                        }
                        onDimensionsChange={handleStructureDimensionsChange}
                        onStructureCommentsChange={
                            handleStructureCommentsChange
                        }
                        initialStructureId={structureId}
                        initialStructureTotal={structureTotal}
                        initialSelectionData={structureSelectionData}
                        initialDimensions={structureDimensions}
                        initialStructureComments={structureComments}
                    />
                )}
            </div>

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {visibleSections.includes("canopy") && (
                    <Canopy
                        onCanopyTotalChange={handleCanopyTotalChange}
                        structureIds={structureId ? [structureId] : []}
                        onCanopyIdChange={setCanopyId}
                        onEntriesChange={handleCanopyEntriesChange}
                        initialCanopyTotal={canopyTotal}
                        initialCanopyId={canopyId}
                        initialEntries={canopyEntries}
                    />
                )}
            </div>

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {visibleSections.includes("equipment") && (
                    <Equipment
                        onSurveyListChange={handleSurveyDataChange}
                        structureIds={structureId ? [structureId] : []}
                        onEquipmentIdChange={setEquipmentId}
                        initialSurveyData={surveyData}
                        initialEquipmentId={equipmentId}
                        equipment={equipment}
                        initialNotes={equipment?.notes || ""}
                        initialSubcategoryComments={
                            equipment?.subcategoryComments || {}
                        }
                        onNotesChange={handleNotesChange}
                        onEquipmentChange={handleEquipmentChange}
                    />
                )}
            </div>

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {visibleSections.includes("schematic") && (
                    <Schematic
                        structureIds={structureId ? [structureId] : []}
                        groupingId={selectedGroupId}
                        onGroupIdChange={handleSelectedGroupIdChange}
                        onAccessDoorPriceChange={(price) =>
                            setAccessDoorPrice((prev) => prev + price)
                        }
                        onVentilationPriceChange={handleVentilationPriceChange}
                        onFanPartsPriceChange={setFanPartsPrice}
                        onAirInExPriceChange={setAirInExTotal}
                        onSchematicItemsTotalChange={(val) =>
                            setSchematicItemsTotal(val)
                        }
                        initialAccessDoorPrice={accessDoorPrice}
                        initialVentilationPrice={ventilationPrice}
                        initialAirPrice={airPrice}
                        initialFanPartsPrice={fanPartsPrice}
                        initialAirInExTotal={airInExTotal}
                        initialSchematicItemsTotal={schematicItemsTotal}
                        // Pass schematic data props
                        placedItems={placedItems}
                        setPlacedItems={setPlacedItems}
                        specialItems={specialItems}
                        setSpecialItems={setSpecialItems}
                        gridSpaces={gridSpaces}
                        setGridSpaces={setGridSpaces}
                        cellSize={cellSize}
                        setCellSize={setCellSize}
                        flexiDuctSelections={flexiDuctSelections}
                        setFlexiDuctSelections={setFlexiDuctSelections}
                        accessDoorSelections={accessDoorSelections}
                        setAccessDoorSelections={setAccessDoorSelections}
                        fanGradeSelections={fanGradeSelections}
                        setFanGradeSelections={setFanGradeSelections}
                    />
                )}
            </div>

            {/* Ventilation Information Accordion */}
            <VentilationInformationAccordion
                ventilation={ventilation}
                setVentilation={setVentilation}
                isOpen={accordion.ventilation}
                toggleAccordion={() => toggleAccordion("ventilation")}
            />

            <div style={{ marginBottom: "3rem" }} />

            <div
                style={{
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {visibleSections.includes("specialistEquipment") && (
                    <SpecialistEquipment
                        onSurveyListChange={handleSpecialistEquipmentChange}
                        structureIds={structureId ? [structureId] : []}
                        onEquipmentIdChange={setSpecialistEquipmentId}
                        initialSpecialistEquipmentData={specialistEquipmentData}
                        initialSpecialistEquipmentId={specialistEquipmentId}
                        equipment={equipment}
                        // CRITICAL FIX: Use specialistNotes for initialNotes
                        initialNotes={equipment?.specialistNotes || ""}
                        initialCategoryComments={
                            equipment?.categoryComments || {}
                        }
                        onNotesChange={(notes) => {
                            // Update equipment with partial update containing only specialistNotes
                            handleEquipmentChange({
                                specialistNotes: notes, // Note the property name change to avoid conflict
                            });
                        }}
                        onEquipmentChange={handleEquipmentChange}
                    />
                )}
            </div>

            <div style={{ marginBottom: "3rem" }} />

            {/* Access Requirements Accordion */}
            <AccessRequirementsAccordion
                access={access}
                setAccess={setAccess}
                isOpen={accordion.access}
                toggleAccordion={() => toggleAccordion("access")}
            />

            <div style={{ marginBottom: "3rem" }} />

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {/* Images section now uses the top-level surveyImages state */}
                {visibleSections.includes("images") && (
                    <div>
                        <h3>Image Gallery</h3>
                        {surveyImages &&
                        Object.keys(surveyImages).length > 0 &&
                        Object.values(surveyImages).flat().length > 0 ? (
                            <p>
                                Found{" "}
                                {Object.values(surveyImages).flat().length}{" "}
                                saved images
                            </p>
                        ) : (
                            <p>
                                No saved images found. Add images using the
                                buttons below.
                            </p>
                        )}
                        <Images
                            initialImages={surveyImages}
                            onImagesChange={(images) => {
                                // Store images in top-level state - with comparison
                                const imagesStr = JSON.stringify(images);
                                const currImagesStr =
                                    JSON.stringify(surveyImages);
                                if (imagesStr !== currImagesStr) {
                                    setSurveyImages(images);
                                }
                            }}
                            surveyRef={refValue || ""} // Use the actual survey reference
                            siteName={siteDetails?.siteName || ""} // Use the actual site name
                        />
                    </div>
                )}
            </div>
        </>
    );
}
