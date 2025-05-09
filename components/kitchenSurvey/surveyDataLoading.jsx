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

/**
 * Custom hook for loading survey data
 */
export default function useSurveyDataLoader(surveyId, siteIdParam, toast) {
    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Survey date state
    const [surveyDate, setSurveyDate] = useState(new Date());
    const [refValue, setRefValue] = useState("");

    // Dedicated parking state
    const [parking, setParking] = useState("");

    // Survey images state - always use standardized location
    const [surveyImages, setSurveyImages] = useState({});

    // States for equipment data in the main area
    const [surveyData, setSurveyData] = useState([]);
    const [equipmentItems, setEquipmentItems] = useState([]);

    // State for specialist equipment
    const [specialistEquipmentData, setSpecialistEquipmentData] = useState([]);
    const [specialistEquipmentId, setSpecialistEquipmentId] = useState("");

    // Structure data
    const [structureTotal, setStructureTotal] = useState(0);
    const [structureSelectionData, setStructureSelectionData] = useState([]);
    const [structureDimensions, setStructureDimensions] = useState({});
    const [structureComments, setStructureComments] = useState("");

    // Canopy data
    const [canopyTotal, setCanopyTotal] = useState(0);
    const [canopyEntries, setCanopyEntries] = useState([]);

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

    // An array to store each duplicated area's state for final calculations
    const [areasState, setAreasState] = useState([]); // array of totals
    const [areas, setAreas] = useState([]);

    // Ventilation Information state
    const [ventilation, setVentilation] = useState({
        obstructionsToggle: "No",
        damageToggle: "No",
        inaccessibleAreasToggle: "No",
        clientActionsToggle: "No",
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
        keysrequired: "No",
        keysContact: "",
        permitToWork: "No",
        ppeToggle: "No",
        frequencyOfService: "",
    });

    // Specialist Equipment state with proper initialization
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
        notes: "",
        subcategoryComments: {},
        categoryComments: {},
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

    // Auto-generate REF ID for new surveys
    useEffect(() => {
        const autoGenerateRef = async () => {
            // Skip if we're editing an existing survey (surveyId is present)
            // or if refValue is already set
            if (surveyId || refValue) {
                console.log(
                    "Skip REF generation - editing mode or REF already set:",
                    {
                        surveyId,
                        refValue,
                    }
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
    }, []); // Only run once on initial mount, not when refValue changes

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

                // Load images from standardized location only
                if (survey.images) {
                    console.log(
                        "Loading images from standardized location:",
                        Object.keys(survey.images).map(
                            (cat) =>
                                `${cat}: ${survey.images[cat].length} images`
                        )
                    );
                    setSurveyImages(survey.images);
                }

                // Set equipment data with comments and notes
                if (survey.equipmentSurvey) {
                    // Set equipment entries
                    if (survey.equipmentSurvey.entries) {
                        setSurveyData(survey.equipmentSurvey.entries);
                    }

                    // Process equipment comments and notes
                    const equipmentComments =
                        survey.equipmentSurvey.subcategoryComments || {};

                    const updatedEquipment = {
                        ...equipment, // Start with existing equipment state
                        // Add subcategory comments from equipmentSurvey section
                        subcategoryComments: equipmentComments,
                        // Add notes from equipmentSurvey section
                        notes: survey.equipmentSurvey.notes || "",
                    };

                    // Update the equipment state with the enhanced data
                    setEquipment(updatedEquipment);
                }

                // Set specialist equipment data
                if (survey.specialistEquipmentSurvey) {
                    // Set specialist equipment entries if they exist
                    if (survey.specialistEquipmentSurvey.entries) {
                        setSpecialistEquipmentData(
                            survey.specialistEquipmentSurvey.entries
                        );
                    }

                    // Process specialist equipment notes and comments
                    // Get latest state for safety
                    const currentEquipment = { ...equipment };

                    // Create updated equipment object with all specialist equipment related data
                    const updatedEquipment = {
                        ...currentEquipment,
                        // Add category comments if they exist
                        categoryComments:
                            survey.specialistEquipmentSurvey.categoryComments ||
                            currentEquipment.categoryComments ||
                            {},
                        // Add notes from specialistEquipmentSurvey
                        notes:
                            survey.specialistEquipmentSurvey.notes ||
                            currentEquipment.notes ||
                            "",
                    };

                    // Update equipment with both notes and category comments
                    console.log(
                        "Setting equipment with specialist equipment data:",
                        updatedEquipment
                    );
                    setEquipment(updatedEquipment);
                }

                // Set canopy data
                if (survey.canopySurvey?.entries) {
                    if (survey.canopySurvey.entries.length > 0) {
                        // Extract total from first entry if available
                        setCanopyTotal(
                            survey.canopySurvey.entries[0].canopyTotal || 0
                        );

                        // Process entries to ensure they have the proper structure
                        const processedEntries =
                            survey.canopySurvey.entries.map((entry) => {
                                // If entry already has the right structure, use it
                                if (entry.canopy && entry.filter) {
                                    return {
                                        ...entry,
                                        id: entry.id || Date.now(), // Ensure ID exists
                                    };
                                }

                                // If it's just a total value, create default structure
                                if (entry.canopyTotal !== undefined) {
                                    return {
                                        id: entry.id || Date.now(),
                                        canopy: {
                                            type: "Canopy",
                                            item:
                                                entry.item || "Standard Canopy",
                                            grade: entry.grade || "Standard",
                                            length: entry.length || 1,
                                            width: entry.width || 1,
                                            height: entry.height || 1,
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
                                    };
                                }

                                // Fallback for any other structure
                                return {
                                    id: Date.now(),
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
                                };
                            });

                        // Store the processed entries array
                        setCanopyEntries(processedEntries);
                    } else {
                        // Initialize with empty array if no entries
                        setCanopyEntries([]);
                    }
                } else {
                    // Initialize with empty array if no canopySurvey.entries
                    setCanopyEntries([]);
                }

                // Set schematic data
                if (survey.schematic) {
                    setAccessDoorPrice(survey.schematic.accessDoorPrice || 0);
                    setVentilationPrice(survey.schematic.ventilationPrice || 0);
                    setAirPrice(survey.schematic.airPrice || 0);
                    setFanPartsPrice(survey.schematic.fanPartsPrice || 0);
                    setAirInExTotal(survey.schematic.airInExTotal || 0);
                    setSchematicItemsTotal(
                        survey.schematic.schematicItemsTotal || 0
                    );
                    setSelectedGroupId(survey.schematic.selectedGroupId || "");

                    // Add schematic visual data loading
                    // First ensure we have initialized dimensions
                    let dimensionsToUse = {};

                    // First, load any saved groupDimensions if they exist
                    if (
                        survey.schematic.groupDimensions &&
                        Object.keys(survey.schematic.groupDimensions).length > 0
                    ) {
                        console.log(
                            "Loading saved group dimensions:",
                            survey.schematic.groupDimensions
                        );
                        dimensionsToUse = {
                            ...survey.schematic.groupDimensions,
                        };
                    }

                    // Now load placed items and ensure dimension entries exist for each
                    if (survey.schematic.placedItems?.length > 0) {
                        const processedItems = survey.schematic.placedItems.map(
                            (item) => {
                                // Create a deep copy to avoid reference issues
                                const newItem = { ...item };

                                // Get a key for this item - use id consistently
                                const itemKey = item.id || item._id || "";

                                // Extract dimensions from the item itself or from the groupDimensions if present
                                const extractedDimensions = {
                                    length: item.length || "",
                                    width: item.width || "",
                                    height: item.height || "",
                                };

                                // Store dimensions with consistent keys
                                dimensionsToUse[itemKey] = extractedDimensions;

                                // Log for debugging
                                if (
                                    extractedDimensions.length ||
                                    extractedDimensions.width ||
                                    extractedDimensions.height
                                ) {
                                    console.log(
                                        `Loading dimension for item ${itemKey}:`,
                                        extractedDimensions
                                    );
                                }

                                return newItem;
                            }
                        );

                        console.log(
                            "Setting placed items with synchronized dimensions"
                        );
                        setPlacedItems(processedItems);
                    }

                    // Set the final synchronized groupDimensions
                    console.log(
                        "Setting synchronized group dimensions:",
                        dimensionsToUse
                    );
                    setGroupDimensions(dimensionsToUse);

                    if (survey.schematic.specialItems?.length > 0) {
                        setSpecialItems(survey.schematic.specialItems);
                    }

                    if (survey.schematic.gridSpaces) {
                        setGridSpaces(survey.schematic.gridSpaces);
                    }

                    if (survey.schematic.cellSize) {
                        setCellSize(survey.schematic.cellSize);
                    }

                    if (
                        survey.schematic.flexiDuctSelections &&
                        Object.keys(survey.schematic.flexiDuctSelections)
                            .length > 0
                    ) {
                        setFlexiDuctSelections(
                            survey.schematic.flexiDuctSelections
                        );
                    }

                    // Load access door selections with better error logging
                    if (
                        survey.schematic.accessDoorSelections &&
                        Object.keys(survey.schematic.accessDoorSelections)
                            .length > 0
                    ) {
                        console.log(
                            "Loading access door selections:",
                            survey.schematic.accessDoorSelections
                        );

                        try {
                            // Make sure the structure is what we expect
                            const processedSelections = {};

                            Object.entries(
                                survey.schematic.accessDoorSelections
                            ).forEach(([itemId, doorData]) => {
                                processedSelections[itemId] = {
                                    // Store MongoDB ID with proper format
                                    mongoId: doorData.mongoId || doorData.id,
                                    id: doorData.mongoId || doorData.id,
                                    name: doorData.name || "Selected Door",
                                    type: doorData.type || "",
                                    dimensions: doorData.dimensions || "",
                                    price: doorData.price || 0,
                                };
                            });

                            console.log(
                                "Processed access door selections:",
                                processedSelections
                            );

                            setAccessDoorSelections(processedSelections);
                        } catch (error) {
                            console.error(
                                "Error processing access door selections:",
                                error
                            );
                            // Fallback to using raw selections
                            setAccessDoorSelections(
                                survey.schematic.accessDoorSelections
                            );
                        }
                    }

                    if (
                        survey.schematic.groupDimensions &&
                        Object.keys(survey.schematic.groupDimensions).length > 0
                    ) {
                        setGroupDimensions(survey.schematic.groupDimensions);
                    }

                    if (
                        survey.schematic.fanGradeSelections &&
                        Object.keys(survey.schematic.fanGradeSelections)
                            .length > 0
                    ) {
                        setFanGradeSelections(
                            survey.schematic.fanGradeSelections
                        );
                    }
                }

                // Set ventilation info
                if (survey.ventilationInfo) {
                    setVentilation(survey.ventilationInfo);
                }

                // Set access requirements
                if (survey.access) {
                    setAccess(survey.access);
                }

                // Handle operations data with maximum reliability
                if (survey.operations) {
                    // Extract operations data from survey
                    console.log(
                        "SurveyDataLoading: Processing operations data:",
                        survey.operations
                    );

                    try {
                        // Create a direct but clean copy
                        const directOperations = JSON.parse(
                            JSON.stringify(survey.operations)
                        );

                        // Create a explicitly normalized copy with exact "Yes"/"No" strings for toggles
                        const normalizedOperations = { ...directOperations };

                        // Directly map toggle values to correct strings
                        // For patronDisruption
                        const patronValue = directOperations.patronDisruption;
                        if (
                            patronValue === true ||
                            patronValue === "true" ||
                            patronValue === "yes" ||
                            patronValue === "Yes" ||
                            patronValue === 1 ||
                            patronValue === "1"
                        ) {
                            normalizedOperations.patronDisruption = "Yes";
                        } else {
                            normalizedOperations.patronDisruption = "No";
                        }

                        // For eightHoursAvailable
                        const hoursValue = directOperations.eightHoursAvailable;
                        if (
                            hoursValue === true ||
                            hoursValue === "true" ||
                            hoursValue === "yes" ||
                            hoursValue === "Yes" ||
                            hoursValue === 1 ||
                            hoursValue === "1"
                        ) {
                            normalizedOperations.eightHoursAvailable = "Yes";
                        } else {
                            normalizedOperations.eightHoursAvailable = "No";
                        }

                        // Ensure operational hours structure exists
                        if (!normalizedOperations.operationalHours) {
                            normalizedOperations.operationalHours = {
                                weekdays: { start: "", end: "" },
                                weekend: { start: "", end: "" },
                            };
                        } else {
                            // Ensure weekdays structure exists
                            if (
                                !normalizedOperations.operationalHours.weekdays
                            ) {
                                normalizedOperations.operationalHours.weekdays =
                                    { start: "", end: "" };
                            }
                            // Ensure weekend structure exists
                            if (
                                !normalizedOperations.operationalHours.weekend
                            ) {
                                normalizedOperations.operationalHours.weekend =
                                    { start: "", end: "" };
                            }
                        }

                        // Format serviceDue as Date if it exists
                        if (normalizedOperations.serviceDue) {
                            try {
                                normalizedOperations.serviceDue = new Date(
                                    normalizedOperations.serviceDue
                                );
                            } catch (e) {
                                console.error(
                                    "Error parsing serviceDue date:",
                                    e
                                );
                                normalizedOperations.serviceDue = null;
                            }
                        }

                        // Set default values for optional fields if not present
                        if (normalizedOperations.bestServiceDay === undefined) {
                            normalizedOperations.bestServiceDay = "Weekdays";
                        }

                        if (
                            normalizedOperations.bestServiceTime === undefined
                        ) {
                            normalizedOperations.bestServiceTime = "";
                        }

                        console.log(
                            "SurveyDataLoading: Normalized operations:",
                            normalizedOperations
                        );
                        console.log(
                            "SurveyDataLoading: Patron Disruption:",
                            normalizedOperations.patronDisruption
                        );
                        console.log(
                            "SurveyDataLoading: Eight Hours Available:",
                            normalizedOperations.eightHoursAvailable
                        );

                        // Set operations state with the normalized data
                        setOperations(normalizedOperations);
                    } catch (error) {
                        console.error(
                            "Error normalizing operations data:",
                            error
                        );
                        // Fallback to direct assignment if normalization fails
                        setOperations(survey.operations);
                    }
                }

                // Set notes
                if (survey.notes) {
                    // Create a processed version of notes
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
                }

                // Set contacts with better handling of primary and walk around indices
                if (survey.contacts && Array.isArray(survey.contacts)) {
                    console.log(
                        "Setting contacts from survey:",
                        survey.contacts
                    );

                    // Map contacts to ensure they have the correct structure
                    const processedContacts = survey.contacts.map(
                        (contact) => ({
                            ...contact,
                            isPrimaryContact: !!contact.isPrimaryContact,
                            isWalkAroundContact: !!contact.isWalkAroundContact,
                        })
                    );

                    setContacts(processedContacts);

                    // Find primary contact by isPrimaryContact flag
                    const primaryIndex = processedContacts.findIndex(
                        (c) => c.isPrimaryContact === true
                    );
                    console.log(
                        "Found primary contact at index:",
                        primaryIndex
                    );

                    if (primaryIndex !== -1) {
                        setPrimaryContactIndex(primaryIndex);
                        console.log(
                            "Setting primary contact index to:",
                            primaryIndex
                        );
                    }

                    // Find walk around contact by isWalkAroundContact flag
                    const walkAroundIndex = processedContacts.findIndex(
                        (c) => c.isWalkAroundContact === true
                    );
                    console.log(
                        "Found walk around contact at index:",
                        walkAroundIndex
                    );

                    if (walkAroundIndex !== -1) {
                        setWalkAroundContactIndex(walkAroundIndex);
                        console.log(
                            "Setting walk around contact index to:",
                            walkAroundIndex
                        );
                    }
                }

                // Set duplicated areas
                if (
                    survey.duplicatedAreas &&
                    Array.isArray(survey.duplicatedAreas)
                ) {
                    const processedAreas = survey.duplicatedAreas;

                    setAreas(
                        processedAreas.map((area) => ({
                            id: area.id || Date.now(),
                        }))
                    );
                    setAreasState(processedAreas);
                }

                // Set modification factor
                if (survey.totals?.modify !== undefined) {
                    setModify(survey.totals.modify);
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

        // Areas
        areasState,
        setAreasState,
        areas,
        setAreas,

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
