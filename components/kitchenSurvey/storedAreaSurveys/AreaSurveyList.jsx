// components\kitchenSurvey\storedAreaSurveys\AreaSurveyList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import { AreaSelectionCheckbox } from "./CombineAreas";

/**
 * Component to display and manage individual areas from all collections
 */
export default function AreaSurveyList({
    siteId,
    onCountChange,
    isSelectionMode = false,
    selectedAreas = {},
    onToggleAreaSelection = () => {},
}) {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const [collections, setCollections] = useState([]);
    const [flippedCards, setFlippedCards] = useState({});
    const router = useRouter();
    const toast = useRef(null);

    // Add CSS for card flip animation and horizontal layout
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
            
            .area-info {
                margin-left: 3.5rem;
                padding: 0.5rem;
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
            setCollections(collections);

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
                                    // Check if this area is already in our list
                                    const existingAreaIndex =
                                        allAreas.findIndex(
                                            (a) => a._id === areaJson.data._id
                                        );

                                    if (existingAreaIndex >= 0) {
                                        // Area already exists, just update its collectionInfo array
                                        if (
                                            !allAreas[existingAreaIndex]
                                                .collectionsInfo
                                        ) {
                                            allAreas[
                                                existingAreaIndex
                                            ].collectionsInfo = [];
                                        }

                                        // Add this collection to the collectionsInfo if not already present
                                        if (
                                            !allAreas[
                                                existingAreaIndex
                                            ].collectionsInfo.some(
                                                (c) =>
                                                    c.id &&
                                                    c.id.toString() ===
                                                        collection._id.toString()
                                            )
                                        ) {
                                            allAreas[
                                                existingAreaIndex
                                            ].collectionsInfo.push({
                                                id: collection._id,
                                                ref: collection.collectionRef,
                                                name:
                                                    collection.name ||
                                                    "Collection",
                                            });
                                        }
                                    } else {
                                        // New area, add it with collection info
                                        const areaWithCollections = {
                                            ...areaJson.data,
                                            collectionsInfo: [
                                                {
                                                    id: collection._id,
                                                    ref: collection.collectionRef,
                                                    name:
                                                        collection.name ||
                                                        "Collection",
                                                },
                                            ],
                                        };

                                        allAreas.push(areaWithCollections);
                                    }
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

    // Function to toggle card flip
    const toggleCardFlip = (areaId) => {
        // Hide any visible tooltips by clearing their DOM elements
        const tooltips = document.querySelectorAll(".p-tooltip");
        tooltips.forEach((tooltip) => {
            tooltip.style.display = "none";
        });

        setFlippedCards((prev) => ({
            ...prev,
            [areaId]: !prev[areaId],
        }));
    };

    // FIXED: Improved delete function with better URL handling and error checking
    const handleDeleteArea = async (areaId) => {
        if (isDeleting) {
            return; // Prevent multiple deletes
        }

        // Validate areaId
        if (!areaId || typeof areaId !== "string") {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Invalid area ID",
                life: 3000,
            });
            return;
        }

        // Clean the areaId - remove any trailing slashes or whitespace
        const cleanAreaId = areaId.toString().trim().replace(/\/+$/, "");

        console.log("Attempting to delete area:", cleanAreaId);

        confirmDialog({
            message:
                "Are you sure you want to delete this area? This action cannot be undone.",
            header: "Delete Area Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setIsDeleting(true);
                try {
                    // Construct the URL properly
                    const deleteUrl = `/api/surveys/kitchenSurveys/viewAll/${cleanAreaId}`;
                    console.log("DELETE URL:", deleteUrl);

                    // Call the delete endpoint
                    const res = await fetch(deleteUrl, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    console.log("DELETE response status:", res.status);

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error("DELETE error response:", errorText);
                        throw new Error(
                            `HTTP error! Status: ${res.status} - ${errorText}`
                        );
                    }

                    const result = await res.json();
                    console.log("DELETE result:", result);

                    if (!result.success) {
                        throw new Error(
                            result.message || "Delete operation failed"
                        );
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
            // Clean the areaId
            const cleanAreaId = areaId.toString().trim().replace(/\/+$/, "");

            // Call the PATCH endpoint to create a new version
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll/${cleanAreaId}`,
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

                // Find primary collection for navigation
                const area = areas.find((a) => a._id === areaId);
                const primaryCollection = getPrimaryCollectionId(area);
                const targetCollection = primaryCollection || collectionId;

                // Navigate to edit the newly created version
                router.push(
                    `/surveys/kitchenSurvey?id=${json.data._id}&collection=${targetCollection}`
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

    // Helper function to get primary collection ID from an area
    const getPrimaryCollectionId = (area) => {
        if (!area || !area.collections) return null;

        // First, try to find a collection marked as primary
        const primaryCollection = area.collections.find((c) => c.isPrimary);
        if (primaryCollection) return primaryCollection.collectionId;

        // If no primary collection, return the first collection's ID
        return area.collections[0]?.collectionId || null;
    };

    // Render an area item in the list
    const areaTemplate = (area) => {
        const structureId = area.structure?.structureId || "Unnamed Area";
        const surveyDate = area.surveyDate || area.createdAt;

        // Get collection info for display
        const collections = area.collections || [];
        const collectionsInfo = area.collectionsInfo || [];
        const collectionsCount = collections.length;

        // Check if this card is flipped
        const isFlipped = flippedCards[area._id] || false;

        // Check if this area is selected in selection mode
        const isSelected = Boolean(selectedAreas && selectedAreas[area._id]);

        // Find the primary collection for this area
        const primaryCollection = area.collections?.find((c) => c.isPrimary);
        const firstCollection = area.collections?.[0];

        // Get a collection object to pass to the selection checkbox
        const collectionForSelection = {
            _id:
                primaryCollection?.collectionId ||
                firstCollection?.collectionId ||
                collectionsInfo[0]?.id ||
                "",
            firstAreaName: structureId,
            collectionRef: collectionsInfo[0]?.ref || area.refValue,
        };

        return (
            <div className="card-container">
                <div className={`card-flipper ${isFlipped ? "flipped" : ""}`}>
                    {/* FRONT OF CARD */}
                    <div className="card-front">
                        <Card
                            key={area._id}
                            className="collection-card"
                            style={{
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            {/* Show selection checkbox when in selection mode */}
                            {isSelectionMode && (
                                <AreaSelectionCheckbox
                                    areaId={area._id}
                                    collection={collectionForSelection}
                                    isSelected={isSelected}
                                    onToggle={onToggleAreaSelection}
                                />
                            )}

                            <div className="vertical-buttons">
                                <Button
                                    tooltip="View Collections"
                                    icon="pi pi-info-circle"
                                    className="p-button-secondary p-button-rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCardFlip(area._id);
                                    }}
                                />
                                <Button
                                    tooltip="Edit Area"
                                    icon="pi pi-file-edit"
                                    className="p-button-primary"
                                    onClick={() => {
                                        // Get primary collection or first collection for navigation
                                        const primaryCollection =
                                            getPrimaryCollectionId(area);
                                        const targetCollection =
                                            primaryCollection ||
                                            (area.collections &&
                                            area.collections.length > 0
                                                ? area.collections[0]
                                                      .collectionId
                                                : null);

                                        router.push(
                                            `/surveys/kitchenSurvey?id=${
                                                area._id
                                            }${
                                                targetCollection
                                                    ? `&collection=${targetCollection}`
                                                    : ""
                                            }`
                                        );
                                    }}
                                />
                                <Button
                                    tooltip="Create New Version"
                                    icon="pi pi-file-plus"
                                    className="p-button-success"
                                    onClick={() =>
                                        handleCreateVersion(area._id)
                                    }
                                    disabled={isCreatingVersion}
                                />
                                <Button
                                    tooltip="Delete Area"
                                    icon="pi pi-trash"
                                    className="p-button-danger"
                                    onClick={() => handleDeleteArea(area._id)}
                                    disabled={isDeleting}
                                />
                            </div>

                            <div className="area-info">
                                <h3>
                                    {structureId}
                                    {collectionsCount > 1 && (
                                        <span style={{ fontWeight: "normal" }}>
                                            <p>in {collectionsCount} surveys</p>
                                        </span>
                                    )}
                                </h3>
                                <p
                                    style={{
                                        marginTop: "-10px",
                                        color: "#666",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {area.refValue}
                                </p>
                                <p>
                                    {surveyDate &&
                                        `Surveyed: ${new Date(
                                            surveyDate
                                        ).toLocaleDateString()}`}
                                </p>

                                <p>
                                    {area.general?.surveyType ||
                                        "Kitchen Survey"}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* BACK OF CARD */}
                    <div className="card-back">
                        <Card
                            key={`${area._id}-back`}
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
                                        Included in Surveys
                                    </h4>
                                    <Button
                                        icon="pi pi-times"
                                        className="p-button-rounded p-button-text"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCardFlip(area._id);
                                        }}
                                    />
                                </div>
                            }
                        >
                            {collections.length > 0 ? (
                                <ul
                                    style={{
                                        padding: "0 1rem",
                                        margin: 0,
                                        listStyleType: "none",
                                    }}
                                >
                                    {collections.map((collection, idx) => {
                                        // Find detailed info for this collection
                                        const info = collectionsInfo.find(
                                            (c) =>
                                                c.id &&
                                                collection.collectionId &&
                                                c.id.toString() ===
                                                    collection.collectionId.toString()
                                        );

                                        return (
                                            <li
                                                key={idx}
                                                style={{
                                                    padding: "0.5rem 0",
                                                    borderBottom:
                                                        idx <
                                                        collections.length - 1
                                                            ? "1px solid #e0e0e0"
                                                            : "none",
                                                }}
                                            >
                                                <strong>REF:</strong>{" "}
                                                {info?.ref ||
                                                    collection.collectionRef ||
                                                    `Unknown`}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div
                                    style={{
                                        padding: "1rem",
                                        textAlign: "center",
                                    }}
                                >
                                    No collections information available
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
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
        <div className="kitchen-survey-list">
            <Toast ref={toast} />
            {/* No ConfirmDialog here - handled at page level */}

            <div className="horizontal-container">
                {areas.map((area) => (
                    <div key={area._id}>{areaTemplate(area)}</div>
                ))}
            </div>
        </div>
    );
}
