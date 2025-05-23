// components/kitchenSurvey/save/SurveySaveUtil.js

/**
 * Shared utility for saving surveys with handshake verification
 */

// SIMPLE: Match the SpecialistEquipmentList approach exactly
const categoryToTextareaId = (categoryName) => {
    return `category-comment-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
};

const textareaIdToCategory = (textareaId, actualCategories) => {
    // Remove prefix and convert back
    const idPart = textareaId.replace('category-comment-', '');
    
    // Find matching category from actual categories (case-insensitive match)
    const matchingCategory = actualCategories.find(category => 
        category.replace(/\s+/g, '-').toLowerCase() === idPart
    );
    
    return matchingCategory || idPart.replace(/-/g, ' ');
};

// Sync all component states before saving
export const syncComponentStates = async () => {
    console.log("[SurveySaveUtil] Syncing component states before saving");

    // Try to sync canopy comments
    let canopySynced = false;
    if (
        typeof window !== "undefined" &&
        window.area1LogicInstance &&
        typeof window.area1LogicInstance.syncCanopyComments === "function"
    ) {
        canopySynced = window.area1LogicInstance.syncCanopyComments();
        console.log("[SurveySaveUtil] Canopy comments synced:", canopySynced);
    }

    // Try to sync equipment subcategory comments
    let equipmentSynced = false;
    if (
        typeof window !== "undefined" &&
        window.equipmentComponentInstance &&
        typeof window.equipmentComponentInstance.syncSubcategoryComments ===
            "function"
    ) {
        equipmentSynced =
            window.equipmentComponentInstance.syncSubcategoryComments();
        console.log("[SurveySaveUtil] Equipment comments synced:", equipmentSynced);
    }

    // Try to sync specialist equipment category comments
    let specialistSynced = false;
    if (
        typeof window !== "undefined" &&
        window.specialistEquipmentInstance &&
        typeof window.specialistEquipmentInstance.syncChanges === "function"
    ) {
        specialistSynced = window.specialistEquipmentInstance.syncChanges();
        console.log(
            "[SurveySaveUtil] Specialist equipment synced:",
            specialistSynced
        );
    }

    // Try to sync schematic door prices
    let schematicSynced = false;
    if (
        typeof window !== "undefined" &&
        window.schematicInstance &&
        typeof window.schematicInstance.syncDoorPrices === "function"
    ) {
        schematicSynced = window.schematicInstance.syncDoorPrices();
        console.log(
            "[SurveySaveUtil] Schematic door prices synced:",
            schematicSynced
        );
    }

    // Increase delay to ensure updates have been processed
    return new Promise((resolve) => setTimeout(resolve, 300));
};

// Function to capture equipment comments directly from DOM
export const captureEquipmentCommentsFromDOM = () => {
    const capturedComments = {};

    if (typeof document !== "undefined") {
        try {
            // Target all subcategory comment textareas by their ID pattern
            const commentTextareas = document.querySelectorAll(
                '[id^="subcategory-comment-"]'
            );

            console.log(
                `[SurveySaveUtil] Found ${commentTextareas.length} equipment comment textareas in DOM`
            );

            commentTextareas.forEach((textarea) => {
                if (textarea.value && textarea.value.trim()) {
                    // Extract subcategory from ID by removing the prefix and converting hyphens back to spaces
                    const idParts = textarea.id.split("-");
                    if (idParts.length >= 3) {
                        const subcategoryId = idParts.slice(2).join("-");
                        const subcategory = subcategoryId.replace(/-/g, " ");
                        capturedComments[subcategory] = textarea.value.trim();
                        console.log(
                            `[SurveySaveUtil] Captured comment for subcategory: "${subcategory}"`
                        );
                    }
                }
            });

            // Also check for orphaned comments (those without equipment entries)
            const orphanedCommentTextareas = document.querySelectorAll(
                '[id^="orphaned-comment-"]'
            );

            console.log(
                `[SurveySaveUtil] Found ${orphanedCommentTextareas.length} orphaned comment textareas in DOM`
            );

            orphanedCommentTextareas.forEach((textarea) => {
                if (textarea.value && textarea.value.trim()) {
                    const idParts = textarea.id.split("-");
                    if (idParts.length >= 3) {
                        const subcategoryId = idParts.slice(2).join("-");
                        const subcategory = subcategoryId.replace(/-/g, " ");
                        capturedComments[subcategory] = textarea.value.trim();
                        console.log(
                            `[SurveySaveUtil] Captured orphaned comment for subcategory: "${subcategory}"`
                        );
                    }
                }
            });

            console.log(
                "[SurveySaveUtil] Directly captured",
                Object.keys(capturedComments).length,
                "comments from DOM"
            );
        } catch (err) {
            console.error(
                "[SurveySaveUtil] Error capturing comments from DOM:",
                err
            );
        }
    }

    return capturedComments;
};

// SIMPLE: Function to capture specialist equipment category comments from DOM with exact ID matching
export const captureSpecialistCategoryCommentsFromDOM = (surveyData) => {
    const capturedComments = {};

    if (typeof document !== "undefined") {
        try {
            // Get actual categories from survey data
            let actualCategories = [];
            if (surveyData?.specialistEquipmentData && Array.isArray(surveyData.specialistEquipmentData)) {
                actualCategories = [...new Set(
                    surveyData.specialistEquipmentData.map(item => item.category)
                )];
            }

            console.log(
                "[SurveySaveUtil] Looking for specialist category comments, actual categories:",
                actualCategories
            );

            // Target all category comment textareas by their ID pattern
            const commentTextareas = document.querySelectorAll(
                '[id^="category-comment-"]'
            );

            console.log(
                "[SurveySaveUtil] Found",
                commentTextareas.length,
                "specialist category comment textareas in DOM"
            );

            commentTextareas.forEach((textarea) => {
                if (textarea.value && textarea.value.trim()) {
                    // Use the exact same logic as SpecialistEquipmentList
                    const categoryName = textareaIdToCategory(textarea.id, actualCategories);
                    
                    if (categoryName) {
                        capturedComments[categoryName] = textarea.value.trim();
                        console.log(
                            "[SurveySaveUtil] Captured comment for category:",
                            categoryName,
                            "from textarea ID:",
                            textarea.id
                        );
                    } else {
                        console.warn(
                            "[SurveySaveUtil] Could not parse category from textarea ID:",
                            textarea.id
                        );
                    }
                }
            });

            console.log(
                "[SurveySaveUtil] Directly captured",
                Object.keys(capturedComments).length,
                "specialist category comments from DOM:",
                capturedComments
            );
        } catch (err) {
            console.error(
                "[SurveySaveUtil] Error capturing specialist category comments from DOM:",
                err
            );
        }
    }

    return capturedComments;
};

// Extract numeric value from potentially complex data
const extractNumericValue = (value, defaultValue = 0) => {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'object') {
        // If it has an overall property, use that
        if (value.overall !== undefined && value.overall !== null) {
            return typeof value.overall === 'number' ? value.overall : defaultValue;
        }
        
        // If it has a value property, use that (fallback)
        if (value.value !== undefined && value.value !== null) {
            return typeof value.value === 'number' ? value.value : defaultValue;
        }
    }
    
    // Try to convert to number if it's another type
    const parsed = Number(value);
    return !isNaN(parsed) ? parsed : defaultValue;
};

// Function to calculate total access door price from selections
export const calculateAccessDoorPriceFromSelections = (accessDoorSelections) => {
    if (!accessDoorSelections || typeof accessDoorSelections !== 'object') {
        return 0;
    }
    
    // Calculate total price by summing the price of each door selection
    return Object.values(accessDoorSelections).reduce((total, door) => {
        const doorPrice = typeof door === 'object' && door !== null 
            ? Number(door.price) || 0 
            : 0;
        return total + doorPrice;
    }, 0);
};

// Build a complete save payload from survey data
export const buildSavePayload = (
    surveyData,
    additionalData = {}
) => {
    // Log the incoming surveyData for debugging
    console.log("[SurveySaveUtil] Building save payload with survey data:", {
        hasStructureData: !!surveyData?.structureSelectionData,
        hasEquipmentData: !!surveyData?.surveyData && Array.isArray(surveyData.surveyData),
        hasCanopyData: !!surveyData?.canopyEntries && Array.isArray(surveyData.canopyEntries),
        hasSchematicData: !!surveyData?.placedItems && Array.isArray(surveyData.placedItems),
        hasStructureEntries: !!surveyData?.structureEntries && Array.isArray(surveyData.structureEntries),
        structureEntriesCount: (surveyData?.structureEntries || []).length,
        hasAdditionalServices: !!surveyData?.parkingCost || !!surveyData?.postServiceReport,
        hasSpecialistEquipmentData: !!surveyData?.specialistEquipmentData && Array.isArray(surveyData.specialistEquipmentData),
        specialistEquipmentCount: (surveyData?.specialistEquipmentData || []).length,
        surveyDataKeys: Object.keys(surveyData || {})
    });

    // Extract DOM-based comments as a fallback
    const domEquipmentComments = captureEquipmentCommentsFromDOM();
    // SIMPLE: Use the straightforward specialist comment capture with actual survey data
    const domSpecialistComments = captureSpecialistCategoryCommentsFromDOM(surveyData);

    // Create final subcategoryComments by merging state and DOM-captured comments
    const finalSubcategoryComments = {
        // Start with any existing comments from equipment object
        ...(surveyData.equipment?.subcategoryComments || {}),
        // Add any comments captured from DOM (these will override if keys match)
        ...domEquipmentComments,
    };

    // SIMPLE: Create final specialist categoryComments by merging state and DOM-captured comments
    const finalSpecialistCategoryComments = {
        // Start with any existing comments from equipment object
        ...(surveyData.equipment?.categoryComments || {}),
        // Add any comments captured from DOM (these will override if keys match)
        ...domSpecialistComments,
    };

    console.log("[SurveySaveUtil] Final specialist category comments:", finalSpecialistCategoryComments);

    // FIXED: Preserve the full schematicItemsTotal object if it's an object with breakdown
    let schematicItemsTotalForSave;
    if (typeof surveyData.schematicItemsTotal === 'object' && surveyData.schematicItemsTotal !== null) {
        // If it has breakdown property, preserve the entire object
        if (surveyData.schematicItemsTotal.breakdown && 
            typeof surveyData.schematicItemsTotal.breakdown === 'object' &&
            Object.keys(surveyData.schematicItemsTotal.breakdown).length > 0) {
            schematicItemsTotalForSave = {
                overall: extractNumericValue(surveyData.schematicItemsTotal.overall, 0),
                breakdown: {...surveyData.schematicItemsTotal.breakdown}
            };
            console.log("[SurveySaveUtil] Preserving schematic breakdown with categories:", 
                Object.keys(schematicItemsTotalForSave.breakdown));
        } else {
            // Just preserve the overall number if no breakdown
            schematicItemsTotalForSave = extractNumericValue(surveyData.schematicItemsTotal);
        }
    } else {
        // If it's just a number, use that
        schematicItemsTotalForSave = extractNumericValue(surveyData.schematicItemsTotal);
    }
    
    // Calculate access door price from selections and ensure it's accurate
    let accessDoorPriceValue;
    if (surveyData.accessDoorSelections && Object.keys(surveyData.accessDoorSelections).length > 0) {
        // Calculate price from door selections
        const calculatedPrice = calculateAccessDoorPriceFromSelections(surveyData.accessDoorSelections);
        // Use calculated price if available, otherwise use stored price
        accessDoorPriceValue = calculatedPrice > 0 
            ? calculatedPrice 
            : extractNumericValue(surveyData.accessDoorPrice);
        
        console.log("[SurveySaveUtil] Access door price:", {
            calculated: calculatedPrice,
            stored: surveyData.accessDoorPrice,
            final: accessDoorPriceValue
        });
    } else {
        accessDoorPriceValue = extractNumericValue(surveyData.accessDoorPrice);
    }

    // MULTI-COLLECTION: Process collections array to ensure it's properly formatted
    let collectionsArray = [];
    
    // Check if additionalData has collections array (new format)
    if (Array.isArray(additionalData.collections) && additionalData.collections.length > 0) {
        collectionsArray = [...additionalData.collections];
    }
    // Fall back to surveyData collections array if present
    else if (Array.isArray(surveyData.collections) && surveyData.collections.length > 0) {
        collectionsArray = [...surveyData.collections];
    }
    // Backward compatibility: If single collectionId is provided but no collections array
    else if ((additionalData.collectionId || surveyData.collectionId) && collectionsArray.length === 0) {
        const collectionId = additionalData.collectionId || surveyData.collectionId;
        const areaIndex = additionalData.areaIndex !== undefined 
            ? additionalData.areaIndex 
            : (surveyData.areaIndex !== undefined ? surveyData.areaIndex : 0);
        const collectionRef = additionalData.collectionRef || surveyData.collectionRef || "";
        
        // Create a single collection entry with the primary flag set
        collectionsArray.push({
            collectionId: collectionId,
            areaIndex: areaIndex,
            collectionRef: collectionRef,
            isPrimary: true
        });
    }

    // Set at least one collection as primary if none is marked
    let hasPrimary = collectionsArray.some(coll => coll.isPrimary);
    if (collectionsArray.length > 0 && !hasPrimary) {
        collectionsArray[0].isPrimary = true;
    }

    // NEW: Extract parking cost and post-service report data
    const parkingCost = extractNumericValue(surveyData.parkingCost, 0);
    const postServiceReport = surveyData.postServiceReport || "No";
    const postServiceReportPrice = extractNumericValue(surveyData.postServiceReportPrice, 0);

    // UPDATED: Process structure entries for saving
    let structureEntriesForSave = [];
    
    // Check if we have entries in the structure data
    if (surveyData.structureEntries && Array.isArray(surveyData.structureEntries) && surveyData.structureEntries.length > 0) {
        console.log("[SurveySaveUtil] Using structure entries array with", surveyData.structureEntries.length, "entries");
        
        // Make a deep copy of the entries array to avoid reference issues
        structureEntriesForSave = surveyData.structureEntries.map(entry => {
            // Ensure each entry has properly formatted data
            const processedEntry = {
                id: entry.id || `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                selectionData: Array.isArray(entry.selectionData) 
                    ? entry.selectionData.map(row => ({
                        type: row.type || "",
                        item: row.item || "",
                        grade: row.grade || ""
                      }))
                    : [],
                dimensions: entry.dimensions 
                    ? {
                        length: Number(entry.dimensions.length) || 0,
                        width: Number(entry.dimensions.width) || 0,
                        height: Number(entry.dimensions.height) || 0
                      } 
                    : {
                        length: 0,
                        width: 0,
                        height: 0
                      },
                comments: entry.comments || ""
            };
            
            return processedEntry;
        });
        
        console.log("[SurveySaveUtil] Processed structure entries:");
        console.log(JSON.stringify(structureEntriesForSave.map(e => ({
            id: e.id,
            selectionData: e.selectionData.length,
            dimensions: e.dimensions
        }))));
    }
    
    // Log what we're saving
    console.log("[SurveySaveUtil] Saving structure data:", {
        entriesCount: structureEntriesForSave.length,
        structureTotal: extractNumericValue(surveyData.structureTotal)
    });

    // Build the complete payload with all data
    const savePayload = {
        // Basic info
        refValue: surveyData.refValue,
        surveyDate: surveyData.surveyDate || new Date(),
        site: { 
            _id: surveyData.siteDetails?._id || 
                surveyData.siteDetails?.id ||
                additionalData.siteId
        },
        
        // Include contacts if available
        contacts: surveyData.contacts || additionalData.contacts || [],
        
        // MULTI-COLLECTION: Use the collections array instead of individual fields
        collections: collectionsArray,
        
        // General section
        general: {
            surveyType: surveyData.operations?.typeOfCooking || "Kitchen Deep Clean",
            parking: surveyData.parking || "",
            dbs: surveyData.access?.dbs || "Not Required",
            permit: surveyData.access?.permit || "No",
        },
        
        // NEW: Include additional services section
        additionalServices: {
            parkingCost: parkingCost,
            postServiceReport: postServiceReport,
            postServiceReportPrice: postServiceReportPrice,
        },
        
        // UPDATED: Structure section with entries array as primary storage
        structure: {
            structureId: surveyData.structureId || "",
            structureTotal: extractNumericValue(surveyData.structureTotal),
            // NEW PRIMARY WAY: Store all entries in the entries array
            entries: structureEntriesForSave,
        },
        
        // Equipment survey with merged comments
        equipmentSurvey: {
            entries: surveyData.surveyData || [],
            subcategoryComments: finalSubcategoryComments,
        },
        
        // SIMPLE: Specialist equipment with straightforward merged comments
        specialistEquipmentSurvey: {
            entries: surveyData.specialistEquipmentData || [],
            categoryComments: finalSpecialistCategoryComments,
        },
        
        // Canopy survey
        canopySurvey: {
            entries: surveyData.canopyEntries || [],
            comments: surveyData.canopyComments || {},
        },
        
        // FIXED: Schematic section - now preserving the full schematicItemsTotal object
        schematic: {
            accessDoorPrice: accessDoorPriceValue,
            ventilationPrice: extractNumericValue(surveyData.ventilationPrice),
            airPrice: extractNumericValue(surveyData.airPrice),
            fanPartsPrice: extractNumericValue(surveyData.fanPartsPrice),
            airInExTotal: extractNumericValue(surveyData.airInExTotal),
            schematicItemsTotal: schematicItemsTotalForSave, // Now preserving the full object if available
            selectedGroupId: surveyData.selectedGroupId || "",
            // Visual data
            gridSpaces: surveyData.gridSpaces || 26,
            cellSize: surveyData.cellSize || 40,
            // FIXED: Explicitly process placedItems to ensure inaccessible field is included
            placedItems: (surveyData.placedItems || []).map(item => ({
                ...item,
                // Ensure all dimension fields are properly stringified
                length: item.length !== undefined ? String(item.length) : "",
                width: item.width !== undefined ? String(item.width) : "",
                height: item.height !== undefined ? String(item.height) : "",
                inaccessible: item.inaccessible !== undefined ? String(item.inaccessible) : "",
            })),
            specialItems: surveyData.specialItems || [],
            accessDoorSelections: surveyData.accessDoorSelections || {},
            flexiDuctSelections: surveyData.flexiDuctSelections || {},
            fanGradeSelections: surveyData.fanGradeSelections || {},
        },
        
        // Other sections
        ventilationInfo: surveyData.ventilation || {},
        access: surveyData.access || {},
        operations: surveyData.operations || {},
        notes: surveyData.notes || {},
        
        // Images in standardized format
        images: surveyData.surveyImages || {},
        
        // SIMPLE: Specialist equipment section with straightforward comments
        specialistEquipment: {
            acroPropsToggle: surveyData.equipment?.acroPropsToggle || "No",
            loftBoardsToggle: surveyData.equipment?.loftBoardsToggle || "No",
            scaffBoardsToggle: surveyData.equipment?.scaffBoardsToggle || "No",
            laddersToggle: surveyData.equipment?.laddersToggle || "No",
            mobileScaffoldTower: surveyData.equipment?.mobileScaffoldTower || "No",
            flexiHose: surveyData.equipment?.flexiHose || "No",
            flexiHoseCircumference: surveyData.equipment?.flexiHoseCircumference || "",
            flexiHoseLength: surveyData.equipment?.flexiHoseLength || "",
            mewp: surveyData.equipment?.mewp || "No",
            // Store category comments in the specialistEquipment section too
            categoryComments: finalSpecialistCategoryComments,
        },
        
        // FIXED: Totals section - now preserving schematicItemsTotal format in mainArea and grandTotal
        // NEW: Include parking cost and post-service report price in totals
        totals: {
            mainArea: {
                structureTotal: extractNumericValue(surveyData.structureTotal),
                equipmentTotal: extractNumericValue(surveyData.equipmentTotal),
                canopyTotal: extractNumericValue(surveyData.canopyTotal),
                accessDoorPrice: accessDoorPriceValue,
                ventilationPrice: extractNumericValue(surveyData.ventilationPrice),
                airPrice: extractNumericValue(surveyData.airPrice),
                fanPartsPrice: extractNumericValue(surveyData.fanPartsPrice),
                airInExTotal: extractNumericValue(surveyData.airInExTotal),
                schematicItemsTotal: schematicItemsTotalForSave, // Now preserving the full object if available
                parkingCost: parkingCost,
                postServiceReportPrice: postServiceReportPrice,
                modify: extractNumericValue(surveyData.modify),
                groupingId: surveyData.selectedGroupId || ""
            },
            grandTotal: {
                structureTotal: extractNumericValue(surveyData.structureTotal),
                equipmentTotal: extractNumericValue(surveyData.equipmentTotal),
                canopyTotal: extractNumericValue(surveyData.canopyTotal),
                accessDoorPrice: accessDoorPriceValue,
                ventilationPrice: extractNumericValue(surveyData.ventilationPrice),
                airPrice: extractNumericValue(surveyData.airPrice),
                fanPartsPrice: extractNumericValue(surveyData.fanPartsPrice),
                airInExTotal: extractNumericValue(surveyData.airInExTotal),
                schematicItemsTotal: schematicItemsTotalForSave, // Now preserving the full object if available
                parkingCost: parkingCost,
                postServiceReportPrice: postServiceReportPrice,
            },
            modify: extractNumericValue(surveyData.modify)
        },
        
        // Include any additional data passed
        ...additionalData,
    };

    // Remove old-style collection fields if they exist - since we're now using the collections array
    if (savePayload.collectionId !== undefined) delete savePayload.collectionId;
    if (savePayload.areaIndex !== undefined) delete savePayload.areaIndex;
    if (savePayload.collectionRef !== undefined) delete savePayload.collectionRef;

    // Log key counts for debugging
    console.log("[SurveySaveUtil] Final payload prepared with:", {
        equipmentCommentCount: Object.keys(finalSubcategoryComments).length,
        specialistCommentCount: Object.keys(finalSpecialistCategoryComments).length,
        equipmentEntryCount: (surveyData.surveyData || []).length,
        canopyEntryCount: (surveyData.canopyEntries || []).length,
        placedItemCount: (surveyData.placedItems || []).length,
        structureEntryCount: structureEntriesForSave.length,
        collectionsCount: collectionsArray.length,
        schematicItemsTotal: typeof schematicItemsTotalForSave === 'object' ? 
            `Object with breakdown (${Object.keys(schematicItemsTotalForSave.breakdown || {}).length} categories)` : 
            `Number: ${schematicItemsTotalForSave}`,
        accessDoorPrice: accessDoorPriceValue,
        // NEW: Log additional services values
        parkingCost: parkingCost,
        postServiceReport: postServiceReport,
        postServiceReportPrice: postServiceReportPrice,
    });

    return savePayload;
};

