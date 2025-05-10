// components/kitchenSurvey/Area1Logic.jsx
"use client";

import { useState, useEffect, useRef } from "react";
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
    groupDimensions,
    setGroupDimensions,
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

    // ENHANCED: Refs to track state updates and prevent circular updates
    const updatingStatesRef = useRef({
        surveyData: false,
        equipment: false,
        structure: false,
        schematic: false,
        ventilation: false,
        specialistEquipment: false,
        canopy: false,
    });

    // ADDED: Debounce timers for state updates
    const debounceTimersRef = useRef({
        surveyData: null,
        equipment: null,
        structure: null,
        notes: null,
    });

    // ADDED: Track previous values for deep comparison
    const prevStatesRef = useRef({
        surveyData: [],
        equipment: equipment || {},
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
                equipment: equipment ? { ...equipment } : {},
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

    // IMPROVED: Safe handler for survey data changes
    const handleSurveyDataChange = (newData) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.surveyData) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevStatesRef.current.surveyData);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Clear any existing timer
        if (debounceTimersRef.current.surveyData) {
            clearTimeout(debounceTimersRef.current.surveyData);
        }

        // Debounce the update
        debounceTimersRef.current.surveyData = setTimeout(() => {
            // Set flag to prevent circular updates
            updatingStatesRef.current.surveyData = true;

            // Update reference
            prevStatesRef.current.surveyData = JSON.parse(newDataStr);

            // Update state
            setSurveyData(newData);

            // Reset flag after a short delay
            setTimeout(() => {
                updatingStatesRef.current.surveyData = false;
            }, 10);
        }, 50);
    };

    // IMPROVED: Safe handler for equipment changes
    const handleEquipmentChange = (newEquipment) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.equipment) {
            return;
        }

        // Skip if no actual change (comparing only necessary fields)
        const equipHasNotes =
            newEquipment.hasOwnProperty("notes") &&
            equipment?.notes !== newEquipment.notes;
        const equipHasSpecialistNotes =
            newEquipment.hasOwnProperty("specialistNotes") &&
            equipment?.specialistNotes !== newEquipment.specialistNotes;
        const equipHasSubcategoryComments =
            newEquipment.hasOwnProperty("subcategoryComments") &&
            JSON.stringify(equipment?.subcategoryComments) !==
                JSON.stringify(newEquipment.subcategoryComments);
        const equipHasCategoryComments =
            newEquipment.hasOwnProperty("categoryComments") &&
            JSON.stringify(equipment?.categoryComments) !==
                JSON.stringify(newEquipment.categoryComments);

        // If nothing has changed, skip the update
        if (
            !equipHasNotes &&
            !equipHasSpecialistNotes &&
            !equipHasSubcategoryComments &&
            !equipHasCategoryComments
        ) {
            return;
        }

        console.log(
            "Area1Logic: Equipment change detected with fields:",
            Object.keys(newEquipment)
        );

        // Clear any existing timer
        if (debounceTimersRef.current.equipment) {
            clearTimeout(debounceTimersRef.current.equipment);
        }

        // Debounce the update
        debounceTimersRef.current.equipment = setTimeout(() => {
            // Set flag to prevent circular updates
            updatingStatesRef.current.equipment = true;

            // Create a merged equipment object that preserves all fields
            let updatedEquipment;
            if (equipment) {
                updatedEquipment = { ...equipment };

                // Apply only the changed fields
                if (equipHasNotes) updatedEquipment.notes = newEquipment.notes;
                if (equipHasSpecialistNotes)
                    updatedEquipment.specialistNotes =
                        newEquipment.specialistNotes;

                if (equipHasSubcategoryComments) {
                    updatedEquipment.subcategoryComments = {
                        ...(updatedEquipment.subcategoryComments || {}),
                        ...newEquipment.subcategoryComments,
                    };
                }

                if (equipHasCategoryComments) {
                    updatedEquipment.categoryComments = {
                        ...(updatedEquipment.categoryComments || {}),
                        ...newEquipment.categoryComments,
                    };
                }
            } else {
                updatedEquipment = newEquipment;
            }

            // Update reference
            prevStatesRef.current.equipment = { ...updatedEquipment };

            // Log the fields being updated
            console.log(
                "Area1Logic: Updating equipment with fields:",
                Object.keys(updatedEquipment)
            );

            // Update state
            setEquipment(updatedEquipment);

            // Reset flag after a short delay
            setTimeout(() => {
                updatingStatesRef.current.equipment = false;
            }, 10);
        }, 50);
    };

    // IMPROVED: Safe handler for specialist equipment changes
    const handleSpecialistEquipmentChange = (newData) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.specialistEquipment) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(specialistEquipmentData);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStatesRef.current.specialistEquipment = true;

        // Update state
        setSpecialistEquipmentData(newData);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.specialistEquipment = false;
        }, 10);
    };

    // IMPROVED: Safe handler for structure-related changes
    const handleStructureTotalChange = (total) => {
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

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.structure = false;
        }, 10);
    };

    // IMPROVED: Safe handler for structure ID changes
    const handleStructureIdChange = (id) => {
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

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.structure = false;
        }, 10);
    };

    // IMPROVED: Safe handler for structure selection data changes
    const handleStructureSelectionDataChange = (data) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.structure) {
            return;
        }

        // Validate data
        if (!data || !Array.isArray(data)) {
            console.error("Area1Logic: Invalid selection data received:", data);
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

        // Skip if no actual change after validation
        const newDataStr = JSON.stringify(validatedData);
        const prevDataStr = JSON.stringify(
            prevStatesRef.current.structureSelectionData
        );
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStatesRef.current.structure = true;

        // Update reference
        prevStatesRef.current.structureSelectionData = JSON.parse(newDataStr);

        // Update state
        setStructureSelectionData(validatedData);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.structure = false;
        }, 10);
    };

    // IMPROVED: Safe handler for structure dimensions changes
    const handleStructureDimensionsChange = (dimensions) => {
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
                dimensions.length !== undefined && dimensions.length !== null
                    ? Number(dimensions.length)
                    : null,
            width:
                dimensions.width !== undefined && dimensions.width !== null
                    ? Number(dimensions.width)
                    : null,
            height:
                dimensions.height !== undefined && dimensions.height !== null
                    ? Number(dimensions.height)
                    : null,
        };

        // Skip if no actual change after validation
        const newDimensionsStr = JSON.stringify(validatedDimensions);
        const prevDimensionsStr = JSON.stringify(
            prevStatesRef.current.structureDimensions
        );
        if (newDimensionsStr === prevDimensionsStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStatesRef.current.structure = true;

        // Update reference
        prevStatesRef.current.structureDimensions =
            JSON.parse(newDimensionsStr);

        // Update state
        setStructureDimensions(validatedDimensions);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.structure = false;
        }, 10);
    };

    // IMPROVED: Safe handler for structure comments changes
    const handleStructureCommentsChange = (comments) => {
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

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.structure = false;
        }, 10);
    };

    // IMPROVED: Safe handler for canopy changes
    const handleCanopyTotalChange = (total) => {
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

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.canopy = false;
        }, 10);
    };

    // IMPROVED: Safe handler for canopy entries changes
    const handleCanopyEntriesChange = (entries) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.canopy) {
            return;
        }

        // Skip if no actual change
        const entriesStr = JSON.stringify(entries);
        const prevEntriesStr = JSON.stringify(canopyEntries);
        if (entriesStr === prevEntriesStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStatesRef.current.canopy = true;

        // Update state
        setCanopyEntries(entries);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.canopy = false;
        }, 10);
    };

    // IMPROVED: Safe handler for notes changes
    const handleNotesUpdate = (newNotes) => {
        // Skip if no actual change
        if (JSON.stringify(newNotes) === JSON.stringify(notes)) {
            return;
        }

        // Clear any existing timer
        if (debounceTimersRef.current.notes) {
            clearTimeout(debounceTimersRef.current.notes);
        }

        // Debounce the update
        debounceTimersRef.current.notes = setTimeout(() => {
            setNotes(newNotes);
        }, 50);
    };

    // IMPROVED: Safe handler for ventilation price changes
    const handleVentilationPriceChange = (price) => {
        // Skip if already handling an update
        if (updatingStatesRef.current.schematic) {
            return;
        }

        // Skip if no actual change
        if (Math.abs(price - prevStatesRef.current.ventilationPrice) < 0.001) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStatesRef.current.schematic = true;

        // Update reference
        prevStatesRef.current.ventilationPrice = price;

        // Update state
        setVentilationPrice(price);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStatesRef.current.schematic = false;
        }, 10);
    };

    // IMPROVED: Safe handler for selected group ID changes
    const handleSelectedGroupIdChange = (newId) => {
        if (newId === selectedGroupId) {
            return;
        }
        setSelectedGroupId(newId);
    };

    // IMPROVED: Safe handler for visible sections changes
    const handleVisibleSectionsChange = (newSections) => {
        if (JSON.stringify(newSections) === JSON.stringify(visibleSections)) {
            return;
        }
        setVisibleSections(newSections);
    };

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
                        onNotesChange={(notes) => {
                            // Update equipment with partial update containing only notes
                            handleEquipmentChange({
                                notes: notes, // Regular equipment notes
                            });
                        }}
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
                        groupDimensions={groupDimensions}
                        setGroupDimensions={setGroupDimensions}
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
