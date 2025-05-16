// components/kitchenSurvey/pricing/PricingUtils.js

/**
 * Calculate the equipment total from surveyData and equipment items
 * @param {Array} surveyData - Array of survey entries
 * @param {Array} equipmentItems - Array of equipment items with prices
 * @returns {number} - Total equipment price
 */
export const computeEquipmentTotal = (surveyData, equipmentItems) => {
    if (!Array.isArray(surveyData) || !Array.isArray(equipmentItems)) {
        console.warn("Invalid data passed to computeEquipmentTotal", { surveyData, equipmentItems });
        return 0;
    }
    
    return surveyData.reduce((sum, entry) => {
        const match = equipmentItems.find(
            (itm) =>
                itm.subcategory?.trim().toLowerCase() ===
                    entry.subcategory?.trim().toLowerCase() &&
                itm.item?.trim().toLowerCase() ===
                    entry.item?.trim().toLowerCase()
        );
        if (match && match.prices && match.prices[entry.grade] != null) {
            const price = Number(match.prices[entry.grade]);
            const qty = Number(entry.number) || 0;
            return sum + price * qty;
        }
        return sum;
    }, 0);
};

/**
 * Helper to ensure values are numeric
 * @param {any} value - Value to convert to numeric
 * @returns {number} - Numeric value
 */
export const ensureNumeric = (value) => {
    if (typeof value === "undefined" || value === null) {
        return 0;
    }
    
    if (typeof value === "object" && value !== null) {
        return value.overall || 0;
    }
    
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

/**
 * Compute grand totals for main area only
 * @param {Object} mainTotals - Main area totals
 * @param {Array} childAreas - Empty array (kept for compatibility)
 * @returns {Object} - Main area totals
 */
export const computeGrandTotals = (mainTotals, childAreas) => {
    if (!mainTotals) {
        console.warn("Invalid inputs to computeGrandTotals", { mainTotals });
        return {
            structureTotal: 0,
            equipmentTotal: 0,
            canopyTotal: 0,
            accessDoorPrice: 0,
            ventilationPrice: 0,
            airPrice: 0,
            fanPartsPrice: 0,
            airInExTotal: 0,
            schematicItemsTotal: 0,
        };
    }
    
    // Return main area totals directly
    return {
        structureTotal: ensureNumeric(mainTotals.structureTotal),
        equipmentTotal: ensureNumeric(mainTotals.equipmentTotal),
        canopyTotal: ensureNumeric(mainTotals.canopyTotal),
        accessDoorPrice: ensureNumeric(mainTotals.accessDoorPrice),
        ventilationPrice: ensureNumeric(mainTotals.ventilationPrice),
        airPrice: ensureNumeric(mainTotals.airPrice),
        fanPartsPrice: ensureNumeric(mainTotals.fanPartsPrice),
        airInExTotal: ensureNumeric(mainTotals.airInExTotal),
        schematicItemsTotal: ensureNumeric(mainTotals.schematicItemsTotal),
    };
};

/**
 * Calculate the grand total for display with modification factor applied
 * Simplified to only calculate for main area
 * @param {number} structureTotal - Structure total
 * @param {number} equipmentTotal - Equipment total
 * @param {number} canopyTotal - Canopy total
 * @param {number} accessDoorPrice - Access door price
 * @param {number} ventilationPrice - Ventilation price
 * @param {number} airPrice - Air price
 * @param {number} fanPartsPrice - Fan parts price 
 * @param {number} airInExTotal - Air in/out total
 * @param {any} schematicItemsTotal - Schematic items total
 * @param {Array} childAreas - Empty array (kept for compatibility)
 * @param {number} modify - Modification factor percentage
 * @param {Array} specialistEquipmentData - Specialist equipment items
 * @returns {number} - Grand total
 */
export const calculateGrandTotal = (
    structureTotal,
    equipmentTotal,
    canopyTotal,
    accessDoorPrice,
    ventilationPrice,
    airPrice,
    fanPartsPrice,
    airInExTotal,
    schematicItemsTotal,
    childAreas,
    modify,
    specialistEquipmentData = []
) => {
    // Helper function to calculate specialist equipment total
    const calculateSpecialistTotal = (items = []) => {
        return items.reduce((total, item) => {
            let itemPrice = 0;
            
            // Check for direct price property
            if (item.price !== undefined && item.price !== null) {
                itemPrice = Number(item.price);
            }
            // Check for price in customData
            else if (item.customData && Array.isArray(item.customData)) {
                const priceField = item.customData.find(
                    field => field.fieldName && field.fieldName.toLowerCase() === "price"
                );
                
                if (priceField && priceField.value !== undefined && priceField.value !== null) {
                    itemPrice = Number(priceField.value);
                }
            }
            
            const quantity = Number(item.number) || 1;
            return total + (itemPrice * quantity);
        }, 0);
    };
    // Calculate specialist equipment total
    const specialistTotal = calculateSpecialistTotal(specialistEquipmentData);
    
    // Calculate main area totals
    const mainArea = {
        structureTotal: ensureNumeric(structureTotal),
        equipmentTotal: ensureNumeric(equipmentTotal),
        canopyTotal: ensureNumeric(canopyTotal),
        accessDoorPrice: ensureNumeric(accessDoorPrice),
        ventilationPrice: ensureNumeric(ventilationPrice),
        airPrice: ensureNumeric(airPrice),
        fanPartsPrice: ensureNumeric(fanPartsPrice),
        airInExTotal: ensureNumeric(airInExTotal),
        schematicItemsTotal: ensureNumeric(schematicItemsTotal),
        specialistTotal: specialistTotal,
    };

    // Log specific parts to help debug
    console.log(`PricingUtils - Main ventilation price: ${mainArea.ventilationPrice}`);
    console.log(`PricingUtils - Main accessDoorPrice: ${mainArea.accessDoorPrice}`);
    if (specialistTotal > 0) {
        console.log(`PricingUtils - Main specialist equipment total: ${specialistTotal}`);
    }

    // Calculate the sum of all totals from main area
    const mainAreaSum =
        mainArea.structureTotal +
        mainArea.equipmentTotal +
        mainArea.canopyTotal +
        mainArea.accessDoorPrice +
        mainArea.ventilationPrice +
        mainArea.airPrice +
        mainArea.fanPartsPrice +
        mainArea.airInExTotal +
        mainArea.schematicItemsTotal +
        mainArea.specialistTotal;

    // Apply modification factor
    const factor = 1 + (ensureNumeric(modify) / 100);
    const grandTotal = mainAreaSum * factor;
    
    console.log(`PricingUtils - Final grand total: ${grandTotal} (with ${modify}% modifier)`);
    
    return grandTotal;
};