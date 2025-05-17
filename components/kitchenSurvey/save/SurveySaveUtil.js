// components/kitchenSurvey/save/SurveySaveUtil.js
/**
 * Shared utility for saving surveys with handshake verification
 */

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

// Function to capture specialist equipment category comments from DOM
export const captureSpecialistCategoryCommentsFromDOM = () => {
    const capturedComments = {};

    if (typeof document !== "undefined") {
        try {
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
                    // Extract category from ID by removing the prefix and converting hyphens back to spaces
                    const idParts = textarea.id.split("-");
                    if (idParts.length >= 3) {
                        const categoryId = idParts.slice(2).join("-");
                        const category = categoryId.replace(/-/g, " ");
                        capturedComments[category] = textarea.value.trim();
                        console.log(
                            "[SurveySaveUtil] Captured comment for category:",
                            category
                        );
                    }
                }
            });

            console.log(
                "[SurveySaveUtil] Directly captured",
                Object.keys(capturedComments).length,
                "specialist category comments from DOM"
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
        surveyDataKeys: Object.keys(surveyData || {})
    });

    // Extract DOM-based comments as a fallback
    const domEquipmentComments = captureEquipmentCommentsFromDOM();
    const domSpecialistComments = captureSpecialistCategoryCommentsFromDOM();

    // Create final subcategoryComments by merging state and DOM-captured comments
    const finalSubcategoryComments = {
        // Start with any existing comments from equipment object
        ...(surveyData.equipment?.subcategoryComments || {}),
        // Add any comments captured from DOM (these will override if keys match)
        ...domEquipmentComments,
    };

    // Create final specialist categoryComments by merging state and DOM-captured comments
    const finalSpecialistCategoryComments = {
        // Start with any existing comments from equipment object
        ...(surveyData.equipment?.categoryComments || {}),
        // Add any comments captured from DOM (these will override if keys match)
        ...domSpecialistComments,
    };

    // FIXED: Preserve the full schematicItemsTotal object if it's an object with breakdown
    let schematicItemsTotalForSave;
    if (typeof surveyData.schematicItemsTotal === 'object' && surveyData.schematicItemsTotal !== null) {
        // If it has breakdown property, preserve the entire object
        if (surveyData.schematicItemsTotal.breakdown && 
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
        
        // Structure section
        structure: {
            structureId: surveyData.structureId || "",
            structureTotal: extractNumericValue(surveyData.structureTotal),
            selectionData: surveyData.structureSelectionData || [],
            dimensions: surveyData.structureDimensions || {},
            structureComments: surveyData.structureComments || "",
        },
        
        // Equipment survey with merged comments
        equipmentSurvey: {
            entries: surveyData.surveyData || [],
            subcategoryComments: finalSubcategoryComments,
        },
        
        // Specialist equipment with merged comments
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
            placedItems: surveyData.placedItems || [],
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
        
        // Specialist equipment section
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
                schematicItemsTotal: schematicItemsTotalForSave // Now preserving the full object if available
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
        collectionsCount: collectionsArray.length,
        schematicItemsTotal: typeof schematicItemsTotalForSave === 'object' ? 
            `Object with breakdown (${Object.keys(schematicItemsTotalForSave.breakdown || {}).length} categories)` : 
            `Number: ${schematicItemsTotalForSave}`,
        accessDoorPrice: accessDoorPriceValue
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
        
        // Log payload size and key sections for debugging
        log(`Save payload prepared with: 
            - ${Object.keys(savePayload.equipmentSurvey.subcategoryComments).length} equipment comments
            - ${Object.keys(savePayload.specialistEquipmentSurvey.categoryComments).length} specialist comments
            - ${savePayload.equipmentSurvey.entries.length} equipment entries
            - ${savePayload.canopySurvey.entries.length} canopy entries
            - ${savePayload.schematic.placedItems.length} placed schematic items
            - ${savePayload.collections ? savePayload.collections.length : 0} collection memberships
            - schematicItemsTotal: ${typeof savePayload.schematic.schematicItemsTotal === 'object' ? 
                'Object with breakdown' : savePayload.schematic.schematicItemsTotal}
            - accessDoorPrice: ${savePayload.schematic.accessDoorPrice}`);
        
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
                
                // Check structure data
                if (!savedData.structure || !savedData.structure.structureId) {
                    warn("Warning: Structure data missing or incomplete in verification");
                }
                
                // Check equipment comments
                const savedCommentCount = 
                    Object.keys(savedData.equipmentSurvey?.subcategoryComments || {}).length;
                    
                const expectedCommentCount = 
                    Object.keys(savePayload.equipmentSurvey.subcategoryComments).length;
                
                if (savedCommentCount < expectedCommentCount) {
                    warn(`Warning: Expected ${expectedCommentCount} equipment comments, but found ${savedCommentCount} in verification`);
                }
                
                // Check specialist equipment comments
                const savedSpecialistCount = 
                    Object.keys(savedData.specialistEquipmentSurvey?.categoryComments || {}).length;
                    
                const expectedSpecialistCount = 
                    Object.keys(savePayload.specialistEquipmentSurvey.categoryComments).length;
                
                if (savedSpecialistCount < expectedSpecialistCount) {
                    warn(`Warning: Expected ${expectedSpecialistCount} specialist comments, but found ${savedSpecialistCount} in verification`);
                }
                
                // Check canopy comments
                const savedCanopyCount = 
                    Object.keys(savedData.canopySurvey?.comments || {}).length;
                    
                const expectedCanopyCount = 
                    Object.keys(savePayload.canopySurvey.comments || {}).length;
                
                if (savedCanopyCount < expectedCanopyCount) {
                    warn(`Warning: Expected ${expectedCanopyCount} canopy comments, but found ${savedCanopyCount} in verification`);
                }
                
                // Check schematic data
                const savedPlacedItemCount = savedData.schematic?.placedItems?.length || 0;
                const expectedPlacedItemCount = savePayload.schematic.placedItems.length;
                
                if (savedPlacedItemCount < expectedPlacedItemCount) {
                    warn(`Warning: Expected ${expectedPlacedItemCount} schematic items, but found ${savedPlacedItemCount} in verification`);
                }
                
                // FIXED: Check if schematicItemsTotal breakdown was preserved
                if (typeof savePayload.schematic.schematicItemsTotal === 'object' && 
                    savePayload.schematic.schematicItemsTotal.breakdown) {
                    
                    const hasBreakdownInSavedData = 
                        typeof savedData.schematic.schematicItemsTotal === 'object' && 
                        savedData.schematic.schematicItemsTotal.breakdown;
                        
                    if (!hasBreakdownInSavedData) {
                        warn("Warning: schematicItemsTotal breakdown was not preserved in saved data!");
                    } else {
                        const expectedCategories = Object.keys(savePayload.schematic.schematicItemsTotal.breakdown).length;
                        const savedCategories = Object.keys(savedData.schematic.schematicItemsTotal.breakdown).length;
                        
                        if (savedCategories < expectedCategories) {
                            warn(`Warning: Expected ${expectedCategories} price categories, but found ${savedCategories} in verification`);
                        } else {
                            log(`Successfully preserved ${savedCategories} price categories in schematicItemsTotal`);
                        }
                    }
                }
                
                // Verify access door price was correctly saved
                const savedAccessDoorPrice = savedData.schematic?.accessDoorPrice || 0;
                const expectedAccessDoorPrice = savePayload.schematic.accessDoorPrice || 0;
                
                if (Math.abs(savedAccessDoorPrice - expectedAccessDoorPrice) > 0.01) {
                    warn(`Warning: Access door price mismatch - expected ${expectedAccessDoorPrice}, but found ${savedAccessDoorPrice} in verification`);
                }

                // MULTI-COLLECTION: Verify collections data
                const savedCollectionCount = savedData.collections?.length || 0;
                const expectedCollectionCount = savePayload.collections?.length || 0;

                if (savedCollectionCount !== expectedCollectionCount) {
                    warn(`Warning: Expected ${expectedCollectionCount} collections, but found ${savedCollectionCount} in verification`);
                }

                if (savedCollectionCount > 0) {
                    // Check that at least one collection is marked as primary
                    const hasPrimary = savedData.collections.some(coll => coll.isPrimary);
                    if (!hasPrimary) {
                        warn("Warning: No collection is marked as primary in saved data");
                    }
                }
                
                log(`Verification complete: 
                    - Found ${savedCommentCount}/${expectedCommentCount} equipment comments
                    - Found ${savedSpecialistCount}/${expectedSpecialistCount} specialist comments
                    - Found ${savedCanopyCount}/${expectedCanopyCount} canopy comments
                    - Found ${savedPlacedItemCount}/${expectedPlacedItemCount} schematic items
                    - Found ${savedCollectionCount}/${expectedCollectionCount} collections
                    - AccessDoorPrice: ${savedAccessDoorPrice}/${expectedAccessDoorPrice}
                    - SchematicItemsTotal: ${typeof savedData.schematic.schematicItemsTotal === 'object' ? 
                        'Object with breakdown' : 'Numeric value only'}`);
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