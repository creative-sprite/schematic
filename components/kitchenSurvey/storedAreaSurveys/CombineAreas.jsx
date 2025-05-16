// components/kitchenSurvey/storedAreaSurveys/CombineAreas.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useRouter } from "next/navigation";
import {
    generateNewCollectionRef,
    generateUniqueId,
} from "../collection/collectionID";

/**
 * Component to enable combining multiple areas into a new survey
 */
export default function CombineAreas({
    siteId,
    collections = [],
    onToggleSelectionMode = () => {},
}) {
    const router = useRouter();
    const toast = useRef(null);

    // State for tracking component status
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAreas, setSelectedAreas] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [newSurveyName, setNewSurveyName] = useState("");

    // State for progress tracking
    const [showProgressOverlay, setShowProgressOverlay] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressValue, setProgressValue] = useState(0);

    // When selection mode changes, notify parent
    useEffect(() => {
        onToggleSelectionMode(isSelectionMode);
    }, [isSelectionMode, onToggleSelectionMode]);

    // Reset selections when exiting selection mode
    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedAreas({});
        }
    }, [isSelectionMode]);

    // Enter selection mode to combine areas
    const startSelectionMode = () => {
        setIsSelectionMode(true);
        // Set default survey name based on site and date
        setNewSurveyName(`Combined Survey ${new Date().toLocaleDateString()}`);
    };

    // Exit selection mode (cancel)
    const cancelSelectionMode = () => {
        setIsSelectionMode(false);
    };

    // Toggle area selection for combining
    const toggleAreaSelection = (areaId, collection) => {
        setSelectedAreas((prev) => {
            // Create a copy of the previous state
            const updated = { ...prev };

            if (updated[areaId]) {
                // If already selected, unselect
                delete updated[areaId];
            } else {
                // If not selected, add with collection info
                updated[areaId] = {
                    areaId,
                    collectionId: collection._id,
                    firstAreaName: collection.firstAreaName,
                    collectionRef: collection.collectionRef,
                };
            }

            return updated;
        });
    };

    // Confirm selection and open dialog for naming
    const confirmSelection = () => {
        const selectedCount = Object.keys(selectedAreas).length;

        if (selectedCount < 1) {
            toast.current.show({
                severity: "warn",
                summary: "No Areas Selected",
                detail: "Please select at least one area to combine",
                life: 3000,
            });
            return;
        }

        setShowConfirmDialog(true);
    };

    // Process and create the combined survey
    const createCombinedSurvey = async () => {
        if (isCreating) return;

        const selectedCount = Object.keys(selectedAreas).length;
        if (selectedCount < 1) {
            toast.current.show({
                severity: "warn",
                summary: "No Areas Selected",
                detail: "Please select at least one area to combine",
                life: 3000,
            });
            return;
        }

        // Validate survey name
        if (!newSurveyName.trim()) {
            toast.current.show({
                severity: "error",
                summary: "Missing Name",
                detail: "Please provide a name for the combined survey",
                life: 3000,
            });
            return;
        }

        // Start the creation process
        setIsCreating(true);
        setShowConfirmDialog(false);
        setShowProgressOverlay(true);
        setProgressValue(0);
        setProgressMessage("Starting combination process...");

        try {
            // Step 1: Generate a new unique REF ID for the combined survey
            setProgressMessage("Generating unique survey reference...");
            setProgressValue(10);
            const newRefId = await generateNewCollectionRef();

            // Step 2: Fetch details for all selected areas
            setProgressMessage("Fetching area details...");
            setProgressValue(20);

            const selectedAreaIds = Object.keys(selectedAreas);
            const areaDetails = [];

            for (let i = 0; i < selectedAreaIds.length; i++) {
                const areaId = selectedAreaIds[i];
                setProgressValue(20 + (i / selectedAreaIds.length) * 20); // 20-40% progress

                try {
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${areaId}`
                    );
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            areaDetails.push(json.data);
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error fetching details for area ${areaId}:`,
                        error
                    );
                }
            }

            if (areaDetails.length === 0) {
                throw new Error(
                    "Could not fetch area details. Please try again."
                );
            }

            // Step 3: Create a new collection
            setProgressMessage("Creating new collection...");
            setProgressValue(50);

            const collectionData = {
                collectionRef: newRefId,
                name: newSurveyName,
                site: siteId,
                surveys: [], // We'll add surveys after they're created
                totalAreas: 0,
            };

            const collRes = await fetch("/api/surveys/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(collectionData),
            });

            if (!collRes.ok) {
                throw new Error("Failed to create new collection");
            }

            const collJson = await collRes.json();
            if (!collJson.success) {
                throw new Error(
                    collJson.message || "Failed to create collection"
                );
            }

            const newCollectionId = collJson.data._id;
            console.log(`Created new collection with ID: ${newCollectionId}`);

            // Step 4: Create surveys in the new collection for each area
            setProgressMessage("Creating combined surveys...");
            setProgressValue(60);

            const createdSurveys = [];

            for (let i = 0; i < areaDetails.length; i++) {
                const area = areaDetails[i];
                setProgressValue(60 + (i / areaDetails.length) * 30); // 60-90% progress

                // Create a copy of the area with modified references
                const newAreaPayload = {
                    // Basic info
                    refValue: `${newRefId}-Area${i + 1}`,
                    surveyDate: new Date(),
                    site: area.site._id || area.site,

                    // Collection reference
                    collectionId: newCollectionId,
                    areaIndex: i,

                    // Copy essential fields from original
                    structure: area.structure,
                    canopySurvey: area.canopySurvey,
                    equipmentSurvey: area.equipmentSurvey,
                    specialistEquipmentSurvey: area.specialistEquipmentSurvey,
                    ventilationInfo: area.ventilationInfo,
                    schematic: area.schematic,
                    access: area.access,
                    operations: area.operations,
                    notes: area.notes,
                    images: area.images,
                    contacts: area.contacts,
                    general: area.general,

                    // Make sure to include totals
                    totals: area.totals,
                };

                // Create the new survey
                const surveyRes = await fetch("/api/surveys/kitchenSurveys", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newAreaPayload),
                });

                if (surveyRes.ok) {
                    const surveyJson = await surveyRes.json();
                    if (surveyJson.success && surveyJson.data) {
                        createdSurveys.push(surveyJson.data);
                    }
                }
            }

            if (createdSurveys.length === 0) {
                throw new Error(
                    "Failed to create surveys in the new collection"
                );
            }

            // Step 5: Finalize and update collection
            setProgressMessage("Finalizing combined survey...");
            setProgressValue(95);

            // Update the collection with the newly created surveys if needed
            if (createdSurveys.length > 0) {
                try {
                    const updateRes = await fetch(
                        `/api/surveys/collections/${newCollectionId}`,
                        {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: newSurveyName,
                                totalAreas: createdSurveys.length,
                            }),
                        }
                    );

                    if (!updateRes.ok) {
                        console.warn(
                            "Warning: Failed to update collection name"
                        );
                    }
                } catch (error) {
                    console.warn("Warning: Error updating collection:", error);
                }
            }

            // Success! Navigate to the first survey in the new collection
            setProgressValue(100);
            setProgressMessage("Survey combination complete!");

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: `Created combined survey with ${createdSurveys.length} areas`,
                life: 3000,
            });

            // Allow time for the user to see the success message
            setTimeout(() => {
                // Navigate to the first survey in the new collection
                if (createdSurveys.length > 0) {
                    const firstSurveyId = createdSurveys[0]._id;
                    router.push(
                        `/surveys/kitchenSurvey?id=${firstSurveyId}&collection=${newCollectionId}`
                    );
                } else {
                    // Fallback to collection view if for some reason we don't have survey IDs
                    router.push(`/database/clients/site/${siteId}`);
                }
            }, 2000);
        } catch (error) {
            console.error("Error creating combined survey:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Error creating combined survey",
                life: 5000,
            });
            setIsCreating(false);
            setShowProgressOverlay(false);
        }
    };

    // For button placement and card decoration in the parent component
    // This component just provides the control buttons and handles the logic
    return (
        <>
            <Toast ref={toast} />

            {/* Main action button - changes based on mode */}
            {!isSelectionMode ? (
                // Button to start combination mode
                <Button
                    icon="pi pi-object-group"
                    label="Create Survey"
                    className="p-button-outlined p-button-info"
                    onClick={startSelectionMode}
                />
            ) : (
                // Confirm/Cancel buttons when in selection mode
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                        icon="pi pi-times"
                        label="Cancel"
                        className="p-button-outlined p-button-secondary"
                        onClick={cancelSelectionMode}
                    />
                    <Button
                        icon="pi pi-check"
                        label="Confirm"
                        className="p-button-success"
                        onClick={confirmSelection}
                        disabled={Object.keys(selectedAreas).length === 0}
                    />
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                header="Create Combined Survey"
                visible={showConfirmDialog}
                onHide={() => setShowConfirmDialog(false)}
                style={{ width: "450px" }}
                footer={
                    <div>
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            onClick={() => setShowConfirmDialog(false)}
                            className="p-button-text"
                        />
                        <Button
                            label="Create Survey"
                            icon="pi pi-check"
                            onClick={createCombinedSurvey}
                            autoFocus
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="surveyName">Survey Name</label>
                        <InputText
                            id="surveyName"
                            value={newSurveyName}
                            onChange={(e) => setNewSurveyName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="p-field mt-3">
                        <p>
                            <strong>{Object.keys(selectedAreas).length}</strong>{" "}
                            areas will be combined into a new survey.
                        </p>
                    </div>
                </div>
            </Dialog>

            {/* Progress Overlay */}
            {showProgressOverlay && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "8px",
                            width: "60%",
                            maxWidth: "500px",
                        }}
                    >
                        <h2>Creating Combined Survey</h2>
                        <p>{progressMessage}</p>
                        <ProgressBar
                            value={progressValue}
                            showValue={true}
                            style={{ height: "20px", marginBottom: "1rem" }}
                        />
                        <p style={{ textAlign: "center", fontStyle: "italic" }}>
                            Please wait while we create your new survey...
                        </p>
                    </div>
                </div>
            )}

            {/* Render Function to use in parent component */}
            {isSelectionMode && (
                <div
                    className="selection-badge"
                    style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        zIndex: 2,
                        background: "#f8f9fa",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                    }}
                >
                    <Checkbox
                        onChange={(e) => {
                            // This is exposed to be used by the parent component's mapping
                            // The parent should call this with the specific collection/area info
                        }}
                    />
                </div>
            )}
        </>
    );
}

// Helper component for use with each card in the parent
export function AreaSelectionCheckbox({
    areaId,
    collection,
    isSelected,
    onToggle,
}) {
    return (
        <div
            className="selection-checkbox"
            style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 2,
            }}
        >
            <Checkbox
                checked={isSelected}
                onChange={(e) => onToggle(areaId, collection)}
            />
        </div>
    );
}
