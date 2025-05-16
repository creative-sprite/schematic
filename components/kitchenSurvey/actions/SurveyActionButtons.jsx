// components/kitchenSurvey/actions/SurveyActionButtons.jsx
import React from "react";
import SaveSurvey from "@/components/kitchenSurvey/save/SaveSurvey";
import AddNewArea from "@/components/kitchenSurvey/AddNewArea";

export default function SurveyActionButtons({
    // Refs
    contentRef,
    schematicRef,

    // Survey and site info
    surveyId,
    refValue,
    surveyDate,
    parking,
    siteDetails,

    // Contacts
    contacts,
    primaryContactIndex,
    walkAroundContactIndex,

    // Structure data
    structureId,
    structureTotal,
    structureSelectionData,
    structureDimensions,
    structureComments,

    // Equipment data
    surveyData,
    equipmentItems,
    specialistEquipmentData,

    // Canopy data
    canopyTotal,
    canopyEntries,
    canopyComments,

    // Pricing data
    accessDoorPrice,
    ventilationPrice,
    airPrice,
    fanPartsPrice,
    airInExTotal,
    schematicItemsTotal,
    selectedGroupId,
    modify,

    // Form sections data
    operations,
    access,
    equipment,
    notes,
    ventilation,

    // Images and visual data
    surveyImages,

    // Schematic visual data
    placedItems,
    specialItems,
    gridSpaces,
    cellSize,
    flexiDuctSelections,
    accessDoorSelections,
    groupDimensions,
    fanGradeSelections,

    // Collection data
    collectionId,
    areaIndex,
    totalAreas,

    // Creation callback
    createSurveyIfNeeded,

    // Position options
    fixedPosition = true,
}) {
    // Container style based on position preference
    const containerStyle = {
        display: "flex",
        gap: "1rem",
        ...(fixedPosition
            ? {
                  position: "fixed",
                  bottom: "1rem",
                  right: "1rem",
                  zIndex: 1000,
              }
            : {
                  justifyContent: "flex-end",
                  margin: "1rem 0",
              }),
    };

    // Create a complete surveyData object for AddNewArea
    const consolidatedSurveyData = {
        refValue,
        surveyDate,
        parking,
        siteDetails,
        structureId,
        structureTotal,
        structureSelectionData,
        structureDimensions,
        structureComments,
        surveyData: surveyData || [],
        equipmentItems,
        specialistEquipmentData,
        canopyTotal,
        canopyEntries,
        canopyComments,
        accessDoorPrice,
        ventilationPrice,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        schematicItemsTotal,
        selectedGroupId,
        modify,
        operations,
        access,
        equipment,
        notes,
        ventilation,
        surveyImages,
        placedItems,
        specialItems,
        gridSpaces,
        cellSize,
        flexiDuctSelections,
        accessDoorSelections,
        groupDimensions,
        fanGradeSelections,
    };

    return (
        <div style={containerStyle}>
            {/* Add New Area button - Pass consolidated data */}
            <AddNewArea
                surveyId={surveyId}
                surveyData={consolidatedSurveyData}
                refValue={refValue}
                structureId={structureId}
                siteDetails={siteDetails}
                collectionId={collectionId}
                operations={operations}
                access={access}
                equipment={equipment}
                notes={notes}
                ventilation={ventilation}
                surveyDate={surveyDate}
                contacts={contacts}
                primaryContactIndex={primaryContactIndex}
                walkAroundContactIndex={walkAroundContactIndex}
                parking={parking}
                onAreaAdded={(newAreaInfo) => {
                    console.log("New area will be added:", newAreaInfo);
                    // Don't update state here - will be handled after navigation
                }}
            />

            {/* Save Survey button */}
            <SaveSurvey
                targetRef={contentRef}
                schematicRef={schematicRef}
                surveyId={surveyId}
                refValue={refValue}
                surveyDate={surveyDate}
                parking={parking}
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
                canopyComments={canopyComments}
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
                childAreas={[]} // Empty array since we're removing child areas
                modify={modify}
                surveyImages={surveyImages}
                placedItems={placedItems}
                specialItems={specialItems}
                gridSpaces={gridSpaces}
                cellSize={cellSize}
                flexiDuctSelections={flexiDuctSelections}
                accessDoorSelections={accessDoorSelections}
                groupDimensions={groupDimensions}
                fanGradeSelections={fanGradeSelections}
                createSurveyIfNeeded={
                    !surveyId &&
                    siteDetails &&
                    (siteDetails._id || siteDetails.id)
                        ? createSurveyIfNeeded
                        : null
                }
                collectionId={collectionId}
                areaIndex={areaIndex}
                totalAreas={totalAreas}
            />
        </div>
    );
}

