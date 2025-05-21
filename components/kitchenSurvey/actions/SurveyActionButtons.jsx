// components/kitchenSurvey/actions/SurveyActionButtons.jsx
import React, { useState, useRef } from "react";
import { Toast } from "primereact/toast";
import SaveSurvey from "@/components/kitchenSurvey/save/SaveSurvey";
import AddNewArea from "@/components/kitchenSurvey/AddNewArea";
import PreviewPDFModal from "@/components/kitchenSurvey/quote/PreviewPDFModal";
import { Button } from "primereact/button";

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

    // Structure data - including both legacy and new fields
    structureId,
    structureTotal,
    structureSelectionData,
    structureDimensions,
    structureComments,
    // NEW: Add structureEntries as primary data storage
    structureEntries = [],

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
    const toast = useRef(null);
    // New state for controlling preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    // State to store schematic HTML for preview
    const [capturedSchematicHtml, setCapturedSchematicHtml] = useState(null);

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

    // Function to capture schematic HTML and show preview
    const handlePreviewClick = async () => {
        try {
            // Capture the schematic HTML if a ref is provided
            let schematicHtml = null;
            if (schematicRef && schematicRef.current) {
                // Get the HTML content
                schematicHtml = schematicRef.current.outerHTML;
                // Clean it up with DOMParser
                const parser = new DOMParser();
                const doc = parser.parseFromString(schematicHtml, "text/html");
                schematicHtml = doc.body.innerHTML;
            }

            // Store the schematic HTML
            setCapturedSchematicHtml(schematicHtml);

            // Show the preview modal
            setPreviewModalVisible(true);
        } catch (error) {
            console.error("Error preparing preview:", error);
            toast.current?.show({
                severity: "error",
                summary: "Preview Error",
                detail: "Could not generate preview",
                life: 3000,
            });
        }
    };

    // Create a complete surveyData object for AddNewArea and Preview
    const consolidatedSurveyData = {
        refValue,
        surveyDate,
        parking,
        siteDetails,
        structureId,
        structureTotal,
        // Include both legacy structure fields and the new entries array
        structureSelectionData,
        structureDimensions,
        structureComments,
        structureEntries, // NEW: Include structure entries array
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
        <>
            <Toast ref={toast} />

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
                        // console.log("New area will be added:", newAreaInfo);
                    }}
                />

                {/* PDF Button */}
                <Button
                    label="Preview PDF"
                    icon="pi pi-eye"
                    className="p-button-help"
                    onClick={handlePreviewClick}
                    tooltip="Preview PDF without saving"
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
                    structureEntries={structureEntries}
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

            {/* Preview PDF Modal */}
            <PreviewPDFModal
                visible={previewModalVisible}
                onHide={() => setPreviewModalVisible(false)}
                surveyData={consolidatedSurveyData}
                schematicHtml={capturedSchematicHtml}
            />
        </>
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

    // Force sync components function
    forceSyncComponents = () => true,
}) {
    const toast = useRef(null);
    // State for controlling preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    // State to store schematic HTML for preview
    const [capturedSchematicHtml, setCapturedSchematicHtml] = useState(null);

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

    // Function to capture schematic HTML and show preview
    const handlePreviewClick = async () => {
        try {
            // Force component state sync before preview if available
            if (typeof forceSyncComponents === "function") {
                forceSyncComponents();
            }

            // Capture the schematic HTML if a ref is provided
            let schematicHtml = null;
            if (schematicRef && schematicRef.current) {
                // Get the HTML content
                schematicHtml = schematicRef.current.outerHTML;
                // Clean it up with DOMParser
                const parser = new DOMParser();
                const doc = parser.parseFromString(schematicHtml, "text/html");
                schematicHtml = doc.body.innerHTML;
            }

            // Store the schematic HTML
            setCapturedSchematicHtml(schematicHtml);

            // Show the preview modal
            setPreviewModalVisible(true);
        } catch (error) {
            console.error("Error preparing preview:", error);
            toast.current?.show({
                severity: "error",
                summary: "Preview Error",
                detail: "Could not generate preview",
                life: 3000,
            });
        }
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
        structureEntries = [],
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
        <>
            <Toast ref={toast} />

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

                {/* Preview PDF Button */}
                <Button
                    label="Preview Quote"
                    className="p-button-help"
                    onClick={handlePreviewClick}
                    tooltip="Preview PDF without saving"
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
                    structureEntries={structureEntries}
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

            {/* Preview PDF Modal */}
            <PreviewPDFModal
                visible={previewModalVisible}
                onHide={() => setPreviewModalVisible(false)}
                surveyData={surveyData}
                schematicHtml={capturedSchematicHtml}
            />
        </>
    );
}
