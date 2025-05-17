// components/kitchenSurvey/surveyDataLoading.jsx
"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Helper functions for REF ID generation
 */
function generateNextRefId(lastRefId = "") {
    // If no previous refId, start with "A"
    if (!lastRefId) {
        return "A"; // Start with A if nothing provided
    }

    // Convert to uppercase to ensure consistency
    lastRefId = lastRefId.toUpperCase();

    // Convert the string to an array of characters
    const chars = lastRefId.split("");

    // Start from the rightmost character and increment
    let index = chars.length - 1;
    let carry = true;

    while (carry && index >= 0) {
        // If current char is Z, reset to A and carry over
        if (chars[index] === "Z") {
            chars[index] = "A";
            carry = true;
        } else {
            // Otherwise, increment the character
            chars[index] = String.fromCharCode(chars[index].charCodeAt(0) + 1);
            carry = false;
        }
        index--;
    }

    // If we still have a carry, we need to add another "A" at the beginning
    if (carry) {
        chars.unshift("A");
    }

    return chars.join("");
}

function generateRefValue(lastRefId = "") {
    // Generate a random 6-digit number
    const randomNum = Math.floor(100000 + Math.random() * 900000);

    // Get the next reference ID
    const nextRefId = generateNextRefId(lastRefId);

    // Combine them
    return `${randomNum}${nextRefId}`;
}

// Consistent utility for generating Cloudinary URLs
const getCloudinaryUrl = (publicId) => {
    const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnu5hunya";
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
};

/**
 * Custom hook for loading survey data with simplified image handling
 * UPDATED to remove parent-child area structure
 */
