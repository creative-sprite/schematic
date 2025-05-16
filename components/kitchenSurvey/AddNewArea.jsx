// components/kitchenSurvey/AddNewArea.jsx
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { saveSurveyWithHandshake } from "./save/SurveySaveUtil";
// Import the ID generation functions from the new component
import { generateUniqueId, generateNewRefId } from "../collection/collectionID";

export default function AddNewArea({
    surveyId,
    // NEW: Add consolidated survey data prop
    surveyData,
    // Keep existing props for backward compatibility
    refValue,
    structureId,
    siteDetails,
    collectionId,
    operations,
    access,
    equipment,
    notes,
    ventilation,
    onAreaAdded,
    surveyDate,
    contacts,
    primaryContactIndex,
    walkAroundContactIndex,
    parking,
}) {
    const router = useRouter();
    const toast = useRef(null);
    const [isAddingArea, setIsAddingArea] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    // Add loading progress states
    const [showProgressOverlay, setShowProgressOverlay] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressValue, setProgressValue] = useState(0);

    // Function to save the current area before creating a new one
    const saveCurrentArea = async () => {
        if (!surveyId) {
            console.log(
                "[AddNewArea] No current survey to save, skipping save step"
            );
            return { success: true, reason: "no-survey" };
        }

        try {
            setProgressMessage("Saving current area...");
            setProgressValue(10);

            console.log(
                "[AddNewArea] Saving current area data before creating new area"
            );

            // Debug log to verify complete data is being passed
            console.log("[AddNewArea] Complete survey data being saved:", {
                hasStructureData: !!surveyData?.structureSelectionData,
                hasEquipmentData:
                    !!surveyData?.surveyData && surveyData.surveyData.length,
                hasCanopyData:
                    !!surveyData?.canopyEntries &&
                    surveyData.canopyEntries.length,
                hasSchematicData:
                    !!surveyData?.placedItems && surveyData.placedItems.length,
                totalFields: Object.keys(surveyData || {}).length,
            });

            // Use the shared utility for saving with handshake
            const saveResult = await saveSurveyWithHandshake(
                surveyId,
                surveyData, // Use the complete consolidated data object
                {
                    // Additional data
                    collectionId: collectionId,
                    contacts: contacts.map((contact, index) => ({
                        ...contact,
                        isPrimaryContact: index === primaryContactIndex,
                        isWalkAroundContact: index === walkAroundContactIndex,
                    })),
                },
                // Progress update function
                (message, percent) => {
                    setProgressMessage(message);
                    setProgressValue(Math.min(40, 10 + percent * 0.3)); // Map to 10-40% of our overall progress
                },
                // Toast function
                (toastConfig) => {
                    if (toast.current) {
                        toast.current.show(toastConfig);
                    }
                },
                // Component tag for logs
                "AddNewArea"
            );

            if (!saveResult.success && !saveResult.forced) {
                // Ask user if they want to continue despite the save failure
                const userConfirmed = window.confirm(
                    "Failed to save current area. Continue creating new area anyway? Current changes may be lost."
                );

                return {
                    success: userConfirmed,
                    forced: true,
                    error: new Error(saveResult.message || "Save failed"),
                };
            }

            console.log("[AddNewArea] Current area saved successfully");
            setProgressValue(40);
            return { success: true, data: saveResult.data };
        } catch (error) {
            console.error("[AddNewArea] Failed to save current area:", error);

            // Ask user if they want to continue despite the error
            const userConfirmed = window.confirm(
                "Error saving current area. Continue creating new area anyway? Current changes may be lost."
            );

            return {
                success: userConfirmed,
                forced: true,
                error,
            };
        }
    };

    const handleAddNewArea = async () => {
        // If already adding, ignore clicks
        if (isAddingArea) {
            console.log(
                "[AddNewArea] Already adding a new area - ignoring click"
            );
            return;
        }

        // Enhanced validation - require site selection
        if (!siteDetails || (!siteDetails._id && !siteDetails.id)) {
            toast.current.show({
                severity: "error",
                summary: "Missing Site",
                detail: "Please select a site before adding a new area",
                life: 5000,
            });
            return;
        }

        setIsAddingArea(true);
        setShowProgressOverlay(true);
        setProgressValue(5);
        setProgressMessage("Starting process...");

        try {
            // STEP 0: First save the current area with handshake verification
            if (surveyId) {
                const saveResult = await saveCurrentArea();

                if (!saveResult.success && !saveResult.forced) {
                    throw new Error(
                        "Failed to save current area - process aborted"
                    );
                }

                console.log(
                    "[AddNewArea] Current area saved or save skipped, proceeding to create new area"
                );
            }

            // Track current step for progress updates
            let currentStep = 0;
            const totalSteps = 5; // Full process with collection handling
            const updateProgress = (message) => {
                currentStep++;
                const percent = Math.min(
                    Math.floor((currentStep / totalSteps) * 100),
                    95
                );
                setProgressValue(percent);
                setProgressMessage(message);
            };

            // STEP 1: First, ensure we have a collection
            let currentCollectionId = collectionId;

            // Log the collection status for debugging
            console.log(
                `[AddNewArea] Current collection ID: ${currentCollectionId}`
            );

            // If we don't have a collection ID, we need to get it or create one
            if (!currentCollectionId) {
                updateProgress("Checking for collection...");

                // First check if the survey has a collection we don't know about
                if (surveyId) {
                    try {
                        const surveyRes = await fetch(
                            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                        );
                        if (surveyRes.ok) {
                            const surveyJson = await surveyRes.json();
                            if (
                                surveyJson.success &&
                                surveyJson.data &&
                                surveyJson.data.collectionId
                            ) {
                                currentCollectionId =
                                    surveyJson.data.collectionId;
                                console.log(
                                    `[AddNewArea] Found collection ID from survey: ${currentCollectionId}`
                                );
                            }
                        }
                    } catch (error) {
                        console.warn(
                            "Could not check for existing collection:",
                            error
                        );
                    }
                }

                // If we still don't have a collection, create one
                if (!currentCollectionId) {
                    updateProgress("Creating new collection...");

                    const collectionData = {
                        collectionRef: refValue || "Survey Collection",
                        name: `${structureId || "Area"} Collection`,
                        site: siteDetails._id || siteDetails.id,
                        surveys: surveyId ? [surveyId] : [], // Include current survey if it exists
                        totalAreas: surveyId ? 1 : 0,
                    };

                    const collRes = await fetch("/api/surveys/collections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(collectionData),
                    });

                    if (!collRes.ok) {
                        throw new Error(
                            "Failed to create collection - please try again"
                        );
                    }

                    const collJson = await collRes.json();
                    if (!collJson.success) {
                        throw new Error(
                            collJson.message || "Failed to create collection"
                        );
                    }

                    currentCollectionId = collJson.data._id;
                    console.log(
                        `[AddNewArea] Collection created with ID: ${currentCollectionId}`
                    );

                    // If we have a survey ID but had to create a new collection,
                    // make sure the survey is associated with the collection
                    if (surveyId) {
                        try {
                            await fetch(
                                `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        collectionId: currentCollectionId,
                                        areaIndex: 0,
                                    }),
                                }
                            );
                            console.log(
                                `[AddNewArea] Updated survey ${surveyId} with new collection ID`
                            );
                        } catch (error) {
                            console.warn(
                                "Warning: Could not update existing survey with collection ID:",
                                error
                            );
                        }
                    }
                }
            }

            // STEP 2: Get the next area index (for an existing collection or the new one we created)
            updateProgress("Determining area position...");

            let nextAreaIndex = 0;
            if (currentCollectionId) {
                try {
                    const collInfoRes = await fetch(
                        `/api/surveys/collections/${currentCollectionId}`
                    );
                    if (collInfoRes.ok) {
                        const collInfoJson = await collInfoRes.json();
                        if (
                            collInfoJson.success &&
                            collInfoJson.data &&
                            Array.isArray(collInfoJson.data.surveys)
                        ) {
                            nextAreaIndex = collInfoJson.data.surveys.length;
                            console.log(
                                `[AddNewArea] Next area index will be ${nextAreaIndex}`
                            );
                        }
                    }
                } catch (error) {
                    console.warn(
                        "Could not determine precise area index, using default"
                    );
                }
            }

            // STEP 3: Create the new area with reference to the collection
            updateProgress("Generating new area...");
            const newRefId = await generateNewRefId(refValue);

            // Generate a unique timestamp for the area
            const timestamp = new Date().toLocaleTimeString();
            const newAreaName = `New Area ${nextAreaIndex + 1} (${timestamp})`;

            // Create new area with collection reference
            updateProgress("Creating new area...");

            // IMPORTANT: Create an explicitly new, empty canopy comments object
            const emptyCanopyComments = {};

            // IMPORTANT: Create explicitly empty schematic objects
            const emptySchematic = {
                accessDoorPrice: 0,
                ventilationPrice: 0,
                airPrice: 0,
                fanPartsPrice: 0,
                airInExTotal: 0,
                schematicItemsTotal: 0,
                selectedGroupId: newAreaName,
                gridSpaces: 26,
                cellSize: 40,
                accessDoorSelections: {},
                flexiDuctSelections: {},
                fanGradeSelections: {},
                placedItems: [], // Explicitly empty array
                specialItems: [], // Explicitly empty array
            };

            // Log to confirm these are properly empty
            console.log(
                "[AddNewArea] Creating new area with EMPTY schematic:",
                {
                    schematic: emptySchematic,
                    canopyComments: emptyCanopyComments,
                }
            );

            const newSurveyPayload = {
                // Basic info
                refValue: newRefId,
                surveyDate: surveyDate || new Date(),
                site: {
                    _id: siteDetails._id || siteDetails.id,
                },
                contacts: contacts.map((contact, index) => ({
                    ...contact,
                    isPrimaryContact: index === primaryContactIndex,
                    isWalkAroundContact: index === walkAroundContactIndex,
                })),

                // Collection data - explicitly include collection ID
                collectionId: currentCollectionId,
                areaIndex: nextAreaIndex,

                // General info - copy from current survey
                general: {
                    surveyType:
                        operations?.typeOfCooking || "Kitchen Deep Clean",
                    parking: parking || "",
                    dbs: access?.dbs || "Not Required",
                    permit: access?.permit || "No",
                },

                // FIXED: Set up structure with default types (Ceiling, Wall, Floor)
                structure: {
                    structureId: newAreaName,
                    structureTotal: 0,
                    selectionData: [
                        { type: "Ceiling", item: "", grade: "" },
                        { type: "Wall", item: "", grade: "" },
                        { type: "Floor", item: "", grade: "" },
                    ],
                    dimensions: {
                        length: 0,
                        width: 0,
                        height: 0,
                    },
                    structureComments: "",
                },

                // Initialize with empty arrays/objects - IMPORTANT: MUST BE EMPTY
                equipmentSurvey: {
                    entries: [], // Empty array
                    subcategoryComments: {}, // Empty object
                },
                specialistEquipmentSurvey: {
                    entries: [], // Empty array
                    categoryComments: {}, // Empty object
                },

                // Use explicitly empty canopy entries and comments
                canopySurvey: {
                    entries: [],
                    comments: emptyCanopyComments, // Using explicitly created empty object
                },

                // IMPORTANT: Only copy settings, not content or comments
                specialistEquipment: {
                    // Reset everything to defaults
                    acroPropsToggle: "No",
                    loftBoardsToggle: "No",
                    scaffBoardsToggle: "No",
                    laddersToggle: "No",
                    mobileScaffoldTower: "No",
                    flexiHose: "No",
                    flexiHoseCircumference: "",
                    flexiHoseLength: "",
                    mewp: "No",
                    categoryComments: {}, // Empty object
                },

                // Use explicitly empty schematic object
                schematic: emptySchematic,

                // IMPORTANT: Reset ventilation data - don't copy over
                ventilationInfo: {
                    obstructionsToggle: "No",
                    obstructionsText: "",
                    obstructionsManualText: "",
                    obstructionsOptions: [],
                    damageToggle: "No",
                    damageText: "",
                    damageManualText: "",
                    damageOptions: [],
                    inaccessibleAreasToggle: "No",
                    inaccessibleAreasText: "",
                    inaccessibleAreasManualText: "",
                    inaccessibleAreasOptions: [],
                    clientActionsToggle: "No",
                    clientActionsText: "",
                    clientActionsManualText: "",
                    clientActionsOptions: [],
                    description: "",
                    accessLocations: [],
                },

                // IMPORTANT: Reset access data - don't copy over specific fields
                access: {
                    inductionNeeded: "No", // Reset to default
                    inductionDetails: "",
                    maintenanceEngineer: "No", // Reset to default
                    maintenanceContact: "",
                    mechanicalEngineer: "No", // Reset to default
                    mechanicalEngineerDetails: "",
                    electricalEngineer: "No", // Reset to default
                    electricalContact: "",
                    systemIsolated: "No", // Reset to default
                    roofAccess: "No", // Reset to default
                    roofAccessDetails: "",
                    wasteTankToggle: "No", // Reset to default
                    wasteTankSelection: "No", // Reset to default
                    wasteTankDetails: "",
                    keysrequired: "No", // Reset to default
                    keysContact: "",
                    permitToWork: "No", // Reset to default
                    ppeToggle: "No", // Reset to default
                    ppeMulti: [], // Empty array
                    frequencyOfService: "",
                    manning: "",
                    wasteManagementRequired: "No", // Reset to default
                    wasteManagementDetails: "",
                    otherComments: "",
                    dbs: "Not Required", // Explicitly set default
                    permit: "No", // Explicitly set default
                },

                // IMPORTANT: Copy operations data from original survey
                operations: {
                    // Copy values from existing operations
                    patronDisruption: operations?.patronDisruption || "No",
                    patronDisruptionDetails:
                        operations?.patronDisruptionDetails || "",
                    operationalHours: operations?.operationalHours || {
                        weekdays: { start: "", end: "" },
                        weekend: { start: "", end: "" },
                    },
                    typeOfCooking: operations?.typeOfCooking || "",
                    coversPerDay: operations?.coversPerDay || "",
                    bestServiceTime: operations?.bestServiceTime || "",
                    bestServiceDay: operations?.bestServiceDay || "Weekdays",
                    eightHoursAvailable:
                        operations?.eightHoursAvailable || "No",
                    eightHoursAvailableDetails:
                        operations?.eightHoursAvailableDetails || "",
                    serviceDue: operations?.serviceDue || null,
                    approxServiceDue: operations?.approxServiceDue || false,
                },

                // IMPORTANT: Copy notes data from original survey
                notes: {
                    obstructions: notes?.obstructions || [],
                    comments: notes?.comments || "",
                    previousIssues: notes?.previousIssues || "",
                    damage: notes?.damage || "",
                    inaccessibleAreas: notes?.inaccessibleAreas || "",
                    clientActions: notes?.clientActions || "",
                    accessLocations: notes?.accessLocations || "",
                    clientNeedsDocument: notes?.clientNeedsDocument || "No",
                    documentDetails: notes?.documentDetails || "",
                },

                // Empty totals - explicitly reset everything
                totals: {
                    mainArea: {
                        structureTotal: 0,
                        equipmentTotal: 0,
                        canopyTotal: 0,
                        accessDoorPrice: 0,
                        ventilationPrice: 0,
                        airPrice: 0,
                        fanPartsPrice: 0,
                        airInExTotal: 0,
                        schematicItemsTotal: 0,
                        modify: 0,
                        groupingId: newAreaName,
                    },
                    duplicatedAreas: [], // Explicitly empty array
                    grandTotal: {
                        structureTotal: 0,
                        equipmentTotal: 0,
                        canopyTotal: 0,
                        accessDoorPrice: 0,
                        ventilationPrice: 0,
                        airPrice: 0,
                        fanPartsPrice: 0,
                        airInExTotal: 0,
                        schematicItemsTotal: 0,
                    },
                    modify: 0,
                },

                // Empty images
                images: {
                    Structure: [],
                    Equipment: [],
                    Canopy: [],
                    Ventilation: [],
                },

                // Explicitly mark as a new area with no duplications or parent/child references
                duplicatedAreas: [],
            };

            // Create the new area
            console.log(
                `[AddNewArea] Creating new survey with collection ID ${currentCollectionId}`
            );
            const res = await fetch("/api/surveys/kitchenSurveys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSurveyPayload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(
                    `Failed to create new area: ${res.status} - ${errorText}`
                );
                throw new Error(`Failed to create new area: ${res.status}`);
            }

            const json = await res.json();

            if (json.success) {
                // Get the new survey ID
                const newSurveyId = json.data._id;
                console.log(
                    `[AddNewArea] Created new survey with ID ${newSurveyId}`
                );

                // STEP 4: Verify the collection relationship is properly established
                updateProgress("Finalizing collection relationship...");
                setProgressValue(70);

                if (currentCollectionId) {
                    try {
                        // Verify that the survey was added to the collection
                        const verifyRes = await fetch(
                            `/api/surveys/collections/${currentCollectionId}`
                        );
                        if (verifyRes.ok) {
                            const verifyJson = await verifyRes.json();

                            // If for some reason the survey isn't in the collection, add it explicitly
                            if (
                                verifyJson.success &&
                                verifyJson.data &&
                                Array.isArray(verifyJson.data.surveys) &&
                                !verifyJson.data.surveys.some(
                                    (s) =>
                                        s._id === newSurveyId ||
                                        (typeof s === "string" &&
                                            s === newSurveyId)
                                )
                            ) {
                                console.log(
                                    `[AddNewArea] Survey not found in collection - adding explicitly`
                                );

                                // Add the survey to the collection
                                const addRes = await fetch(
                                    `/api/surveys/collections/${currentCollectionId}`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            surveyId: newSurveyId,
                                            areaIndex: nextAreaIndex,
                                        }),
                                    }
                                );

                                if (addRes.ok) {
                                    console.log(
                                        `[AddNewArea] Successfully added survey to collection explicitly`
                                    );
                                }
                            } else {
                                console.log(
                                    `[AddNewArea] Survey already found in collection, no need to add explicitly`
                                );
                            }
                        }
                    } catch (error) {
                        console.warn(
                            "Warning: Verification of collection membership failed, but continuing anyway",
                            error
                        );
                    }
                }

                // STEP 5: Perform a final verification to ensure the new area exists
                updateProgress("Verifying new area creation...");
                setProgressValue(80);

                try {
                    // Verify the new survey exists and contains the correct data
                    const verifyNewRes = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${newSurveyId}`
                    );

                    if (!verifyNewRes.ok) {
                        console.warn(
                            `[AddNewArea] New area verification failed with status: ${verifyNewRes.status}`
                        );
                    } else {
                        const verifyNewJson = await verifyNewRes.json();
                        if (verifyNewJson.success && verifyNewJson.data) {
                            console.log(
                                `[AddNewArea] New area verified successfully: ${newSurveyId}`
                            );

                            // EXTRA VERIFICATION: Check that schematic and canopy are empty
                            const verifiedData = verifyNewJson.data;
                            console.log(
                                "[AddNewArea] Verification of empty fields:",
                                {
                                    schematicPlacedItems:
                                        verifiedData.schematic?.placedItems
                                            ?.length || 0,
                                    canopyComments: Object.keys(
                                        verifiedData.canopySurvey?.comments ||
                                            {}
                                    ).length,
                                }
                            );

                            setProgressValue(90);
                        }
                    }
                } catch (error) {
                    console.warn(
                        "Warning: Final verification failed, but continuing:",
                        error
                    );
                }

                // Store essential collection data as a fallback
                localStorage.setItem(
                    "surveyCollectionFallback",
                    JSON.stringify({
                        newSurveyId,
                        collectionId: currentCollectionId,
                        areaIndex: nextAreaIndex,
                        timestamp: Date.now(),
                        previousSurveyId: surveyId,
                    })
                );

                // Show success message
                toast.current.show({
                    severity: "success",
                    summary: "New Area Created",
                    detail: "Successfully created new area. Navigating now...",
                    life: 3000,
                });

                // If callback provided, call it with new area info
                if (typeof onAreaAdded === "function") {
                    onAreaAdded({
                        newSurveyId,
                        collectionId: currentCollectionId,
                        areaIndex: nextAreaIndex,
                    });
                }

                // STEP 6: Navigate to the new area
                // Add a delay before navigation to allow database operations to complete
                updateProgress("Preparing for navigation...");
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setProgressValue(100);

                // Navigate to the new area with refresh flag to ensure proper loading
                console.log(
                    `[AddNewArea] Navigating to new survey ${newSurveyId} in collection ${currentCollectionId}`
                );
                router.push(
                    `/surveys/kitchenSurvey?id=${newSurveyId}&collection=${currentCollectionId}&refresh=true`
                );

                // Note: We're keeping the overlay visible until navigation completes
            } else {
                throw new Error(
                    json.message || "Failed to create new area survey"
                );
            }
        } catch (error) {
            console.error("[AddNewArea] Error creating new area:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Error creating new area",
                life: 5000,
            });
            setIsAddingArea(false);
            setShowProgressOverlay(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />

            {/* Progress overlay */}
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
                        <h2>Adding New Area</h2>
                        <p>{progressMessage}</p>
                        <ProgressBar
                            value={progressValue}
                            showValue={true}
                            style={{ height: "20px", marginBottom: "1rem" }}
                        />
                        <p style={{ textAlign: "center", fontStyle: "italic" }}>
                            Please wait while we prepare your new area...
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleAddNewArea}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isAddingArea}
                style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    backgroundColor: isHovered ? "#4caf50" : "#2e7d32",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isAddingArea ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: isAddingArea ? 0.7 : 1,
                }}
            >
                {isAddingArea && (
                    <i
                        className="pi pi-spin pi-spinner"
                        style={{ fontSize: "1.2rem" }}
                    ></i>
                )}
                + Add New Area
            </button>
        </>
    );
}
