// components\kitchenSurvey\storedSiteSurveys\AreaSurveyList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataScroller } from "primereact/datascroller";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { generateNewCollectionRef } from "../collection/collectionID";

/**
 * Component to display and manage individual areas from all collections
 */
export default function AreaSurveyList({ siteId, onCountChange }) {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const router = useRouter();
    const toast = useRef(null);

    // State for area combination
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedAreas, setSelectedAreas] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [newSurveyName, setNewSurveyName] = useState("");
    const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
    const [showProgressOverlay, setShowProgressOverlay] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressValue, setProgressValue] = useState(0);

    // Add CSS for dynamic cards
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .area-card {
                min-height: 180px;
                margin-bottom: 1rem;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .area-card.selected {
                border: 2px solid #4caf50;
                background-color: rgba(76, 175, 80, 0.05);
            }
            
            .p-card {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .p-card-body {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .p-card-content {
                flex: 1;
                padding: 1rem;
            }
            
            .area-selection-checkbox {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 10;
            }
            
            .area-badge {
                display: inline-block;
                background: #2196F3;
                color: white;
                border-radius: 12px;
                padding: 3px 8px;
                font-size: 0.85rem;
                margin-top: 5px;
                margin-right: 8px;
            }
            
            .ref-badge {
                display: inline-block;
                background: #FF9800;
                color: white;
                border-radius: 12px;
                padding: 3px 8px;
                font-size: 0.85rem;
                margin-right: 8px;
            }
            
            /* Ensure DataScroller adjusts to content */
            .p-datascroller .p-datascroller-content {
                min-height: 400px;
                max-height: 800px;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Function to fetch all areas across all collections for this site
    const fetchAreas = async () => {
        if (!siteId) return;

        setLoading(true);
        try {
            // First, fetch all collections for this site
            const collRes = await fetch(
                `/api/surveys/collections?siteId=${siteId}`
            );

            if (!collRes.ok) {
                throw new Error(`HTTP error! Status: ${collRes.status}`);
            }

            const collJson = await collRes.json();

            if (!collJson.success) {
                throw new Error(
                    collJson.message || "Failed to fetch collections"
                );
            }

            const collections = collJson.data;

            // Now fetch all areas from these collections
            const allAreas = [];

            for (const collection of collections) {
                if (collection.surveys && collection.surveys.length > 0) {
                    for (const survey of collection.surveys) {
                        try {
                            const surveyId =
                                typeof survey === "string"
                                    ? survey
                                    : survey._id;
                            const areaRes = await fetch(
                                `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                            );

                            if (areaRes.ok) {
                                const areaJson = await areaRes.json();

                                if (areaJson.success && areaJson.data) {
                                    // Add collection info to the area data
                                    allAreas.push({
                                        ...areaJson.data,
                                        collectionInfo: {
                                            id: collection._id,
                                            ref: collection.collectionRef,
                                            name:
                                                collection.name || "Collection",
                                        },
                                    });
                                }
                            }
                        } catch (err) {
                            console.error("Error fetching area details:", err);
                        }
                    }
                }
            }

            // Sort areas by date (newest first)
            allAreas.sort(
                (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );

            setAreas(allAreas);

            // Call onCountChange with the count if provided
            if (onCountChange && typeof onCountChange === "function") {
                onCountChange(allAreas.length);
            }
        } catch (error) {
            console.error("Error fetching areas:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch areas when component mounts or siteId changes
    useEffect(() => {
        fetchAreas();
    }, [siteId]);

    // Function to toggle area selection for combining
    const toggleAreaSelection = (areaId) => {
        setSelectedAreas((prev) => {
            const updated = { ...prev };
            if (updated[areaId]) {
                delete updated[areaId];
            } else {
                const area = areas.find((a) => a._id === areaId);
                if (area) {
                    updated[areaId] = area;
                }
            }
            return updated;
        });
    };

    // Start selection mode to combine areas
    const startSelectionMode = () => {
        setSelectionMode(true);
        // Set default survey name based on site and date
        setNewSurveyName(`Combined Survey ${new Date().toLocaleDateString()}`);
    };

    // Exit selection mode (cancel)
    const cancelSelectionMode = () => {
        setSelectionMode(false);
        setSelectedAreas({});
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
        if (isCreatingSurvey) return;

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
        setIsCreatingSurvey(true);
        setShowConfirmDialog(false);
        setShowProgressOverlay(true);
        setProgressValue(0);
        setProgressMessage("Starting combination process...");

        try {
            // Step 1: Generate a new unique REF ID for the combined survey
            setProgressMessage("Generating unique survey reference...");
            setProgressValue(10);
            const newRefId = await generateNewCollectionRef();

            // Step 2: Selected areas are already loaded, prepare them for the new collection
            setProgressMessage("Preparing areas for combination...");
            setProgressValue(20);

            const selectedAreaIds = Object.keys(selectedAreas);
            const areaDetails = selectedAreaIds.map((id) => selectedAreas[id]);

            if (areaDetails.length === 0) {
                throw new Error(
                    "Could not prepare area details. Please try again."
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
            setIsCreatingSurvey(false);
            setShowProgressOverlay(false);
        } finally {
            // Reset states in case user cancels navigation
            setTimeout(() => {
                setIsCreatingSurvey(false);
                setShowProgressOverlay(false);
                setSelectionMode(false);
                setSelectedAreas({});
            }, 3000);
        }
    };

    // Function to handle deleting an area
    const handleDeleteArea = async (areaId, collectionId) => {
        confirmDialog({
            message:
                "Are you sure you want to delete this area? This action cannot be undone.",
            header: "Delete Area Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setIsDeleting(true);
                try {
                    // Call the delete endpoint
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${areaId}`,
                        {
                            method: "DELETE",
                        }
                    );

                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }

                    // Refresh the area list
                    toast.current.show({
                        severity: "success",
                        summary: "Success",
                        detail: "Area deleted successfully",
                        life: 3000,
                    });

                    // Refresh the data
                    fetchAreas();
                } catch (error) {
                    console.error("Error deleting area:", error);
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: error.message || "Failed to delete area",
                        life: 3000,
                    });
                } finally {
                    setIsDeleting(false);
                }
            },
        });
    };

    // Function to handle creating a new version of an area
    const handleCreateVersion = async (areaId, collectionId) => {
        setIsCreatingVersion(true);
        try {
            // Call the PATCH endpoint to create a new version
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll/${areaId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();

            if (json.success) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: json.message || "New version created successfully",
                    life: 3000,
                });

                // Navigate to edit the newly created version
                router.push(
                    `/surveys/kitchenSurvey?id=${json.data._id}&collection=${collectionId}`
                );
            } else {
                throw new Error(json.message || "Failed to create new version");
            }
        } catch (error) {
            console.error("Error creating version:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Error creating new version",
                life: 3000,
            });
            setIsCreatingVersion(false);
        }
    };

    // Render an area item in the list
    const areaTemplate = (area) => {
        const isSelected = !!selectedAreas[area._id];
        const structureId = area.structure?.structureId || "Unnamed Area";
        const surveyDate = area.surveyDate || area.createdAt;

        // Get collection info
        const collectionName = area.collectionInfo?.name || "Collection";
        const collectionRef = area.collectionInfo?.ref || "";
        const collectionId = area.collectionInfo?.id;

        // Get individual kitchen survey REF
        const surveyRef = area.refValue || "";

        return (
            <div className={`area-card ${isSelected ? "selected" : ""}`}>
                {selectionMode && (
                    <div className="area-selection-checkbox">
                        <Checkbox
                            checked={isSelected}
                            onChange={() => toggleAreaSelection(area._id)}
                        />
                    </div>
                )}

                <Card>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                        }}
                    >
                        <div>
                            <h3>Area Name: {structureId}</h3>
                            <p style={{ marginTop: "-10px", color: "#666" }}>
                                Survey REF: {collectionRef}
                                <p className="ref-badge">
                                    Area REF: {surveyRef}
                                </p>
                                {surveyDate &&
                                    `Date: ${new Date(
                                        surveyDate
                                    ).toLocaleDateString()}`}
                            </p>

                            <p>
                                <strong>Type:</strong>{" "}
                                {area.general?.surveyType || "Kitchen Survey"}
                            </p>
                        </div>

                        {!selectionMode && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Button
                                    tooltip="Edit Area"
                                    icon="pi pi-file-edit"
                                    className="p-button-primary"
                                    onClick={() => {
                                        router.push(
                                            `/surveys/kitchenSurvey?id=${area._id}&collection=${collectionId}`
                                        );
                                    }}
                                />
                                <Button
                                    tooltip="Create New Version"
                                    icon="pi pi-file-plus"
                                    className="p-button-success"
                                    onClick={() =>
                                        handleCreateVersion(
                                            area._id,
                                            collectionId
                                        )
                                    }
                                    disabled={isCreatingVersion}
                                />
                                <Button
                                    tooltip="Delete Area"
                                    icon="pi pi-trash"
                                    className="p-button-danger"
                                    onClick={() =>
                                        handleDeleteArea(area._id, collectionId)
                                    }
                                    disabled={isDeleting}
                                />
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "2rem",
                }}
            >
                <ProgressSpinner style={{ width: "50px", height: "50px" }} />
            </div>
        );
    }

    if (error) {
        return <div>Error loading areas: {error}</div>;
    }

    if (areas.length === 0) {
        return <div>No areas found for this site.</div>;
    }

    return (
        <div className="area-survey-list">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Header with title and action buttons */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                }}
            >
                {!selectionMode ? (
                    <Button
                        icon="pi pi-object-group"
                        label="Create Survey"
                        className="p-button-outlined p-button-info"
                        onClick={startSelectionMode}
                    />
                ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                background: "#f0f0f0",
                                padding: "0.5rem 1rem",
                                borderRadius: "4px",
                            }}
                        >
                            <i
                                className="pi pi-check-circle"
                                style={{
                                    marginRight: "0.5rem",
                                    color: "#4caf50",
                                }}
                            ></i>
                            {Object.keys(selectedAreas).length} areas selected
                        </span>
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
            </div>

            <DataScroller
                value={areas}
                itemTemplate={areaTemplate}
                rows={10}
                inline
                scrollHeight={areas.length > 5 ? "700px" : "auto"}
                emptyMessage="No areas found for this site."
            />

            {/* Confirmation Dialog for naming new survey */}
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
        </div>
    );
}