export default function useSurveyDataLoader(surveyId, siteIdParam, toast) {
    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Survey date state
    const [surveyDate, setSurveyDate] = useState(new Date());
    const [refValue, setRefValue] = useState("");

    // Dedicated parking state
    const [parking, setParking] = useState("");

    // Survey images state - standardized location
    const [surveyImages, setSurveyImages] = useState({
        Structure: [],
        Equipment: [],
        Canopy: [],
        Ventilation: [],
    });

    // States for equipment data in the main area
    const [surveyData, setSurveyData] = useState([]);
    const [equipmentItems, setEquipmentItems] = useState([]);

    // State for specialist equipment
    const [specialistEquipmentData, setSpecialistEquipmentData] = useState([]);
    const [specialistEquipmentId, setSpecialistEquipmentId] = useState("");
    // State to store the full specialistEquipmentSurvey object
    const [
        initialSpecialistEquipmentSurvey,
        setInitialSpecialistEquipmentSurvey,
    ] = useState({
        entries: [],
        categoryComments: {},
    });

    // Structure data
    const [structureTotal, setStructureTotal] = useState(0);
    const [structureSelectionData, setStructureSelectionData] = useState([]);
    const [structureDimensions, setStructureDimensions] = useState({});
    const [structureComments, setStructureComments] = useState("");

    // Canopy data
    const [canopyTotal, setCanopyTotal] = useState(0);
    const [canopyEntries, setCanopyEntries] = useState([]);
    // Add canopy comments state
    const [canopyComments, setCanopyComments] = useState({});

    // Schematic-based partial costs in the main area
    const [accessDoorPrice, setAccessDoorPrice] = useState(0);
    const [ventilationPrice, setVentilationPrice] = useState(0);
    const [airPrice, setAirPrice] = useState(0);
    const [fanPartsPrice, setFanPartsPrice] = useState(0);
    const [airInExTotal, setAirInExTotal] = useState(0);
    const [selectedGroupId, setSelectedGroupId] = useState("");

    // Site Details
    const [siteDetails, setSiteDetails] = useState({
        siteName: "",
        addresses: [
            {
                addressNameNumber: "",
                addressLine1: "",
                addressLine2: "",
                town: "",
                county: "",
                postCode: "",
            },
        ],
    });

    // IDs for grouping totals in the main area
    const [structureId, setStructureId] = useState("");
    const [equipmentId, setEquipmentId] = useState("");
    const [canopyId, setCanopyId] = useState("");

    // For PriceTables modification factor
    const [modify, setModify] = useState(0);

    // We'll store the total price of *all schematic items* in the main area here
    const [schematicItemsTotal, setSchematicItemsTotal] = useState(0);

    // Schematic visual data states
    const [placedItems, setPlacedItems] = useState([]);
    const [specialItems, setSpecialItems] = useState([]);
    const [gridSpaces, setGridSpaces] = useState(26);
    const [cellSize, setCellSize] = useState(40);
    const [flexiDuctSelections, setFlexiDuctSelections] = useState({});
    const [accessDoorSelections, setAccessDoorSelections] = useState({});
    const [groupDimensions, setGroupDimensions] = useState({});
    const [fanGradeSelections, setFanGradeSelections] = useState({});

    // Simplified Ventilation Information state
    const [ventilation, setVentilation] = useState({
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
    });

    // Access Requirements
    const [access, setAccess] = useState({
        inductionNeeded: "No",
        inductionDetails: "",
        maintenanceEngineer: "No",
        maintenanceContact: "",
        mechanicalEngineer: "No",
        mechanicalEngineerDetails: "",
        electricalEngineer: "No",
        electricalContact: "",
        systemIsolated: "No",
        roofAccess: "No",
        roofAccessDetails: "",
        wasteTankToggle: "No",
        wasteTankSelection: "No",
        wasteTankDetails: "",
        keysrequired: "No",
        keysContact: "",
        permitToWork: "No",
        ppeToggle: "No",
        frequencyOfService: "",
    });

    // Simplified equipment state with clear separation of fields - REMOVED notes
    const [equipment, setEquipment] = useState({
        acroPropsToggle: "No",
        loftBoardsToggle: "No",
        scaffBoardsToggle: "No",
        laddersToggle: "No",
        mobileScaffoldTower: "No",
        flexiHose: "No",
        flexiHoseCircumference: "",
        flexiHoseLength: "",
        mewp: "No",
        subcategoryComments: {}, // Equipment subcategory comments
        categoryComments: {}, // Specialist equipment category comments
    });

    // Site operations state
    const [operations, setOperations] = useState({
        patronDisruption: "No",
        patronDisruptionDetails: "",
        operationalHours: {
            weekdays: { start: "", end: "" },
            weekend: { start: "", end: "" },
        },
        typeOfCooking: "",
        coversPerDay: "",
        bestServiceTime: "",
        bestServiceDay: "Weekdays",
        eightHoursAvailable: "No",
        eightHoursAvailableDetails: "",
        serviceDue: "",
        approxServiceDue: false,
    });

    // Notes state - Initialize obstructions as an array
    const [notes, setNotes] = useState({
        obstructions: [],
        comments: "",
        previousIssues: "",
        damage: "",
        inaccessibleAreas: "",
        clientActions: "",
        accessLocations: "",
        clientNeedsDocument: "No",
        documentDetails: "",
    });

    // Contacts state
    const [contacts, setContacts] = useState([]);
    const [primaryContactIndex, setPrimaryContactIndex] = useState(null);
    const [walkAroundContactIndex, setWalkAroundContactIndex] = useState(null);

    // Simple flag to track initial render
    const initialRenderCompleted = useRef(false);

    // Auto-generate REF ID for new surveys
    useEffect(() => {
        const autoGenerateRef = async () => {
            // Skip if we're editing an existing survey or if refValue is already set
            if (surveyId || refValue) {
                console.log(
                    "Skip REF generation - editing mode or REF already set"
                );
                return;
            }

            try {
                console.log("Generating new REF ID for new survey");
                // Fetch the latest surveys to find the last REF ID
                const res = await fetch("/api/surveys/kitchenSurveys/viewAll");
                if (!res.ok) {
                    throw new Error(`Error fetching surveys: ${res.status}`);
                }

                const data = await res.json();

                // Extract the alphabetic part of the REF from the most recent survey
                let lastRefId = "";
                if (data.success && data.data && data.data.length > 0) {
                    // Sort surveys by creation date (newest first)
                    const sortedSurveys = data.data.sort(
                        (a, b) =>
                            new Date(b.createdAt || b.updatedAt || 0) -
                            new Date(a.createdAt || a.updatedAt || 0)
                    );

                    // Get the most recent refValue
                    const latestRefValue = sortedSurveys[0].refValue;
                    console.log("Latest REF value found:", latestRefValue);

                    if (latestRefValue) {
                        // Extract the alphabetic part (should be at the end)
                        const match = latestRefValue.match(/[A-Za-z]+$/);
                        if (match) {
                            lastRefId = match[0];
                            console.log(
                                "Extracted alphabetic part:",
                                lastRefId
                            );
                        }
                    }
                }

                // Generate new REF value
                const newRefValue = generateRefValue(lastRefId);
                console.log("Generated new REF value:", newRefValue);
                setRefValue(newRefValue);
            } catch (error) {
                console.error("Failed to auto-generate REF ID:", error);
                // Fallback to a simple random REF if there's an error
                const fallbackRef = generateRefValue();
                console.log("Using fallback REF value:", fallbackRef);
                setRefValue(fallbackRef);
            }
        };

        autoGenerateRef();
    }, []); // Only run once on initial mount

    // Load site by ID if provided in URL
    useEffect(() => {
        if (siteIdParam) {
            const fetchSite = async () => {
                try {
                    const res = await fetch(
                        `/api/database/clients/sites/${siteIdParam}`
                    );
                    if (!res.ok) throw new Error("Failed to fetch site");

                    const data = await res.json();
                    if (data.success && data.data) {
                        setSiteDetails(data.data);
                    }
                } catch (error) {
                    console.error("Error fetching site:", error);
                    if (toast && toast.current) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to load site information",
                        });
                    }
                }
            };

            fetchSite();
        }
    }, [siteIdParam, toast]);

    // Load existing survey if ID is provided
    useEffect(() => {
        if (!surveyId) return;

        const fetchSurvey = async () => {
            setIsLoading(true);

            try {
                const res = await fetch(
                    `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                );
                if (!res.ok) {
                    throw new Error("Failed to fetch survey");
                }

                const json = await res.json();
                if (!json.success) {
                    throw new Error(json.message || "Failed to fetch survey");
                }

                const survey = json.data;
                console.log("SurveyDataLoading: Loaded survey data:", survey);

                // Set basic info
                setSurveyDate(
                    survey.surveyDate ? new Date(survey.surveyDate) : new Date()
                );
                setRefValue(survey.refValue || "");

                // Set site details
                if (survey.site) {
                    setSiteDetails(survey.site);
                }

                // Load general section data
                if (survey.general) {
                    console.log("Found general section:", survey.general);
                    // If there's parking data in the general section, add it to dedicated parking state
                    if (survey.general.parking !== undefined) {
                        console.log(
                            "Found parking in general:",
                            survey.general.parking
                        );
                        setParking(survey.general.parking);
                    }
                }

                // Set structure data
                if (survey.structure) {
                    setStructureTotal(survey.structure.structureTotal || 0);
                    setStructureId(survey.structure.structureId || "");
                    setStructureSelectionData(
                        survey.structure.selectionData || []
                    );
                    setStructureDimensions(survey.structure.dimensions || {});
                    setStructureComments(
                        survey.structure.structureComments || ""
                    );
                }

                // SIMPLIFIED: Load images from standardized location with consistent URL handling
                if (survey.images) {
                    console.log("Loading images from standardized location");

                    // Create standardized image structure
                    const processedImages = {
                        Structure: [],
                        Equipment: [],
                        Canopy: [],
                        Ventilation: [],
                    };

                    // Process each category of images
                    Object.keys(processedImages).forEach((category) => {
                        if (
                            survey.images[category] &&
                            Array.isArray(survey.images[category])
                        ) {
                            // Map each image to our standard format
                            processedImages[category] = survey.images[
                                category
                            ].map((img) => {
                                // Ensure we have a valid URL
                                const imageUrl =
                                    img.url ||
                                    (img.publicId
                                        ? getCloudinaryUrl(img.publicId)
                                        : null);

                                return {
                                    id:
                                        img.id ||
                                        `${Date.now()}-${Math.random()
                                            .toString(36)
                                            .substr(2, 9)}`,
                                    publicId: img.publicId,
                                    url: imageUrl,
                                    category: category,
                                    uploaded: true,
                                    alt: img.alt || "",
                                    title: img.title || "",
                                };
                            });
                        }
                    });

                    // Count images for logging
                    const totalImages =
                        Object.values(processedImages).flat().length;

                    console.log(
                        `Loaded ${totalImages} images from survey data`
                    );

                    if (totalImages > 0) {
                        // Show success message
                        toast.current?.show({
                            severity: "success",
                            summary: "Images Loaded",
                            detail: `Successfully loaded ${totalImages} images`,
                            life: 3000,
                        });
                    }

                    // Set the processed images to state
                    setSurveyImages(processedImages);
                } else {
                    // Reset images if none exist in survey
                    setSurveyImages({
                        Structure: [],
                        Equipment: [],
                        Canopy: [],
                        Ventilation: [],
                    });
                }

                // Set equipment data with clear separation of fields
                if (survey.equipmentSurvey) {
                    // Set equipment entries
                    if (survey.equipmentSurvey.entries) {
                        setSurveyData(survey.equipmentSurvey.entries);
                    } else {
                        // Reset to empty array if no entries
                        setSurveyData([]);
                    }

                    // Initialize equipment state with empty values first
                    let updatedEquipment = { ...equipment };

                    // Set subcategory comments
                    updatedEquipment.subcategoryComments =
                        survey.equipmentSurvey.subcategoryComments || {};

                    // Process specialist equipment data
                    if (survey.specialistEquipmentSurvey) {
                        // Set specialist equipment entries if they exist
                        if (survey.specialistEquipmentSurvey.entries) {
                            setSpecialistEquipmentData(
                                survey.specialistEquipmentSurvey.entries
                            );
                        } else {
                            // Reset to empty array if no entries
                            setSpecialistEquipmentData([]);
                        }

                        // Set the full specialistEquipmentSurvey object
                        setInitialSpecialistEquipmentSurvey(
                            survey.specialistEquipmentSurvey
                        );

                        // Set category comments
                        updatedEquipment.categoryComments =
                            survey.specialistEquipmentSurvey.categoryComments ||
                            {};

                        // Log the specialist equipment survey data for debugging
                        console.log(
                            "Loaded specialistEquipmentSurvey:",
                            survey.specialistEquipmentSurvey
                        );
                    } else {
                        // Reset specialist equipment data if not present
                        setSpecialistEquipmentData([]);
                        setInitialSpecialistEquipmentSurvey({
                            entries: [],
                            categoryComments: {},
                        });
                        updatedEquipment.categoryComments = {}; // Reset category comments
                    }

                    // Set equipment toggles and fields from the specialist equipment section
                    if (survey.specialistEquipment) {
                        updatedEquipment = {
                            ...updatedEquipment,
                            acroPropsToggle:
                                survey.specialistEquipment.acroPropsToggle ||
                                "No",
                            loftBoardsToggle:
                                survey.specialistEquipment.loftBoardsToggle ||
                                "No",
                            scaffBoardsToggle:
                                survey.specialistEquipment.scaffBoardsToggle ||
                                "No",
                            laddersToggle:
                                survey.specialistEquipment.laddersToggle ||
                                "No",
                            mobileScaffoldTower:
                                survey.specialistEquipment
                                    .mobileScaffoldTower || "No",
                            flexiHose:
                                survey.specialistEquipment.flexiHose || "No",
                            flexiHoseCircumference:
                                survey.specialistEquipment
                                    .flexiHoseCircumference || "",
                            flexiHoseLength:
                                survey.specialistEquipment.flexiHoseLength ||
                                "",
                            mewp: survey.specialistEquipment.mewp || "No",
                        };
                    }

                    // Set the updated equipment state
                    setEquipment(updatedEquipment);
                } else {
                    // Reset equipment data if not present
                    setSurveyData([]);
                    setEquipment({
                        ...equipment,
                        subcategoryComments: {},
                        categoryComments: {},
                    });
                }

                // Simplified canopy data loading
                if (survey.canopySurvey) {
                    // First check for canopy total in the totals section (priority source)
                    if (
                        survey.totals &&
                        survey.totals.mainArea &&
                        survey.totals.mainArea.canopyTotal
                    ) {
                        setCanopyTotal(survey.totals.mainArea.canopyTotal);
                        console.log(
                            "Loading canopy total from totals section:",
                            survey.totals.mainArea.canopyTotal
                        );
                    } else if (
                        survey.canopySurvey.entries &&
                        survey.canopySurvey.entries.length > 0 &&
                        survey.canopySurvey.entries[0].canopyTotal
                    ) {
                        // Fall back to entries if totals section doesn't have it
                        setCanopyTotal(
                            survey.canopySurvey.entries[0].canopyTotal
                        );
                        console.log(
                            "Loading canopy total from first entry:",
                            survey.canopySurvey.entries[0].canopyTotal
                        );
                    } else {
                        setCanopyTotal(0);
                        console.log("No canopy total found, setting to 0");
                    }

                    // Set canopy entries
                    if (
                        survey.canopySurvey.entries &&
                        survey.canopySurvey.entries.length > 0
                    ) {
                        // Process entries with cleaner structure
                        const processedEntries =
                            survey.canopySurvey.entries.map((entry) => {
                                return {
                                    id: entry.id || Date.now(),
                                    canopy: entry.canopy || {
                                        type: "Canopy",
                                        item: entry.item || "Standard Canopy",
                                        grade: entry.grade || "Standard",
                                        length: entry.length || 1,
                                        width: entry.width || 1,
                                        height: entry.height || 1,
                                    },
                                    filter: entry.filter || {
                                        type: "Filter",
                                        item: "Standard Filter",
                                        grade: "Standard",
                                        number: 1,
                                        length: null,
                                        width: null,
                                        height: null,
                                    },
                                    // Make sure to include the canopy total in each entry
                                    canopyTotal:
                                        entry.canopyTotal ||
                                        survey.totals?.mainArea?.canopyTotal ||
                                        0,
                                };
                            });

                        setCanopyEntries(processedEntries);
                    } else if (survey.totals?.mainArea?.canopyTotal > 0) {
                        // If we have a total but no entries, create a placeholder entry
                        setCanopyEntries([
                            {
                                id: Date.now().toString(),
                                canopy: {
                                    type: "Canopy",
                                    item: "Standard Canopy",
                                    grade: "Standard",
                                    length: 1,
                                    width: 1,
                                    height: 1,
                                },
                                filter: {
                                    type: "Filter",
                                    item: "Standard Filter",
                                    grade: "Standard",
                                    number: 1,
                                    length: null,
                                    width: null,
                                    height: null,
                                },
                                canopyTotal: survey.totals.mainArea.canopyTotal,
                            },
                        ]);
                    } else {
                        setCanopyEntries([]);
                    }

                    // FIXED: Always set canopy comments, even if empty
                    setCanopyComments(survey.canopySurvey.comments || {});
                    console.log(
                        "Setting canopy comments to:",
                        survey.canopySurvey.comments || {}
                    );
                } else {
                    // Reset canopy data if not present
                    setCanopyEntries([]);
                    setCanopyTotal(0);
                    setCanopyComments({});
                }

                // Set schematic data
                if (survey.schematic) {
                    // FIXED: Set access door selections and calculate total price
                    const doorSelections =
                        survey.schematic.accessDoorSelections || {};
                    setAccessDoorSelections(doorSelections);

                    // Calculate total price from all door selections
                    const calculatedDoorPrice = Object.values(
                        doorSelections
                    ).reduce((total, door) => {
                        const doorPrice = Number(door.price) || 0;
                        return total + doorPrice;
                    }, 0);

                    // Use calculated price if greater than 0, otherwise use saved value as fallback
                    console.log(
                        "Calculated access door price:",
                        calculatedDoorPrice
                    );
                    if (calculatedDoorPrice > 0) {
                        setAccessDoorPrice(calculatedDoorPrice);
                    } else {
                        setAccessDoorPrice(
                            survey.schematic.accessDoorPrice || 0
                        );
                    }

                    // Set other schematic prices
                    setVentilationPrice(survey.schematic.ventilationPrice || 0);
                    setAirPrice(survey.schematic.airPrice || 0);
                    setFanPartsPrice(survey.schematic.fanPartsPrice || 0);
                    setAirInExTotal(survey.schematic.airInExTotal || 0);
                    setSchematicItemsTotal(
                        survey.schematic.schematicItemsTotal || 0
                    );
                    setSelectedGroupId(survey.schematic.selectedGroupId || "");

                    // FIXED: Always set placedItems, even if empty
                    const processedItems =
                        survey.schematic.placedItems?.length > 0
                            ? survey.schematic.placedItems.map((item) => ({
                                  ...item,
                                  length:
                                      item.length !== undefined
                                          ? String(item.length)
                                          : "",
                                  width:
                                      item.width !== undefined
                                          ? String(item.width)
                                          : "",
                                  height:
                                      item.height !== undefined
                                          ? String(item.height)
                                          : "",
                              }))
                            : [];

                    setPlacedItems(processedItems);

                    // FIXED: Always set specialItems, even if empty
                    setSpecialItems(survey.schematic.specialItems || []);

                    if (survey.schematic.gridSpaces) {
                        setGridSpaces(survey.schematic.gridSpaces);
                    }

                    if (survey.schematic.cellSize) {
                        setCellSize(survey.schematic.cellSize);
                    }

                    // FIXED: Always set selections, even if empty
                    setFlexiDuctSelections(
                        survey.schematic.flexiDuctSelections || {}
                    );
                    setFanGradeSelections(
                        survey.schematic.fanGradeSelections || {}
                    );

                    console.log(
                        "Setting schematic data - placedItems:",
                        processedItems.length,
                        "specialItems:",
                        (survey.schematic.specialItems || []).length,
                        "accessDoorSelections:",
                        Object.keys(survey.schematic.accessDoorSelections || {})
                            .length
                    );
                } else {
                    // Reset schematic data if not present
                    setAccessDoorPrice(0);
                    setVentilationPrice(0);
                    setAirPrice(0);
                    setFanPartsPrice(0);
                    setAirInExTotal(0);
                    setSchematicItemsTotal(0);
                    setSelectedGroupId("");
                    setPlacedItems([]);
                    setSpecialItems([]);
                    setFlexiDuctSelections({});
                    setAccessDoorSelections({});
                    setFanGradeSelections({});
                }

                // Simplified ventilation info loading
                if (survey.ventilationInfo) {
                    // Create normalized ventilation data
                    const normalizedVentilation = {
                        ...ventilation, // Start with defaults
                        ...survey.ventilationInfo, // Override with loaded data
                        // Ensure arrays exist
                        obstructionsOptions: Array.isArray(
                            survey.ventilationInfo.obstructionsOptions
                        )
                            ? survey.ventilationInfo.obstructionsOptions
                            : [],
                        damageOptions: Array.isArray(
                            survey.ventilationInfo.damageOptions
                        )
                            ? survey.ventilationInfo.damageOptions
                            : [],
                        inaccessibleAreasOptions: Array.isArray(
                            survey.ventilationInfo.inaccessibleAreasOptions
                        )
                            ? survey.ventilationInfo.inaccessibleAreasOptions
                            : [],
                        clientActionsOptions: Array.isArray(
                            survey.ventilationInfo.clientActionsOptions
                        )
                            ? survey.ventilationInfo.clientActionsOptions
                            : [],
                    };

                    setVentilation(normalizedVentilation);
                } else {
                    // Reset ventilation if not present
                    setVentilation({
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
                    });
                }

                // Set access requirements
                if (survey.access) {
                    setAccess(survey.access);
                } else {
                    // Reset access if not present
                    setAccess({
                        inductionNeeded: "No",
                        inductionDetails: "",
                        maintenanceEngineer: "No",
                        maintenanceContact: "",
                        mechanicalEngineer: "No",
                        mechanicalEngineerDetails: "",
                        electricalEngineer: "No",
                        electricalContact: "",
                        systemIsolated: "No",
                        roofAccess: "No",
                        roofAccessDetails: "",
                        wasteTankToggle: "No",
                        wasteTankSelection: "No",
                        wasteTankDetails: "",
                        keysrequired: "No",
                        keysContact: "",
                        permitToWork: "No",
                        ppeToggle: "No",
                        frequencyOfService: "",
                    });
                }

                // Set operations data
                if (survey.operations) {
                    // Create a normalized version
                    const normalizedOperations = {
                        ...operations, // Start with defaults
                        ...survey.operations, // Override with loaded data
                    };

                    // Normalize Yes/No values
                    normalizedOperations.patronDisruption =
                        normalizedOperations.patronDisruption === true ||
                        normalizedOperations.patronDisruption === "true" ||
                        normalizedOperations.patronDisruption === "yes" ||
                        normalizedOperations.patronDisruption === "Yes" ||
                        normalizedOperations.patronDisruption === 1 ||
                        normalizedOperations.patronDisruption === "1"
                            ? "Yes"
                            : "No";

                    normalizedOperations.eightHoursAvailable =
                        normalizedOperations.eightHoursAvailable === true ||
                        normalizedOperations.eightHoursAvailable === "true" ||
                        normalizedOperations.eightHoursAvailable === "yes" ||
                        normalizedOperations.eightHoursAvailable === "Yes" ||
                        normalizedOperations.eightHoursAvailable === 1 ||
                        normalizedOperations.eightHoursAvailable === "1"
                            ? "Yes"
                            : "No";

                    // Ensure operational hours structure exists
                    if (!normalizedOperations.operationalHours) {
                        normalizedOperations.operationalHours = {
                            weekdays: { start: "", end: "" },
                            weekend: { start: "", end: "" },
                        };
                    } else {
                        // Ensure weekdays structure exists
                        if (!normalizedOperations.operationalHours.weekdays) {
                            normalizedOperations.operationalHours.weekdays = {
                                start: "",
                                end: "",
                            };
                        }
                        // Ensure weekend structure exists
                        if (!normalizedOperations.operationalHours.weekend) {
                            normalizedOperations.operationalHours.weekend = {
                                start: "",
                                end: "",
                            };
                        }
                    }

                    // Set operations state
                    setOperations(normalizedOperations);
                } else {
                    // Reset operations if not present
                    setOperations({
                        patronDisruption: "No",
                        patronDisruptionDetails: "",
                        operationalHours: {
                            weekdays: { start: "", end: "" },
                            weekend: { start: "", end: "" },
                        },
                        typeOfCooking: "",
                        coversPerDay: "",
                        bestServiceTime: "",
                        bestServiceDay: "Weekdays",
                        eightHoursAvailable: "No",
                        eightHoursAvailableDetails: "",
                        serviceDue: "",
                        approxServiceDue: false,
                    });
                }

                // Set notes
                if (survey.notes) {
                    const processedNotes = { ...survey.notes };

                    // Ensure obstructions is an array
                    if (processedNotes.obstructions) {
                        if (!Array.isArray(processedNotes.obstructions)) {
                            // Convert string to array if needed
                            processedNotes.obstructions =
                                processedNotes.obstructions
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter((item) => item !== "");
                        }
                    } else {
                        processedNotes.obstructions = [];
                    }

                    setNotes(processedNotes);
                } else {
                    // Reset notes if not present
                    setNotes({
                        obstructions: [],
                        comments: "",
                        previousIssues: "",
                        damage: "",
                        inaccessibleAreas: "",
                        clientActions: "",
                        accessLocations: "",
                        clientNeedsDocument: "No",
                        documentDetails: "",
                    });
                }

                // Set contacts
                if (survey.contacts && Array.isArray(survey.contacts)) {
                    // Map contacts to ensure they have the correct structure
                    const processedContacts = survey.contacts.map(
                        (contact) => ({
                            ...contact,
                            isPrimaryContact: !!contact.isPrimaryContact,
                            isWalkAroundContact: !!contact.isWalkAroundContact,
                        })
                    );

                    setContacts(processedContacts);

                    // Find primary contact and walk around contact
                    const primaryIndex = processedContacts.findIndex(
                        (c) => c.isPrimaryContact === true
                    );
                    if (primaryIndex !== -1) {
                        setPrimaryContactIndex(primaryIndex);
                    }

                    const walkAroundIndex = processedContacts.findIndex(
                        (c) => c.isWalkAroundContact === true
                    );
                    if (walkAroundIndex !== -1) {
                        setWalkAroundContactIndex(walkAroundIndex);
                    }
                } else {
                    // Reset contacts if not present
                    setContacts([]);
                    setPrimaryContactIndex(null);
                    setWalkAroundContactIndex(null);
                }

                // Set modification factor
                if (survey.totals?.modify !== undefined) {
                    setModify(survey.totals.modify);
                } else {
                    setModify(0);
                }

                // Show success message
                if (toast && toast.current) {
                    toast.current.show({
                        severity: "success",
                        summary: "Survey Loaded",
                        detail: "Survey data loaded successfully",
                        life: 3000,
                    });
                }
            } catch (error) {
                console.error("Error fetching survey:", error);
                if (toast && toast.current) {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: error.message || "Failed to load survey",
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSurvey();
    }, [surveyId, toast]);

    // Fetch equipment items from DB
    useEffect(() => {
        const fetchEquipmentItems = async () => {
            try {
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    const equipment = json.data
                        .filter((item) => item.category === "Equipment")
                        .map((item) => {
                            const newPrices = {};
                            if (item.prices) {
                                Object.keys(item.prices).forEach((grade) => {
                                    newPrices[grade] = Number(
                                        item.prices[grade]
                                    );
                                });
                            }
                            return { ...item, prices: newPrices };
                        });
                    setEquipmentItems(equipment);
                } else {
                    console.error("Failed to fetch equipment items:", json);
                }
            } catch (error) {
                console.error("Error fetching equipment items:", error);
            }
        };

        fetchEquipmentItems();
    }, []); // Load only once

    // Mark initialization as complete
    useEffect(() => {
        if (!initialRenderCompleted.current) {
            console.log("Initial render completed");
            initialRenderCompleted.current = true;
        }
    }, []);

    // Return all the state variables and setters
    return {
        // Loading state
        isLoading,
        setIsLoading,

        // Survey basic info
        surveyDate,
        setSurveyDate,
        refValue,
        setRefValue,

        // Add parking to return values
        parking,
        setParking,

        // Add surveyImages to return values - standardized location only
        surveyImages,
        setSurveyImages,

        // Equipment data
        surveyData,
        setSurveyData,
        equipmentItems,
        setEquipmentItems,

        // Specialist equipment
        specialistEquipmentData,
        setSpecialistEquipmentData,
        specialistEquipmentId,
        setSpecialistEquipmentId,
        // Add the initialSpecialistEquipmentSurvey to the return
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
    };
}
