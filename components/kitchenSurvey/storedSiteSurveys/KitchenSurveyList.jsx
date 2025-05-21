// components\kitchenSurvey\storedSiteSurveys\KitchenSurveyList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import QuoteModal from "@/components/kitchenSurvey/quote/QuoteModal";
import { Tooltip } from "primereact/tooltip";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";

export default function KitchenSurveyList({ siteId, onCountChange }) {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [quoteModalVisible, setQuoteModalVisible] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [flippedCards, setFlippedCards] = useState({});
    const [areasData, setAreasData] = useState({});
    const [loadingAreas, setLoadingAreas] = useState({});

    // Edit collection name state with modal approach
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [editedCollectionName, setEditedCollectionName] = useState("");

    const router = useRouter();
    const toast = useRef(null);

    // Add CSS for card flip animation
    useEffect(() => {
        // Create style element for card flip animation
        const style = document.createElement("style");
        style.innerHTML = `
            .horizontal-container {
                width: 100%;
                overflow-x: auto;
                display: flex;
                flex-wrap: nowrap;
                padding: 1rem 0;
            }
            
            .card-container {
                width: 250px;
                flex: 0 0 auto;
                height: 350px;
                margin: 0 1rem;
                position: relative;
            }
            
            .card-flipper {
                position: relative;
                width: 100%;
                height: 100%;
                transition: transform 0.6s;
                transform-style: preserve-3d;
            }

            .card-flipper.flipped {
                transform: rotateY(180deg);
            }
            
            .card-front, .card-back {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
            }
            
            .card-front {
                z-index: 1;
                pointer-events: auto;
            }
            
            .card-flipper.flipped .card-front {
                pointer-events: none;
            }
            
            .card-back {
                transform: rotateY(180deg);
                z-index: 0;
                pointer-events: none;
                overflow-y: auto;
            }
            
            .card-flipper.flipped .card-back {
                z-index: 2;
                pointer-events: auto;
            }
            
            .vertical-buttons {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
            }
            
            .collection-info {
                margin-left: 3.5rem;
                padding: 0.5rem;
            }
            
            .edit-name-icon {
                color: #6c757d;
                background: transparent;
                border: none;
                padding: 0.2rem;
                margin-left: 0.5rem;
                cursor: pointer;
            }
            
            .edit-name-icon:hover {
                color: #007bff;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Function to fetch collections for a site (can be called to refresh the list)
    const fetchCollections = async () => {
        if (!siteId) return;

        setLoading(true);
        try {
            // Fetch collections for this site
            const res = await fetch(
                `/api/surveys/collections?siteId=${siteId}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();
            if (json.success) {
                // Sort collections by creation date (newest first)
                const sortedCollections = json.data.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                );

                // Populate with additional data if needed
                const enhancedCollections = await Promise.all(
                    sortedCollections.map(async (collection) => {
                        // If the collection doesn't have populated surveys, fetch the first survey
                        // to get basic information
                        if (
                            collection.surveys &&
                            collection.surveys.length > 0
                        ) {
                            if (
                                !collection.firstAreaName &&
                                collection.surveys[0]
                            ) {
                                try {
                                    // For collections with multiple surveys, fetch the first one to get its name
                                    const surveyId =
                                        typeof collection.surveys[0] ===
                                        "string"
                                            ? collection.surveys[0]
                                            : collection.surveys[0]._id;

                                    const surveyRes = await fetch(
                                        `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                                    );
                                    if (surveyRes.ok) {
                                        const surveyData =
                                            await surveyRes.json();
                                        if (
                                            surveyData.success &&
                                            surveyData.data
                                        ) {
                                            collection.firstAreaName =
                                                surveyData.data.structure
                                                    ?.structureId || "Area 1";
                                            collection.surveyDate =
                                                surveyData.data.surveyDate ||
                                                surveyData.data.createdAt;
                                            collection.surveyType =
                                                surveyData.data.general
                                                    ?.surveyType ||
                                                "Kitchen Survey";
                                        }
                                    }
                                } catch (err) {
                                    console.error(
                                        "Error fetching first survey:",
                                        err
                                    );
                                }
                            }
                        }
                        return collection;
                    })
                );

                setCollections(enhancedCollections);

                // Call the onCountChange prop with the count if it exists
                if (onCountChange && typeof onCountChange === "function") {
                    onCountChange(enhancedCollections.length);
                }
            } else {
                throw new Error(json.message || "Failed to fetch collections");
            }
        } catch (error) {
            console.error("Error fetching collections:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch collections when component mounts or siteId changes
    useEffect(() => {
        fetchCollections();
    }, [siteId]);

    // Function to open the collection name edit modal
    const openEditNameModal = (collection) => {
        setEditingCollection(collection);
        setEditedCollectionName(collection.name || "");
        setNameModalVisible(true);
    };

    // Function to handle saving the collection name
    const handleSaveCollectionName = async () => {
        if (!editingCollection) return;

        if (!editedCollectionName.trim()) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Collection name cannot be empty",
                life: 3000,
            });
            return;
        }

        try {
            const res = await fetch(
                `/api/surveys/collections/${editingCollection._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: editedCollectionName,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();
            if (json.success) {
                // Update the local collections array
                setCollections(
                    collections.map((c) =>
                        c._id === editingCollection._id
                            ? { ...c, name: editedCollectionName }
                            : c
                    )
                );

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Collection name updated successfully",
                    life: 3000,
                });

                // Close the modal
                setNameModalVisible(false);
            } else {
                throw new Error(
                    json.message || "Failed to update collection name"
                );
            }
        } catch (error) {
            console.error("Error updating collection name:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update collection name",
                life: 3000,
            });
        }
    };

    // Function to toggle card flip
    const toggleCardFlip = async (collectionId) => {
        // Hide any visible tooltips by clearing their DOM elements
        const tooltips = document.querySelectorAll(".p-tooltip");
        tooltips.forEach((tooltip) => {
            tooltip.style.display = "none";
        });

        // Toggle the flip state for this card
        setFlippedCards((prev) => ({
            ...prev,
            [collectionId]: !prev[collectionId],
        }));

        // If we're flipping to show the back and we don't have the areas data yet,
        // fetch the areas for this collection
        if (!flippedCards[collectionId] && !areasData[collectionId]) {
            await fetchCollectionAreas(collectionId);
        }
    };

    // Function to fetch areas for a collection
    const fetchCollectionAreas = async (collectionId) => {
        setLoadingAreas((prev) => ({ ...prev, [collectionId]: true }));

        try {
            // Find the collection
            const collection = collections.find((c) => c._id === collectionId);
            if (
                !collection ||
                !collection.surveys ||
                collection.surveys.length === 0
            ) {
                throw new Error("Collection not found or has no surveys");
            }

            // Fetch all areas in this collection
            const areas = [];
            for (const survey of collection.surveys) {
                const surveyId =
                    typeof survey === "string" ? survey : survey._id;
                const res = await fetch(
                    `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                );

                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        const areaName =
                            json.data.structure?.structureId ||
                            json.data.structureId ||
                            "Unnamed Area";

                        // Find the area index for this specific collection
                        let areaIndex = 0;
                        if (json.data.collections) {
                            const collectionEntry = json.data.collections.find(
                                (entry) =>
                                    entry.collectionId &&
                                    entry.collectionId.toString() ===
                                        collectionId.toString()
                            );
                            if (collectionEntry) {
                                areaIndex = collectionEntry.areaIndex || 0;
                            }
                        }

                        areas.push({
                            id: surveyId,
                            name: areaName,
                            date: json.data.surveyDate || json.data.createdAt,
                            areaIndex: areaIndex,
                            collections: json.data.collections || [],
                        });
                    }
                }
            }

            // Sort areas by areaIndex
            areas.sort((a, b) => a.areaIndex - b.areaIndex);

            // Update areas data
            setAreasData((prev) => ({
                ...prev,
                [collectionId]: areas,
            }));
        } catch (error) {
            console.error("Error fetching collection areas:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to load areas for this collection",
                life: 3000,
            });
        } finally {
            setLoadingAreas((prev) => ({ ...prev, [collectionId]: false }));
        }
    };

    // Function to create a new version of the first survey in a collection
    const handleCreateVersion = async (collectionId, firstSurveyId) => {
        if (!firstSurveyId) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Cannot find first survey in collection",
                life: 3000,
            });
            return;
        }

        setCreating(true);
        try {
            // Call the PATCH endpoint to create a new version
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll/${firstSurveyId}`,
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

                // Navigate to edit the newly created version, including collection parameter
                router.push(
                    `/surveys/kitchenSurvey?id=${json.data._id}&collection=${collectionId}`
                );
            } else {
                throw new Error(json.message || "Failed to create new version");
            }
        } catch (error) {
            console.error("Error creating survey version:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to create new version",
                life: 3000,
            });
        } finally {
            setCreating(false);
        }
    };

    // Function to handle deleting a collection
    const handleDeleteCollection = async (collectionId) => {
        confirmDialog({
            message:
                "Are you sure you want to delete this entire collection? This will delete all areas within this collection.",
            header: "Delete Collection Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setDeleting(true);
                try {
                    // First, get all surveys in the collection
                    const surveysRes = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll?collectionId=${collectionId}`
                    );

                    if (!surveysRes.ok) {
                        throw new Error(
                            `HTTP error! Status: ${surveysRes.status}`
                        );
                    }

                    const surveysJson = await surveysRes.json();

                    if (
                        surveysJson.success &&
                        Array.isArray(surveysJson.data)
                    ) {
                        // Delete each survey in the collection
                        for (const survey of surveysJson.data) {
                            // Check if this survey is in multiple collections
                            if (
                                survey.collections &&
                                survey.collections.length > 1
                            ) {
                                // Only remove this survey from this collection
                                await fetch(
                                    `/api/surveys/collections/${collectionId}`,
                                    {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            surveyId: survey._id,
                                        }),
                                    }
                                );
                            } else {
                                // Delete the survey completely if it's only in this collection
                                await fetch(
                                    `/api/surveys/kitchenSurveys/viewAll/${survey._id}`,
                                    {
                                        method: "DELETE",
                                    }
                                );
                            }
                        }

                        toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Collection and all areas deleted successfully",
                            life: 3000,
                        });

                        // Refresh the collections list
                        fetchCollections();
                    } else {
                        throw new Error(
                            surveysJson.message ||
                                "Failed to find surveys in collection"
                        );
                    }
                } catch (error) {
                    console.error("Error deleting collection:", error);
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: error.message || "Failed to delete collection",
                        life: 3000,
                    });
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    // Render a collection item in the list
    const collectionTemplate = (collection) => {
        // Get first survey ID for editing
        const firstSurveyId =
            collection.surveys && collection.surveys.length > 0
                ? typeof collection.surveys[0] === "string"
                    ? collection.surveys[0]
                    : collection.surveys[0]._id
                : null;

        // Check if this card is flipped
        const isFlipped = flippedCards[collection._id] || false;

        // Check if areas are loading
        const isLoadingAreas = loadingAreas[collection._id] || false;

        // Get areas data for this collection
        const areas = areasData[collection._id] || [];

        return (
            <div className="card-container">
                <div className={`card-flipper ${isFlipped ? "flipped" : ""}`}>
                    {/* FRONT OF CARD */}
                    <div className="card-front">
                        <Card
                            key={collection._id}
                            className="collection-card"
                            style={{
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            {/* Vertical Buttons on left side */}
                            <div className="vertical-buttons">
                                <Button
                                    tooltip="View Areas"
                                    icon="pi pi-info-circle"
                                    className="p-button-secondary p-button-rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCardFlip(collection._id);
                                    }}
                                />
                                <Button
                                    tooltip="Edit Collection"
                                    icon="pi pi-file-edit"
                                    className="p-button-primary"
                                    onClick={() => {
                                        if (firstSurveyId) {
                                            router.push(
                                                `/surveys/kitchenSurvey?id=${firstSurveyId}&collection=${collection._id}`
                                            );
                                        } else {
                                            toast.current.show({
                                                severity: "error",
                                                summary: "Error",
                                                detail: "Cannot find a survey in this collection",
                                                life: 3000,
                                            });
                                        }
                                    }}
                                    disabled={!firstSurveyId}
                                />
                                <Button
                                    tooltip="Create New Version"
                                    icon="pi pi-file-plus"
                                    className="p-button-success"
                                    onClick={() =>
                                        handleCreateVersion(
                                            collection._id,
                                            firstSurveyId
                                        )
                                    }
                                    disabled={creating || !firstSurveyId}
                                />
                                <Button
                                    tooltip="View Quotes"
                                    icon="pi pi-file-pdf"
                                    className="p-button-info"
                                    onClick={() => {
                                        // For now, just show quotes for the first survey in the collection
                                        if (firstSurveyId) {
                                            setSelectedSurvey({
                                                _id: firstSurveyId,
                                                refValue:
                                                    collection.collectionRef,
                                            });
                                            setQuoteModalVisible(true);
                                        } else {
                                            toast.current.show({
                                                severity: "error",
                                                summary: "Error",
                                                detail: "Cannot find a survey in this collection",
                                                life: 3000,
                                            });
                                        }
                                    }}
                                    disabled={!firstSurveyId}
                                />
                                <Button
                                    tooltip="Delete Collection"
                                    icon="pi pi-trash"
                                    className="p-button-danger"
                                    onClick={() =>
                                        handleDeleteCollection(collection._id)
                                    }
                                    disabled={deleting}
                                />
                            </div>

                            {/* Collection Info */}
                            <div className="collection-info">
                                <h3
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {collection.name || "Collection"}
                                    <Button
                                        icon="pi pi-pencil"
                                        className="p-button-text p-button-sm"
                                        style={{
                                            marginLeft: "0.5rem",
                                            color: "#6c757d",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            padding: "0.2rem",
                                        }}
                                        onClick={() =>
                                            openEditNameModal(collection)
                                        }
                                    />
                                </h3>
                                <p>
                                    {collection.collectionRef
                                        ? `${collection.collectionRef}`
                                        : "No Reference"}
                                </p>
                                <p>
                                    {collection.surveyDate
                                        ? `Created: ${new Date(
                                              collection.surveyDate
                                          ).toLocaleDateString()}`
                                        : `Areas: ${
                                              collection.totalAreas ||
                                              collection.surveys?.length ||
                                              0
                                          }`}
                                </p>
                                <p>
                                    {collection.surveyType || "Kitchen Survey"}
                                </p>

                                {/* Badge showing number of areas */}
                                <div
                                    style={{
                                        display: "inline-block",
                                        background: "#2196F3",
                                        color: "white",
                                        borderRadius: "12px",
                                        padding: "3px 8px",
                                        fontSize: "0.85rem",
                                        marginTop: "5px",
                                    }}
                                >
                                    {collection.totalAreas ||
                                        collection.surveys?.length ||
                                        0}{" "}
                                    Areas
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* BACK OF CARD */}
                    <div className="card-back">
                        <Card
                            key={`${collection._id}-back`}
                            className="collection-card-back"
                            style={{
                                height: "100%",
                                position: "relative",
                            }}
                            header={
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.5rem 1rem",
                                        background: "#f4f4f4",
                                    }}
                                >
                                    <h4 style={{ margin: 0 }}>
                                        {collection.name || "Collection"} -
                                        Areas
                                    </h4>
                                    <Button
                                        icon="pi pi-times"
                                        className="p-button-rounded p-button-text"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCardFlip(collection._id);
                                        }}
                                    />
                                </div>
                            }
                        >
                            {isLoadingAreas ? (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        padding: "1rem",
                                    }}
                                >
                                    <ProgressSpinner
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                        }}
                                    />
                                </div>
                            ) : areas.length > 0 ? (
                                <ul
                                    style={{
                                        padding: "0 1rem",
                                        margin: 0,
                                        listStyleType: "none",
                                    }}
                                >
                                    {areas.map((area, index) => (
                                        <li
                                            key={area.id}
                                            style={{
                                                padding: "0.5rem 0",
                                                borderBottom:
                                                    index < areas.length - 1
                                                        ? "1px solid #e0e0e0"
                                                        : "none",
                                            }}
                                        >
                                            <div>
                                                <strong>{area.name}</strong>
                                                {area.collections?.length >
                                                    1 && (
                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                "normal",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        {" | in "}
                                                        {
                                                            area.collections
                                                                .length
                                                        }{" "}
                                                        collections
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div
                                    style={{
                                        padding: "1rem",
                                        textAlign: "center",
                                    }}
                                >
                                    No area details available
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        );
    };

    // Footer template for the edit name dialog
    const editNameDialogFooter = (
        <div>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => setNameModalVisible(false)}
            />
            <Button
                label="Save"
                icon="pi pi-check"
                className="p-button-primary"
                onClick={handleSaveCollectionName}
            />
        </div>
    );

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
        return <div>Error loading collections: {error}</div>;
    }

    if (collections.length === 0) {
        return <div>No surveys found for this site.</div>;
    }

    return (
        <div className="kitchen-survey-list">
            <Toast ref={toast} />
            <ConfirmDialog />
            <Tooltip target=".shared-area-badge" />

            <div className="horizontal-container">
                {collections.map((collection) => (
                    <div key={collection._id}>
                        {collectionTemplate(collection)}
                    </div>
                ))}
            </div>

            {/* Quote Modal */}
            {selectedSurvey && (
                <QuoteModal
                    visible={quoteModalVisible}
                    onHide={() => setQuoteModalVisible(false)}
                    surveyId={selectedSurvey._id}
                    surveyRef={selectedSurvey.refValue}
                />
            )}

            {/* Edit Collection Name Modal */}
            <Dialog
                header="Edit Collection Name"
                visible={nameModalVisible}
                style={{ width: "400px" }}
                modal
                footer={editNameDialogFooter}
                onHide={() => setNameModalVisible(false)}
            >
                <div className="p-field" style={{ marginTop: "1rem" }}>
                    <label
                        htmlFor="collection-name"
                        style={{ display: "block", marginBottom: "0.5rem" }}
                    >
                        Collection Name
                    </label>
                    <InputText
                        id="collection-name"
                        value={editedCollectionName}
                        onChange={(e) =>
                            setEditedCollectionName(e.target.value)
                        }
                        style={{ width: "100%" }}
                        autoFocus
                    />
                </div>
            </Dialog>
        </div>
    );
}
