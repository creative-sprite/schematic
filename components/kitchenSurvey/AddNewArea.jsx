// components/kitchenSurvey/AddNewArea.jsx
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { saveSurveyWithHandshake } from "./save/SurveySaveUtil";
// Import the ID generation functions from the new component
import { generateUniqueId, generateNewRefId } from "./collection/collectionID";

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
    // NEW: Add support for multiple collections
    collections = [],
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
                    // MULTI-COLLECTION: Pass collections array if available
                    ...(collections.length > 0
                        ? { collections }
                        : {
                              // For backward compatibility if no collections array
                              collectionId: collectionId,
                              contacts: contacts.map((contact, index) => ({
                                  ...contact,
                                  isPrimaryContact:
                                      index === primaryContactIndex,
                                  isWalkAroundContact:
                                      index === walkAroundContactIndex,
                              })),
                          }),
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

            // STEP 1: First, ensure we have at least one collection
            // MULTI-COLLECTION: Handle multiple collections - first gather all collections
            let existingCollections = [];
            let primaryCollectionId = null;

            // Check if we have collections passed as prop (new approach)
            if (collections && collections.length > 0) {
                existingCollections = [...collections];
                // Find primary collection if any exists
                const primaryCollection = collections.find((c) => c.isPrimary);
                if (primaryCollection) {
                    primaryCollectionId =
                        primaryCollection.id || primaryCollection.collectionId;
                }
                console.log(
                    `[AddNewArea] Using ${existingCollections.length} collections passed as prop`
                );
            }
            // Fall back to single collectionId for backward compatibility
            else if (collectionId) {
                existingCollections = [
                    {
                        id: collectionId,
                        collectionId: collectionId,
                        isPrimary: true,
                    },
                ];
                primaryCollectionId = collectionId;
                console.log(
                    `[AddNewArea] Using single collection ID: ${collectionId}`
                );
            }

            // Log the collection status for debugging
            console.log(
                `[AddNewArea] Found ${existingCollections.length} existing collections, primary: ${primaryCollectionId}`
            );

            // If we don't have any collections, we need to get them or create one
            if (existingCollections.length === 0) {
                updateProgress("Checking for collection...");

                // First check if the survey has collections we don't know about
                if (surveyId) {
                    try {
                        const surveyRes = await fetch(
                            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                        );
                        if (surveyRes.ok) {
                            const surveyJson = await surveyRes.json();
                            if (surveyJson.success && surveyJson.data) {
                                // MULTI-COLLECTION: Check for collections array first (new approach)
                                if (
                                    surveyJson.data.collections &&
                                    Array.isArray(
                                        surveyJson.data.collections
                                    ) &&
                                    surveyJson.data.collections.length > 0
                                ) {
                                    existingCollections =
                                        surveyJson.data.collections.map(
                                            (coll) => ({
                                                id: coll.collectionId,
                                                collectionId: coll.collectionId,
                                                collectionRef:
                                                    coll.collectionRef,
                                                areaIndex: coll.areaIndex,
                                                isPrimary: coll.isPrimary,
                                            })
                                        );

                                    // Find the primary collection
                                    const primaryColl =
                                        existingCollections.find(
                                            (c) => c.isPrimary
                                        );
                                    if (primaryColl) {
                                        primaryCollectionId =
                                            primaryColl.id ||
                                            primaryColl.collectionId;
                                    } else if (existingCollections.length > 0) {
                                        // Use first collection as primary if none marked
                                        primaryCollectionId =
                                            existingCollections[0].id ||
                                            existingCollections[0].collectionId;
                                    }

                                    console.log(
                                        `[AddNewArea] Found ${existingCollections.length} collections from survey`
                                    );
                                }
                                // Fall back to single collectionId (backward compatibility)
                                else if (surveyJson.data.collectionId) {
                                    primaryCollectionId =
                                        surveyJson.data.collectionId;
                                    existingCollections = [
                                        {
                                            id: primaryCollectionId,
                                            collectionId: primaryCollectionId,
                                            collectionRef:
                                                surveyJson.data.collectionRef ||
                                                "",
                                            areaIndex:
                                                surveyJson.data.areaIndex || 0,
                                            isPrimary: true,
                                        },
                                    ];
                                    console.log(
                                        `[AddNewArea] Found single collection ID from survey: ${primaryCollectionId}`
                                    );
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(
                            "Could not check for existing collections:",
                            error
                        );
                    }
                }

                // If we still don't have a collection, create one
                if (existingCollections.length === 0) {
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

                    primaryCollectionId = collJson.data._id;
                    existingCollections = [
                        {
                            id: primaryCollectionId,
                            collectionId: primaryCollectionId,
                            collectionRef: collectionData.collectionRef,
                            areaIndex: 0,
                            isPrimary: true,
                        },
                    ];

                    console.log(
                        `[AddNewArea] Created new collection with ID: ${primaryCollectionId}`
                    );

                    // If we have a survey ID but had to create a new collection,
                    // make sure the survey is associated with the collection
                    if (surveyId) {
                        try {
                            // MULTI-COLLECTION: Use collections array approach
                            const surveyRes = await fetch(
                                `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                            );

                            if (surveyRes.ok) {
                                const surveyJson = await surveyRes.json();
                                if (surveyJson.success && surveyJson.data) {
                                    // Get existing collections
                                    const existingColls =
                                        surveyJson.data.collections || [];

                                    // Add the new collection to the list
                                    existingColls.push({
                                        collectionId: primaryCollectionId,
                                        areaIndex: 0,
                                        collectionRef:
                                            collectionData.collectionRef,
                                        isPrimary: true,
                                    });

                                    // Update the survey with the combined collections
                                    await fetch(
                                        `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                                        {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                collections: existingColls,
                                            }),
                                        }
                                    );

                                    console.log(
                                        `[AddNewArea] Updated survey ${surveyId} with collection in collections array`
                                    );
                                }
                            }
                        } catch (error) {
                            console.warn(
                                "Warning: Could not update existing survey with collection ID:",
                                error
                            );
                        }
                    }
                }
            }

            // MULTI-COLLECTION: Now with multiple collections, handle determining area indices
            updateProgress("Determining area positions...");

            // Arrays to store next area indices and final collections array
            const nextAreaIndices = {};
            const finalCollections = [];

            // Process each collection to get next available area index
            for (const collection of existingCollections) {
                const collectionId = collection.id || collection.collectionId;

                try {
                    // Get information about this collection
                    const collInfoRes = await fetch(
                        `/api/surveys/collections/${collectionId}`
                    );

                    if (collInfoRes.ok) {
                        const collInfoJson = await collInfoRes.json();
                        if (
                            collInfoJson.success &&
                            collInfoJson.data &&
                            Array.isArray(collInfoJson.data.surveys)
                        ) {
                            // Store the next available index
                            nextAreaIndices[collectionId] =
                                collInfoJson.data.surveys.length;

                            // Add to final collections with determined areaIndex
                            finalCollections.push({
                                collectionId: collectionId,
                                areaIndex: collInfoJson.data.surveys.length,
                                collectionRef:
                                    collInfoJson.data.collectionRef ||
                                    collection.collectionRef ||
                                    "",
                                isPrimary: collection.isPrimary,
                            });

                            console.log(
                                `[AddNewArea] Collection ${collectionId}: next area index will be ${nextAreaIndices[collectionId]}`
                            );
                        }
                    }
                } catch (error) {
                    console.warn(
                        `Could not determine precise area index for collection ${collectionId}, using default`,
                        error
                    );

                    // Use a fallback index if fetch fails
                    nextAreaIndices[collectionId] = 0;

                    // Still add to final collections with fallback areaIndex
                    finalCollections.push({
                        collectionId: collectionId,
                        areaIndex: 0,
                        collectionRef: collection.collectionRef || "",
                        isPrimary: collection.isPrimary,
                    });
                }
            }

            // Ensure at least one collection is marked as primary
            if (
                finalCollections.length > 0 &&
                !finalCollections.some((c) => c.isPrimary)
            ) {
                finalCollections[0].isPrimary = true;
            }

            // STEP 3: Create the new area with reference to the collections
            updateProgress("Generating new area...");
            const newRefId = await generateNewRefId(refValue);

            // Generate a unique timestamp for the area
            const timestamp = new Date().toLocaleTimeString();
            const newAreaName = `New Area (${timestamp})`;

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

                // MULTI-COLLECTION: Use collections array instead of single collectionId
                collections: finalCollections,

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
                    bestServiceDay: operations?.bestServiceDay || "",
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
                `[AddNewArea] Creating new survey with ${finalCollections.length} collections`
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

                // STEP 4: Verify the collection relationships are properly established
                updateProgress("Finalizing collection relationships...");
                setProgressValue(70);

                // MULTI-COLLECTION: Verify all collection relationships
                let verificationSuccess = true;

                for (const collection of finalCollections) {
                    try {
                        // Verify that the survey was added to this collection
                        const verifyRes = await fetch(
                            `/api/surveys/collections/${collection.collectionId}`
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
                                    `[AddNewArea] Survey not found in collection ${collection.collectionId} - adding explicitly`
                                );

                                // Add the survey to the collection
                                const addRes = await fetch(
                                    `/api/surveys/collections/${collection.collectionId}`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            surveyId: newSurveyId,
                                            areaIndex: collection.areaIndex,
                                            isPrimary: collection.isPrimary,
                                        }),
                                    }
                                );

                                if (addRes.ok) {
                                    console.log(
                                        `[AddNewArea] Successfully added survey to collection ${collection.collectionId} explicitly`
                                    );
                                } else {
                                    console.warn(
                                        `[AddNewArea] Failed to add survey to collection ${collection.collectionId} explicitly`
                                    );
                                    verificationSuccess = false;
                                }
                            } else {
                                console.log(
                                    `[AddNewArea] Survey already found in collection ${collection.collectionId}, no need to add explicitly`
                                );
                            }
                        }
                    } catch (error) {
                        console.warn(
                            `[AddNewArea] Verification of collection ${collection.collectionId} membership failed:`,
                            error
                        );
                        verificationSuccess = false;
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
                                    collections:
                                        verifiedData.collections?.length || 0,
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

                // Find the primary collection for navigation
                let navigateCollectionId = null;
                if (finalCollections.length > 0) {
                    const primaryCollection = finalCollections.find(
                        (c) => c.isPrimary
                    );
                    navigateCollectionId = primaryCollection
                        ? primaryCollection.collectionId
                        : finalCollections[0].collectionId;
                } else if (primaryCollectionId) {
                    navigateCollectionId = primaryCollectionId;
                }

                // Store essential collection data as a fallback
                localStorage.setItem(
                    "surveyCollectionFallback",
                    JSON.stringify({
                        newSurveyId,
                        collectionId: navigateCollectionId,
                        collections: finalCollections,
                        areaIndex:
                            navigateCollectionId &&
                            nextAreaIndices[navigateCollectionId]
                                ? nextAreaIndices[navigateCollectionId]
                                : 0,
                        timestamp: Date.now(),
                        previousSurveyId: surveyId,
                    })
                );

                // Show success message
                toast.current?.show({
                    severity: "success",
                    summary: "New Area Created",
                    detail: "Successfully created new area. Navigating now...",
                    life: 3000,
                });

                // If callback provided, call it with new area info
                if (typeof onAreaAdded === "function") {
                    onAreaAdded({
                        newSurveyId,
                        collections: finalCollections,
                        primaryCollectionId: navigateCollectionId,
                        areaIndex:
                            navigateCollectionId &&
                            nextAreaIndices[navigateCollectionId]
                                ? nextAreaIndices[navigateCollectionId]
                                : 0,
                    });
                }

                // STEP 6: Navigate to the new area
                // Add a delay before navigation to allow database operations to complete
                updateProgress("Preparing for navigation...");
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setProgressValue(100);

                // Navigate to the new area with refresh flag to ensure proper loading
                console.log(
                    `[AddNewArea] Navigating to new survey ${newSurveyId} in collection ${navigateCollectionId}`
                );
                router.push(
                    `/surveys/kitchenSurvey?id=${newSurveyId}&collection=${navigateCollectionId}&refresh=true`
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
