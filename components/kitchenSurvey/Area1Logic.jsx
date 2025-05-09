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

    // ADDED: Refs to track state updates and prevent circular updates
    const isHandlingSurveyDataUpdateRef = useRef(false);
    const isHandlingEquipmentUpdateRef = useRef(false);
    const isHandlingStructureUpdateRef = useRef(false);
    const isHandlingCanopyUpdateRef = useRef(false);
    const isHandlingSpecialistEquipmentUpdateRef = useRef(false);

    // ADDED: Refs to store previous values for deep comparison
    const prevSurveyDataRef = useRef([]);
    const prevEquipmentRef = useRef({});
    const prevStructureRef = useRef({});
    const prevCanopyRef = useRef([]);
    const prevSpecialistEquipmentRef = useRef([]);

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
            setInitialDataLoaded(true);

            // Initialize tracking refs with current data
            prevSurveyDataRef.current = [...surveyData];
            prevEquipmentRef.current = equipment ? { ...equipment } : {};
            prevStructureRef.current = {
                structureId,
                structureTotal,
                structureSelectionData,
                structureDimensions,
                structureComments,
            };
            prevCanopyRef.current = canopyEntries ? [...canopyEntries] : [];
            prevSpecialistEquipmentRef.current = specialistEquipmentData
                ? [...specialistEquipmentData]
                : [];
        }
    }, [
        structureId,
        structureTotal,
        surveyData,
        ventilation,
        access,
        initialDataLoaded,
        equipment,
        canopyEntries,
        specialistEquipmentData,
        structureSelectionData,
        structureDimensions,
        structureComments,
    ]);

    // ADDED: Safe handler for survey data changes
    const handleSurveyDataChange = (newData) => {
        // Skip if already handling an update
        if (isHandlingSurveyDataUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSurveyDataRef.current);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingSurveyDataUpdateRef.current = true;

        // Update reference
        prevSurveyDataRef.current = JSON.parse(newDataStr);

        // Update state
        setSurveyData(newData);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingSurveyDataUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for equipment changes
    const handleEquipmentChange = (newEquipment) => {
        // Skip if already handling an update
        if (isHandlingEquipmentUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newEquipStr = JSON.stringify(newEquipment);
        const prevEquipStr = JSON.stringify(prevEquipmentRef.current);
        if (newEquipStr === prevEquipStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingEquipmentUpdateRef.current = true;

        // Update reference
        prevEquipmentRef.current = JSON.parse(newEquipStr);

        // Update state
        setEquipment(newEquipment);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingEquipmentUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for specialist equipment changes
    const handleSpecialistEquipmentChange = (newData) => {
        // Skip if already handling an update
        if (isHandlingSpecialistEquipmentUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSpecialistEquipmentRef.current);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingSpecialistEquipmentUpdateRef.current = true;

        // Update reference
        prevSpecialistEquipmentRef.current = JSON.parse(newDataStr);

        // Update state
        setSpecialistEquipmentData(newData);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingSpecialistEquipmentUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for structure total changes
    const handleStructureTotalChange = (total) => {
        // Skip if already handling an update
        if (isHandlingStructureUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        if (total === prevStructureRef.current.structureTotal) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingStructureUpdateRef.current = true;

        // Update reference
        prevStructureRef.current.structureTotal = total;

        // Update state
        setStructureTotal(total);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingStructureUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for structure ID changes
    const handleStructureIdChange = (id) => {
        // Skip if already handling an update
        if (isHandlingStructureUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        if (id === prevStructureRef.current.structureId) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingStructureUpdateRef.current = true;

        // Update reference
        prevStructureRef.current.structureId = id;

        // Update state
        setStructureId(id);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingStructureUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for structure selection data changes
    const handleStructureSelectionDataChange = (data) => {
        // Skip if already handling an update
        if (isHandlingStructureUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(data);
        const prevDataStr = JSON.stringify(
            prevStructureRef.current.structureSelectionData
        );
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingStructureUpdateRef.current = true;

        // Update reference
        prevStructureRef.current.structureSelectionData =
            JSON.parse(newDataStr);

        // Update state
        setStructureSelectionData(data);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingStructureUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for structure dimensions changes
    const handleStructureDimensionsChange = (dimensions) => {
        // Skip if already handling an update
        if (isHandlingStructureUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newDimensionsStr = JSON.stringify(dimensions);
        const prevDimensionsStr = JSON.stringify(
            prevStructureRef.current.structureDimensions
        );
        if (newDimensionsStr === prevDimensionsStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingStructureUpdateRef.current = true;

        // Update reference
        prevStructureRef.current.structureDimensions =
            JSON.parse(newDimensionsStr);

        // Update state
        setStructureDimensions(dimensions);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingStructureUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for structure comments changes
    const handleStructureCommentsChange = (comments) => {
        // Skip if already handling an update
        if (isHandlingStructureUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newCommentsStr = JSON.stringify(comments);
        const prevCommentsStr = JSON.stringify(
            prevStructureRef.current.structureComments
        );
        if (newCommentsStr === prevCommentsStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingStructureUpdateRef.current = true;

        // Update reference
        prevStructureRef.current.structureComments = JSON.parse(newCommentsStr);

        // Update state
        setStructureComments(comments);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingStructureUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for canopy total changes
    const handleCanopyTotalChange = (total) => {
        // Skip if already handling an update
        if (isHandlingCanopyUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        if (prevCanopyRef.current.canopyTotal === total) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingCanopyUpdateRef.current = true;

        // Update reference
        prevCanopyRef.current.canopyTotal = total;

        // Update state
        setCanopyTotal(total);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingCanopyUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for canopy entries changes
    const handleCanopyEntriesChange = (entries) => {
        // Skip if already handling an update
        if (isHandlingCanopyUpdateRef.current) {
            return;
        }

        // Skip if no actual change
        const newEntriesStr = JSON.stringify(entries);
        const prevEntriesStr = JSON.stringify(prevCanopyRef.current);
        if (newEntriesStr === prevEntriesStr) {
            return;
        }

        // Set flag to prevent circular updates
        isHandlingCanopyUpdateRef.current = true;

        // Update reference
        prevCanopyRef.current = JSON.parse(newEntriesStr);

        // Update state
        setCanopyEntries(entries);

        // Reset flag after a short delay
        setTimeout(() => {
            isHandlingCanopyUpdateRef.current = false;
        }, 0);
    };

    // ADDED: Handle notes updates with protection
    const handleNotesUpdate = (newNotes) => {
        if (newNotes === notes) return;
        setNotes(newNotes);
    };

    // Handler for ventilation price changes from Flexi-Duct/Flexi Hose items
    const handleVentilationPriceChange = (price) => {
        setVentilationPrice(price);
    };

    // ADDED: Safe handler for visible sections change
    const handleVisibleSectionsChange = (newSections) => {
        if (JSON.stringify(newSections) === JSON.stringify(visibleSections)) {
            return;
        }
        setVisibleSections(newSections);
    };

    // ADDED: Safe handler for selected group ID
    const handleSelectedGroupIdChange = (newId) => {
        if (newId === selectedGroupId) {
            return;
        }
        setSelectedGroupId(newId);
    };

    return (
        <>
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
                    <InputText
                        placeholder="Enter Area ID"
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
                            // Update equipment with new notes - with protection
                            if (typeof handleEquipmentChange === "function") {
                                handleEquipmentChange({
                                    ...equipment,
                                    notes: notes,
                                });
                            }
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
                        initialNotes={equipment?.notes || ""}
                        initialCategoryComments={
                            equipment?.categoryComments || {}
                        }
                        onNotesChange={(notes) => {
                            // Update equipment with new notes - with protection
                            if (typeof handleEquipmentChange === "function") {
                                handleEquipmentChange({
                                    ...equipment,
                                    notes: notes,
                                });
                            }
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