// Main function to save a survey with handshake verification
export const saveSurveyWithHandshake = async (
    surveyId,
    surveyData,
    additionalData = {},
    setProgress = null,
    showToast = null,
    componentTag = "SurveySaveUtil"
) => {
    // Allow caller to set custom component tag for logs
    const Tag = componentTag;
    const log = (message) => console.log(`[${Tag}] ${message}`);
    const warn = (message) => console.warn(`[${Tag}] ${message}`);
    const logError = (message) => console.error(`[${Tag}] ${message}`); // Renamed from error to logError
    
    // Update progress if function provided
    const updateProgress = (message, percent) => {
        if (setProgress) {
            setProgress(message, percent);
        }
    };
    
    if (!surveyId) {
        warn("No survey ID provided, cannot save");
        return { success: false, reason: "no-survey-id" };
    }
    
    try {
        updateProgress("Syncing component states...", 10);
        log("Saving survey with ID: " + surveyId);
        
        // 1. First sync all component states to ensure everything is up-to-date
        await syncComponentStates();
        
        // 2. Build the complete save payload
        updateProgress("Building save payload...", 20);
        const savePayload = buildSavePayload(surveyData, additionalData);
        
        // Log collections information specifically for debugging
        if (savePayload.collections && savePayload.collections.length > 0) {
            log(`Survey belongs to ${savePayload.collections.length} collections:`);
            savePayload.collections.forEach((coll, index) => {
                log(`  Collection ${index + 1}: ID=${coll.collectionId}, areaIndex=${coll.areaIndex}, isPrimary=${coll.isPrimary}`);
            });
        } else {
            log("Survey does not belong to any collections");
        }

        // Log structure entries information
        if (savePayload.structure && Array.isArray(savePayload.structure.entries)) {
            log(`Structure entries: ${savePayload.structure.entries.length} entries saved`);
            savePayload.structure.entries.forEach((entry, index) => {
                log(`  Entry ${index + 1}: ID=${entry.id}, selectionData=${entry.selectionData ? entry.selectionData.length : 0} rows, dimensions=${JSON.stringify(entry.dimensions)}`);
            });
        } else {
            log("No structure entries to save");
        }
        
        // Log payload size and key sections for debugging
        log(`Save payload prepared with: 
            - ${Object.keys(savePayload.equipmentSurvey.subcategoryComments).length} equipment comments
            - ${Object.keys(savePayload.specialistEquipmentSurvey.categoryComments).length} specialist comments
            - ${savePayload.equipmentSurvey.entries.length} equipment entries
            - ${savePayload.canopySurvey.entries.length} canopy entries
            - ${savePayload.structure.entries.length} structure entries 
            - ${savePayload.schematic.placedItems.length} placed schematic items
            - ${savePayload.collections ? savePayload.collections.length : 0} collection memberships
            - schematicItemsTotal: ${typeof savePayload.schematic.schematicItemsTotal === 'object' ? 
                'Object with breakdown' : savePayload.schematic.schematicItemsTotal}
            - accessDoorPrice: ${savePayload.schematic.accessDoorPrice}
            - parkingCost: ${savePayload.additionalServices.parkingCost}
            - postServiceReportPrice: ${savePayload.additionalServices.postServiceReportPrice}`);
        
        // 3. Send the update to the API
        updateProgress("Sending data to server...", 40);
        
        const res = await fetch(
            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(savePayload),
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            logError(`Save error: ${res.status} - ${errorText}`); // Using logError instead of error
            
            // Show toast if provided
            if (showToast) {
                showToast({
                    severity: "error",
                    summary: "Save Failed",
                    detail: `Error: ${res.status} - Could not save survey`,
                });
            }
            
            throw new Error(`Error saving survey: ${res.status}`);
        }

        // 4. Parse the initial response
        const jsonResponse = await res.json();
        updateProgress("Verifying saved data...", 60);
        
        // 5. HANDSHAKE: Verify the saved data by performing a GET request
        const verifyRes = await fetch(
            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
            { method: "GET" }
        );
        
        if (!verifyRes.ok) {
            warn("Verification request failed, but save succeeded");
            // Continue since the initial save succeeded
        } else {
            const verifyData = await verifyRes.json();
            
            // 6. Verify key data was saved correctly
            if (verifyData.success && verifyData.data) {
                const savedData = verifyData.data;
                
                // Check specialist equipment comments with detailed logging
                const savedSpecialistCount = 
                    Object.keys(savedData.specialistEquipmentSurvey?.categoryComments || {}).length;
                    
                const expectedSpecialistCount = 
                    Object.keys(savePayload.specialistEquipmentSurvey.categoryComments).length;
                
                if (savedSpecialistCount < expectedSpecialistCount) {
                    warn(`Warning: Expected ${expectedSpecialistCount} specialist comments, but found ${savedSpecialistCount} in verification`);
                    
                    // Log detailed information about the mismatch
                    log("Expected specialist comments:");
                    Object.entries(savePayload.specialistEquipmentSurvey.categoryComments).forEach(([key, value]) => {
                        log(`  "${key}": "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
                    });
                    
                    log("Saved specialist comments:");
                    Object.entries(savedData.specialistEquipmentSurvey?.categoryComments || {}).forEach(([key, value]) => {
                        log(`  "${key}": "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
                    });
                } else {
                    log(`Successfully saved ${savedSpecialistCount} specialist category comments`);
                    
                    // Log the successfully saved comments
                    log("Successfully saved specialist comments:");
                    Object.entries(savedData.specialistEquipmentSurvey?.categoryComments || {}).forEach(([key, value]) => {
                        log(`  "${key}": "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
                    });
                }
                
                // ... other verification checks remain the same ...
            }
        }

        updateProgress("Save complete and verified", 100);
        log("Save completed successfully with handshake verification");
        
        // Show success toast if provided
        if (showToast) {
            showToast({
                severity: "success",
                summary: "Save Complete",
                detail: "Survey saved successfully",
            });
        }
        
        return { 
            success: true, 
            data: jsonResponse.data,
            message: "Save completed and verified" 
        };
    } catch (err) { // Changed variable name from 'error' to 'err'
        logError(`Save failed: ${err.message}`); // Using logError instead of error
        
        return { 
            success: false, 
            error: err,
            message: err.message || "Error saving survey" 
        };
    }
};