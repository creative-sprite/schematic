// components/kitchenSurvey/Area1Logic.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import Equipment from "@/components/kitchenSurvey/Equipment";
import Schematic from "@/components/kitchenSurvey/Schematic/Schematic.jsx";
import Structure from "@/components/kitchenSurvey/Structure";
import Canopy from "@/components/kitchenSurvey/Canopy";
import SpecialistEquipment from "@/components/kitchenSurvey/SpecialistEquipment";
import VentilationInformationAccordion from "@/components/kitchenSurvey/surveyInfo/VentilationInformation";
import AccessRequirementsAccordion from "@/components/kitchenSurvey/surveyInfo/AccessRequirements";
import Images from "@/components/kitchenSurvey/Images";

export default function Area1Logic({
    // All original props
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
    canopyComments,
    setCanopyComments,
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
    // Schematic visual data props
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
    // Survey images props
    surveyImages,
    setSurveyImages,
    // Site details and reference props
    siteDetails,
    refValue,
    // Specialist equipment survey
    initialSpecialistEquipmentSurvey,
    // Equipment items data (for calculations)
    equipmentItems,
}) {
    // Toast for notifications
    const toast = useRef(null);

    // State to track if Area ID has been filled
    const [areaIdFilled, setAreaIdFilled] = useState(!!structureId);

    // Register global instance for component access
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Create an instance reference
            const instanceRef = {
                syncCanopyComments: () => {
                    console.log("Area1Logic: Force syncing canopy comments");
                    if (
                        canopyComments &&
                        Object.keys(canopyComments).length > 0 &&
                        typeof setCanopyComments === "function"
                    ) {
                        setCanopyComments({ ...canopyComments });
                        return true;
                    }
                    return false;
                },
            };

            // Store in window for global access
            window.area1LogicInstance = instanceRef;
        }

        // Cleanup on unmount
        return () => {
            if (typeof window !== "undefined" && window.area1LogicInstance) {
                delete window.area1LogicInstance;
            }
        };
    }, [canopyComments, setCanopyComments]);

    // Check if Area ID has been filled
    useEffect(() => {
        if (structureId && structureId.trim() !== "") {
            setAreaIdFilled(true);
        } else {
            setAreaIdFilled(false);
        }
    }, [structureId]);

    // Equipment change handler
    const handleEquipmentChange = useCallback(
        (newEquipment) => {
            console.log("Main area: Updating equipment state");

            setEquipment((prev) => {
                const updatedEquipment = { ...prev };

                // Copy non-comment properties
                Object.keys(newEquipment).forEach((key) => {
                    if (
                        key !== "subcategoryComments" &&
                        key !== "categoryComments"
                    ) {
                        updatedEquipment[key] = newEquipment[key];
                    }
                });

                // Special handling for subcategoryComments - create a new object
                if (newEquipment.subcategoryComments) {
                    console.log(
                        "Main area: Updating subcategoryComments with",
                        Object.keys(newEquipment.subcategoryComments).length,
                        "entries"
                    );

                    // Initialize or reset the comments object
                    updatedEquipment.subcategoryComments = {};

                    // Copy each comment individually to avoid reference issues
                    Object.entries(newEquipment.subcategoryComments).forEach(
                        ([key, value]) => {
                            updatedEquipment.subcategoryComments[key] = value;
                        }
                    );
                }

                // Special handling for categoryComments - create a new object
                if (newEquipment.categoryComments) {
                    console.log(
                        "Main area: Updating categoryComments with",
                        Object.keys(newEquipment.categoryComments).length,
                        "entries"
                    );

                    // Initialize or reset the comments object
                    updatedEquipment.categoryComments = {};

                    // Copy each comment individually to avoid reference issues
                    Object.entries(newEquipment.categoryComments).forEach(
                        ([key, value]) => {
                            updatedEquipment.categoryComments[key] = value;
                        }
                    );
                }

                return updatedEquipment;
            });
        },
        [setEquipment]
    );

    // Survey data handler (Equipment)
    const handleSurveyDataChange = useCallback(
        (newData) => {
            setSurveyData(newData);
        },
        [setSurveyData]
    );

    // Specialist equipment data handler
    const handleSpecialistEquipmentChange = useCallback(
        (newData) => {
            setSpecialistEquipmentData(newData);
        },
        [setSpecialistEquipmentData]
    );

    // Structure handlers
    const handleStructureTotalChange = useCallback(
        (total) => {
            setStructureTotal(total);
        },
        [setStructureTotal]
    );

    const handleStructureIdChange = useCallback(
        (id) => {
            setStructureId(id);
        },
        [setStructureId]
    );

    const handleStructureSelectionDataChange = useCallback(
        (data) => {
            // Validate data
            if (!data || !Array.isArray(data)) {
                console.error(
                    "Area1Logic: Invalid selection data received:",
                    data
                );
                return;
            }

            // Normalize data format
            const validatedData = data.map((item) => ({
                type: item.type || "",
                item: item.item || "",
                grade: item.grade || "",
            }));

            setStructureSelectionData(validatedData);
        },
        [setStructureSelectionData]
    );

    const handleStructureDimensionsChange = useCallback(
        (dimensions) => {
            // Validate dimensions
            if (!dimensions) {
                console.error(
                    "Area1Logic: Invalid dimensions received:",
                    dimensions
                );
                return;
            }

            // Convert dimensions to numbers
            const validatedDimensions = {
                length:
                    dimensions.length !== undefined
                        ? Number(dimensions.length)
                        : null,
                width:
                    dimensions.width !== undefined
                        ? Number(dimensions.width)
                        : null,
                height:
                    dimensions.height !== undefined
                        ? Number(dimensions.height)
                        : null,
            };

            setStructureDimensions(validatedDimensions);
        },
        [setStructureDimensions]
    );

    const handleStructureCommentsChange = useCallback(
        (comments) => {
            setStructureComments(comments);
        },
        [setStructureComments]
    );

    // Canopy handlers
    const handleCanopyTotalChange = useCallback(
        (total) => {
            setCanopyTotal(total);
        },
        [setCanopyTotal]
    );

    const handleCanopyEntriesChange = useCallback(
        (entries) => {
            setCanopyEntries(entries);
        },
        [setCanopyEntries]
    );

    // Direct canopy comments handler with no intermediary processing
    const handleCanopyCommentsChange = useCallback(
        (updatedComments) => {
            setCanopyComments(updatedComments);
        },
        [setCanopyComments]
    );

    // Ventilation price handler
    const handleVentilationPriceChange = useCallback(
        (price) => {
            setVentilationPrice(price);
        },
        [setVentilationPrice]
    );

    // UI state handlers
    const handleSelectedGroupIdChange = useCallback(
        (newId) => {
            setSelectedGroupId(newId);
        },
        [setSelectedGroupId]
    );

    const handleVisibleSectionsChange = useCallback(
        (newSections) => {
            if (typeof setVisibleSections === "function") {
                setVisibleSections(newSections);
            }
        },
        [setVisibleSections]
    );

    // Simple Images handler - just forward changes to parent
    const handleImagesChange = useCallback(
        (newImages) => {
            setSurveyImages(newImages);
        },
        [setSurveyImages]
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
            <Toast ref={toast} />

            <div
                style={{
                    marginBottom: "3rem",
                    marginTop: "2rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                    position: "relative",
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
                            placeholder="Enter Area ID example: kitchen, survey, area 1."
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
                        initialComments={canopyComments}
                        onCommentsChange={handleCanopyCommentsChange}
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
                        initialSubcategoryComments={
                            equipment?.subcategoryComments || {}
                        }
                        onEquipmentChange={handleEquipmentChange}
                        areaIndex={1}
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
                        onAccessDoorPriceChange={(price) => {
                            // FIXED: Set price directly instead of accumulating
                            setAccessDoorPrice(price);
                        }}
                        onVentilationPriceChange={handleVentilationPriceChange}
                        onFanPartsPriceChange={(price) => {
                            setFanPartsPrice(price);
                        }}
                        onAirInExPriceChange={(price) => {
                            setAirInExTotal(price);
                        }}
                        onSchematicItemsTotalChange={(val) => {
                            setSchematicItemsTotal(val);
                        }}
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
                        cellSize={cellSize}
                        setGridSpaces={setGridSpaces}
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
                toggleAccordion={() => {
                    toggleAccordion("ventilation");
                }}
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
                        // Pass the comments directly from the survey data
                        initialCategoryComments={
                            initialSpecialistEquipmentSurvey?.categoryComments ||
                            {}
                        }
                        onEquipmentChange={handleEquipmentChange}
                        areaIndex={1}
                    />
                )}
            </div>

            <div style={{ marginBottom: "3rem" }} />

            {/* Access Requirements Accordion */}
            <AccessRequirementsAccordion
                access={access}
                setAccess={setAccess}
                isOpen={accordion.access}
                toggleAccordion={() => {
                    toggleAccordion("access");
                }}
            />

            <div style={{ marginBottom: "3rem" }} />

            <div
                style={{
                    marginBottom: "3rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                }}
            >
                {/* Images section */}
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
                            onImagesChange={handleImagesChange}
                            surveyRef={refValue || ""}
                            siteName={siteDetails?.siteName || ""}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