// Alternative implementation with consolidated props
export function SurveyActionButtonsConsolidated({
    // Refs
    contentRef,
    schematicRef,

    // All survey data in one object
    surveyData,

    // Internal survey ID
    internalSurveyId,

    // Pagination data
    areasPagination,

    // Creation callback
    createSurveyIfNeeded,

    // Position options
    fixedPosition = true,
}) {
    const containerStyle = {
        display: "flex",
        gap: "1rem",
        ...(fixedPosition
            ? {
                  position: "fixed",
                  bottom: "1rem",
                  right: "1rem",
                  zIndex: 1000,
              }
            : {
                  justifyContent: "flex-end",
                  margin: "1rem 0",
              }),
    };

    // Extract all the necessary properties from surveyData
    const {
        refValue,
        surveyDate,
        parking,
        siteDetails,
        contacts,
        primaryContactIndex,
        walkAroundContactIndex,
        structureId,
        structureTotal,
        structureSelectionData,
        structureDimensions,
        structureComments,
        surveyData: equipmentSurveyData,
        equipmentItems,
        specialistEquipmentData,
        canopyTotal,
        canopyEntries,
        canopyComments,
        accessDoorPrice,
        ventilationPrice,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        schematicItemsTotal,
        selectedGroupId,
        operations,
        access,
        equipment,
        notes,
        ventilation,
        surveyImages,
        placedItems,
        specialItems,
        gridSpaces,
        cellSize,
        flexiDuctSelections,
        accessDoorSelections,
        groupDimensions,
        fanGradeSelections,
        modify,
    } = surveyData;

    return (
        <div style={containerStyle}>
            {/* Add New Area button - Pass the entire surveyData object */}
            <AddNewArea
                surveyId={internalSurveyId}
                surveyData={surveyData} // Pass the full consolidated data
                refValue={refValue}
                structureId={structureId}
                siteDetails={siteDetails}
                collectionId={areasPagination.collectionId}
                operations={operations}
                access={access}
                equipment={equipment}
                notes={notes}
                ventilation={ventilation}
                surveyDate={surveyDate}
                contacts={contacts}
                primaryContactIndex={primaryContactIndex}
                walkAroundContactIndex={walkAroundContactIndex}
                parking={parking}
                onAreaAdded={(newAreaInfo) => {
                    console.log("New area will be added:", newAreaInfo);
                }}
            />

            {/* Save Survey button */}
            <SaveSurvey
                targetRef={contentRef}
                schematicRef={schematicRef}
                surveyId={internalSurveyId}
                refValue={refValue}
                surveyDate={surveyDate}
                parking={parking}
                siteDetails={siteDetails}
                contacts={contacts}
                primaryContactIndex={primaryContactIndex}
                walkAroundContactIndex={walkAroundContactIndex}
                structureId={structureId}
                structureTotal={structureTotal}
                structureSelectionData={structureSelectionData}
                structureDimensions={structureDimensions}
                structureComments={structureComments}
                surveyData={equipmentSurveyData}
                equipmentItems={equipmentItems}
                specialistEquipmentData={specialistEquipmentData}
                canopyTotal={canopyTotal}
                canopyEntries={canopyEntries}
                canopyComments={canopyComments}
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
                childAreas={[]}
                modify={modify}
                surveyImages={surveyImages}
                placedItems={placedItems}
                specialItems={specialItems}
                gridSpaces={gridSpaces}
                cellSize={cellSize}
                flexiDuctSelections={flexiDuctSelections}
                accessDoorSelections={accessDoorSelections}
                groupDimensions={groupDimensions}
                fanGradeSelections={fanGradeSelections}
                createSurveyIfNeeded={
                    !internalSurveyId &&
                    siteDetails &&
                    (siteDetails._id || siteDetails.id)
                        ? createSurveyIfNeeded
                        : null
                }
                collectionId={areasPagination.collectionId}
                areaIndex={areasPagination.currentIndex}
                totalAreas={areasPagination.totalAreas}
            />
        </div>
    );
}
