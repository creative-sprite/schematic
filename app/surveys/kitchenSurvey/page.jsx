// app\surveys\kitchenSurvey\page.jsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import ExportPDF from "@/components/PDF/export";
import SurveyInfo from "@/components/kitchenSurvey/surveyInfo";
import Area1Logic from "@/components/kitchenSurvey/Area1Logic";
import DuplicationLogic from "@/components/kitchenSurvey/DuplicationLogic";
import SurveySteps from "@/components/kitchenSurvey/SurveySteps";

// Import pricing components
import PriceTables from "@/components/kitchenSurvey/pricing/PriceTables";
import GrandTotalSection from "@/components/kitchenSurvey/pricing/GrandTotalSection";
import {
    computeEquipmentTotal,
    computeGrandTotals,
} from "@/components/kitchenSurvey/pricing/PricingUtils";

// Import save component
import SaveSurvey from "@/components/kitchenSurvey/save/SaveSurvey";

// Import data loading hook
import useSurveyDataLoader from "@/components/kitchenSurvey/surveyDataLoading";

export default function SurveyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const surveyId = searchParams.get("id");
    const siteIdParam = searchParams.get("site");

    const toast = useRef(null);
    const contentRef = useRef(null);
    const mainAreaRef = useRef(null); // Reference for main area
    const schematicRef = useRef(null); // Reference for capturing schematic in quotes

    // ADDED: Track initialized state to prevent unnecessary updates
    const initializedRef = useRef(false);

    // ADDED: Refs to track update status and prevent circular updates for elements
    // that still need protection
    const updatingSurveyDataRef = useRef(false);
    const updatingSpecialistEquipmentRef = useRef(false);
    const updatingStructureTotalRef = useRef(false);
    const updatingCanopyTotalRef = useRef(false);
    // REMOVED updatingEquipmentRef - no longer needed
    const updatingAccessRef = useRef(false);
    const updatingVentilationRef = useRef(false);
    const updatingNotesRef = useRef(false);
    const updatingOperationsRef = useRef(false);

    // ADDED: Refs to store previous values for comparison
    const prevSurveyDataRef = useRef([]);
    const prevSpecialistEquipmentRef = useRef([]);
    const prevStructureTotalRef = useRef(0);
    const prevCanopyTotalRef = useRef(0);
    // REMOVED prevEquipmentRef - no longer needed
    const prevAccessRef = useRef({});
    const prevVentilationRef = useRef({});
    const prevNotesRef = useRef({});
    const prevOperationsRef = useRef({});
    const prevAreasStateRef = useRef([]);

    const [areaRefs, setAreaRefs] = useState([]); // References for duplicated areas

    // Load all survey data using our custom hook
    const {
        // Loading state
        isLoading,

        // Survey basic info
        surveyDate,
        setSurveyDate,
        refValue,
        setRefValue,

        // Get parking from the data loader
        parking,
        setParking,

        // Top-level survey images - standardized location only
        surveyImages,
        setSurveyImages,

        // Equipment data
        surveyData,
        setSurveyData,
        equipmentItems,

        // Specialist equipment
        specialistEquipmentData,
        setSpecialistEquipmentData,
        specialistEquipmentId,
        setSpecialistEquipmentId,
        // NEW: Get the initialSpecialistEquipmentSurvey object
        initialSpecialistEquipmentSurvey,

        // Structure data
        structureTotal,
        setStructureTotal,
        structureSelectionData,
        setStructureSelectionData,
        structureDimensions,
        setStructureDimensions,
        structureComments,
        setStructureComments,
        // Canopy data
        canopyTotal,
        setCanopyTotal,
        canopyEntries,
        setCanopyEntries,
        canopyComments,
        setCanopyComments,

        // Schematic costs
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
        selectedGroupId,
        setSelectedGroupId,

        // Site details
        siteDetails,
        setSiteDetails,

        // IDs for grouping
        structureId,
        setStructureId,
        equipmentId,
        setEquipmentId,
        canopyId,
        setCanopyId,

        // Price modification
        modify,
        setModify,

        // Schematic items
        schematicItemsTotal,
        setSchematicItemsTotal,

        // Schematic visual data
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

        // Areas
        areasState,
        setAreasState,
        areas,
        setAreas,

        // Form sections
        ventilation,
        setVentilation,
        access,
        setAccess,
        equipment,
        setEquipment,
        operations,
        setOperations,
        notes,
        setNotes,

        // Contacts
        contacts,
        setContacts,
        primaryContactIndex,
        setPrimaryContactIndex,
        walkAroundContactIndex,
        setWalkAroundContactIndex,
    } = useSurveyDataLoader(surveyId, siteIdParam, toast);

    // Debug the initialSpecialistEquipmentSurvey data to confirm we're getting it
    useEffect(() => {
        if (initialSpecialistEquipmentSurvey?.categoryComments) {
            console.log(
                "Page: Loaded specialist category comments:",
                Object.keys(initialSpecialistEquipmentSurvey.categoryComments)
                    .length,
                "items",
                JSON.stringify(
                    initialSpecialistEquipmentSurvey.categoryComments
                )
            );
        }
    }, [initialSpecialistEquipmentSurvey]);

    // Create area refs whenever the areas array changes
    React.useEffect(() => {
        // Create refs for each area
        setAreaRefs(areas.map(() => React.createRef()));
    }, [areas.length]);

    // ADDED: Initialize tracking refs after data is loaded
    useEffect(() => {
        if (!initializedRef.current && !isLoading) {
            // Initialize refs with initial data for comparison
            prevSurveyDataRef.current = [...surveyData];
            prevSpecialistEquipmentRef.current = [...specialistEquipmentData];
            prevStructureTotalRef.current = structureTotal;
            prevCanopyTotalRef.current = canopyTotal;
            prevAccessRef.current = access ? { ...access } : {};
            prevVentilationRef.current = ventilation ? { ...ventilation } : {};
            prevNotesRef.current = notes ? { ...notes } : {};
            prevOperationsRef.current = operations ? { ...operations } : {};
            prevAreasStateRef.current = [...areasState];

            initializedRef.current = true;
        }
    }, [
        isLoading,
        surveyData,
        specialistEquipmentData,
        structureTotal,
        canopyTotal,
        access,
        ventilation,
        notes,
        operations,
        areasState,
    ]);

    // Toggle accordion sections
    const [accordion, setAccordion] = useState({
        access: false,
        ventilation: false,
    });

    const toggleAccordion = (section) => {
        setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Visible sections state
    const [visibleSections, setVisibleSections] = useState([
        "structure",
        "equipment",
        "canopy",
        "schematic",
        "specialistEquipment",
        "images",
    ]);

    // ADDED: Safe handlers with circular update protection

    // Safe setter for surveyData
    const handleSurveyDataChange = (newData) => {
        // Skip if already updating
        if (updatingSurveyDataRef.current) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSurveyDataRef.current);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingSurveyDataRef.current = true;

        // Update reference
        prevSurveyDataRef.current = JSON.parse(newDataStr);

        // Update state
        setSurveyData(newData);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingSurveyDataRef.current = false;
        }, 0);
    };

    // Safe setter for specialist equipment data
    const handleSpecialistEquipmentDataChange = (newData) => {
        // Skip if already updating
        if (updatingSpecialistEquipmentRef.current) {
            return;
        }

        // Skip if no actual change
        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSpecialistEquipmentRef.current);
        if (newDataStr === prevDataStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingSpecialistEquipmentRef.current = true;

        // Update reference
        prevSpecialistEquipmentRef.current = JSON.parse(newDataStr);

        // Update state
        setSpecialistEquipmentData(newData);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingSpecialistEquipmentRef.current = false;
        }, 0);
    };

    // Safe setter for structure total
    const handleStructureTotalChange = (total) => {
        // Skip if already updating
        if (updatingStructureTotalRef.current) {
            return;
        }

        // Skip if no actual change
        if (total === prevStructureTotalRef.current) {
            return;
        }

        // Set flag to prevent circular updates
        updatingStructureTotalRef.current = true;

        // Update reference
        prevStructureTotalRef.current = total;

        // Update state
        setStructureTotal(total);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingStructureTotalRef.current = false;
        }, 0);
    };

    // Safe setter for canopy total
    const handleCanopyTotalChange = (total) => {
        // Skip if already updating
        if (updatingCanopyTotalRef.current) {
            return;
        }

        // Skip if no actual change
        if (total === prevCanopyTotalRef.current) {
            return;
        }

        // Set flag to prevent circular updates
        updatingCanopyTotalRef.current = true;

        // Update reference
        prevCanopyTotalRef.current = total;

        // Update state
        setCanopyTotal(total);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingCanopyTotalRef.current = false;
        }, 0);
    };

    // SIMPLIFIED: Direct canopy comments handler with no circular update protection
    const handleCanopyCommentsChange = (comments) => {
        // Simply update the state directly - no circular protection needed
        setCanopyComments(comments);
    };

    // IMPROVED: Equipment change handler with special handling for categoryComments
    const handleEquipmentChange = (newEquipment) => {
        console.log(
            "Page: Received equipment update:",
            Object.keys(newEquipment).join(", ")
        );

        // Direct state update that preserves all fields
        setEquipment((prev) => {
            // Create a new object to avoid mutation
            const updatedEquipment = { ...prev };

            // Copy all properties from newEquipment to updatedEquipment
            Object.keys(newEquipment).forEach((key) => {
                updatedEquipment[key] = newEquipment[key];
            });

            // Special handling for subcategoryComments
            if (newEquipment.subcategoryComments) {
                console.log(
                    "Page: Updating subcategoryComments with",
                    Object.keys(newEquipment.subcategoryComments).length,
                    "entries"
                );
                updatedEquipment.subcategoryComments =
                    newEquipment.subcategoryComments;
            }

            // Special handling for categoryComments
            if (newEquipment.categoryComments) {
                console.log(
                    "Page: Updating categoryComments with",
                    Object.keys(newEquipment.categoryComments).length,
                    "entries"
                );
                updatedEquipment.categoryComments =
                    newEquipment.categoryComments;
            }

            return updatedEquipment;
        });
    };

    // Safe setter for areas state
    const handleAreasStateChange = (newState) => {
        // Skip if no actual change
        const newStateStr = JSON.stringify(newState);
        const prevStateStr = JSON.stringify(prevAreasStateRef.current);
        if (newStateStr === prevStateStr) {
            return;
        }

        // Update reference
        prevAreasStateRef.current = JSON.parse(newStateStr);

        // Update state
        setAreasState(newState);
    };

    // Compute equipment total from main area's surveyData
    const computedEquipmentTotal = () => {
        return computeEquipmentTotal(surveyData, equipmentItems);
    };

    // Function to compute grand totals from main area and all duplicated areas
    const computedGrandTotals = () => {
        // Create object with main area totals
        const mainTotals = {
            structureTotal: structureTotal,
            equipmentTotal: computedEquipmentTotal(),
            canopyTotal: canopyTotal,
            accessDoorPrice: accessDoorPrice,
            ventilationPrice: ventilationPrice,
            airPrice: airPrice,
            fanPartsPrice: fanPartsPrice,
            airInExTotal: airInExTotal,
            schematicItemsTotal: schematicItemsTotal,
        };

        // Use utility function to compute combined totals
        return computeGrandTotals(mainTotals, areasState);
    };

    // Handle ventilation price change
    const handleVentilationPriceChange = (price) => {
        console.log(`Main page: Setting ventilation price to ${price}`);
        setVentilationPrice(price);
    };

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <ProgressSpinner style={{ width: "50px", height: "50px" }} />
                <div style={{ marginLeft: "1rem" }}>Loading survey data...</div>
            </div>
        );
    }

    return (
        <div className="survey-container">
            <Toast ref={toast} />
            {/* Survey Steps Navigation */}
            <SurveySteps
                areas={areasState}
                mainAreaRef={mainAreaRef}
                areaRefs={areaRefs}
            />
            {/* Use a single contentRef to wrap ALL content for the PDF, including price tables */}
            <div ref={contentRef}>
                <SurveyInfo
                    initialSiteDetails={siteDetails}
                    initialContacts={contacts}
                    initialPrimaryContactIndex={primaryContactIndex}
                    initialWalkAroundContactIndex={walkAroundContactIndex}
                    initialRefValue={refValue} // Pass the refValue directly
                    initialSurveyDate={surveyDate}
                    initialParking={parking} // Pass parking to SurveyInfo
                    initialOperations={operations} // Pass operations for initialization
                    initialEquipment={equipment} // Pass equipment for initialization
                    initialNotes={notes} // Pass notes for initialization
                    onRefValueChange={(value) => {
                        // Only update if we're not in edit mode or if the value has changed
                        if (value !== refValue) {
                            setRefValue(value);
                        }
                    }}
                    onSurveyDateChange={setSurveyDate}
                    onParkingChange={setParking} // Add parking change handler
                    onContactsChange={setContacts}
                    onPrimaryContactChange={setPrimaryContactIndex}
                    onWalkAroundContactChange={setWalkAroundContactIndex}
                    onSiteDetailsChange={setSiteDetails}
                    onOperationsChange={(newOps) => {
                        // Skip if already updating
                        if (updatingOperationsRef.current) {
                            return;
                        }

                        // Skip if no actual change
                        const newOpsStr = JSON.stringify(newOps);
                        const prevOpsStr = JSON.stringify(
                            prevOperationsRef.current
                        );
                        if (newOpsStr === prevOpsStr) {
                            return;
                        }

                        // Set flag to prevent circular updates
                        updatingOperationsRef.current = true;

                        // Update reference
                        prevOperationsRef.current = JSON.parse(newOpsStr);

                        // Update state
                        setOperations(newOps);

                        // Reset flag after a short delay
                        setTimeout(() => {
                            updatingOperationsRef.current = false;
                        }, 0);
                    }}
                    onEquipmentChange={handleEquipmentChange}
                    onNotesChange={(newNotes) => {
                        // Skip if already updating
                        if (updatingNotesRef.current) {
                            return;
                        }

                        // Skip if no actual change
                        const newNotesStr = JSON.stringify(newNotes);
                        const prevNotesStr = JSON.stringify(
                            prevNotesRef.current
                        );
                        if (newNotesStr === prevNotesStr) {
                            return;
                        }

                        // Set flag to prevent circular updates
                        updatingNotesRef.current = true;

                        // Update reference
                        prevNotesRef.current = JSON.parse(newNotesStr);

                        // Update state
                        setNotes(newNotes);

                        // Reset flag after a short delay
                        setTimeout(() => {
                            updatingNotesRef.current = false;
                        }, 0);
                    }}
                    isEditingMode={!!surveyId} // Pass whether we're in edit mode
                />

                {/* Area 1 Component */}
                <div ref={mainAreaRef}>
                    {" "}
                    {/* Added ref for main area */}
                    <div ref={schematicRef}>
                        <Area1Logic
                            visibleSections={visibleSections}
                            setVisibleSections={setVisibleSections}
                            structureTotal={structureTotal}
                            setStructureTotal={handleStructureTotalChange}
                            structureId={structureId}
                            setStructureId={setStructureId}
                            structureSelectionData={structureSelectionData}
                            setStructureSelectionData={
                                setStructureSelectionData
                            }
                            structureDimensions={structureDimensions}
                            setStructureDimensions={setStructureDimensions}
                            structureComments={structureComments}
                            setStructureComments={setStructureComments}
                            surveyData={surveyData}
                            setSurveyData={handleSurveyDataChange}
                            equipmentId={equipmentId}
                            setEquipmentId={setEquipmentId}
                            canopyTotal={canopyTotal}
                            setCanopyTotal={handleCanopyTotalChange}
                            canopyId={canopyId}
                            setCanopyId={setCanopyId}
                            canopyEntries={canopyEntries}
                            setCanopyEntries={setCanopyEntries}
                            canopyComments={canopyComments}
                            setCanopyComments={handleCanopyCommentsChange}
                            specialistEquipmentData={specialistEquipmentData}
                            setSpecialistEquipmentData={
                                handleSpecialistEquipmentDataChange
                            }
                            specialistEquipmentId={specialistEquipmentId}
                            setSpecialistEquipmentId={setSpecialistEquipmentId}
                            selectedGroupId={selectedGroupId}
                            setSelectedGroupId={setSelectedGroupId}
                            accessDoorPrice={accessDoorPrice}
                            setAccessDoorPrice={setAccessDoorPrice}
                            ventilationPrice={ventilationPrice}
                            setVentilationPrice={handleVentilationPriceChange}
                            airPrice={airPrice}
                            setAirPrice={setAirPrice}
                            fanPartsPrice={fanPartsPrice}
                            setFanPartsPrice={setFanPartsPrice}
                            airInExTotal={airInExTotal}
                            setAirInExTotal={setAirInExTotal}
                            schematicItemsTotal={schematicItemsTotal}
                            setSchematicItemsTotal={setSchematicItemsTotal}
                            ventilation={ventilation}
                            setVentilation={(newVent) => {
                                // Skip if already updating
                                if (updatingVentilationRef.current) {
                                    return;
                                }

                                // Skip if no actual change
                                const newVentStr = JSON.stringify(newVent);
                                const prevVentStr = JSON.stringify(
                                    prevVentilationRef.current
                                );
                                if (newVentStr === prevVentStr) {
                                    return;
                                }

                                // Set flag to prevent circular updates
                                updatingVentilationRef.current = true;

                                // Update reference
                                prevVentilationRef.current =
                                    JSON.parse(newVentStr);

                                // Update state
                                setVentilation(newVent);

                                // Reset flag after a short delay
                                setTimeout(() => {
                                    updatingVentilationRef.current = false;
                                }, 0);
                            }}
                            access={access}
                            setAccess={(newAccess) => {
                                // Skip if already updating
                                if (updatingAccessRef.current) {
                                    return;
                                }

                                // Skip if no actual change
                                const newAccessStr = JSON.stringify(newAccess);
                                const prevAccessStr = JSON.stringify(
                                    prevAccessRef.current
                                );
                                if (newAccessStr === prevAccessStr) {
                                    return;
                                }

                                // Set flag to prevent circular updates
                                updatingAccessRef.current = true;

                                // Update reference
                                prevAccessRef.current =
                                    JSON.parse(newAccessStr);

                                // Update state
                                setAccess(newAccess);

                                // Reset flag after a short delay
                                setTimeout(() => {
                                    updatingAccessRef.current = false;
                                }, 0);
                            }}
                            accordion={accordion}
                            toggleAccordion={toggleAccordion}
                            equipment={equipment}
                            setEquipment={handleEquipmentChange}
                            operations={operations}
                            setOperations={setOperations}
                            notes={notes}
                            setNotes={setNotes}
                            // Pass schematic visual data to Area1Logic
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
                            // Pass survey images explicitly from standardized location
                            surveyImages={surveyImages}
                            setSurveyImages={(images) => {
                                // Skip if no actual change
                                const imagesStr = JSON.stringify(images);
                                const currImagesStr =
                                    JSON.stringify(surveyImages);
                                if (imagesStr !== currImagesStr) {
                                    setSurveyImages(images);
                                }
                            }}
                            // Pass site details and reference for proper image organization
                            siteDetails={siteDetails}
                            refValue={refValue}
                            // IMPROVED: Pass the comments directly from specialistEquipmentSurvey
                            initialSpecialistEquipmentSurvey={
                                initialSpecialistEquipmentSurvey
                            }
                        />
                    </div>
                </div>

                {/* Duplicated Areas Component with refs passed to it */}
                <DuplicationLogic
                    areas={areas}
                    setAreas={setAreas}
                    areasState={areasState}
                    setAreasState={handleAreasStateChange}
                    equipmentItems={equipmentItems}
                    initialAreas={surveyId ? areasState : []}
                    areaRefs={areaRefs}
                />

                {/* IMPORTANT: Include price tables in the contentRef so they appear in the quote PDF */}
                {/* PriceTables for the main area (Area 1) */}
                <PriceTables
                    structureTotal={structureTotal}
                    structureId={structureId}
                    equipmentTotal={computedEquipmentTotal()}
                    equipmentId={equipmentId}
                    canopyTotal={canopyTotal}
                    canopyId={canopyId}
                    accessDoorPrice={accessDoorPrice}
                    ventilationPrice={ventilationPrice}
                    airPrice={airPrice}
                    fanPartsPrice={fanPartsPrice}
                    airInExTotal={airInExTotal}
                    modify={modify}
                    setModify={setModify}
                    groupingId={selectedGroupId}
                    schematicItemsTotal={schematicItemsTotal}
                    specialistEquipmentData={specialistEquipmentData}
                    areaLabel={structureId}
                />

                {/* PriceTables for duplicated areas, each with its own totals */}
                {areasState.map((areaTotals, index) => (
                    <div key={index}>
                        <PriceTables
                            structureTotal={areaTotals.structureTotal || 0}
                            structureId={
                                areaTotals.structure?.structureId || ""
                            }
                            equipmentTotal={areaTotals.equipmentTotal || 0}
                            equipmentId={""}
                            canopyTotal={areaTotals.canopyTotal || 0}
                            canopyId={""}
                            accessDoorPrice={areaTotals.accessDoorPrice || 0}
                            ventilationPrice={areaTotals.ventilationPrice || 0}
                            airPrice={areaTotals.airPrice || 0}
                            fanPartsPrice={areaTotals.fanPartsPrice || 0}
                            airInExTotal={areaTotals.airInExTotal || 0}
                            modify={modify}
                            setModify={setModify}
                            groupingId={areaTotals.groupingId || ""}
                            schematicItemsTotal={
                                areaTotals.schematicItemsTotal || 0
                            }
                            specialistEquipmentData={
                                areaTotals.specialistEquipmentData || []
                            }
                            areaLabel={`Area ${index + 2}`}
                        />
                    </div>
                ))}

                {/* Grand Total Section - now included in the contentRef */}
                <GrandTotalSection
                    structureTotal={structureTotal}
                    structureId={structureId}
                    computedEquipmentTotal={computedEquipmentTotal()}
                    canopyTotal={canopyTotal}
                    accessDoorPrice={accessDoorPrice}
                    ventilationPrice={ventilationPrice}
                    airPrice={airPrice}
                    fanPartsPrice={fanPartsPrice}
                    airInExTotal={airInExTotal}
                    schematicItemsTotal={schematicItemsTotal}
                    areasState={areasState}
                    modify={modify}
                    specialistEquipmentData={specialistEquipmentData}
                />
            </div>
            {/* Properly close the contentRef div */}

            {/* Save Survey Component - outside contentRef */}
            <div>
                <SaveSurvey
                    targetRef={contentRef}
                    schematicRef={schematicRef}
                    surveyId={surveyId}
                    refValue={refValue}
                    surveyDate={surveyDate}
                    parking={parking} // Dedicated parking prop
                    siteDetails={siteDetails}
                    contacts={contacts}
                    primaryContactIndex={primaryContactIndex}
                    walkAroundContactIndex={walkAroundContactIndex}
                    structureId={structureId}
                    structureTotal={structureTotal}
                    structureSelectionData={structureSelectionData}
                    structureDimensions={structureDimensions}
                    structureComments={structureComments}
                    surveyData={surveyData}
                    equipmentItems={equipmentItems}
                    specialistEquipmentData={specialistEquipmentData}
                    canopyTotal={canopyTotal}
                    canopyEntries={canopyEntries}
                    canopyComments={canopyComments} // Add canopyComments here
                    accessDoorPrice={accessDoorPrice}
                    ventilationPrice={ventilationPrice}
                    airPrice={airPrice}
                    fanPartsPrice={fanPartsPrice}
                    airInExTotal={airInExTotal}
                    schematicItemsTotal={schematicItemsTotal}
                    selectedGroupId={selectedGroupId}
                    operations={operations}
                    access={access}
                    equipment={equipment}
                    notes={notes}
                    ventilation={ventilation}
                    areasState={areasState}
                    modify={modify}
                    // Pass survey images from standardized location only
                    surveyImages={surveyImages}
                    // Pass schematic data from children components
                    placedItems={placedItems}
                    specialItems={specialItems}
                    gridSpaces={gridSpaces}
                    cellSize={cellSize}
                    flexiDuctSelections={flexiDuctSelections}
                    accessDoorSelections={accessDoorSelections}
                    groupDimensions={groupDimensions}
                    fanGradeSelections={fanGradeSelections}
                />
            </div>
            <div style={{ marginTop: "1rem" }}>
                <ExportPDF
                    targetRef={contentRef}
                    fileName="kitchen_survey.pdf"
                    buttonText="Save as PDF"
                />
            </div>
        </div>
    );
}
