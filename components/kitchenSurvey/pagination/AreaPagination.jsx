// components/kitchenSurvey/pagination/AreaPagination.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { saveSurveyWithHandshake } from "../save/SurveySaveUtil";

export default function AreaPagination({
    // Option 1: Detailed props
    collectionId,
    currentSurveyId,
    currentIndex,
    areasList = [],

    // Option 2: Consolidated props object
    paginationData = null,

    // Survey data needed for auto-saving
    surveyData = null,

    // Style options
    fixedPosition = true,
}) {
    const router = useRouter();
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useRef(null);

    // Use either provided paginationData or construct from individual props
    const pagination = paginationData || {
        collectionId,
        currentIndex: currentIndex || 0,
        totalAreas: areasList.length,
        areasList: areasList,
    };

    // Fetch areas if we only have collectionId but no areasList
    useEffect(() => {
        if (!pagination.collectionId || pagination.areasList.length > 0) {
            setLoading(false);
            return;
        }

        const fetchCollection = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/surveys/collections/${pagination.collectionId}`
                );
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data && json.data.surveys) {
                        // Fetch full details of each survey to get the area index for this collection
                        const surveyDetails = [];

                        for (const surveyId of json.data.surveys) {
                            const sid =
                                typeof surveyId === "string"
                                    ? surveyId
                                    : surveyId._id;
                            const surveyRes = await fetch(
                                `/api/surveys/kitchenSurveys/viewAll/${sid}`
                            );

                            if (surveyRes.ok) {
                                const surveyData = await surveyRes.json();
                                if (surveyData.success && surveyData.data) {
                                    // Find the collection entry for this specific collection
                                    let areaIndex = 0;
                                    const collectionEntry =
                                        surveyData.data.collections?.find(
                                            (c) =>
                                                c.collectionId &&
                                                c.collectionId.toString() ===
                                                    pagination.collectionId
                                        );

                                    if (collectionEntry) {
                                        areaIndex =
                                            collectionEntry.areaIndex || 0;
                                    }

                                    surveyDetails.push({
                                        id: sid,
                                        name:
                                            surveyData.data.structure
                                                ?.structureId ||
                                            `Area ${areaIndex + 1}`,
                                        refValue:
                                            surveyData.data.refValue || "",
                                        areaIndex: areaIndex,
                                    });
                                }
                            }
                        }

                        // Sort by area index within this specific collection
                        surveyDetails.sort((a, b) => a.areaIndex - b.areaIndex);

                        setAreas(surveyDetails);
                    }
                }
            } catch (error) {
                console.error("Error fetching collection areas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [pagination.collectionId, pagination.areasList]);

    // Determine which areas list to use
    const displayAreas =
        pagination.areasList.length > 0 ? pagination.areasList : areas;
    const totalAreas = displayAreas.length;

    // Skip rendering if no areas or only one area
    if (
        loading ||
        totalAreas <= 1 ||
        !displayAreas ||
        displayAreas.length <= 1
    ) {
        console.log(
            "Pagination not shown: loading=",
            loading,
            "totalAreas=",
            totalAreas,
            "displayAreas.length=",
            displayAreas?.length || 0
        );
        return null;
    }

    // Function to save the current survey with handshake verification
    const saveCurrentSurvey = async () => {
        if (!currentSurveyId || !surveyData) {
            console.log(
                "[AreaPagination] No survey data or ID available, skipping auto-save"
            );
            return { success: true, reason: "no-data" };
        }

        setIsSaving(true);
        console.log(
            "[AreaPagination] Auto-saving current survey before navigation"
        );

        try {
            // Use the shared utility for saving with handshake
            const saveResult = await saveSurveyWithHandshake(
                currentSurveyId,
                surveyData,
                {
                    // Only include collection info if we have a valid collection ID
                    ...(pagination.collectionId
                        ? {
                              collectionId: pagination.collectionId,
                              areaIndex: pagination.currentIndex,
                          }
                        : {}),
                },
                // Progress update function
                (message, percent) => {
                    console.log(
                        `[AreaPagination] Save progress: ${message} (${percent}%)`
                    );
                },
                // Toast function
                (toastConfig) => {
                    if (toast.current) {
                        toast.current.show(toastConfig);
                    }
                },
                // Component tag for logs
                "AreaPagination"
            );

            if (!saveResult.success) {
                throw new Error(saveResult.message || "Error saving survey");
            }

            console.log("[AreaPagination] Auto-save successfully completed");
            return { success: true, data: saveResult.data };
        } catch (error) {
            console.error("[AreaPagination] Auto-save failed:", error);
            toast.current?.show({
                severity: "error",
                summary: "Auto-Save Failed",
                detail: "Could not save changes before navigation. You may lose data.",
                life: 3000,
            });
            return { success: false, error };
        } finally {
            setIsSaving(false);
        }
    };

    // Navigate to a specific area with handshake confirmation before proceeding
    const navigateToArea = async (areaId) => {
        if (isSaving || !areaId) return;

        try {
            setIsSaving(true);

            // Show saving indicator to user
            toast.current?.show({
                severity: "info",
                summary: "Saving...",
                detail: "Saving current area before navigation",
                life: 3000,
            });

            // First try to save the current survey and get confirmation
            const saveResult = await saveCurrentSurvey();

            if (!saveResult.success && saveResult.reason !== "no-data") {
                // If save failed, ask user if they want to continue anyway
                if (
                    confirm(
                        "Save failed. Continue to next area anyway? Unsaved changes will be lost."
                    )
                ) {
                    // Add delay to ensure any in-progress operations complete
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    router.push(
                        `/surveys/kitchenSurvey?id=${areaId}&collection=${pagination.collectionId}`
                    );
                } else {
                    setIsSaving(false);
                    return; // Abort navigation
                }
            } else {
                // Save succeeded! Show success and navigate
                toast.current?.show({
                    severity: "success",
                    summary: "Save Complete",
                    detail: "Changes saved successfully. Navigating to next area...",
                    life: 2000,
                });

                // CRITICAL: Add a delay before navigation to ensure all save operations complete
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Navigate to the new area with refresh flag to ensure clean loading
                router.push(
                    `/surveys/kitchenSurvey?id=${areaId}&collection=${pagination.collectionId}&refresh=true`
                );
            }
        } catch (error) {
            console.error("[AreaPagination] Navigation error:", error);
            toast.current?.show({
                severity: "error",
                summary: "Navigation Error",
                detail: error.message || "Error during navigation",
                life: 3000,
            });
            setIsSaving(false);
        }
    };

    // Navigate to previous area
    const goToPrevious = async () => {
        if (pagination.currentIndex > 0) {
            const prevArea = displayAreas[pagination.currentIndex - 1];
            if (prevArea && prevArea.id) {
                await navigateToArea(prevArea.id);
            }
        }
    };

    // Navigate to next area
    const goToNext = async () => {
        if (pagination.currentIndex < totalAreas - 1) {
            const nextArea = displayAreas[pagination.currentIndex + 1];
            if (nextArea && nextArea.id) {
                await navigateToArea(nextArea.id);
            }
        }
    };

    // Container style based on whether it should be fixed or not
    const containerStyle = {
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        padding: "0.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        ...(fixedPosition
            ? {
                  position: "fixed",
                  bottom: "1rem",
                  left: "1rem",
                  zIndex: 1000,
              }
            : {
                  margin: "1rem 0",
                  justifyContent: "center",
              }),
    };

    // Log pagination rendering for debugging
    console.log(
        "Rendering pagination with",
        displayAreas.length,
        "areas, current index:",
        pagination.currentIndex
    );

    return (
        <>
            <Toast ref={toast} />
            <div style={containerStyle}>
                <div style={{ marginRight: "1rem", fontWeight: "bold" }}>
                    Area {pagination.currentIndex + 1} of {totalAreas}
                </div>

                {/* Previous Button */}
                <button
                    onClick={goToPrevious}
                    disabled={pagination.currentIndex === 0 || isSaving}
                    style={{
                        padding: "0.5rem",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "4px 0 0 4px",
                        cursor:
                            pagination.currentIndex === 0 || isSaving
                                ? "not-allowed"
                                : "pointer",
                        opacity:
                            pagination.currentIndex === 0 || isSaving ? 0.5 : 1,
                    }}
                    aria-label="Previous Area"
                >
                    <i className="pi pi-chevron-left" />
                </button>

                {/* Area Buttons */}
                <div
                    style={{
                        padding: "0.5rem 1rem",
                        borderTop: "1px solid #ccc",
                        borderBottom: "1px solid #ccc",
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    {displayAreas.map((area, idx) => (
                        <button
                            key={idx}
                            onClick={() => area.id && navigateToArea(area.id)}
                            disabled={isSaving}
                            style={{
                                width: "30px",
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border:
                                    idx === pagination.currentIndex
                                        ? "2px solid #2196F3"
                                        : "1px solid #ccc",
                                borderRadius: "50%",
                                backgroundColor:
                                    idx === pagination.currentIndex
                                        ? "#e3f2fd"
                                        : "white",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.7 : 1,
                            }}
                            aria-label={`Go to Area ${idx + 1}`}
                            title={area.name || `Area ${idx + 1}`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={goToNext}
                    disabled={
                        pagination.currentIndex >= totalAreas - 1 || isSaving
                    }
                    style={{
                        padding: "0.5rem",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "0 4px 4px 0",
                        cursor:
                            pagination.currentIndex >= totalAreas - 1 ||
                            isSaving
                                ? "not-allowed"
                                : "pointer",
                        opacity:
                            pagination.currentIndex >= totalAreas - 1 ||
                            isSaving
                                ? 0.5
                                : 1,
                    }}
                    aria-label="Next Area"
                >
                    <i className="pi pi-chevron-right" />
                </button>
            </div>
        </>
    );
}
